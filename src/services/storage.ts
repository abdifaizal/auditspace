import JSZip from 'jszip'
import { AuditWorkspace, Attachment, MultiSpaceStore } from '../types'
import { saveFileWithDialog } from './nativeSave'
import { getSampleWorkspace, getRecoveredQitaWorkspace } from './sampleData'

const MULTI_STORE_KEY = 'auditspace_multi_store_v1'
const LEGACY_STORAGE_KEY = 'auditspace_workspace_legacy_v1'

export function loadMultiSpaceStore(): MultiSpaceStore {
  try {
    const raw = localStorage.getItem(MULTI_STORE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as MultiSpaceStore
      if (parsed && Array.isArray(parsed.spaces) && parsed.spaces.length > 0) {
        let modified = false

        // RECOVERY MIGRATION:
        // Check if Advisory QITA 2026 was lost or overwritten by a P2P session
        const hasQita = parsed.spaces.some((s) =>
          s.projectMeta?.name?.toLowerCase().includes('qita')
        )

        if (!hasQita) {
          // If Audit BGF or another space had ID 'proj-default-1', re-id it to prevent collision
          parsed.spaces = parsed.spaces.map((s) => {
            if (s.projectMeta?.id === 'proj-default-1') {
              modified = true
              const safeId = s.projectMeta.name.includes('BGF')
                ? 'proj-audit-bgf-2026'
                : 'proj-' + Math.random().toString(36).substring(2, 9)
              return {
                ...s,
                projectMeta: { ...s.projectMeta, id: safeId },
              }
            }
            return s
          })

          const recoveredQita = getRecoveredQitaWorkspace()
          parsed.spaces = [recoveredQita, ...parsed.spaces]
          parsed.activeSpaceId = recoveredQita.projectMeta.id
          modified = true
        }

        // Ensure unique IDs across all spaces to prevent collisions
        const seenIds = new Set<string>()
        parsed.spaces = parsed.spaces.map((s) => {
          if (seenIds.has(s.projectMeta.id)) {
            modified = true
            return {
              ...s,
              projectMeta: {
                ...s.projectMeta,
                id: 'proj-' + Math.random().toString(36).substring(2, 9),
              },
            }
          }
          seenIds.add(s.projectMeta.id)
          return s
        })

        // Ensure activeSpaceId points to an existing space
        if (!parsed.spaces.some((s) => s.projectMeta.id === parsed.activeSpaceId)) {
          parsed.activeSpaceId = parsed.spaces[0].projectMeta.id
          modified = true
        }

        if (modified) {
          saveMultiSpaceStore(parsed)
        }

        return parsed
      }
    }

    // Check legacy single-workspace storage
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (legacyRaw) {
      const legacyParsed = JSON.parse(legacyRaw) as AuditWorkspace
      if (legacyParsed && legacyParsed.projectMeta) {
        const store: MultiSpaceStore = {
          activeSpaceId: legacyParsed.projectMeta.id,
          spaces: [legacyParsed],
        }
        saveMultiSpaceStore(store)
        return store
      }
    }
  } catch (err) {
    console.error('Failed to parse multi-space store, falling back to sample:', err)
  }

  const sample = getSampleWorkspace()
  const store: MultiSpaceStore = {
    activeSpaceId: sample.projectMeta.id,
    spaces: [sample],
  }
  saveMultiSpaceStore(store)
  return store
}

export function saveMultiSpaceStore(store: MultiSpaceStore): void {
  try {
    localStorage.setItem(MULTI_STORE_KEY, JSON.stringify(store))
  } catch (err) {
    console.error('Failed to save multi-space store to localStorage:', err)
  }
}

export function factoryResetStorage(): void {
  try {
    localStorage.removeItem(MULTI_STORE_KEY)
    localStorage.removeItem(LEGACY_STORAGE_KEY)
    localStorage.clear()
  } catch (err) {
    console.error('Failed to factory reset storage:', err)
  }
}

export function createNewSpace(
  name: string,
  timeline: string,
  auditeeName: string,
  leadAuditor: string,
  description: string
): AuditWorkspace {
  const newId = 'proj-' + Math.random().toString(36).substring(2, 9)

  return {
    version: '1.0.0',
    lastModified: new Date().toISOString(),
    projectMeta: {
      id: newId,
      name: name.trim() || 'Workspace Audit Baru',
      timeline: timeline.trim() || '01 Nov 2026 s.d. 31 Des 2026',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      auditeeName: auditeeName.trim() || 'Entitas Auditee',
      leadAuditor: leadAuditor.trim() || 'Tim Auditor',
      description: description.trim(),
    },
    meetings: [],
    materials: [],
    tasks: [],
    stickies: [],
    connections: [],
  }
}

