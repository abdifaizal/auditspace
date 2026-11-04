import React, { useState } from 'react'
import { StickyNote } from '../types'
import { X, Trash2, StickyNote as NoteIcon } from 'lucide-react'

interface StickyModalProps {
  sticky: StickyNote | null
  isOpen: boolean
  onClose: () => void
  onSave: (sticky: StickyNote) => void
  onDelete?: (id: string) => void
}

export const StickyModal: React.FC<StickyModalProps> = ({
  sticky,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  if (!isOpen) return null

  const [content, setContent] = useState(sticky?.content || '')
  const [color, setColor] = useState<'amber' | 'blue' | 'emerald' | 'purple' | 'rose'>(
    sticky?.color || 'amber'
  )

  const colors = [
    { key: 'amber', label: 'Kuning', bg: 'bg-amber-100 border-amber-300 text-amber-900' },
    { key: 'blue', label: 'Biru', bg: 'bg-blue-100 border-blue-300 text-blue-900' },
    { key: 'emerald', label: 'Hijau', bg: 'bg-emerald-100 border-emerald-300 text-emerald-900' },
    { key: 'purple', label: 'Ungu', bg: 'bg-purple-100 border-purple-300 text-purple-900' },
    { key: 'rose', label: 'Merah', bg: 'bg-rose-100 border-rose-300 text-rose-900' },
  ] as const

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    const updated: StickyNote = {
      id: sticky?.id || 'stk-' + Math.random().toString(36).substring(2, 9),
      content: content.trim(),
      color,
      x: sticky?.x ?? 250,
      y: sticky?.y ?? 250,
    }
    onSave(updated)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <NoteIcon className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {sticky ? 'Edit Catatan Tempel' : 'Tambah Catatan Cepat'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
              Warna Catatan
            </label>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setColor(c.key)}
                  className={`w-7 h-7 rounded-full border-2 transition ${c.bg} ${
                    color === c.key ? 'ring-2 ring-offset-2 ring-zinc-500 scale-110' : 'opacity-70'
                  }`}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">
              Isi Catatan
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tuliskan catatan penting, temuan awal, atau reminder audit..."
              className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
              required
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {sticky && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(sticky.id)
                  onClose()
                }}
                className="text-xs text-red-600 hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Hapus
              </button>
            ) : <div />}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow"
              >
                Simpan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
