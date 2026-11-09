import { useState, useEffect } from 'react'
import {
  AuditWorkspace,
  MeetingCard,
  MaterialVaultCard,
  TaskCard,
  StickyNote,
  Attachment,
  ProjectMeta,
  MultiSpaceStore,
  CustomColumn,
  CustomCard,
  TaskStatus,
} from './types'
import {
  loadMultiSpaceStore,
  saveMultiSpaceStore,
  createNewSpace,
  exportAuditPackage,
  importAuditPackage,
  factoryResetStorage,
  fileToAttachment,
} from './services/storage'
import { Upload, CheckCircle2, RefreshCw } from 'lucide-react'
import {
  getNextMeetingPosition,
  getNextMaterialPosition,
  getNextTaskPosition,
  getNextStickyPosition,
  autoLayoutWorkspace,
} from './services/layoutHelper'
import { getSampleWorkspace } from './services/sampleData'
import { Header } from './components/Header'
import { CanvasView } from './components/CanvasView'
import { KanbanView } from './components/KanbanView'
import { MeetingModal } from './components/MeetingModal'
import { MeetingReaderModal } from './components/MeetingReaderModal'
import { MaterialModal } from './components/MaterialModal'
import { TaskModal } from './components/TaskModal'
import { StickyModal } from './components/StickyModal'
import { SpaceModal } from './components/SpaceModal'
import { PdfViewerModal } from './components/PdfViewerModal'
import { ReportModal } from './components/ReportModal'
import { ArtifactsVaultModal } from './components/ArtifactsVaultModal'
import { CloudSyncModal } from './components/CloudSyncModal'
import { UpdateModal } from './components/UpdateModal'
import { ResetConfirmModal } from './components/ResetConfirmModal'
import { ShareModal } from './components/ShareModal'
import { DisconnectPromptModal } from './components/DisconnectPromptModal'
import { LeaveSpaceConfirmModal } from './components/LeaveSpaceConfirmModal'
import { exportInteractiveHtmlReport } from './services/htmlReportExporter'
import { p2pSync, CollabState } from './services/p2pSync'
import { getGmt7Time } from './services/smartMerge'

