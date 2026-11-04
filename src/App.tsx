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
} from './types'
import {
  loadMultiSpaceStore,
  saveMultiSpaceStore,
  createNewSpace,
  exportAuditPackage,
  importAuditPackage,
  factoryResetStorage,
} from './services/storage'
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

export function App() {
  const [multiStore, setMultiStore] = useState<MultiSpaceStore>(() => loadMultiSpaceStore())
  const [viewMode, setViewMode] = useState<'canvas' | 'kanban'>('canvas')
  const [lastSavedTime, setLastSavedTime] = useState<string>('')
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches || false
  })

  // Modals
  const [editingMeeting, setEditingMeeting] = useState<MeetingCard | null>(null)
  const [isMeetingOpen, setIsMeetingOpen] = useState(false)

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

  // Helper to update active space
  const updateActiveSpace = (updater: (prev: AuditWorkspace) => AuditWorkspace) => {
    setMultiStore((prev) => ({
      ...prev,
      spaces: prev.spaces.map((s) =>
        s.projectMeta.id === prev.activeSpaceId ? updater(s) : s
      ),
    }))
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
      await exportAuditPackage(activeSpace)
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
        lastSavedTime={lastSavedTime}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />

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
          />
        ) : (
          <KanbanView
            meetings={activeSpace.meetings}
            materials={activeSpace.materials}
            tasks={activeSpace.tasks}
            stickies={activeSpace.stickies}
            onAddNew={handleAddNew}
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
    </div>
  )
}

export default App
