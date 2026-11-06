import React, { useState, useRef } from 'react'
import {
  MeetingCard,
  MaterialVaultCard,
  TaskCard,
  StickyNote,
  Attachment,
  CustomColumn,
  CustomCard,
  TaskStatus,
} from '../types'
import {
  FileText,
  FileSpreadsheet,
  Calendar,
  Clock,
  Globe,
  CheckCircle2,
  Plus,
  ExternalLink,
  Search,
  Filter,
  Layers,
  FolderArchive,
  CheckSquare,
  Award,
  StickyNote as NoteIcon,
  Edit3,
  Trash2,
  Play,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ListTodo,
  Timer,
  Columns,
  Sparkles,
} from 'lucide-react'
import { formatBytes, formatDateString } from '../services/storage'
import { openExternalUrl } from '../services/nativeSave'
import { CustomColumnModal } from './CustomColumnModal'
import { CustomCardModal } from './CustomCardModal'
import { StickyContentRenderer } from './StickyContentRenderer'

interface KanbanViewProps {
  meetings: MeetingCard[]
  materials: MaterialVaultCard[]
  tasks: TaskCard[]
  stickies: StickyNote[]
  columnTitles?: Record<string, string>
  customColumns?: CustomColumn[]
  customCards?: CustomCard[]
  onAddNew: (type: 'meeting' | 'material' | 'task' | 'sticky') => void
  onEditMeeting: (meeting: MeetingCard) => void
  onEditMaterial: (mat: MaterialVaultCard) => void
  onEditTask: (task: TaskCard) => void
  onEditSticky: (sticky: StickyNote) => void
  onDeleteSticky?: (id: string) => void
  onPreviewPdf: (att: Attachment) => void
  onToggleTaskDone: (task: TaskCard) => void
  onUpdateTaskStatus?: (taskId: string, status: TaskStatus) => void
  onRenameColumn?: (columnKey: string, newTitle: string) => void
  onResetColumnTitle?: (columnKey: string) => void
  onSaveCustomColumn?: (col: CustomColumn) => void
  onDeleteCustomColumn?: (columnId: string) => void
  onSaveCustomCard?: (card: CustomCard) => void
  onDeleteCustomCard?: (cardId: string) => void
}

const DEFAULT_TITLES: Record<string, string> = {
  stickies: 'Catatan Tempel',
  meetings: 'Agenda & Diskusi',
  materials: 'Materi Auditee & Links',
  todo: 'To-Do Audit',
  in_progress: 'Sedang Dikerjakan',
  done: 'Selesai & Bukti Audit',
}

