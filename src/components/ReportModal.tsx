import React from 'react'
import { AuditWorkspace } from '../types'
import {
  X,
  Printer,
  CheckCircle2,
  Clock,
  Calendar,
  FileText,
  ShieldCheck,
  Building,
  User,
  AlertCircle,
  TrendingUp,
} from 'lucide-react'
import { formatDateString } from '../services/storage'

interface ReportModalProps {
  workspace: AuditWorkspace
  isOpen: boolean
  onClose: () => void
}

export const ReportModal: React.FC<ReportModalProps> = ({ workspace, isOpen, onClose }) => {
  if (!isOpen) return null

  const { projectMeta, tasks, meetings, stickies } = workspace

  const completedTasks = tasks.filter((t) => t.status === 'done')
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress')
  const todoTasks = tasks.filter((t) => t.status === 'todo')

  const totalTasks = tasks.length
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0

  const handlePrint = () => {
    window.print()
  }

  const currentDateFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="print-report-modal fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="print-report-sheet relative w-full max-w-4xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-6 max-h-[90vh] flex flex-col">
        {/* Top Actions Bar (Hidden on Print) */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/70 shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Laporan Progres Audit (Audit Status Report)
              </h3>
              <p className="text-xs text-zinc-500">
                Potret komprehensif apa yang sudah, sedang, dan akan dilakukan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Ekspor ke PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Content Body */}
        <div className="print-report-body flex-1 overflow-y-auto p-8 space-y-6 text-zinc-900 dark:text-zinc-100 print:text-black font-sans">
          {/* Header Surat / Laporan */}
          <div className="border-b-2 border-zinc-900 dark:border-zinc-100 pb-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-blue-600 print:text-black" />
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 print:text-zinc-600">
                    KERTAS KERJA & MONITORING PELAKSANAAN AUDIT
                  </span>
                </div>
                <h1 className="text-2xl font-bold mt-1 text-zinc-900 dark:text-white print:text-black">
                  {projectMeta.name}
                </h1>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 print:text-zinc-700 mt-0.5">
                  {projectMeta.description || 'Laporan Status dan Progres Pengujian Sistem'}
                </p>
              </div>

              <div className="text-right text-xs space-y-0.5 text-zinc-600 dark:text-zinc-400 print:text-zinc-700">
                <p>
                  <strong>Tanggal Dokumen:</strong> {currentDateFormatted} WIB
                </p>
                <p>
                  <strong>Status Penugasan:</strong> Active Fieldwork
                </p>
              </div>
            </div>

            {/* Meta Details Box */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 p-3.5 bg-zinc-50 dark:bg-zinc-800/50 print:bg-zinc-100 rounded-xl text-xs">
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase font-bold">Timeline Pelaksanaan</span>
                <span className="font-semibold">{projectMeta.timeline}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase font-bold">Entitas Auditee</span>
                <span className="font-semibold">{projectMeta.auditeeName}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase font-bold">Tim Pemeriksa (Lead)</span>
                <span className="font-semibold">{projectMeta.leadAuditor}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase font-bold">Tingkat Penyelesaian</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 print:text-black">
                  {progressPercent}% ({completedTasks.length}/{totalTasks} Prosedur)
                </span>
              </div>
            </div>
          </div>

          {/* Section: Executive KPI Snapshot */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20">
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Sudah Dilakukan</span>
              </div>
              <div className="text-xl font-bold text-emerald-800 dark:text-emerald-300">
                {completedTasks.length} <span className="text-xs font-normal">Tugas / Temuan</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20">
              <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Sedang Dilakukan</span>
              </div>
              <div className="text-xl font-bold text-amber-800 dark:text-amber-300">
                {inProgressTasks.length} <span className="text-xs font-normal">Prosedur Aktif</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20">
              <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Akan Dilakukan</span>
              </div>
              <div className="text-xl font-bold text-blue-800 dark:text-blue-300">
                {todoTasks.length} <span className="text-xs font-normal">Rencana Uji</span>
              </div>
            </div>
          </div>

          {/* BAGIAN 1: APA YANG SUDAH DILAKUKAN */}
          <div className="print-section space-y-3">
            <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 print:text-black">
                1. Apa yang Sudah Dilakukan (Completed Tasks & Evidences)
              </h2>
            </div>

            {completedTasks.length > 0 ? (
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-100 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="py-2.5 px-3 w-10">No</th>
                      <th className="py-2.5 px-3">Prosedur Pengujian / Tugas</th>
                      <th className="py-2.5 px-3">PIC & Waktu Selesai</th>
                      <th className="py-2.5 px-3">Bukti Dokumen Terlampir (Evidence)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {completedTasks.map((t, idx) => (
                      <tr key={t.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                        <td className="py-2 px-3 text-zinc-500 font-mono">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100 print:text-black">
                            {t.title}
                          </p>
                          {t.description && (
                            <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2">
                              {t.description}
                            </p>
                          )}
                        </td>
                        <td className="py-2 px-3 text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                          <p className="font-medium">{t.completedBy || t.pic}</p>
                          <p className="text-[10px] text-zinc-500">
                            {t.completedAt ? new Date(t.completedAt).toLocaleString('id-ID') : '-'}
                          </p>
                        </td>
                        <td className="py-2 px-3">
                          {t.evidenceAttachment ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-medium">
                              <FileText className="w-3 h-3" />
                              {t.evidenceAttachment.name}
                            </span>
                          ) : (
                            <span className="text-[11px] text-zinc-400 italic">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-zinc-400 italic">Belum ada tugas yang diselesaikan.</p>
            )}
          </div>

          {/* BAGIAN 2: APA YANG SEDANG DILAKUKAN */}
          <div className="print-section space-y-3 pt-2">
            <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 print:text-black">
                2. Apa yang Sedang Dilakukan (Active / In Progress)
              </h2>
            </div>

            {inProgressTasks.length > 0 ? (
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-100 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="py-2.5 px-3 w-10">No</th>
                      <th className="py-2.5 px-3">Prosedur Pengujian</th>
                      <th className="py-2.5 px-3">PIC Pelaksana</th>
                      <th className="py-2.5 px-3">Prioritas</th>
                      <th className="py-2.5 px-3">Target Selesai (Due Date)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {inProgressTasks.map((t, idx) => (
                      <tr key={t.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                        <td className="py-2 px-3 text-zinc-500 font-mono">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100 print:text-black">
                            {t.title}
                          </p>
                          {t.description && (
                            <p className="text-[11px] text-zinc-500 mt-0.5">{t.description}</p>
                          )}
                        </td>
                        <td className="py-2 px-3 font-medium text-blue-600 dark:text-blue-400">
                          {t.pic}
                        </td>
                        <td className="py-2 px-3 uppercase text-[10px] font-bold">
                          {t.priority}
                        </td>
                        <td className="py-2 px-3 text-zinc-700 dark:text-zinc-300">
                          {formatDateString(t.dueDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-zinc-400 italic">Tidak ada tugas yang berstatus In Progress.</p>
            )}
          </div>

          {/* BAGIAN 3: APA YANG AKAN DILAKUKAN */}
          <div className="print-section space-y-3 pt-2">
            <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-blue-800 dark:text-blue-400 print:text-black">
                3. Apa yang Akan Dilakukan (Upcoming / To-Do Pipeline)
              </h2>
            </div>

            {todoTasks.length > 0 ? (
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-100 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="py-2.5 px-3 w-10">No</th>
                      <th className="py-2.5 px-3">Rencana Prosedur Audit</th>
                      <th className="py-2.5 px-3">Alokasi PIC</th>
                      <th className="py-2.5 px-3">Jadwal Pelaksanaan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {todoTasks.map((t, idx) => (
                      <tr key={t.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                        <td className="py-2 px-3 text-zinc-500 font-mono">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100 print:text-black">
                            {t.title}
                          </p>
                          {t.description && (
                            <p className="text-[11px] text-zinc-500 mt-0.5">{t.description}</p>
                          )}
                        </td>
                        <td className="py-2 px-3 font-medium text-zinc-700 dark:text-zinc-300">
                          {t.pic}
                        </td>
                        <td className="py-2 px-3 text-zinc-700 dark:text-zinc-300">
                          {formatDateString(t.startDate)} s.d. {formatDateString(t.dueDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-zinc-400 italic">Seluruh rencana tugas telah berjalan atau selesai.</p>
            )}

            {/* Sesi Diskusi / Wawancara Mendatang */}
            {meetings.length > 0 && (
              <div className="mt-4 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
                <p className="text-xs font-semibold uppercase text-zinc-700 dark:text-zinc-300 mb-2">
                  Daftar Pertemuan & Diskusi Teknis Auditee Terkait:
                </p>
                <div className="space-y-1.5 text-xs">
                  {meetings.map((m) => (
                    <div key={m.id} className="flex items-center justify-between">
                      <span className="font-medium">• {m.title} ({m.auditeeUnit})</span>
                      <span className="text-zinc-500">
                        {formatDateString(m.date)} | {m.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* BAGIAN 4: CATATAN TEMUAN AWAL / STICKY INQUIRY */}
          {stickies.length > 0 && (
            <div className="space-y-2 pt-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Catatan Penting & Audit Inquiry:
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {stickies.map((s) => (
                  <div
                    key={s.id}
                    className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/30"
                  >
                    <p className="italic text-zinc-700 dark:text-zinc-300">"{s.content}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signatures Footer */}
          <div className="print-section pt-10 flex items-center justify-between text-xs text-center border-t border-zinc-200 dark:border-zinc-800">
            <div>
              <p className="text-zinc-500 mb-12">Disiapkan Oleh (Auditor):</p>
              <p className="font-bold underline">{projectMeta.leadAuditor}</p>
              <p className="text-zinc-500">Tim Audit Internal</p>
            </div>
            <div>
              <p className="text-zinc-500 mb-12">Diverifikasi & Diketahui Oleh:</p>
              <p className="font-bold underline">{projectMeta.auditeeName}</p>
              <p className="text-zinc-500">Perwakilan Manajemen Auditee</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
