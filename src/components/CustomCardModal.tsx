import React, { useState, useEffect } from 'react'
import { X, FileText, Trash2, Calendar, User, AlertCircle } from 'lucide-react'
import { CustomCard, TaskPriority } from '../types'

interface CustomCardModalProps {
  card: CustomCard | null
  columnId: string
  columnTitle: string
  isOpen: boolean
  onSave: (card: CustomCard) => void
  onDelete?: (id: string) => void
  onClose: () => void
}

export const CustomCardModal: React.FC<CustomCardModalProps> = ({
  card,
  columnId,
  columnTitle,
  isOpen,
  onSave,
  onDelete,
  onClose,
}) => {
  const [title, setTitle] = useState(card?.title || '')
  const [description, setDescription] = useState(card?.description || '')
  const [pic, setPic] = useState(card?.pic || '')
  const [date, setDate] = useState(card?.date || new Date().toISOString().slice(0, 10))
  const [priority, setPriority] = useState<TaskPriority>(card?.priority || 'medium')

  useEffect(() => {
    setTitle(card?.title || '')
    setDescription(card?.description || '')
    setPic(card?.pic || '')
    setDate(card?.date || new Date().toISOString().slice(0, 10))
    setPriority(card?.priority || 'medium')
  }, [card, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      alert('Judul item wajib diisi!')
      return
    }

    const updated: CustomCard = {
      id: card?.id || 'custom-' + Math.random().toString(36).substring(2, 9),
      columnId,
      title: title.trim(),
      description: description.trim(),
      pic: pic.trim(),
      date,
      priority,
      x: card?.x ?? 300,
      y: card?.y ?? 100,
    }
    onSave(updated)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {card ? 'Edit Item' : 'Tambah Item Baru'}
              </h3>
              <p className="text-xs text-zinc-500">
                Di kolom: <strong>{columnTitle}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-zinc-700 dark:text-zinc-300">
          <div>
            <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
              Judul Item <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Temuan Segregasi Tugas IT Ops, Tindak lanjut audit, dll"
              className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
              Deskripsi & Catatan
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tuliskan rincian, kondisi, kriteria, sebab, atau dampak..."
              className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                <span>PIC / Auditor</span>
              </label>
              <input
                type="text"
                value={pic}
                onChange={(e) => setPic(e.target.value)}
                placeholder="Nama auditor / PIC"
                className="w-full px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Tanggal</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Prioritas / Signifikansi</span>
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100"
            >
              <option value="low">Low (Minor / Informatif)</option>
              <option value="medium">Medium (Standar)</option>
              <option value="high">High (Signifikan)</option>
              <option value="critical">Critical (Kritis / Fatal)</option>
            </select>
          </div>

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div>
              {card && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Hapus item ini?')) {
                      onDelete(card.id)
                      onClose()
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow transition"
              >
                Simpan Item
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
