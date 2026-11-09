import { AuditWorkspace, MeetingCard, MaterialVaultCard, TaskCard, StickyNote, ConnectionLink } from '../types'

/**
 * Standard GMT+7 (WIB) Time Helper
 * Ensures uniform synchronization timestamps across all peers and host.
 */
export function getGmt7Time(): {
  epochMs: number
  isoGmt7: string
  displayWib: string
  timestamp: number
  isoString: string
} {
  const now = new Date()
  const epochMs = now.getTime()
  // Shift by 7 hours for GMT+7 representation
  const gmt7Date = new Date(epochMs + 7 * 60 * 60 * 1000)
  const isoGmt7 = gmt7Date.toISOString().replace('Z', '+07:00')
  const displayWib =
    now.toLocaleTimeString('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + ' WIB'

  return {
    epochMs,
    isoGmt7,
    displayWib,
    timestamp: epochMs,
    isoString: isoGmt7,
  }
}

export interface SmartMergeResult {
  mergedWorkspace: AuditWorkspace
  mergedCount: number
  summary: string
}

/**
 * Smart Merge: Reconciles offline draft edits into the authoritative workspace
 * Uses ID-based matching and GMT+7 epoch timestamps to avoid blind overwriting.
 */
export function smartMergeWorkspaces(
  baseWorkspace: AuditWorkspace,
  incomingDraft: AuditWorkspace
): SmartMergeResult {
  let mergedCount = 0
  const addedItems: string[] = []
  const updatedItems: string[] = []

  // 1. MERGE MEETINGS / AGENDA
  const baseMeetingsMap = new Map<string, MeetingCard>(baseWorkspace.meetings.map((m) => [m.id, { ...m }]))
  incomingDraft.meetings.forEach((inc) => {
    const existing = baseMeetingsMap.get(inc.id)
    if (!existing) {
      // New meeting added during offline draft
      baseMeetingsMap.set(inc.id, { ...inc, _isOfflineDraft: false })
      mergedCount++
      addedItems.push(`Agenda: "${inc.title}"`)
    } else {
      const incTime = inc.updatedAt || 0
      const baseTime = existing.updatedAt || 0
      // If incoming draft was updated more recently or has changes
      if (incTime >= baseTime && (inc.transcript !== existing.transcript || inc.title !== existing.title)) {
        // Merge attachments
        const existingAttachments = existing.attachments || []
        const incomingAttachments = inc.attachments || []
        const mergedAttachments = [...existingAttachments]
        incomingAttachments.forEach((att) => {
          if (!mergedAttachments.some((a) => a.id === att.id || a.name === att.name)) {
            mergedAttachments.push(att)
          }
        })

        baseMeetingsMap.set(inc.id, {
          ...existing,
          ...inc,
          attachments: mergedAttachments,
          _isOfflineDraft: false,
        })
        mergedCount++
        updatedItems.push(`Agenda: "${inc.title}"`)
      }
    }
  })

  // 2. MERGE TASKS / WORKING PAPERS
  const baseTasksMap = new Map<string, TaskCard>(baseWorkspace.tasks.map((t) => [t.id, { ...t }]))
  incomingDraft.tasks.forEach((inc) => {
    const existing = baseTasksMap.get(inc.id)
    if (!existing) {
      baseTasksMap.set(inc.id, { ...inc, _isOfflineDraft: false })
      mergedCount++
      addedItems.push(`Tugas: "${inc.title}"`)
    } else {
      const incTime = inc.updatedAt || 0
      const baseTime = existing.updatedAt || 0
      if (incTime >= baseTime && (inc.status !== existing.status || inc.title !== existing.title || inc.description !== existing.description)) {
        baseTasksMap.set(inc.id, {
          ...existing,
          ...inc,
          _isOfflineDraft: false,
        })
        mergedCount++
        updatedItems.push(`Tugas: "${inc.title}"`)
      }
    }
  })

  // 3. MERGE MATERIALS & FILES
  const baseMaterialsMap = new Map<string, MaterialVaultCard>(baseWorkspace.materials.map((m) => [m.id, { ...m }]))
  incomingDraft.materials.forEach((inc) => {
    const existing = baseMaterialsMap.get(inc.id)
    if (!existing) {
      baseMaterialsMap.set(inc.id, { ...inc, _isOfflineDraft: false })
      mergedCount++
      addedItems.push(`Materi: "${inc.title}"`)
    } else {
      const incTime = inc.updatedAt || 0
      const baseTime = existing.updatedAt || 0
      if (incTime >= baseTime) {
        // Merge attachments and links
        const mergedAtts = [...existing.attachments]
        inc.attachments.forEach((a) => {
          if (!mergedAtts.some((ea) => ea.id === a.id || ea.name === a.name)) {
            mergedAtts.push(a)
          }
        })
        const mergedLinks = [...existing.links]
        inc.links.forEach((l) => {
          if (!mergedLinks.some((el) => el.id === l.id || el.url === l.url)) {
            mergedLinks.push(l)
          }
        })
        baseMaterialsMap.set(inc.id, {
          ...existing,
          ...inc,
          attachments: mergedAtts,
          links: mergedLinks,
          _isOfflineDraft: false,
        })
        mergedCount++
        updatedItems.push(`Materi: "${inc.title}"`)
      }
    }
  })

  // 4. MERGE STICKY NOTES
  const baseStickiesMap = new Map<string, StickyNote>(baseWorkspace.stickies.map((s) => [s.id, { ...s }]))
  incomingDraft.stickies.forEach((inc) => {
    const existing = baseStickiesMap.get(inc.id)
    if (!existing) {
      baseStickiesMap.set(inc.id, { ...inc, _isOfflineDraft: false })
      mergedCount++
      addedItems.push(`Catatan: "${inc.content.substring(0, 15)}..."`)
    } else {
      const incTime = inc.updatedAt || 0
      const baseTime = existing.updatedAt || 0
      if (incTime >= baseTime && (inc.content !== existing.content || inc.color !== existing.color)) {
        baseStickiesMap.set(inc.id, {
          ...existing,
          ...inc,
          _isOfflineDraft: false,
        })
        mergedCount++
        updatedItems.push(`Catatan: "${inc.content.substring(0, 15)}..."`)
      }
    }
  })

  // 5. MERGE CONNECTIONS
  const baseConnections = [...baseWorkspace.connections]
  incomingDraft.connections.forEach((inc) => {
    const exists = baseConnections.some(
      (c) => c.id === inc.id || (c.fromId === inc.fromId && c.toId === inc.toId)
    )
    if (!exists) {
      baseConnections.push(inc)
      mergedCount++
    }
  })

  const mergedWorkspace: AuditWorkspace = {
    ...baseWorkspace,
    meetings: Array.from(baseMeetingsMap.values()),
    tasks: Array.from(baseTasksMap.values()),
    materials: Array.from(baseMaterialsMap.values()),
    stickies: Array.from(baseStickiesMap.values()),
    connections: baseConnections,
    lastModified: getGmt7Time().isoGmt7,
  }

  const summary = [
    addedItems.length > 0 ? `+${addedItems.length} baru` : '',
    updatedItems.length > 0 ? `${updatedItems.length} diperbarui` : '',
  ]
    .filter(Boolean)
    .join(', ')

  return {
    mergedWorkspace,
    mergedCount,
    summary: summary || 'Tidak ada benturan perubahan',
  }
}