export const KanbanView: React.FC<KanbanViewProps> = ({
  meetings,
  materials,
  tasks,
  stickies,
  columnTitles = {},
  customColumns = [],
  customCards = [],
  onAddNew,
  onEditMeeting,
  onEditMaterial,
  onEditTask,
  onEditSticky,
  onDeleteSticky,
  onPreviewPdf,
  onToggleTaskDone,
  onUpdateTaskStatus,
  onRenameColumn,
  onResetColumnTitle,
  onSaveCustomColumn,
  onDeleteCustomColumn,
  onSaveCustomCard,
  onDeleteCustomCard,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPic, setSelectedPic] = useState('all')
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Modals for Column Customization
  const [columnModalState, setColumnModalState] = useState<{
    isOpen: boolean
    isRenameBuiltin: boolean
    columnKey: string
    initialTitle: string
    initialDescription?: string
    initialColor?: string
    customColId?: string
  }>({
    isOpen: false,
    isRenameBuiltin: false,
    columnKey: '',
    initialTitle: '',
  })

  // Modals for Custom Cards
  const [cardModalState, setCardModalState] = useState<{
    isOpen: boolean
    columnId: string
    columnTitle: string
    card: CustomCard | null
  }>({
    isOpen: false,
    columnId: '',
    columnTitle: '',
    card: null,
  })

  // Helper for column title resolution
  const getColTitle = (key: string): string => {
    return columnTitles[key] || DEFAULT_TITLES[key] || key
  }

  // Extract all unique PICs for filter
  const allPics = Array.from(
    new Set([
      ...tasks.map((t) => t.pic).filter(Boolean),
      ...customCards.map((c) => c.pic).filter(Boolean),
    ])
  )

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.pic.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPic = selectedPic === 'all' || t.pic === selectedPic
    return matchesSearch && matchesPic
  })

  // Split tasks into To-Do, In-Progress, and Done
  const todoTasks = filteredTasks.filter((t) => t.status === 'todo')
  const inProgressTasks = filteredTasks.filter((t) => t.status === 'in_progress')
  const completedTasks = filteredTasks.filter((t) => t.status === 'done')

  // Filter stickies
  const filteredStickies = stickies.filter((s) =>
    s.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Horizontal scroll helpers
  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -360, behavior: 'smooth' })
    }
  }

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 360, behavior: 'smooth' })
    }
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      {/* Subheader Filters & Navigation */}
      <div className="h-12 px-6 border-b border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 flex items-center justify-between gap-4 shrink-0 backdrop-blur-sm">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari catatan, agenda, materi, atau tugas..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Scroll navigation action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleScrollLeft}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 border border-zinc-300 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-500 shadow-xs hover:shadow transition active:scale-95"
              title="Geser Kolom Papan ke Kiri"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Geser Kiri</span>
            </button>
            <button
              onClick={handleScrollRight}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 border border-zinc-300 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-500 shadow-xs hover:shadow transition active:scale-95"
              title="Geser Kolom Papan ke Kanan"
            >
              <span>Geser Kanan</span>
              <ChevronRight className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filter PIC:</span>
            <select
              value={selectedPic}
              onChange={(e) => setSelectedPic(e.target.value)}
              className="px-2 py-1 text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-800 dark:text-zinc-200 focus:outline-none"
            >
              <option value="all">Semua Auditor</option>
              {allPics.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs font-medium text-zinc-500">
            Progress Audit:{' '}
            <strong className="text-emerald-600 dark:text-emerald-400">
              {completedTasks.length} / {tasks.length} Selesai
            </strong>
          </div>
        </div>
      </div>

      {/* HORIZONTAL SCROLLABLE KANBAN BOARD */}
      <div
        ref={scrollContainerRef}
        className="eyecatching-scrollbar flex-1 p-6 overflow-x-auto overflow-y-hidden"
      >
        <div className="flex gap-5 h-full min-w-max pb-2">
          {/* COLUMN 1: CATATAN TEMPEL (STICKY NOTES) */}
          <div className="w-[300px] flex flex-col bg-zinc-100/70 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden shrink-0">
            <div className="p-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900">
              <div className="flex items-center gap-2 truncate">
                <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 shrink-0">
                  <NoteIcon className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 truncate">
                      {getColTitle('stickies')}
                    </h3>
                    <button
                      onClick={() =>
                        setColumnModalState({
                          isOpen: true,
                          isRenameBuiltin: true,
                          columnKey: 'stickies',
                          initialTitle: getColTitle('stickies'),
                        })
                      }
                      className="p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded"
                      title="Ubah Nama Kolom"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-500">{stickies.length} Catatan Cepat</p>
                </div>
              </div>
              <button
                onClick={() => onAddNew('sticky')}
                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 shrink-0 ml-1"
                title="Tambah Catatan Tempel"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
              {filteredStickies.map((s) => {
                const colorMap = {
                  amber: 'bg-amber-100 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200',
                  blue: 'bg-blue-100 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-950 dark:text-blue-200',
                  emerald: 'bg-emerald-100 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200',
                  purple: 'bg-purple-100 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 text-purple-950 dark:text-purple-200',
                  rose: 'bg-rose-100 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200',
                }[s.color]

                return (
                  <div
                    key={s.id}
                    onClick={() => onEditSticky(s)}
                    className={`p-3.5 rounded-xl border shadow-sm cursor-pointer hover:shadow-md transition relative group ${colorMap}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                        Reminder / Inquiry
                      </span>
                      <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onEditSticky(s)
                          }}
                          className="p-0.5 hover:text-black"
                          title="Edit Catatan"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {onDeleteSticky && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm('Hapus catatan tempel ini?')) onDeleteSticky(s.id)
                            }}
                            className="p-0.5 hover:text-red-600"
                            title="Hapus Catatan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <StickyContentRenderer content={s.content} />
                  </div>
                )
              })}
              {filteredStickies.length === 0 && (
                <div className="p-4 text-center border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-400">
                  Belum ada catatan tempel. Klik (+) di atas.
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 2: AGENDA & DISKUSI */}
          <div className="w-[310px] flex flex-col bg-zinc-100/70 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden shrink-0">
            <div className="p-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900">
              <div className="flex items-center gap-2 truncate">
                <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 truncate">
                      {getColTitle('meetings')}
                    </h3>
                    <button
                      onClick={() =>
                        setColumnModalState({
                          isOpen: true,
                          isRenameBuiltin: true,
                          columnKey: 'meetings',
                          initialTitle: getColTitle('meetings'),
                        })
                      }
                      className="p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded"
                      title="Ubah Nama Kolom"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-500">{meetings.length} Sesi Terjadwal</p>
                </div>
              </div>
              <button
                onClick={() => onAddNew('meeting')}
                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 shrink-0 ml-1"
                title="Tambah Sesi Diskusi"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
              {meetings.map((m) => (
                <div
                  key={m.id}
                  onClick={() => onEditMeeting(m)}
                  className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm hover:border-blue-400 dark:hover:border-blue-500 transition cursor-pointer space-y-2.5 group"
                >
                  <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 transition leading-snug">
                    {m.title}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                    <Calendar className="w-3 h-3 text-zinc-400" />
                    <span>{formatDateString(m.date)}</span>
                    <span>•</span>
                    <Clock className="w-3 h-3 text-zinc-400" />
                    <span>{m.time}</span>
                  </div>

                  {/* Meeting attachments: PDF Undangan, Daftar Hadir Excel, Transkrip, dll. */}
                  {(() => {
                    const atts =
                      m.attachments && m.attachments.length > 0
                        ? m.attachments
                        : m.pdfInvite
                        ? [m.pdfInvite]
                        : []
                    if (atts.length === 0) return null
                    return (
                      <div className="space-y-1">
                        {atts.map((a) => {
                          const name = a.name.toLowerCase()
                          const isXls =
                            name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')
                          const isTxt = name.endsWith('.txt') || name.endsWith('.log')
                          return (
                            <div
                              key={a.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                onPreviewPdf(a)
                              }}
                              className={`flex items-center justify-between p-1.5 rounded-lg border text-[11px] cursor-pointer transition ${
                                isXls
                                  ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/50'
                                  : isTxt
                                  ? 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-200/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100/50'
                                  : 'bg-red-50/60 dark:bg-red-950/20 border-red-200/60 text-red-700 dark:text-red-300 hover:bg-red-100/50'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                {isXls ? (
                                  <FileSpreadsheet className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                  <FileText
                                    className={`w-3.5 h-3.5 shrink-0 ${
                                      isTxt
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : 'text-red-600 dark:text-red-400'
                                    }`}
                                  />
                                )}
                                <span className="truncate">{a.name}</span>
                              </div>
                              <span className="text-[10px] underline font-medium shrink-0 ml-1">
                                {isXls ? 'Excel' : isTxt ? 'Teks' : 'PDF'}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}

                  {m.transcript && (
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed bg-zinc-50 dark:bg-zinc-800/40 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800">
                      {m.transcript}
                    </p>
                  )}
                </div>
              ))}
              {meetings.length === 0 && (
                <div className="p-4 text-center border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-400">
                  Belum ada agenda rapat. Klik (+) di atas.
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 3: MATERI AUDITEE & LINKS */}
          <div className="w-[310px] flex flex-col bg-zinc-100/70 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden shrink-0">
            <div className="p-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900">
              <div className="flex items-center gap-2 truncate">
                <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 shrink-0">
                  <FolderArchive className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 truncate">
                      {getColTitle('materials')}
                    </h3>
                    <button
                      onClick={() =>
                        setColumnModalState({
                          isOpen: true,
                          isRenameBuiltin: true,
                          columnKey: 'materials',
                          initialTitle: getColTitle('materials'),
                        })
                      }
                      className="p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded"
                      title="Ubah Nama Kolom"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-500">{materials.length} Repositori Berkas</p>
                </div>
              </div>
              <button
                onClick={() => onAddNew('material')}
                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 shrink-0 ml-1"
                title="Tambah Kategori Materi"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
              {materials.map((mat) => (
                <div
                  key={mat.id}
                  onClick={() => onEditMaterial(mat)}
                  className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm hover:border-purple-400 dark:hover:border-purple-500 transition cursor-pointer space-y-2.5 group"
                >
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-purple-600 transition">
                      {mat.title}
                    </h4>
                    {mat.description && (
                      <p className="text-[11px] text-zinc-500 line-clamp-2 mt-0.5">
                        {mat.description}
                      </p>
                    )}
                  </div>

                  {mat.attachments.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        Berkas ({mat.attachments.length})
                      </p>
                      {mat.attachments.map((a) => (
                        <div
                          key={a.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            onPreviewPdf(a)
                          }}
                          className="flex items-center justify-between p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 text-[11px] text-zinc-800 dark:text-zinc-200 hover:text-purple-600"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <FileText className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                            <span className="truncate">{a.name}</span>
                          </div>
                          <span className="text-[10px] text-zinc-400 shrink-0 ml-1">
                            {formatBytes(a.size)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {mat.links.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        Tautan URL ({mat.links.length})
                      </p>
                      {mat.links.map((link) => (
                        <button
                          key={link.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            openExternalUrl(link.url)
                          }}
                          className="w-full flex items-center justify-between p-1.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 text-[11px] text-blue-700 dark:text-blue-300 hover:underline text-left cursor-pointer"
                          title={`Buka ${link.url} di browser`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <Globe className="w-3 h-3 text-blue-500 shrink-0" />
                            <span className="truncate">{link.title}</span>
                          </div>
                          <ExternalLink className="w-3 h-3 shrink-0 ml-1" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {materials.length === 0 && (
                <div className="p-4 text-center border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-400">
                  Belum ada berkas auditee. Klik (+) di atas.
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 4: TO-DO AUDIT (BELUM DIMULAI) */}
          <div className="w-[320px] flex flex-col bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden shrink-0">
            <div className="p-3.5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900">
              <div className="flex items-center gap-2 truncate">
                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                  <ListTodo className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 truncate">
                      {getColTitle('todo')}
                    </h3>
                    <button
                      onClick={() =>
                        setColumnModalState({
                          isOpen: true,
                          isRenameBuiltin: true,
                          columnKey: 'todo',
                          initialTitle: getColTitle('todo'),
                        })
                      }
                      className="p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded"
                      title="Ubah Nama Kolom"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-500">{todoTasks.length} Antrian Tugas</p>
                </div>
              </div>
              <button
                onClick={() => onAddNew('task')}
                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 shrink-0 ml-1"
                title="Tambah Tugas Baru"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
              {todoTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => onEditTask(t)}
                  className="p-3.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm hover:border-slate-400 dark:hover:border-slate-600 transition cursor-pointer space-y-2.5 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span>Belum Dimulai</span>
                      </span>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          t.priority === 'critical'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                            : t.priority === 'high'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                            : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </div>
                  </div>

                  <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 transition leading-snug">
                    {t.title}
                  </h4>

                  {t.description && (
                    <p className="text-[11px] text-zinc-500 line-clamp-2">{t.description}</p>
                  )}

                  <div className="pt-1 flex flex-col gap-1 text-[11px] text-zinc-500 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                      <span>Timeline:</span>
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        {formatDateString(t.startDate)} - {formatDateString(t.dueDate)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>PIC:</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{t.pic}</span>
                    </div>
                  </div>

                  {/* Actions: Start Working or Mark Done */}
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (onUpdateTaskStatus) {
                          onUpdateTaskStatus(t.id, 'in_progress')
                        } else {
                          onEditTask(t)
                        }
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition flex items-center gap-1 border border-blue-200 dark:border-blue-900/50"
                      title="Mulai Kerjakan Tugas Ini"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Mulai Kerjakan</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleTaskDone(t)
                      }}
                      className="px-2 py-1 text-[10px] text-zinc-400 hover:text-emerald-600 transition"
                      title="Langsung Selesai"
                    >
                      <span>Selesai</span>
                    </button>
                  </div>
                </div>
              ))}
              {todoTasks.length === 0 && (
                <div className="p-4 text-center border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-400">
                  Tidak ada tugas antrian to-do.
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 5: SEDANG DIKERJAKAN (IN PROGRESS) */}
          <div className="w-[330px] flex flex-col bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/60 rounded-2xl overflow-hidden shrink-0">
            <div className="p-3.5 border-b border-blue-200 dark:border-blue-900/60 flex items-center justify-between bg-white dark:bg-zinc-900">
              <div className="flex items-center gap-2 truncate">
                <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 shrink-0">
                  <Timer className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 truncate">
                      {getColTitle('in_progress')}
                    </h3>
                    <button
                      onClick={() =>
                        setColumnModalState({
                          isOpen: true,
                          isRenameBuiltin: true,
                          columnKey: 'in_progress',
                          initialTitle: getColTitle('in_progress'),
                        })
                      }
                      className="p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded"
                      title="Ubah Nama Kolom"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-500">{inProgressTasks.length} Sedang Berjalan</p>
                </div>
              </div>
              <button
                onClick={() => onAddNew('task')}
                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 shrink-0 ml-1"
                title="Tambah Tugas Audit"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
              {inProgressTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => onEditTask(t)}
                  className="p-3.5 bg-white dark:bg-zinc-900 border-2 border-blue-400/80 dark:border-blue-600/70 rounded-xl shadow-md shadow-blue-500/5 hover:border-blue-500 transition cursor-pointer space-y-2.5 group relative"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800 flex items-center">
                        <span className="relative flex h-2 w-2 mr-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                        </span>
                        Sedang Berjalan
                      </span>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          t.priority === 'critical'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                            : t.priority === 'high'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                            : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </div>
                  </div>

                  <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 transition leading-snug">
                    {t.title}
                  </h4>

                  {t.description && (
                    <p className="text-[11px] text-zinc-500 line-clamp-2">{t.description}</p>
                  )}

                  <div className="p-2 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 text-[11px] flex flex-col gap-1 border border-blue-100 dark:border-blue-900/40">
                    <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                      <span>Timeline:</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {formatDateString(t.startDate)} - {formatDateString(t.dueDate)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">PIC Pelaksana:</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{t.pic}</span>
                    </div>
                  </div>

                  {/* Actions: Finish with Evidence or Rollback */}
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (onUpdateTaskStatus) {
                          onUpdateTaskStatus(t.id, 'todo')
                        }
                      }}
                      className="px-2 py-1 text-[10px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition flex items-center gap-1"
                      title="Kembalikan ke antrian To-Do"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>Kembalikan</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleTaskDone(t)
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition flex items-center gap-1.5 shadow-sm"
                      title="Selesaikan & Lampirkan Bukti"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Selesaikan & Bukti</span>
                    </button>
                  </div>
                </div>
              ))}
              {inProgressTasks.length === 0 && (
                <div className="p-4 text-center border border-dashed border-blue-200 dark:border-blue-900/40 rounded-xl text-xs text-blue-400">
                  Belum ada tugas yang sedang aktif dikerjakan. Klik tombol <strong>"Mulai Kerjakan"</strong> pada kolom To-Do.
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 6: COMPLETED & EVIDENCE (SELESAI DENGAN BUKTI DOKUMEN) */}
          <div className="w-[330px] flex flex-col bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/60 rounded-2xl overflow-hidden shrink-0">
            <div className="p-3.5 border-b border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between bg-white dark:bg-zinc-900">
              <div className="flex items-center gap-2 truncate">
                <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 truncate">
                      {getColTitle('done')}
                    </h3>
                    <button
                      onClick={() =>
                        setColumnModalState({
                          isOpen: true,
                          isRenameBuiltin: true,
                          columnKey: 'done',
                          initialTitle: getColTitle('done'),
                        })
                      }
                      className="p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded"
                      title="Ubah Nama Kolom"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-500">{completedTasks.length} Tugas Terverifikasi</p>
                </div>
              </div>
            </div>

            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
              {completedTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => onEditTask(t)}
                  className="p-3.5 bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-900/60 rounded-xl shadow-sm hover:border-emerald-400 transition cursor-pointer space-y-2 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-snug flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{t.title}</span>
                    </h4>
                  </div>

                  <div className="p-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 text-[11px] text-emerald-900 dark:text-emerald-300">
                    <p>
                      Diselesaikan oleh: <strong>{t.completedBy || t.pic}</strong>
                    </p>
                    {t.completedAt && (
                      <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
                        Waktu: {new Date(t.completedAt).toLocaleString('id-ID')}
                      </p>
                    )}
                  </div>

                  {t.evidenceAttachment ? (
                    <div
                      onClick={(e) => {
                        e.stopPropagation()
                        onPreviewPdf(t.evidenceAttachment!)
                      }}
                      className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-zinc-800 border border-emerald-300 dark:border-emerald-800 text-[11px] hover:bg-emerald-50 transition"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate font-medium text-zinc-800 dark:text-zinc-200">
                          {t.evidenceAttachment.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-blue-600 font-semibold underline shrink-0 ml-1">
                        Buka Bukti
                      </span>
                    </div>
                  ) : (
                    <div className="text-[10px] text-zinc-400 italic">
                      Belum melampirkan berkas bukti uji.
                    </div>
                  )}
                </div>
              ))}
              {completedTasks.length === 0 && (
                <div className="p-4 text-center border border-dashed border-emerald-200 dark:border-emerald-900/40 rounded-xl text-xs text-emerald-600">
                  Belum ada tugas selesai.
                </div>
              )}
            </div>
          </div>

          {/* USER CUSTOM COLUMNS (KOTAK TAMBAHAN) */}
          {customColumns.map((col) => {
            const cardsInCol = customCards.filter((c) => c.columnId === col.id)
            return (
              <div
                key={col.id}
                className="w-[310px] flex flex-col bg-zinc-100/70 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden shrink-0"
              >
                <div className="p-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900">
                  <div className="flex items-center gap-2 truncate">
                    <div className="p-1.5 rounded-lg bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 shrink-0">
                      <Columns className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 truncate">
                          {col.title}
                        </h3>
                        <button
                          onClick={() =>
                            setColumnModalState({
                              isOpen: true,
                              isRenameBuiltin: false,
                              columnKey: col.id,
                              customColId: col.id,
                              initialTitle: col.title,
                              initialDescription: col.description,
                              initialColor: col.color,
                            })
                          }
                          className="p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded"
                          title="Edit Kolom"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-[10px] text-zinc-500">
                        {col.description || `${cardsInCol.length} Item`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setCardModalState({
                        isOpen: true,
                        columnId: col.id,
                        columnTitle: col.title,
                        card: null,
                      })
                    }
                    className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 shrink-0 ml-1"
                    title="Tambah Item ke Kotak Ini"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                  {cardsInCol.map((c) => (
                    <div
                      key={c.id}
                      onClick={() =>
                        setCardModalState({
                          isOpen: true,
                          columnId: col.id,
                          columnTitle: col.title,
                          card: c,
                        })
                      }
                      className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm hover:border-cyan-400 dark:hover:border-cyan-500 transition cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-cyan-600 transition leading-snug">
                          {c.title}
                        </h4>
                        {c.priority && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                            {c.priority}
                          </span>
                        )}
                      </div>

                      {c.description && (
                        <p className="text-[11px] text-zinc-500 line-clamp-3 leading-relaxed">
                          {c.description}
                        </p>
                      )}

                      {(c.pic || c.date) && (
                        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[10px] text-zinc-400">
                          {c.pic && <span>PIC: {c.pic}</span>}
                          {c.date && <span>{formatDateString(c.date)}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                  {cardsInCol.length === 0 && (
                    <div className="p-4 text-center border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-400">
                      Kotak ini masih kosong. Klik (+) di atas untuk menambahkan item.
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* ADD NEW CUSTOM COLUMN / BOX BUTTON */}
          <div className="w-[280px] shrink-0 flex flex-col justify-start">
            <button
              onClick={() =>
                setColumnModalState({
                  isOpen: true,
                  isRenameBuiltin: false,
                  columnKey: '',
                  initialTitle: '',
                  initialDescription: '',
                  initialColor: 'blue',
                })
              }
              className="h-28 w-full border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl flex flex-col items-center justify-center gap-2 text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/20 dark:hover:bg-blue-950/10 transition group"
            >
              <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-950/60 transition">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider">
                + Tambah Kotak / Kolom Baru
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Rename / Create Column */}
      <CustomColumnModal
        isOpen={columnModalState.isOpen}
        initialTitle={columnModalState.initialTitle}
        initialDescription={columnModalState.initialDescription}
        initialColor={columnModalState.initialColor}
        isRenameBuiltin={columnModalState.isRenameBuiltin}
        columnKey={columnModalState.columnKey}
        onSave={(newTitle, desc, color) => {
          if (columnModalState.isRenameBuiltin && onRenameColumn) {
            onRenameColumn(columnModalState.columnKey, newTitle)
          } else if (onSaveCustomColumn) {
            onSaveCustomColumn({
              id: columnModalState.customColId || 'col-' + Math.random().toString(36).substring(2, 9),
              title: newTitle,
              description: desc,
              color: color as any,
            })
          }
        }}
        onResetDefault={() => {
          if (columnModalState.isRenameBuiltin && onResetColumnTitle) {
            onResetColumnTitle(columnModalState.columnKey)
          }
        }}
        onDelete={() => {
          if (columnModalState.customColId && onDeleteCustomColumn) {
            onDeleteCustomColumn(columnModalState.customColId)
          }
        }}
        onClose={() =>
          setColumnModalState((prev) => ({
            ...prev,
            isOpen: false,
          }))
        }
      />

      {/* Modal Add / Edit Custom Card */}
      <CustomCardModal
        isOpen={cardModalState.isOpen}
        columnId={cardModalState.columnId}
        columnTitle={cardModalState.columnTitle}
        card={cardModalState.card}
        onSave={(c) => {
          if (onSaveCustomCard) onSaveCustomCard(c)
        }}
        onDelete={(id) => {
          if (onDeleteCustomCard) onDeleteCustomCard(id)
        }}
        onClose={() =>
          setCardModalState((prev) => ({
            ...prev,
            isOpen: false,
          }))
        }
      />
    </div>
  )
}
