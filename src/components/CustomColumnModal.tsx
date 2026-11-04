import React, { useState, useEffect } from 'react'
import { X, Columns, Trash2, Check } from 'lucide-react'

interface CustomColumnModalProps {
  isOpen: boolean
  initialTitle?: string
  initialDescription?: string
  initialColor?: string
  isRenameBuiltin?: boolean
  columnKey?: string
  onSave: (title: string, description?: string, color?: string) => void
  onDelete?: () => void
  onResetDefault?: () => void
  onClose: () => void
}

const COLOR_OPTIONS: { id: string; label: string; bg: string; border: string; text: string }[] = [
  { id: 'blue', label: 'Biru', bg: 'bg-blue-100 dark:bg-blue-950/60', border: 'border-blue-400', text: 'text-blue-600' },
  { id: 'purple', label: 'Ungu', bg: 'bg-purple-100 dark:bg-purple-950/60', border: 'border-purple-400', text: 'text-purple-600' },
  { id: 'amber', label: 'Kuning', bg: 'bg-amber-100 dark:bg-amber-950/60', border: 'border-amber-400', text: 'text-amber-600' },
  { id: 'emerald', label: 'Hijau', bg: 'bg-emerald-100 dark:bg-emerald-950/60', border: 'border-emerald-400', text: 'text-emerald-600' },
  { id: 'rose', label: 'Merah', bg: 'bg-rose-100 dark:bg-rose-950/60', border: 'border-rose-400', text: 'text-rose-600' },
  { id: 'cyan', label: 'Sian', bg: 'bg-cyan-100 dark:bg-cyan-950/60', border: 'border-cyan-400', text: 'text-cyan-600' },
  { id: 'zinc', label: 'Abu-abu', bg: 'bg-zinc-100 dark:bg-zinc-800', border: 'border-zinc-400', text: 'text-zinc-600' },
]

export const CustomColumnModal: React.FC<CustomColumnModalProps> = ({
  isOpen,
  initialTitle = '',
  initialDescription = '',
  initialColor = 'blue',
  isRenameBuiltin = false,
  onSave,
  onDelete,
  onResetDefault,
  onClose,
}) => {
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [color, setColor] = useState(initialColor)

  useEffect(() => {
    setTitle(initialTitle)
    setDescription(initialDescription)
    setColor(initialColor)
  }, [initialTitle, initialDescription, initialColor, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      alert('Nama kolom / kotak wajib diisi!')
      return
    }
    onSave(title.trim(), description.trim(), color)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600">
              <Columns className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {isRenameBuiltin ? 'Ubah Nama Kolom' : initialTitle ? 'Edit Kotak / Kolom' : 'Tambah Kotak / Kolom Baru'}
              </h3>
              <p className="text-xs text-zinc-500">
                {isRenameBuiltin
                  ? 'Sesuaikan judul kolom agar sesuai metodologi kerja Anda'
                  : 'Buat kotak baru khusus untuk alur kerja audit Anda'}
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
              Nama Kolom / Kotak <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Temuan Sementara, Rekomendasi, dll"
              className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          {!isRenameBuiltin && (
            <>
              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
                  Keterangan Sub-judul (Opsional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Daftar temuan & isu audit pendahuluan"
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1.5">
                  Warna Aksen Kolom
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setColor(c.id)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition ${
                        c.bg
                      } ${c.text} ${color === c.id ? `ring-2 ring-offset-1 ring-blue-500 ${c.border}` : 'border-transparent opacity-80 hover:opacity-100'}`}
                    >
                      {color === c.id && <Check className="w-3.5 h-3.5" />}
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div>
              {isRenameBuiltin && onResetDefault && (
                <button
                  type="button"
                  onClick={() => {
                    onResetDefault()
                    onClose()
                  }}
                  className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
                >
                  Reset Judul Asli
                </button>
              )}
              {!isRenameBuiltin && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Yakin ingin menghapus kolom '${title}' dan seluruh isinya?`)) {
                      onDelete()
                      onClose()
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Kolom</span>
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
                Simpan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