// Convert File to base64 Attachment
export async function fileToAttachment(file: File): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve({
        id: 'att-' + Math.random().toString(36).substring(2, 9),
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl: reader.result as string,
        uploadedAt: new Date().toISOString(),
      })
    }
    reader.onerror = (error) => reject(error)
    reader.readAsDataURL(file)
  })
}

// Robust downloader that preserves original filename and uses native dialog in Tauri
export async function downloadAttachment(att: Attachment): Promise<void> {
  const parts = att.dataUrl.split(',')
  const base64Data = parts.length > 1 ? parts[1] : parts[0]
  await saveFileWithDialog(att.name, base64Data, {
    isBase64: true,
    mimeType: att.type,
  })
}

// Export complete workspace to .auditpkg bundle (ZIP file)
export async function exportAuditPackage(workspace: AuditWorkspace): Promise<{ success: boolean; path?: string; cancelled?: boolean }> {
  const zip = new JSZip()

  // 1. Manifest
  const manifest = {
    appName: 'AuditSpace Portable',
    version: workspace.version,
    exportedAt: new Date().toISOString(),
    project: workspace.projectMeta,
  }
  zip.file('manifest.json', JSON.stringify(manifest, null, 2))

  // 2. Clone workspace to prepare clean JSON and extract attachments into files
  const cleanWorkspace = JSON.parse(JSON.stringify(workspace)) as AuditWorkspace
  const attachmentsFolder = zip.folder('attachments')

  const extractAndReplace = (att: Attachment | null | undefined) => {
    if (!att || !att.dataUrl) return
    const filename = `${att.id}_${att.name}`
    try {
      const parts = att.dataUrl.split(',')
      const base64Data = parts.length > 1 ? parts[1] : parts[0]
      if (attachmentsFolder) {
        attachmentsFolder.file(filename, base64Data, { base64: true })
      }
    } catch (e) {
      console.warn('Failed to extract attachment binary:', att.name, e)
    }
  }

  // Extract from meetings
  for (const m of cleanWorkspace.meetings) {
    if (m.pdfInvite) extractAndReplace(m.pdfInvite)
    if (m.attachments) {
      for (const a of m.attachments) extractAndReplace(a)
    }
  }
  // Extract from materials
  for (const mat of cleanWorkspace.materials) {
    for (const a of mat.attachments) extractAndReplace(a)
  }
  // Extract from tasks
  for (const t of cleanWorkspace.tasks) {
    if (t.evidenceAttachment) extractAndReplace(t.evidenceAttachment)
  }

  // Add full workspace.json
  zip.file('workspace.json', JSON.stringify(cleanWorkspace, null, 2))

  // Generate Base64 ZIP
  const base64Data = await zip.generateAsync({ type: 'base64' })
  const safeName = (workspace.projectMeta.name || 'AuditWorkspace').replace(/[^a-zA-Z0-9_-]/g, '_')
  const filename = `${safeName}_${new Date().toISOString().slice(0, 10)}.auditpkg`

  return await saveFileWithDialog(filename, base64Data, {
    isBase64: true,
    mimeType: 'application/zip',
  })
}

// Import complete workspace from a .auditpkg file
export async function importAuditPackage(file: File): Promise<AuditWorkspace> {
  const zip = await JSZip.loadAsync(file)

  const workspaceFile = zip.file('workspace.json')
  if (!workspaceFile) {
    throw new Error('File .auditpkg tidak valid: workspace.json tidak ditemukan!')
  }

  const workspaceJson = await workspaceFile.async('text')
  const workspace = JSON.parse(workspaceJson) as AuditWorkspace

  // Hydrate attachments from zip if needed
  const attachmentsFolder = zip.folder('attachments')
  if (attachmentsFolder) {
    const hydrate = async (att: Attachment | null | undefined) => {
      if (!att) return
      const filename = `${att.id}_${att.name}`
      const fileEntry = attachmentsFolder.file(filename)
      if (fileEntry) {
        const base64 = await fileEntry.async('base64')
        att.dataUrl = `data:${att.type || 'application/octet-stream'};base64,${base64}`
      }
    }

    for (const m of workspace.meetings) {
      if (m.pdfInvite) await hydrate(m.pdfInvite)
      if (m.attachments) {
        for (const a of m.attachments) await hydrate(a)
      }
    }
    for (const mat of workspace.materials) {
      for (const a of mat.attachments) await hydrate(a)
    }
    for (const t of workspace.tasks) {
      if (t.evidenceAttachment) await hydrate(t.evidenceAttachment)
    }
  }

  return workspace
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function formatDateString(dateStr: string): string {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}
