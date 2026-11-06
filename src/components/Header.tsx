import React, { useRef, useState } from 'react'
import { AuditWorkspace, ProjectMeta } from '../types'
import {
  Download,
  Upload,
  RotateCcw,
  Plus,
  LayoutGrid,
  Sparkles,
  Calendar,
  Moon,
  Sun,
  ShieldCheck,
  ChevronDown,
  Layers,
  FolderArchive,
  CheckSquare,
  StickyNote,
  FolderPlus,
  Trash2,
  Check,
  Building,
  Edit2,
  Printer,
  Cloud,
  Briefcase,
  Radio,
  FileCode,
  FileUp,
  FileDown,
} from 'lucide-react'

interface HeaderProps {
  spaces: AuditWorkspace[]
  activeSpace: AuditWorkspace
  onSwitchSpace: (spaceId: string) => void
  onOpenCreateSpace: () => void
  onOpenEditSpace: (meta: ProjectMeta) => void
  onDeleteSpace: (spaceId: string) => void
  viewMode: 'canvas' | 'kanban'
  onViewModeChange: (mode: 'canvas' | 'kanban') => void
  onExport: () => void
  onImport: (file: File) => void
  onAddNew: (type: 'meeting' | 'material' | 'task' | 'sticky') => void
  onOpenReport: () => void
  onOpenArtifactsVault: () => void
  onOpenCloudSync: () => void
  onOpenUpdateModal: () => void
  onOpenResetConfirm: () => void
  onOpenShareModal: () => void
  onExportHtmlReport: () => void
  isCollaborating?: boolean
  collabRoomId?: string | null
  lastSavedTime: string
  darkMode: boolean
  onToggleDarkMode: () => void
}