export function App() {
  const [multiStore, setMultiStore] = useState<MultiSpaceStore>(() => loadMultiSpaceStore())
  const [viewMode, setViewMode] = useState<'canvas' | 'kanban'>('canvas')
  const [lastSavedTime, setLastSavedTime] = useState<string>('')
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('auditspace_theme')
    if (saved === 'dark') return true
    if (saved === 'light') return false
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches || false
  })

  // Listen to Windows / OS theme changes when not manually overridden
  useEffect(() => {
    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mediaQuery) return

    const handleChange = (e: MediaQueryListEvent) => {
      const saved = localStorage.getItem('auditspace_theme')
      if (!saved) {
        setDarkMode(e.matches)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Modals
  const [editingMeeting, setEditingMeeting] = useState<MeetingCard | null>(null)
  const [isMeetingOpen, setIsMeetingOpen] = useState(false)
  const [readingMeeting, setReadingMeeting] = useState<MeetingCard | null>(null)

  const [editingMaterial, setEditingMaterial] = useState<MaterialVaultCard | null>(null)
  const [isMaterialOpen, setIsMaterialOpen] = useState(false)

  const [editingTask, setEditingTask] = useState<TaskCard | null>(null)
  const [isTaskOpen, setIsTaskOpen] = useState(false)

  const [editingSticky, setEditingSticky] = useState<StickyNote | null>(null)
  const [isStickyOpen, setIsStickyOpen] = useState(false)

  const [isSpaceModalOpen, setIsSpaceModalOpen] = useState(false)
  const [spaceToEdit, setSpaceToEdit] = useState<ProjectMeta | null>(null)

  const [isReportOpen, setIsReportOpen] = useState(false)
  const [isArtifactsVaultOpen, setIsArtifactsVaultOpen] = useState(false)
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isDisconnectPromptOpen, setIsDisconnectPromptOpen] = useState(false)
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [offlineDraftCount, setOfflineDraftCount] = useState<number>(0)
  const [disconnectedWorkspaceSnapshot, setDisconnectedWorkspaceSnapshot] = useState<AuditWorkspace | null>(null)
  const [collabState, setCollabState] = useState<CollabState>(p2pSync.getState())
  const [isWindowDragOver, setIsWindowDragOver] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // P2P Collaboration Sync Listener
  useEffect(() => {
    let prevConnected = false
    let prevRole: 'host' | 'peer' | null = null

    const unsubState = p2pSync.subscribeState((newState) => {
      setCollabState(newState)

      // When peer disconnects unexpectedly (e.g. host sleep/closed/timeout), keep remote space locked and prompt user
      if (newState.wasUnexpectedDisconnect) {
        setMultiStore((prevStore) => {
          const remote = prevStore.spaces.find((s) => s.projectMeta.id === prevStore.activeSpaceId)
          if (remote) {
            setDisconnectedWorkspaceSnapshot(remote)
          }
          return prevStore
        })
        setIsDisconnectPromptOpen(true)
      } else if (prevConnected && !newState.isConnected && prevRole === 'peer') {
        // Normal/intentional disconnect: cleanly clean up remote space and restore local space
        setMultiStore((prevStore) => {
          const cleaned = prevStore.spaces.filter((s) => !s.projectMeta.id.startsWith('p2p-session-'))
          const fallback =
            cleaned.find((s) => !s.projectMeta.id.startsWith('p2p-session-')) || cleaned[0]
          return {
            spaces: cleaned.length > 0 ? cleaned : prevStore.spaces,
            activeSpaceId: fallback ? fallback.projectMeta.id : prevStore.activeSpaceId,
          }
        })
      }

      prevConnected = newState.isConnected
      prevRole = newState.role
    })

    const unsubWs = p2pSync.subscribeWorkspace((syncedWs) => {
      setMultiStore((prev) => {
        const state = p2pSync.getState()
        if (state.role === 'peer') {
          // ISOLATED REMOTE PEER SPACE: Never overwrite local space
          const remoteSpaceId = `p2p-session-${state.roomId || 'shared'}`
          const remoteWs: AuditWorkspace = {
            ...syncedWs,
            projectMeta: {
              ...syncedWs.projectMeta,
              id: remoteSpaceId,
              name: syncedWs.projectMeta.name.includes('(P2P)')
                ? syncedWs.projectMeta.name
                : `${syncedWs.projectMeta.name} (P2P)`,
            },
          }

          const existingIndex = prev.spaces.findIndex(
            (s) => s.projectMeta.id === remoteSpaceId
          )

          let updatedSpaces: AuditWorkspace[]
          if (existingIndex >= 0) {
            updatedSpaces = prev.spaces.map((s, idx) =>
              idx === existingIndex ? remoteWs : s
            )
          } else {
            updatedSpaces = [...prev.spaces, remoteWs]
          }

          return {
            ...prev,
            activeSpaceId: remoteSpaceId,
            spaces: updatedSpaces,
          }
        }

        // Host mode or standalone sync
        const exists = prev.spaces.some((s) => s.projectMeta.id === syncedWs.projectMeta.id)
        return {
          ...prev,
          activeSpaceId: syncedWs.projectMeta.id,
          spaces: exists
            ? prev.spaces.map((s) => (s.projectMeta.id === syncedWs.projectMeta.id ? syncedWs : s))
            : [...prev.spaces, syncedWs],
        }
      })
    })

    const unsubResync = p2pSync.subscribeResyncCompleted((summary) => {
      setOfflineDraftCount(0)
      setToastMessage(`✓ Re-sync berhasil: ${summary}`)
      setTimeout(() => setToastMessage(null), 5000)
    })

    return () => {
      unsubState()
      unsubWs()
      unsubResync()
    }
  }, [])

  // Sync window & document title dynamically with version
  useEffect(() => {
    const isTauri =
      typeof window !== 'undefined' &&
      ('__TAURI_INTERNALS__' in window || '__TAURI__' in window)
    if (isTauri) {
      import('@tauri-apps/api/window')
        .then(({ getCurrentWindow }) => {
          getCurrentWindow().setTitle('AuditSpace v1.0.16').catch(() => {})
        })
        .catch(() => {})
    }
    document.title = 'AuditSpace v1.0.16'
  }, [])

  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null)

  // Current active workspace
  const activeSpace =
    multiStore.spaces.find((s) => s.projectMeta.id === multiStore.activeSpaceId) ||
    multiStore.spaces[0]

  // Persist state & update autosaved time
  useEffect(() => {
    saveMultiSpaceStore(multiStore)
    const now = new Date()
    setLastSavedTime(
      now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB'
    )
  }, [multiStore])

  // Toggle Dark Mode Class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const handleToggleDarkMode = () => {
    const nextDark = !darkMode
    setDarkMode(nextDark)
    localStorage.setItem('auditspace_theme', nextDark ? 'dark' : 'light')
  }

  // Synchronize document.title to display app version on the native title bar
  useEffect(() => {
    const spaceName = activeSpace?.projectMeta?.name || 'Workspace'
    const fullTitle = `AuditSpace v1.0.16 - ${spaceName}`
    document.title = fullTitle
    const isTauri =
      typeof window !== 'undefined' &&
      ('__TAURI_INTERNALS__' in window || '__TAURI__' in window)
    if (isTauri) {
      import('@tauri-apps/api/window')
        .then(({ getCurrentWindow }) => {
          getCurrentWindow().setTitle(fullTitle).catch(() => {})
        })
        .catch(() => {})
    }
  }, [activeSpace?.projectMeta?.name])

  // Helper to update active space
  const updateActiveSpace = (updater: (prev: AuditWorkspace) => AuditWorkspace) => {
    // If peer is unexpectedly disconnected on a remote P2P space, allow offline drafting
    const isDisconnectedRemote =
      collabState.wasUnexpectedDisconnect &&
      activeSpace?.projectMeta?.id.startsWith('p2p-session-')

    if (isDisconnectedRemote) {
      setOfflineDraftCount((c) => c + 1)
    }

    const gmt7 = getGmt7Time()

    setMultiStore((prev) => {
      const updatedSpaces = prev.spaces.map((s) => {
        if (s.projectMeta.id === prev.activeSpaceId) {
          const updated = updater(s)

          // In offline draft mode, mark cards with GMT+7 timestamps and draft flag
          if (isDisconnectedRemote) {
            return {
              ...updated,
              meetings: updated.meetings.map((m) => ({
                ...m,
                updatedAt: m.updatedAt || gmt7.timestamp,
                updatedAtGmt7: m.updatedAtGmt7 || gmt7.isoString,
                _isOfflineDraft: true,
              })),
              materials: updated.materials.map((m) => ({
                ...m,
                updatedAt: m.updatedAt || gmt7.timestamp,
                updatedAtGmt7: m.updatedAtGmt7 || gmt7.isoString,
                _isOfflineDraft: true,
              })),
              tasks: updated.tasks.map((t) => ({
                ...t,
                updatedAt: t.updatedAt || gmt7.timestamp,
                updatedAtGmt7: t.updatedAtGmt7 || gmt7.isoString,
                _isOfflineDraft: true,
              })),
              stickies: updated.stickies.map((st) => ({
                ...st,
                updatedAt: st.updatedAt || gmt7.timestamp,
                updatedAtGmt7: st.updatedAtGmt7 || gmt7.isoString,
                _isOfflineDraft: true,
              })),
            }
          }

          // Broadcast to connected P2P peers if in read-write session
          p2pSync.broadcastWorkspace(updated)
          return updated
        }
        return s
      })
      return {
        ...prev,
        spaces: updatedSpaces,
      }
    })
  }

  // P2P DISCONNECT ACTIONS: Save as Local, Reconnect, or Discard
  const handleSaveRemoteAsLocal = () => {
    const sourceWs = disconnectedWorkspaceSnapshot || activeSpace
    const newSpaceId = `proj-salinan-${Date.now()}`
    const cleanName =
      sourceWs.projectMeta.name.replace(/\s*\(P2P\)\s*/g, '').trim() + ' (Salinan Mandiri)'

    const clonedWs: AuditWorkspace = {
      ...sourceWs,
      projectMeta: {
        ...sourceWs.projectMeta,
        id: newSpaceId,
        name: cleanName,
      },
    }

    setMultiStore((prevStore) => {
      const filtered = prevStore.spaces.filter(
        (s) => !s.projectMeta.id.startsWith('p2p-session-')
      )
      return {
        spaces: [clonedWs, ...filtered],
        activeSpaceId: newSpaceId,
      }
    })

    p2pSync.disconnect()
    p2pSync.clearDisconnectAlert()
    setIsDisconnectPromptOpen(false)
    setIsLeaveConfirmOpen(false)
    setDisconnectedWorkspaceSnapshot(null)
    setToastMessage('Ruang berhasil disimpan sebagai Space Lokal Mandiri Anda!')
    setTimeout(() => setToastMessage(null), 4000)
  }

  const handleReconnect = async () => {
    const roomId = collabState.lastRoomId || collabState.roomId
    if (!roomId) return
    setIsReconnecting(true)
    try {
      const savedName = localStorage.getItem('auditspace_collab_name') || undefined
      const draftToSend = offlineDraftCount > 0 ? activeSpace : undefined
      await p2pSync.joinRoom(roomId, savedName, draftToSend)
      setIsDisconnectPromptOpen(false)
      p2pSync.clearDisconnectAlert()
      setToastMessage(
        draftToSend
          ? `Tersambung kembali ke ruang ${roomId}! Mengirim draft offline (${offlineDraftCount} perubahan) ke Host...`
          : `Berhasil tersambung kembali ke ruang ${roomId}!`
      )
      setTimeout(() => setToastMessage(null), 4000)
    } catch (err: any) {
      console.error('Reconnect failed:', err)
      setToastMessage(`Gagal menyambung ulang: ${err?.message || err}`)
      setTimeout(() => setToastMessage(null), 4000)
    } finally {
      setIsReconnecting(false)
    }
  }

  const handleDiscardAndLeave = () => {
    setMultiStore((prevStore) => {
      const cleaned = prevStore.spaces.filter(
        (s) => !s.projectMeta.id.startsWith('p2p-session-')
      )
      const fallback =
        cleaned.find((s) => !s.projectMeta.id.startsWith('p2p-session-')) || cleaned[0]
      return {
        spaces: cleaned.length > 0 ? cleaned : prevStore.spaces,
        activeSpaceId: fallback ? fallback.projectMeta.id : prevStore.activeSpaceId,
      }
    })

    p2pSync.disconnect()
    p2pSync.clearDisconnectAlert()
    setIsDisconnectPromptOpen(false)
    setIsLeaveConfirmOpen(false)
    setDisconnectedWorkspaceSnapshot(null)
    setToastMessage('Telah keluar dari sesi dan kembali ke Space Lokal Anda.')
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handlePeerManualLeave = () => {
    setIsLeaveConfirmOpen(true)
  }

  // SPACE MANAGEMENT
  const handleSwitchSpace = (spaceId: string) => {
    setMultiStore((prev) => ({ ...prev, activeSpaceId: spaceId }))
  }

  const handleOpenCreateSpace = () => {
    setSpaceToEdit(null)
    setIsSpaceModalOpen(true)
  }

  const handleOpenEditSpace = (meta: ProjectMeta) => {
    setSpaceToEdit(meta)
    setIsSpaceModalOpen(true)
  }

  const handleSaveSpace = (data: {
    name: string
    timeline: string
    auditeeName: string
    leadAuditor: string
    description: string
    useTemplate: boolean
  }) => {
    if (spaceToEdit) {
      // Edit existing
      updateActiveSpace((prev) => ({
        ...prev,
        projectMeta: {
          ...prev.projectMeta,
          name: data.name,
          timeline: data.timeline,
          auditeeName: data.auditeeName,
          leadAuditor: data.leadAuditor,
          description: data.description,
        },
      }))
    } else {
      // Create new space
      const newSpace = createNewSpace(
        data.name,
        data.timeline,
        data.auditeeName,
        data.leadAuditor,
        data.description
      )
      setMultiStore((prev) => ({
        activeSpaceId: newSpace.projectMeta.id,
        spaces: [...prev.spaces, newSpace],
      }))
    }
  }

  const handleDeleteSpace = (spaceId: string) => {
    setMultiStore((prev) => {
      const remaining = prev.spaces.filter((s) => s.projectMeta.id !== spaceId)
      if (remaining.length === 0) return prev
      return {
        activeSpaceId: remaining[0].projectMeta.id,
        spaces: remaining,
      }
    })
  }

  // MEETINGS HANDLERS
  const handleSaveMeeting = (meeting: MeetingCard) => {
    const gmt7 = getGmt7Time()
    const meetingWithGmt7: MeetingCard = {
      ...meeting,
      updatedAt: gmt7.timestamp,
      updatedAtGmt7: gmt7.isoString,
    }
    updateActiveSpace((prev) => {
      const exists = prev.meetings.some((m) => m.id === meeting.id)
      let itemToSave = meetingWithGmt7
      if (!exists) {
        const nextPos = getNextMeetingPosition(prev.meetings)
        itemToSave = { ...meetingWithGmt7, x: nextPos.x, y: nextPos.y }
      }
      return {
        ...prev,
        meetings: exists
          ? prev.meetings.map((m) => (m.id === meeting.id ? itemToSave : m))
          : [...prev.meetings, itemToSave],
      }
    })
  }

  const handleDeleteMeeting = (id: string) => {
    updateActiveSpace((prev) => ({
      ...prev,
      meetings: prev.meetings.filter((m) => m.id !== id),
      connections: prev.connections.filter((c) => c.fromId !== id && c.toId !== id),
    }))
  }

  // MATERIALS HANDLERS
  const handleSaveMaterial = (mat: MaterialVaultCard) => {
    const gmt7 = getGmt7Time()
    const matWithGmt7: MaterialVaultCard = {
      ...mat,
      updatedAt: gmt7.timestamp,
      updatedAtGmt7: gmt7.isoString,
    }
    updateActiveSpace((prev) => {
      const exists = prev.materials.some((m) => m.id === mat.id)
      let itemToSave = matWithGmt7
      if (!exists) {
        const nextPos = getNextMaterialPosition(prev.materials)
        itemToSave = { ...matWithGmt7, x: nextPos.x, y: nextPos.y }
      }
      return {
        ...prev,
        materials: exists
          ? prev.materials.map((m) => (m.id === mat.id ? itemToSave : m))
          : [...prev.materials, itemToSave],
      }
    })
  }

  const handleDeleteMaterial = (id: string) => {
    updateActiveSpace((prev) => ({
      ...prev,
      materials: prev.materials.filter((m) => m.id !== id),
      connections: prev.connections.filter((c) => c.fromId !== id && c.toId !== id),
    }))
  }

  // GLOBAL DRAG & DROP LISTENER
  // Prevents browser navigation on file drop and automatically creates Material cards when dropped on workspace
  useEffect(() => {
    let dragCounter = 0

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault()
      dragCounter++
      if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')) {
        setIsWindowDragOver(true)
      }
    }

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy'
      }
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      dragCounter--
      if (dragCounter <= 0) {
        dragCounter = 0
        setIsWindowDragOver(false)
      }
    }

    const handleWindowDrop = async (e: DragEvent) => {
      e.preventDefault()
      dragCounter = 0
      setIsWindowDragOver(false)

      const files = e.dataTransfer?.files
      if (!files || files.length === 0) return

      // If any modal is open, let the modal handle it or avoid creating global cards
      const anyModalOpen =
        isMeetingOpen ||
        isMaterialOpen ||
        isTaskOpen ||
        isStickyOpen ||
        isSpaceModalOpen ||
        isReportOpen ||
        isArtifactsVaultOpen ||
        isCloudSyncOpen ||
        isUpdateModalOpen ||
        isResetModalOpen ||
        isShareModalOpen ||
        !!previewAttachment

      if (anyModalOpen) {
        return
      }

      try {
        const atts: Attachment[] = []
        for (let i = 0; i < files.length; i++) {
          const att = await fileToAttachment(files[i])
          atts.push(att)
        }

        const title =
          files.length === 1
            ? files[0].name.replace(/\.[^/.]+$/, '')
            : `Dokumen Masuk (${files.length} Berkas)`

        const newMaterial: MaterialVaultCard = {
          id: 'mat-' + Math.random().toString(36).substring(2, 9),
          title,
          description: `Diunggah via Drag & Drop pada ${new Date().toLocaleDateString('id-ID')}`,
          attachments: atts,
          links: [],
          x: 200,
          y: 200,
        }

        handleSaveMaterial(newMaterial)
        setToastMessage(`✓ ${atts.length} berkas berhasil ditambahkan ke Materi & Berkas Auditee!`)
        setTimeout(() => setToastMessage(null), 3500)
      } catch (err) {
        alert('Gagal memproses berkas yang di-drop: ' + err)
      }
    }

    window.addEventListener('dragenter', handleDragEnter)
    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('dragleave', handleDragLeave)
    window.addEventListener('drop', handleWindowDrop)

    return () => {
      window.removeEventListener('dragenter', handleDragEnter)
      window.removeEventListener('dragover', handleDragOver)
      window.removeEventListener('dragleave', handleDragLeave)
      window.removeEventListener('drop', handleWindowDrop)
    }
  }, [
    isMeetingOpen,
    isMaterialOpen,
    isTaskOpen,
    isStickyOpen,
    isSpaceModalOpen,
    isReportOpen,
    isArtifactsVaultOpen,
    isCloudSyncOpen,
    isUpdateModalOpen,
    isResetModalOpen,
    isShareModalOpen,
    previewAttachment,
  ])

  // TASKS HANDLERS
  const handleSaveTask = (task: TaskCard) => {
    const gmt7 = getGmt7Time()
    const taskWithGmt7: TaskCard = {
      ...task,
      updatedAt: gmt7.timestamp,
      updatedAtGmt7: gmt7.isoString,
    }
    updateActiveSpace((prev) => {
      const existing = prev.tasks.find((t) => t.id === task.id)
      let itemToSave = taskWithGmt7
      if (!existing) {
        const nextPos = getNextTaskPosition(prev.tasks, task.status)
        itemToSave = { ...taskWithGmt7, x: nextPos.x, y: nextPos.y }
      } else if (existing.status !== task.status) {
        const nextPos = getNextTaskPosition(prev.tasks, task.status)
        itemToSave = { ...taskWithGmt7, x: nextPos.x, y: nextPos.y }
      }
      return {
        ...prev,
        tasks: existing
          ? prev.tasks.map((t) => (t.id === task.id ? itemToSave : t))
          : [...prev.tasks, itemToSave],
      }
    })
  }

  const handleDeleteTask = (id: string) => {
    updateActiveSpace((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
      connections: prev.connections.filter((c) => c.fromId !== id && c.toId !== id),
    }))
  }

  const handleToggleTaskDone = (task: TaskCard) => {
    const gmt7 = getGmt7Time()
    const nextStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done'
    const updated: TaskCard = {
      ...task,
      status: nextStatus,
      completedAt: nextStatus === 'done' ? gmt7.isoString : undefined,
      completedBy: nextStatus === 'done' ? (task.pic || 'Auditor') : undefined,
      updatedAt: gmt7.timestamp,
      updatedAtGmt7: gmt7.isoString,
    }
    handleSaveTask(updated)
  }

  // STICKIES HANDLERS
  const handleSaveSticky = (sticky: StickyNote) => {
    const gmt7 = getGmt7Time()
    const stickyWithGmt7: StickyNote = {
      ...sticky,
      updatedAt: gmt7.timestamp,
      updatedAtGmt7: gmt7.isoString,
    }
    updateActiveSpace((prev) => {
      const exists = prev.stickies.some((s) => s.id === sticky.id)
      let itemToSave = stickyWithGmt7
      if (!exists) {
        const nextPos = getNextStickyPosition(prev.stickies)
        itemToSave = { ...stickyWithGmt7, x: nextPos.x, y: nextPos.y }
      }
      return {
        ...prev,
        stickies: exists
          ? prev.stickies.map((s) => (s.id === sticky.id ? itemToSave : s))
          : [...prev.stickies, itemToSave],
      }
    })
  }

  const handleDeleteSticky = (id: string) => {
    updateActiveSpace((prev) => ({
      ...prev,
      stickies: prev.stickies.filter((s) => s.id !== id),
    }))
  }

  const handleAutoLayout = () => {
    updateActiveSpace((prev) => autoLayoutWorkspace(prev))
  }

  // TASK STATUS TRANSITIONS (To-Do <-> In-Progress)
  const handleUpdateTaskStatus = (taskId: string, status: TaskStatus) => {
    const gmt7 = getGmt7Time()
    updateActiveSpace((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== taskId) return t
        return {
          ...t,
          status,
          completedAt: status === 'done' ? (t.completedAt || gmt7.isoString) : undefined,
          completedBy: status === 'done' ? (t.completedBy || t.pic || 'Auditor') : undefined,
          updatedAt: gmt7.timestamp,
          updatedAtGmt7: gmt7.isoString,
        }
      }),
    }))
  }

  // COLUMN CUSTOMIZATION & RENAME
  const handleRenameColumn = (columnKey: string, newTitle: string) => {
    updateActiveSpace((prev) => ({
      ...prev,
      columnTitles: {
        ...(prev.columnTitles || {}),
        [columnKey]: newTitle,
      },
    }))
  }

  const handleResetColumnTitle = (columnKey: string) => {
    updateActiveSpace((prev) => {
      const copy = { ...(prev.columnTitles || {}) }
      delete copy[columnKey]
      return {
        ...prev,
        columnTitles: copy,
      }
    })
  }

  const handleSaveCustomColumn = (col: CustomColumn) => {
    updateActiveSpace((prev) => {
      const existing = (prev.customColumns || []).some((c) => c.id === col.id)
      return {
        ...prev,
        customColumns: existing
          ? (prev.customColumns || []).map((c) => (c.id === col.id ? col : c))
          : [...(prev.customColumns || []), col],
      }
    })
  }

  const handleDeleteCustomColumn = (columnId: string) => {
    updateActiveSpace((prev) => ({
      ...prev,
      customColumns: (prev.customColumns || []).filter((c) => c.id !== columnId),
      customCards: (prev.customCards || []).filter((c) => c.columnId !== columnId),
    }))
  }

  const handleSaveCustomCard = (card: CustomCard) => {
    updateActiveSpace((prev) => {
      const existing = (prev.customCards || []).some((c) => c.id === card.id)
      return {
        ...prev,
        customCards: existing
          ? (prev.customCards || []).map((c) => (c.id === card.id ? card : c))
          : [...(prev.customCards || []), card],
      }
    })
  }

  const handleDeleteCustomCard = (cardId: string) => {
    updateActiveSpace((prev) => ({
      ...prev,
      customCards: (prev.customCards || []).filter((c) => c.id !== cardId),
    }))
  }

  // ADD NEW ITEM DISPATCHER
  const handleAddNew = (type: 'meeting' | 'material' | 'task' | 'sticky') => {
    if (type === 'meeting') {
      setEditingMeeting(null)
      setIsMeetingOpen(true)
    } else if (type === 'material') {
      setEditingMaterial(null)
      setIsMaterialOpen(true)
    } else if (type === 'task') {
      setEditingTask(null)
      setIsTaskOpen(true)
    } else if (type === 'sticky') {
      setEditingSticky(null)
      setIsStickyOpen(true)
    }
  }

  // EXPORT / IMPORT / RESET
  const handleExport = async () => {
    try {
      const res = await exportAuditPackage(activeSpace)
      if (res && res.success && res.path) {
        setToastMessage(`✓ Bundle .auditpkg tersimpan di:\n${res.path}`)
        setTimeout(() => setToastMessage(null), 5000)
      }
    } catch (err) {
      alert('Gagal mengekspor bundle .auditpkg: ' + err)
    }
  }

  const handleImport = async (file: File) => {
    try {
      const imported = await importAuditPackage(file)
      const existingIdx = multiStore.spaces.findIndex(
        (s) => s.projectMeta.id === imported.projectMeta.id
      )

      if (existingIdx >= 0) {
        if (
          confirm(
            `Space "${imported.projectMeta.name}" sudah ada. Apakah Anda ingin menimpa data yang ada?`
          )
        ) {
          setMultiStore((prev) => ({
            activeSpaceId: imported.projectMeta.id,
            spaces: prev.spaces.map((s, idx) => (idx === existingIdx ? imported : s)),
          }))
        }
      } else {
        setMultiStore((prev) => ({
          activeSpaceId: imported.projectMeta.id,
          spaces: [...prev.spaces, imported],
        }))
        alert(`Berhasil memulihkan (restore) space audit: "${imported.projectMeta.name}"!`)
      }
    } catch (err) {
      alert('Gagal memulihkan cadangan .auditpkg: ' + err)
    }
  }

  const handleResetCurrentSpace = () => {
    const sample = getSampleWorkspace()
    updateActiveSpace(() => sample)
  }

  const handleFactoryResetAll = () => {
    factoryResetStorage()
    const fresh = loadMultiSpaceStore()
    setMultiStore(fresh)
  }

  return (
    <div className="flex flex-col w-screen h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans">
      {/* Top Header with Multi-Space Switcher & Autosave Badge */}
      <Header
        spaces={multiStore.spaces}
        activeSpace={activeSpace}
        onSwitchSpace={handleSwitchSpace}
        onOpenCreateSpace={handleOpenCreateSpace}
        onOpenEditSpace={handleOpenEditSpace}
        onDeleteSpace={handleDeleteSpace}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onExport={handleExport}
        onImport={handleImport}
        onAddNew={handleAddNew}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenArtifactsVault={() => setIsArtifactsVaultOpen(true)}
        onOpenCloudSync={() => setIsCloudSyncOpen(true)}
        onOpenUpdateModal={() => setIsUpdateModalOpen(true)}
        onOpenResetConfirm={() => setIsResetModalOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onExportHtmlReport={() => exportInteractiveHtmlReport(activeSpace)}
        isCollaborating={collabState.isConnected}
        collabRoomId={collabState.roomId}
        lastSavedTime={lastSavedTime}
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
      />

      {/* Disconnected Peer Offline Draft Mode Banner */}
      {collabState.wasUnexpectedDisconnect && activeSpace.projectMeta.id.startsWith('p2p-session-') && (
        <div className="bg-gradient-to-r from-amber-500/25 via-amber-500/15 to-orange-500/20 border-b border-amber-500/40 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-950 dark:text-amber-100 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5 font-medium flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-black text-[10px] tracking-wide uppercase shadow-xs flex items-center gap-1.5 animate-pulse">
              ✏️ MODE OFFLINE (DRAFT)
            </span>
            <span>
              Koneksi ke Host terputus. Anda tetap dapat mencatat & mengedit (Waktu GMT+7 WIB).
            </span>
            {offlineDraftCount > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-amber-200 dark:bg-amber-900/60 font-bold text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                {offlineDraftCount} perubahan draft lokal tersimpan
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReconnect}
              disabled={isReconnecting}
              className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {isReconnecting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Menghubungkan...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  Sambung Ulang & Re-sync
                </>
              )}
            </button>
            <button
              onClick={() => setIsDisconnectPromptOpen(true)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 dark:hover:bg-amber-900/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 transition"
            >
              Opsi Simpan
            </button>
            <button
              onClick={handlePeerManualLeave}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 text-zinc-800 dark:text-zinc-200 transition"
            >
              Kembali ke Space Saya
            </button>
          </div>
        </div>
      )}

      {/* Peer Collaboration Banner with Disconnect & Return to Local Space */}
      {collabState.isConnected && collabState.role === 'peer' && (
        <div
          className={`px-6 py-2 flex items-center justify-between text-xs border-b ${
            collabState.accessMode === 'read-only'
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-800 dark:text-amber-300'
              : 'bg-blue-500/15 border-blue-500/30 text-blue-800 dark:text-blue-300'
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            <span
              className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                collabState.accessMode === 'read-only' ? 'bg-amber-500/20' : 'bg-blue-500/20'
              }`}
            >
              {collabState.accessMode === 'read-only' ? '🔒 Peninjau (Read-Only)' : '✏️ Editor P2P'}
            </span>
            <span>
              Anda sedang berada di ruang rekan: <strong>{activeSpace.projectMeta.name}</strong> ({collabState.roomId}).
            </span>
            {collabState.participants && collabState.participants.length > 0 && (
              <div className="flex items-center -space-x-1.5 ml-2">
                {collabState.participants.map((p) => (
                  <span
                    key={p.id}
                    title={`${p.name} (${p.role === 'host' ? 'Host Ruang' : 'Rekan Editor'}${p.isYou ? ' - Anda' : ''})`}
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-extrabold text-white uppercase ring-2 ring-white dark:ring-zinc-900 shadow-xs cursor-default"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.name.substring(0, 2)}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handlePeerManualLeave}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-zinc-800 border shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 transition text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5"
            title="Keluar dari sesi ruang rekan dan kembali ke ruang kerja audit lokal Anda"
          >
            <span>Kembali ke Space Saya</span>
          </button>
        </div>
      )}

      {/* Host Collaboration Indicator Banner */}
      {collabState.isConnected && collabState.role === 'host' && (
        <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-6 py-2 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-2 font-medium">
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 font-bold text-[10px] uppercase tracking-wider">
              📡 Host Ruang Aktif
            </span>
            <span>
              Kode Ruang: <strong>{collabState.roomId}</strong> • {collabState.connectedPeersCount} rekan terhubung
            </span>
            {collabState.participants && collabState.participants.length > 0 && (
              <div className="flex items-center -space-x-1.5 ml-2">
                {collabState.participants.map((p) => (
                  <span
                    key={p.id}
                    title={`${p.name} (${p.role === 'host' ? 'Host (Anda)' : 'Rekan Editor'})`}
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-extrabold text-white uppercase ring-2 ring-white dark:ring-zinc-900 shadow-xs cursor-default"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.name.substring(0, 2)}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => p2pSync.disconnect()}
            className="text-[11px] underline font-semibold hover:text-emerald-950 dark:hover:text-emerald-100"
          >
            Hentikan Berbagi
          </button>
        </div>
      )}

      {/* Main Workspace: Dual-View Switcher */}
      <main className="flex-1 relative overflow-hidden">
        {viewMode === 'canvas' ? (
          <CanvasView
            meetings={activeSpace.meetings}
            materials={activeSpace.materials}
            tasks={activeSpace.tasks}
            stickies={activeSpace.stickies}
            connections={activeSpace.connections}
            onUpdateMeeting={handleSaveMeeting}
            onUpdateMaterial={handleSaveMaterial}
            onUpdateTask={handleSaveTask}
            onUpdateSticky={handleSaveSticky}
            onEditMeeting={(m) => {
              setEditingMeeting(m)
              setIsMeetingOpen(true)
            }}
            onEditMaterial={(mat) => {
              setEditingMaterial(mat)
              setIsMaterialOpen(true)
            }}
            onEditTask={(t) => {
              setEditingTask(t)
              setIsTaskOpen(true)
            }}
            onEditSticky={(s) => {
              setEditingSticky(s)
              setIsStickyOpen(true)
            }}
            onPreviewPdf={(att) => setPreviewAttachment(att)}
            onAutoLayout={handleAutoLayout}
            onViewMeeting={(m) => setReadingMeeting(m)}
          />
        ) : (
          <KanbanView
            meetings={activeSpace.meetings}
            materials={activeSpace.materials}
            tasks={activeSpace.tasks}
            stickies={activeSpace.stickies}
            columnTitles={activeSpace.columnTitles || {}}
            customColumns={activeSpace.customColumns || []}
            customCards={activeSpace.customCards || []}
            onAddNew={handleAddNew}
            onViewMeeting={(m) => setReadingMeeting(m)}
            onEditMeeting={(m) => {
              setEditingMeeting(m)
              setIsMeetingOpen(true)
            }}
            onEditMaterial={(mat) => {
              setEditingMaterial(mat)
              setIsMaterialOpen(true)
            }}
            onEditTask={(t) => {
              setEditingTask(t)
              setIsTaskOpen(true)
            }}
            onEditSticky={(s) => {
              setEditingSticky(s)
              setIsStickyOpen(true)
            }}
            onDeleteSticky={handleDeleteSticky}
            onPreviewPdf={(att) => setPreviewAttachment(att)}
            onToggleTaskDone={handleToggleTaskDone}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onRenameColumn={handleRenameColumn}
            onResetColumnTitle={handleResetColumnTitle}
            onSaveCustomColumn={handleSaveCustomColumn}
            onDeleteCustomColumn={handleDeleteCustomColumn}
            onSaveCustomCard={handleSaveCustomCard}
            onDeleteCustomCard={handleDeleteCustomCard}
          />
        )}
      </main>

      {/* Modals & Dialogs */}
      <MeetingModal
        meeting={editingMeeting}
        isOpen={isMeetingOpen}
        onClose={() => setIsMeetingOpen(false)}
        onSave={handleSaveMeeting}
        onDelete={handleDeleteMeeting}
        onPreviewPdf={(att) => setPreviewAttachment(att)}
      />

      <MeetingReaderModal
        meeting={readingMeeting}
        isOpen={!!readingMeeting}
        onClose={() => setReadingMeeting(null)}
        onEditMeeting={(m) => {
          setReadingMeeting(null)
          setEditingMeeting(m)
          setIsMeetingOpen(true)
        }}
        onSaveMeeting={handleSaveMeeting}
        onPreviewPdf={(att) => setPreviewAttachment(att)}
      />

      <MaterialModal
        material={editingMaterial}
        isOpen={isMaterialOpen}
        onClose={() => setIsMaterialOpen(false)}
        onSave={handleSaveMaterial}
        onDelete={handleDeleteMaterial}
        onPreviewPdf={(att) => setPreviewAttachment(att)}
      />

      <TaskModal
        task={editingTask}
        isOpen={isTaskOpen}
        onClose={() => setIsTaskOpen(false)}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        onPreviewPdf={(att) => setPreviewAttachment(att)}
      />

      <StickyModal
        sticky={editingSticky}
        isOpen={isStickyOpen}
        onClose={() => setIsStickyOpen(false)}
        onSave={handleSaveSticky}
        onDelete={handleDeleteSticky}
      />

      <SpaceModal
        isOpen={isSpaceModalOpen}
        onClose={() => setIsSpaceModalOpen(false)}
        onSave={handleSaveSpace}
        editingSpace={spaceToEdit}
      />

      <ReportModal
        workspace={activeSpace}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />

      <ArtifactsVaultModal
        workspace={activeSpace}
        isOpen={isArtifactsVaultOpen}
        onClose={() => setIsArtifactsVaultOpen(false)}
        onPreviewPdf={(att) => setPreviewAttachment(att)}
      />

      <CloudSyncModal
        workspace={activeSpace}
        isOpen={isCloudSyncOpen}
        onClose={() => setIsCloudSyncOpen(false)}
        lastSavedTime={lastSavedTime}
      />

      <UpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        workspace={activeSpace}
        onExportHtmlReport={() => exportInteractiveHtmlReport(activeSpace)}
        onPeerLeave={handlePeerManualLeave}
      />

      <LeaveSpaceConfirmModal
        isOpen={isLeaveConfirmOpen}
        workspaceName={
          disconnectedWorkspaceSnapshot?.projectMeta?.name || activeSpace.projectMeta.name
        }
        offlineDraftCount={offlineDraftCount}
        onClose={() => setIsLeaveConfirmOpen(false)}
        onSaveAsLocalAndLeave={handleSaveRemoteAsLocal}
        onDiscardAndLeave={handleDiscardAndLeave}
      />

      <DisconnectPromptModal
        isOpen={isDisconnectPromptOpen}
        roomCode={collabState.lastRoomId || collabState.roomId || ''}
        workspaceName={
          disconnectedWorkspaceSnapshot?.projectMeta?.name || activeSpace.projectMeta.name
        }
        reason={collabState.disconnectReason}
        isReconnecting={isReconnecting}
        offlineDraftCount={offlineDraftCount}
        onContinueDraft={() => setIsDisconnectPromptOpen(false)}
        onSaveAsLocal={handleSaveRemoteAsLocal}
        onReconnect={handleReconnect}
        onDiscardAndLeave={handleDiscardAndLeave}
      />

      <ResetConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        currentSpaceName={activeSpace.projectMeta.name}
        onResetCurrentSpace={handleResetCurrentSpace}
        onFactoryResetAll={handleFactoryResetAll}
      />

      <PdfViewerModal
        attachment={previewAttachment}
        onClose={() => setPreviewAttachment(null)}
      />

      {/* Visual Overlay when dragging files over the workspace */}
      {isWindowDragOver && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-blue-600/20 dark:bg-blue-900/30 backdrop-blur-xs border-4 border-dashed border-blue-500 pointer-events-none transition animate-in fade-in">
          <div className="px-6 py-4 rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl border border-blue-300 dark:border-blue-700 flex items-center gap-3">
            <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-bounce" />
            <div>
              <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Lepaskan berkas untuk menambahkan ke Materi & Berkas Auditee
              </p>
              <p className="text-xs text-zinc-500">Mendukung PDF, Excel, Dokumen, dan Arsip Bukti Audit</p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xl border border-zinc-700 animate-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}
    </div>
  )
}

export default App
