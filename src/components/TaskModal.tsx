import React, { useState } from 'react'
import { TaskCard, TaskPriority, TaskStatus, Attachment } from '../types'
import { X, Upload, FileText, Trash2, CheckCircle2, Calendar, User, AlertCircle } from 'lucide-react'
import { fileToAttachment, formatBytes } from '../services/storage'

interface TaskModalProps {
  task: TaskCard | null
  isOpen: boolean
  onClose: () => void
  onSave: (task: TaskCard) => void
  onDelete?: (id: string) => void
  onPreviewPdf: (att: Attachment) => void
}

export const TaskModal: React.FC<TaskModalProps> = ({
  task,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onPreviewPdf,
}) => {
  if (!isOpen) return null

  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [startDate, setStartDate] = useState(task?.startDate || new Date().toISOString().slice(0, 10))
  const [dueDate, setDueDate] = useState(task?.dueDate || new Date().toISOString().slice(0, 10))
  const [pic, setPic] = useState(task?.pic || '')
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'medium')
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'todo')
  const [completedAt, setCompletedAt] = useState(task?.completedAt || '')
  const [completedBy, setCompletedBy] = useState(task?.completedBy || '')
  const [evidenceAttachment, setEvidenceAttachment] = useState<Attachment | null>(task?.evidenceAttachment || null)
  const [isUploading, setIsUploading] = useState(false)

  const handleStatusChange = (newStatus: TaskStatus) => {
    setStatus(newStatus)
    if (newStatus === 'done') {
      if (!completedAt) {
        setCompletedAt(new Date().toISOString())
      }
      if (!completedBy) {
        setCompletedBy(pic || 'Auditor TI')
      }
    }
  }

  const handleEvidenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const att = await fileToAttachment(file)
      setEvidenceAttachment(att)
    } catch (err) {
      alert('Gagal mengunggah dokumen bukti audit: ' + err)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      alert('Judul Tugas wajib diisi!')
      return
    }

    const updated: TaskCard = {
      id: task?.id || 'task-' + Math.random().toString(36).substring(2, 9),
      title: title.trim(),
      description: description.trim(),
      startDate,
      dueDate,
      pic: pic.trim() || 'Auditor',
      priority,
      status,
      completedAt: status === 'done' ? (completedAt || new Date().toISOString()) : undefined,
      completedBy: status === 'done' ? (completedBy || pic || 'Auditor') : undefined,
      evidenceAttachment: status === 'done' ? evidenceAttachment : null,
      x: task?.x ?? 300,
      y: task?.y ?? 100,
    }
    onSave(updated)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${status === 'done' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600' : 'bg-blue-100 dark:bg-blue-950/60 text-blue-600'}`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {task ? 'Kelola Tugas / Kertas Kerja Audit' : 'Buat Tugas Baru'}
              </h2>
              <p className="text-xs text-zinc-500">
                Tetapkan PIC, timeline pelaksanaan, serta lampirkan bukti verifikasi kerja.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Status Bar */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
              Status Pelaksanaan
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleStatusChange('todo')}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition flex items-center justify-center gap-1.5 ${
                  status === 'todo'
                    ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900 border-transparent shadow'
                    : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100'
                }`}
              >
                To Do (Antrian)
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('in_progress')}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition flex items-center justify-center gap-1.5 ${
                  status === 'in_progress'
                    ? 'bg-amber-600 text-white border-transparent shadow'
                    : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100'
                }`}
              >
                In Progress (Dikerjakan)
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange('done')}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition flex items-center justify-center gap-1.5 ${
                  status === 'done'
                    ? 'bg-emerald-600 text-white border-transparent shadow'
                    : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100'
                }`}
              >
                ✔ Selesai (Done)
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
              Judul Tugas / Pengujian Audit *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Verifikasi Konfigurasi Enkripsi Database"
              className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
              Deskripsi Prosedur Pengujian
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan ruang lingkup, kriteria kepatuhan, atau langkah kerja audit..."
              className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          {/* PIC & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> PIC (Person in Charge) *
              </label>
              <input
                type="text"
                value={pic}
                onChange={(e) => setPic(e.target.value)}
                placeholder="cth: Budi Pratama (Lead Auditor)"
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Tingkat Prioritas
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
              >
                <option value="low">Rendah (Low)</option>
                <option value="medium">Sedang (Medium)</option>
                <option value="high">Tinggi (High)</option>
                <option value="critical">Kritis (Critical Finding)</option>
              </select>
            </div>
          </div>

          {/* Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Tanggal Mulai
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Batas Waktu (Due Date)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* COMPLETED TASK DETAILS (AUDIT TRAIL & EVIDENCE ATTACHMENT) */}
          {status === 'done' && (
            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <h4 className="text-xs font-semibold uppercase tracking-wider">
                  Audit Trail Penyelesaian Tugas & Berkas Bukti (Working Paper)
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Diselesaikan Oleh (Auditor / Reviewer)
                  </label>
                  <input
                    type="text"
                    value={completedBy}
                    onChange={(e) => setCompletedBy(e.target.value)}
                    placeholder="Nama yang menyelesaikan"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-emerald-300 dark:border-emerald-800 rounded-lg text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Waktu Selesai (Timestamp)
                  </label>
                  <input
                    type="text"
                    value={completedAt}
                    onChange={(e) => setCompletedAt(e.target.value)}
                    placeholder="YYYY-MM-DD HH:mm"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-emerald-300 dark:border-emerald-800 rounded-lg text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Evidence Attachment */}
              <div className="pt-1">
                <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Lampiran Dokumen Bukti (Evidence / Kertas Kerja Uji)
                </label>
                {evidenceAttachment ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-300 dark:border-emerald-800">
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {evidenceAttachment.name}
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          {formatBytes(evidenceAttachment.size)} • Bukti Terlampir
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onPreviewPdf(evidenceAttachment)}
                        className="px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Pratinjau
                      </button>
                      <button
                        type="button"
                        onClick={() => setEvidenceAttachment(null)}
                        className="p-1 text-zinc-400 hover:text-red-500"
                        title="Hapus lampiran bukti"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-emerald-300 dark:border-emerald-800 rounded-xl cursor-pointer hover:bg-emerald-100/40 dark:hover:bg-emerald-950/40 transition">
                    <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      {isUploading ? 'Mengunggah bukti...' : 'Lampirkan Dokumen Bukti (PDF / Gambar / Log)'}
                    </span>
                    <input
                      type="file"
                      onChange={handleEvidenceUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
            {task && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Yakin ingin menghapus tugas audit ini?')) {
                    onDelete(task.id)
                    onClose()
                  }
                }}
                className="text-xs text-red-600 hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Hapus Tugas
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow transition"
              >
                Simpan Tugas
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