export const Header: React.FC<HeaderProps> = ({
  spaces,
  activeSpace,
  onSwitchSpace,
  onOpenCreateSpace,
  onOpenEditSpace,
  onDeleteSpace,
  viewMode,
  onViewModeChange,
  onExport,
  onImport,
  onAddNew,
  onOpenReport,
  onOpenArtifactsVault,
  onOpenCloudSync,
  onOpenUpdateModal,
  onOpenResetConfirm,
  onOpenShareModal,
  onExportHtmlReport,
  isCollaborating = false,
  collabRoomId = null,
  lastSavedTime,
  darkMode,
  onToggleDarkMode,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showSpaceMenu, setShowSpaceMenu] = useState(false)
  const [showToolsMenu, setShowToolsMenu] = useState(false)
  const [showAddMenu, setShowAddMenu] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onImport(file)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const projectMeta = activeSpace.projectMeta

  return (
    <header className="h-16 px-4 md:px-6 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md z-30 shrink-0 select-none">
      {/* Brand & Multi-Space Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center shrink-0 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
            <img src="/app-icon.png" alt="AuditSpace Logo" className="w-6 h-6 object-contain" />
          </div>
          <div className="hidden lg:flex items-center gap-1.5 pr-2 border-r border-zinc-200 dark:border-zinc-800">
            <span className="text-xs font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              AuditSpace
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
              v1.0.6
            </span>
          </div>
        </div>

        {/* Space Dropdown Button */}
        <div className="relative">
          <button
            onClick={() => {
              setShowSpaceMenu(!showSpaceMenu)
              setShowToolsMenu(false)
              setShowAddMenu(false)
            }}
            className="flex items-center gap-2 px-2.5 py-1 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-left group border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 transition truncate max-w-[120px] sm:max-w-[180px] xl:max-w-[260px]">
                  {projectMeta.name}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-semibold uppercase">
                  Space
                </span>
                <span
                  className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"
                  title={`Status: Tersimpan otomatis (${lastSavedTime || 'Baru saja'})`}
                />
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600 transition" />
              </div>

              {/* Subtitle: Timeline & Auditee (Hidden on compact screens) */}
              <div className="hidden xl:flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                <Calendar className="w-2.5 h-2.5 text-zinc-400 shrink-0" />
                <span className="truncate max-w-[130px]">{projectMeta.timeline}</span>
                <span>•</span>
                <span className="truncate max-w-[110px]">{projectMeta.auditeeName}</span>
              </div>

              {/* WAKTU SIMPAN TERAKHIR KECIL DI BAWAH JUDUL (Visible on 2xl) */}
              <div className="hidden 2xl:flex items-center gap-1 text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Tersimpan otomatis ({lastSavedTime || 'Baru saja'})</span>
              </div>
            </div>
          </button>

          {/* Space Selector Dropdown Menu */}
          {showSpaceMenu && (
            <div
              className="absolute left-0 mt-2 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in"
              onMouseLeave={() => setShowSpaceMenu(false)}
            >
              <div className="px-3.5 py-1.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Daftar Space Audit ({spaces.length})
                </span>
                <button
                  onClick={() => {
                    setShowSpaceMenu(false)
                    onOpenCreateSpace()
                  }}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Space Baru
                </button>
              </div>

              {/* Spaces List */}
              <div className="max-h-64 overflow-y-auto py-1">
                {spaces.map((sp) => {
                  const isActive = sp.projectMeta.id === activeSpace.projectMeta.id
                  return (
                    <div
                      key={sp.projectMeta.id}
                      onClick={() => {
                        onSwitchSpace(sp.projectMeta.id)
                        setShowSpaceMenu(false)
                      }}
                      className={`px-3 py-2 mx-1.5 rounded-xl cursor-pointer flex items-center justify-between group/item transition ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40'
                          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate mr-2">
                        {isActive ? (
                          <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center shrink-0 text-zinc-500">
                            <ShieldCheck className="w-3 h-3" />
                          </div>
                        )}
                        <div className="truncate">
                          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {sp.projectMeta.name}
                          </p>
                          <p className="text-[10px] text-zinc-500 truncate flex items-center gap-1">
                            <Building className="w-2.5 h-2.5" />
                            {sp.projectMeta.auditeeName} • {sp.tasks.length} Tugas
                          </p>
                        </div>
                      </div>

                      {/* Space Actions (Edit / Delete) */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowSpaceMenu(false)
                            onOpenEditSpace(sp.projectMeta)
                          }}
                          className="p-1 text-zinc-400 hover:text-blue-600 rounded-md hover:bg-white dark:hover:bg-zinc-700"
                          title="Edit Rincian Space"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        {spaces.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm(`Hapus space "${sp.projectMeta.name}" beserta seluruh isinya?`)) {
                                onDeleteSpace(sp.projectMeta.id)
                              }
                            }}
                            className="p-1 text-zinc-400 hover:text-red-600 rounded-md hover:bg-white dark:hover:bg-zinc-700"
                            title="Hapus Space"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Bottom Quick Action */}
              <div className="p-2 border-t border-zinc-100 dark:border-zinc-800 mt-1">
                <button
                  onClick={() => {
                    setShowSpaceMenu(false)
                    onOpenCreateSpace()
                  }}
                  className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition flex items-center justify-center gap-1.5"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>+ Tambah Space Audit Lainnya</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center: View Switcher (High-Contrast Segmented Control with Divider) */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="flex items-center p-0.5 sm:p-1 rounded-xl bg-zinc-200/80 dark:bg-zinc-800/90 border border-zinc-300/80 dark:border-zinc-700 shadow-inner">
          <button
            onClick={() => onViewModeChange('canvas')}
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs rounded-lg transition ${
              viewMode === 'canvas'
                ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 font-bold shadow-sm border border-zinc-200/60 dark:border-zinc-700/60'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium'
            }`}
            title="Beralih ke Tampilan Infinite Canvas"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="hidden xl:inline">Infinite Canvas</span>
            <span className="hidden md:inline xl:hidden">Canvas</span>
          </button>
          <button
            onClick={() => onViewModeChange('kanban')}
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs rounded-lg transition ${
              viewMode === 'kanban'
                ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 font-bold shadow-sm border border-zinc-200/60 dark:border-zinc-700/60'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium'
            }`}
            title="Beralih ke Tampilan Modular Kanban"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="hidden xl:inline">Modular Kanban</span>
            <span className="hidden md:inline xl:hidden">Kanban</span>
          </button>
        </div>

        {/* Visual Divider Separator before Right Actions */}
        <div className="h-6 w-px bg-zinc-300 dark:bg-zinc-700 hidden lg:block shrink-0" />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* P2P LIVE COLLABORATION BUTTON */}
        <button
          onClick={onOpenShareModal}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl transition border ${
            isCollaborating
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 shadow-sm'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 border-zinc-200/80 dark:border-zinc-700'
          }`}
          title="Kolaborasi Langsung P2P (Bagi Ruang atau Gabung Ruang Rekan)"
        >
          <Radio className={`w-3.5 h-3.5 ${isCollaborating ? 'text-emerald-500 animate-pulse' : 'text-blue-500'}`} />
          <span className="hidden xl:inline">{isCollaborating ? `Live (${collabRoomId})` : 'Kolaborasi P2P'}</span>
          <span className="hidden lg:inline xl:hidden">{isCollaborating ? 'Live' : 'P2P'}</span>
        </button>

        {/* DROPDOWN MENU ALAT & LAPORAN AUDIT (Menggabungkan Laporan PDF, Vault Berkas, dan Cloud Sync) */}
        <div className="relative">
          <button
            onClick={() => {
              setShowToolsMenu(!showToolsMenu)
              setShowAddMenu(false)
              setShowSpaceMenu(false)
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition border border-zinc-200/80 dark:border-zinc-700"
            title="Menu Alat & Laporan Audit"
          >
            <Briefcase className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden xl:inline">Alat & Laporan</span>
            <span className="hidden md:inline xl:hidden">Laporan</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {showToolsMenu && (
            <div
              className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in"
              onMouseLeave={() => setShowToolsMenu(false)}
            >
              <button
                onClick={() => {
                  setShowToolsMenu(false)
                  onOpenReport()
                }}
                className="w-full px-3.5 py-2.5 text-left text-xs text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-3 transition"
              >
                <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 shrink-0">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">Laporan Progres (PDF)</p>
                  <p className="text-[10px] text-zinc-500">Cetak potret status & progress report</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowToolsMenu(false)
                  onOpenArtifactsVault()
                }}
                className="w-full px-3.5 py-2.5 text-left text-xs text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-3 transition"
              >
                <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 shrink-0">
                  <FolderArchive className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">Vault Seluruh Berkas</p>
                  <p className="text-[10px] text-zinc-500">Lihat semua lampiran & unduh .ZIP</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowToolsMenu(false)
                  onOpenCloudSync()
                }}
                className="w-full px-3.5 py-2.5 text-left text-xs text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-3 transition"
              >
                <div className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-600 shrink-0">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">Pencadangan Cloud Sync</p>
                  <p className="text-[10px] text-zinc-500">Backup Google Drive & OneDrive</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowToolsMenu(false)
                  onExportHtmlReport()
                }}
                className="w-full px-3.5 py-2.5 text-left text-xs text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-3 transition"
              >
                <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 shrink-0">
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">Ekspor Dasbor Interaktif (.html)</p>
                  <p className="text-[10px] text-zinc-500">1 file HTML eksekutif mandiri (Read-Only)</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowToolsMenu(false)
                  onOpenResetConfirm()
                }}
                className="w-full px-3.5 py-2.5 text-left text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-3 transition border-t border-zinc-100 dark:border-zinc-800 mt-1"
              >
                <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 shrink-0">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-red-600 dark:text-red-400">Reset & Pembersihan Data...</p>
                  <p className="text-[10px] text-zinc-500">Kosongkan space atau reset total</p>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Add New Item Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowAddMenu(!showAddMenu)
              setShowToolsMenu(false)
              setShowSpaceMenu(false)
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah</span>
            <ChevronDown className="w-3 h-3 opacity-80" />
          </button>

          {showAddMenu && (
            <div
              className="absolute right-0 mt-2 w-52 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in"
              onMouseLeave={() => setShowAddMenu(false)}
            >
              <button
                onClick={() => {
                  onAddNew('meeting')
                  setShowAddMenu(false)
                }}
                className="w-full px-3 py-2 text-left text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2.5"
              >
                <Layers className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="font-medium">Agenda & Diskusi</p>
                  <p className="text-[10px] text-zinc-400">Undangan PDF & Transkrip</p>
                </div>
              </button>
              <button
                onClick={() => {
                  onAddNew('material')
                  setShowAddMenu(false)
                }}
                className="w-full px-3 py-2 text-left text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2.5"
              >
                <FolderArchive className="w-4 h-4 text-purple-500" />
                <div>
                  <p className="font-medium">Materi & Berkas Auditee</p>
                  <p className="text-[10px] text-zinc-400">PDF, Dokumen & Link URL</p>
                </div>
              </button>
              <button
                onClick={() => {
                  onAddNew('task')
                  setShowAddMenu(false)
                }}
                className="w-full px-3 py-2 text-left text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2.5"
              >
                <CheckSquare className="w-4 h-4 text-emerald-500" />
                <div>
                  <p className="font-medium">Tugas / Working Paper</p>
                  <p className="text-[10px] text-zinc-400">To-Do, PIC & Bukti Audit</p>
                </div>
              </button>
              <button
                onClick={() => {
                  onAddNew('sticky')
                  setShowAddMenu(false)
                }}
                className="w-full px-3 py-2 text-left text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2.5 border-t border-zinc-100 dark:border-zinc-800 mt-1 pt-1"
              >
                <StickyNote className="w-4 h-4 text-amber-500" />
                <div>
                  <p className="font-medium">Catatan Tempel (Sticky)</p>
                  <p className="text-[10px] text-zinc-400">Catatan & Temuan Cepat</p>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Export .auditpkg */}
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 text-xs font-medium rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
          title="Export Space ini + Berkas PDF ke Bundle .auditpkg"
        >
          <FileUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span className="hidden 2xl:inline">Export</span>
        </button>

        {/* Import .auditpkg */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".auditpkg,.zip"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 text-xs font-medium rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
          title="Buka / Import file .auditpkg yang tersimpan di disk atau cloud drive"
        >
          <FileDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden 2xl:inline">Import</span>
        </button>

        {/* Cek Update */}
        <button
          onClick={onOpenUpdateModal}
          className="p-1.5 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
          title="Cek Pembaruan Versi (Auto-Update)"
        >
          <Sparkles className="w-4 h-4 text-blue-500" />
        </button>

        {/* Dark Mode */}
        <button
          onClick={onToggleDarkMode}
          className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
          title={darkMode ? 'Beralih ke Terang' : 'Beralih ke Gelap'}
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
        </button>
      </div>
    </header>
  )
}
