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
import { Upload, CheckCircle2 } from 'lucide-react'
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
import { exportInteractiveHtmlReport } from './services/htmlReportExporter'
import { p2pSync, CollabState } from './services/p2pSync'

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
  const [collabState, setCollabState] = useState<CollabState>(p2pSync.getState())
  const [isWindowDragOver, setIsWindowDragOver] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // P2P Collaboration Sync Listener
  useEffect(() => {
    const unsubState = p2pSync.subscribeState(setCollabState)
    const unsubWs = p2pSync.subscribeWorkspace((syncedWs) => {
      setMultiStore((prev) => {
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

    return () => {
      unsubState()
      unsubWs()
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
          getCurrentWindow().setTitle('AuditSpace v1.0.10').catch(() => {})
        })
        .catch(() => {})
    }
    document.title = 'AuditSpace v1.0.10'
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
    document.title = `AuditSpace v1.0.6 - ${spaceName}`
  }, [activeSpace?.projectMeta?.name])

  // Helper to update active space
  const updateActiveSpace = (updater: (prev: AuditWorkspace) => AuditWorkspace) => {
    setMultiStore((prev) => {
      const updatedSpaces = prev.spaces.map((s) => {
        if (s.projectMeta.id === prev.activeSpaceId) {
          const updated = updater(s)
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
    updateActiveSpace((prev) => {
      const exists = prev.meetings.some((m) => m.id === meeting.id)
      let itemToSave = meeting
      if (!exists) {
        const nextPos = getNextMeetingPosition(prev.meetings)
        itemToSave = { ...meeting, x: nextPos.x, y: nextPos.y }
      }
      return {
        ...prev,
        meetings: exists
          ? prev.meetings.map((m) => (m.id === meeting.id ? meeting : m))
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
    updateActiveSpace((prev) => {
      const exists = prev.materials.some((m) => m.id === mat.id)
      let itemToSave = mat
      if (!exists) {
        const nextPos = getNextMaterialPosition(prev.materials)
        itemToSave = { ...mat, x: nextPos.x, y: nextPos.y }
      }
      return {
        ...prev,
        materials: exists
          ? prev.materials.map((m) => (m.id === mat.id ? mat : m))
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
    updateActiveSpace((prev) => {
      const existing = prev.tasks.find((t) => t.id === task.id)
      let itemToSave = task
      if (!existing) {
        const nextPos = getNextTaskPosition(prev.tasks, task.status)
        itemToSave = { ...task, x: nextPos.x, y: nextPos.y }
      } else if (existing.status !== task.status) {
        const nextPos = getNextTaskPosition(prev.tasks, task.status)
        itemToSave = { ...task, x: nextPos.x, y: nextPos.y }
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
    setEditingTask(task)
    setIsTaskOpen(true)
  }

  // STICKIES HANDLERS
  const handleSaveSticky = (sticky: StickyNote) => {
    updateActiveSpace((prev) => {
      const exists = prev.stickies.some((s) => s.id === sticky.id)
      let itemToSave = sticky
      if (!exists) {
        const nextPos = getNextStickyPosition(prev.stickies)
        itemToSave = { ...sticky, x: nextPos.x, y: nextPos.y }
      }
      return {
        ...prev,
        stickies: exists
          ? prev.stickies.map((s) => (s.id === sticky.id ? sticky : s))
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
    updateActiveSpace((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== taskId) return t
        return {
          ...t,
          status,
          completedAt: status === 'done' ? (t.completedAt || new Date().toISOString()) : undefined,
          completedBy: status === 'done' ? (t.completedBy || t.pic || 'Auditor') : undefined,
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
        alert(`Berhasil mengimpor space audit: "${imported.projectMeta.name}"!`)
      }
    } catch (err) {
      alert('Gagal mengimpor .auditpkg: ' + err)
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

      {/* Read-Only Collaboration Banner */}
      {collabState.isConnected && collabState.accessMode === 'read-only' && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-6 py-2 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2 font-medium">
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 font-bold text-[10px] uppercase tracking-wider">
              🔒 Mode Peninjau (Read-Only)
            </span>
            <span>
              Anda terhubung ke ruang kolaborasi <strong>{collabState.roomId}</strong>. Perubahan dinonaktifkan untuk peninjau.
            </span>
          </div>
          <button
            onClick={() => p2pSync.disconnect()}
            className="text-[11px] underline font-semibold hover:text-amber-950 dark:hover:text-amber-100"
          >
            Putuskan Sesi
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
