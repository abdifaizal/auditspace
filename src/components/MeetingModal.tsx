import React, { useState } from 'react'
import { MeetingCard, Attachment } from '../types'
import { X, Upload, FileText, Trash2, Plus, Calendar, Clock, Building } from 'lucide-react'
import { fileToAttachment, formatBytes } from '../services/storage'

interface MeetingModalProps {
  meeting: MeetingCard | null
  isOpen: boolean
  onClose: () => void
  onSave: (meeting: MeetingCard) => void
  onDelete?: (id: string) => void
  onPreviewPdf: (att: Attachment) => void
}

export const MeetingModal: React.FC<MeetingModalProps> = ({
  meeting,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onPreviewPdf,
}) => {
  if (!isOpen) return null

  const [title, setTitle] = useState(meeting?.title || '')
  const [auditeeUnit, setAuditeeUnit] = useState(meeting?.auditeeUnit || '')
  const [date, setDate] = useState(meeting?.date || new Date().toISOString().slice(0, 10))
  const [time, setTime] = useState(meeting?.time || '09:00 - 11:00 WIB')
  const [transcript, setTranscript] = useState(meeting?.transcript || '')
  const [pdfInvite, setPdfInvite] = useState<Attachment | null>(meeting?.pdfInvite || null)
  const [actionPoints, setActionPoints] = useState<string[]>(meeting?.actionPoints || [])
  const [newActionPoint, setNewActionPoint] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  const processFile = async (file: File) => {
    setIsUploading(true)
    try {
      const att = await fileToAttachment(file)
      setPdfInvite(att)
    } catch (err) {
      alert('Gagal mengunggah berkas PDF: ' + err)
    } finally {
      setIsUploading(false)
      setIsDragOver(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleAddActionPoint = () => {
    if (!newActionPoint.trim()) return
    setActionPoints([...actionPoints, newActionPoint.trim()])
    setNewActionPoint('')
  }

  const handleRemoveActionPoint = (idx: number) => {
    setActionPoints(actionPoints.filter((_, i) => i !== idx))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      alert('Judul Diskusi wajib diisi!')
      return
    }

    const updated: MeetingCard = {
      id: meeting?.id || 'meet-' + Math.random().toString(36).substring(2, 9),
      title: title.trim(),
      auditeeUnit: auditeeUnit.trim() || 'Tim Auditee',
      date,
      time,
      pdfInvite,
      transcript: transcript.trim(),
      actionPoints,
      x: meeting?.x ?? 100,
      y: meeting?.y ?? 100,
    }
    onSave(updated)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {meeting ? 'Edit Agenda & Diskusi Auditee' : 'Tambah Agenda & Diskusi Baru'}
            </h2>
            <p className="text-xs text-zinc-500">
              Lampirkan surat/PDF undangan dan catat rangkuman hasil wawancara audit.
            </p>
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
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
              Topik / Judul Diskusi *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Wawancara Keamanan Server & API"
              className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
              required
            />
          </div>

          {/* Unit & Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1 flex items-center gap-1">
                <Building className="w-3.5 h-3.5" /> Unit Auditee
              </label>
              <input
                type="text"
                value={auditeeUnit}
                onChange={(e) => setAuditeeUnit(e.target.value)}
                placeholder="cth: Tim DevOps & Infrastruktur"
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Tanggal
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Waktu
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="09:30 - 11:30 WIB"
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Attachment: PDF Undangan Diskusi */}
          <div className="pt-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-2">
              Lampiran PDF Undangan Diskusi
            </label>
            {pdfInvite ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50">
                <div className="flex items-center gap-3 truncate">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {pdfInvite.name}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      {formatBytes(pdfInvite.size)} • PDF Terlampir
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onPreviewPdf(pdfInvite)}
                    className="px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Buka Pratinjau
                  </button>
                  <button
                    type="button"
                    onClick={() => setPdfInvite(null)}
                    className="p-1 text-zinc-400 hover:text-red-500 transition"
                    title="Hapus berkas"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <label
                onDragOver={handleDragOver}
                onDragEnter={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/60 ring-2 ring-blue-400 scale-[1.01]'
                    : 'border-zinc-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40'
                }`}
              >
                <Upload className={`w-6 h-6 mb-1 transition ${isDragOver ? 'text-blue-600 animate-bounce' : 'text-zinc-400'}`} />
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {isDragOver
                    ? 'Lepaskan berkas PDF di sini!'
                    : isUploading
                    ? 'Sedang memproses PDF...'
                    : 'Unggah PDF Undangan (Klik atau Drag & Drop)'}
                </span>
                <span className="text-[10px] text-zinc-400 mt-0.5">Format PDF disarankan</span>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Transcript / Minutes of Meeting */}
          <div className="pt-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
              Rangkuman / Transkrip Hasil Diskusi
            </label>
            <textarea
              rows={5}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Tempelkan hasil wawancara, transkrip meeting, poin klarifikasi auditee, atau ringkasan diskusi di sini..."
              className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100 font-sans"
            />
          </div>

          {/* Action Points */}
          <div className="pt-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
              Poin Tindak Lanjut / Action Items
            </label>
            <div className="space-y-1.5 mb-2">
              {actionPoints.map((pt, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 text-xs text-zinc-800 dark:text-zinc-200"
                >
                  <span>• {pt}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveActionPoint(idx)}
                    className="text-zinc-400 hover:text-red-500"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newActionPoint}
                onChange={(e) => setNewActionPoint(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddActionPoint()
                  }
                }}
                placeholder="Tambahkan poin tindak lanjut..."
                className="flex-1 px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
              />
              <button
                type="button"
                onClick={handleAddActionPoint}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-600 inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah
              </button>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
            {meeting && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Yakin ingin menghapus agenda diskusi ini?')) {
                    onDelete(meeting.id)
                    onClose()
                  }
                }}
                className="text-xs text-red-600 hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Hapus Agenda
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
                Simpan Diskusi
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
