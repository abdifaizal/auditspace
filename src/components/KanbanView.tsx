import React, { useState } from 'react'
import {
  MeetingCard,
  MaterialVaultCard,
  TaskCard,
  StickyNote,
  Attachment,
} from '../types'
import {
  FileText,
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
} from 'lucide-react'
import { formatBytes, formatDateString } from '../services/storage'

interface KanbanViewProps {
  meetings: MeetingCard[]
  materials: MaterialVaultCard[]
  tasks: TaskCard[]
  stickies: StickyNote[]
  onAddNew: (type: 'meeting' | 'material' | 'task' | 'sticky') => void
  onEditMeeting: (meeting: MeetingCard) => void
  onEditMaterial: (mat: MaterialVaultCard) => void
  onEditTask: (task: TaskCard) => void
  onEditSticky: (sticky: StickyNote) => void
  onDeleteSticky?: (id: string) => void
  onPreviewPdf: (att: Attachment) => void
  onToggleTaskDone: (task: TaskCard) => void
}

export const KanbanView: React.FC<KanbanViewProps> = ({
  meetings,
  materials,
  tasks,
  stickies,
  onAddNew,
  onEditMeeting,
  onEditMaterial,
  onEditTask,
  onEditSticky,
  onDeleteSticky,
  onPreviewPdf,
  onToggleTaskDone,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPic, setSelectedPic] = useState('all')

  // Extract all unique PICs for filter
  const allPics = Array.from(new Set(tasks.map((t) => t.pic).filter(Boolean)))

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.pic.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPic = selectedPic === 'all' || t.pic === selectedPic
    return matchesSearch && matchesPic
  })

  const pendingTasks = filteredTasks.filter((t) => t.status !== 'done')
  const completedTasks = filteredTasks.filter((t) => t.status === 'done')

  // Filter stickies
  const filteredStickies = stickies.filter((s) =>
    s.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      {/* Subheader Filters */}
      <div className="h-12 px-6 border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 flex items-center justify-between gap-4 shrink-0">
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

      {/* 5-COLUMN KANBAN BOARD */}
      <div className="flex-1 p-6 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-5 h-full min-w-[1550px]">
          {/* COLUMN 1: CATATAN TEMPEL (STICKY NOTES) */}
          <div className="w-[290px] flex flex-col bg-zinc-100/70 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden shrink-0">
            <div className="p-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600">
                  <NoteIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                    Catatan Tempel
                  </h3>
                  <p className="text-[10px] text-zinc-500">{stickies.length} Catatan Cepat</p>
                </div>
              </div>
              <button
                onClick={() => onAddNew('sticky')}
                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500"
                title="Tambah Catatan Tempel"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
              {filteredStickies.map((s) => {
                const colorMap = {
                  amber: 'bg-amber-100 border-amber-300 text-amber-900',
                  blue: 'bg-blue-100 border-blue-300 text-blue-900',
                  emerald: 'bg-emerald-100 border-emerald-300 text-emerald-900',
                  purple: 'bg-purple-100 border-purple-300 text-purple-900',
                  rose: 'bg-rose-100 border-rose-300 text-rose-900',
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
                    <p className="text-xs leading-relaxed whitespace-pre-line font-medium font-sans">
                      {s.content}
                    </p>
                  </div>
                )
              })}
              {filteredStickies.length === 0 && (
                <div className="p-4 text-center border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-400">
                  Belum ada catatan tempel. Klik tombol (+) di atas untuk menambahkan.
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 2: AGENDA & DISKUSI */}
          <div className="w-[310px] flex flex-col bg-zinc-100/70 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden shrink-0">
            <div className="p-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                    Agenda & Diskusi
                  </h3>
                  <p className="text-[10px] text-zinc-500">{meetings.length} Sesi Terjadwal</p>
                </div>
              </div>
              <button
                onClick={() => onAddNew('meeting')}
                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500"
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

                  {/* Attached PDF Invite */}
                  {m.pdfInvite && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation()
                        onPreviewPdf(m.pdfInvite!)
                      }}
                      className="flex items-center justify-between p-2 rounded-lg bg-red-50/60 dark:bg-red-950/20 border border-red-200/60 text-[11px] text-red-700 dark:text-red-300 hover:bg-red-100/50 transition"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{m.pdfInvite.name}</span>
                      </div>
                      <span className="text-[10px] underline font-medium shrink-0 ml-1">Lihat PDF</span>
                    </div>
                  )}

                  {/* Transcript Snippet */}
                  {m.transcript && (
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed bg-zinc-50 dark:bg-zinc-800/40 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800">
                      {m.transcript}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* COLUMN 3: MATERI AUDITEE & LINKS */}
          <div className="w-[310px] flex flex-col bg-zinc-100/70 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden shrink-0">
            <div className="p-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600">
                  <FolderArchive className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                    Materi Auditee & Links
                  </h3>
                  <p className="text-[10px] text-zinc-500">{materials.length} Repositori Berkas</p>
                </div>
              </div>
              <button
                onClick={() => onAddNew('material')}
                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500"
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

                  {/* Documents */}
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

                  {/* Links */}
                  {mat.links.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        Tautan URL ({mat.links.length})
                      </p>
                      {mat.links.map((link) => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-between p-1.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 text-[11px] text-blue-700 dark:text-blue-300 hover:underline"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <Globe className="w-3 h-3 text-blue-500 shrink-0" />
                            <span className="truncate">{link.title}</span>
                          </div>
                          <ExternalLink className="w-3 h-3 shrink-0 ml-1" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* COLUMN 4: TUGAS / TO-DO & IN PROGRESS */}
          <div className="w-[320px] flex flex-col bg-zinc-100/70 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden shrink-0">
            <div className="p-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                    Tugas & To-Do Audit
                  </h3>
                  <p className="text-[10px] text-zinc-500">{pendingTasks.length} Tugas Berjalan</p>
                </div>
              </div>
              <button
                onClick={() => onAddNew('task')}
                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500"
                title="Tambah Tugas Audit"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
              {pendingTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => onEditTask(t)}
                  className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm hover:border-amber-400 dark:hover:border-amber-500 transition cursor-pointer space-y-2 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 transition leading-snug">
                      {t.title}
                    </h4>
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

                  {t.description && (
                    <p className="text-[11px] text-zinc-500 line-clamp-2">{t.description}</p>
                  )}

                  <div className="pt-1 flex flex-col gap-1 text-[11px] text-zinc-500">
                    <div className="flex items-center justify-between">
                      <span>Timeline:</span>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">
                        {formatDateString(t.startDate)} - {formatDateString(t.dueDate)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>PIC:</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">{t.pic}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleTaskDone(t)
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Tandai Selesai</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* COLUMN 5: COMPLETED & EVIDENCE (SELESAI DENGAN BUKTI DOKUMEN) */}
          <div className="w-[330px] flex flex-col bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/60 rounded-2xl overflow-hidden shrink-0">
            <div className="p-3.5 border-b border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between bg-white dark:bg-zinc-900">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                    Selesai & Bukti Audit
                  </h3>
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

                  {/* Audit Trail completion info */}
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

                  {/* Attached Evidence document */}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
