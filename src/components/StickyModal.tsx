import React, { useState, useRef } from 'react'
import { StickyNote } from '../types'
import {
  X,
  Trash2,
  StickyNote as NoteIcon,
  List,
  ListOrdered,
  CheckSquare,
  Bold,
  Image as ImageIcon,
  Eye,
  PenLine,
} from 'lucide-react'
import { StickyContentRenderer } from './StickyContentRenderer'

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
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write')

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const colors = [
    { key: 'amber', label: 'Kuning', bg: 'bg-amber-100 border-amber-300 text-amber-900', ring: 'ring-amber-400' },
    { key: 'blue', label: 'Biru', bg: 'bg-blue-100 border-blue-300 text-blue-900', ring: 'ring-blue-400' },
    { key: 'emerald', label: 'Hijau', bg: 'bg-emerald-100 border-emerald-300 text-emerald-900', ring: 'ring-emerald-400' },
    { key: 'purple', label: 'Ungu', bg: 'bg-purple-100 border-purple-300 text-purple-900', ring: 'ring-purple-400' },
    { key: 'rose', label: 'Merah', bg: 'bg-rose-100 border-rose-300 text-rose-900', ring: 'ring-rose-400' },
  ] as const

  const insertText = (before: string, after: string = '') => {
    if (!textareaRef.current) return
    const ta = textareaRef.current
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = content.substring(start, end)
    const replacement = before + selected + after
    const newContent = content.substring(0, start) + replacement + content.substring(end)
    setContent(newContent)
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(start + before.length, end + before.length)
    }, 0)
  }

  const handleInsertBullet = () => {
    if (!textareaRef.current) return
    const ta = textareaRef.current
    const start = ta.selectionStart
    // Check if cursor is at line start
    const isLineStart = start === 0 || content[start - 1] === '\n'
    insertText(isLineStart ? '- ' : '\n- ')
  }

  const handleInsertNumber = () => {
    if (!textareaRef.current) return
    const ta = textareaRef.current
    const start = ta.selectionStart
    const isLineStart = start === 0 || content[start - 1] === '\n'
    insertText(isLineStart ? '1. ' : '\n1. ')
  }

  const handleInsertCheckbox = () => {
    if (!textareaRef.current) return
    const ta = textareaRef.current
    const start = ta.selectionStart
    const isLineStart = start === 0 || content[start - 1] === '\n'
    insertText(isLineStart ? '[ ] ' : '\n[ ] ')
  }

  const handleInsertBold = () => {
    insertText('**', '**')
  }

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Hanya berkas gambar (PNG, JPG, JPEG, WEBP, GIF) yang didukung.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      const alt = file.name.replace(/\.[^/.]+$/, '') || 'Lampiran Catatan'
      insertText(`\n![${alt}](${base64})\n`)
    }
    reader.readAsDataURL(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageFile(file)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile()
        if (file) {
          e.preventDefault()
          handleImageFile(file)
          return
        }
      }
    }
  }

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

  const currentColorClass = {
    amber: 'bg-amber-100 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-800',
    blue: 'bg-blue-100 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200 border-blue-300 dark:border-blue-800',
    emerald: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800',
    purple: 'bg-purple-100 dark:bg-purple-950/40 text-purple-950 dark:text-purple-200 border-purple-300 dark:border-purple-800',
    rose: 'bg-rose-100 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-800',
  }[color]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <NoteIcon className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {sticky ? 'Edit Catatan Tempel' : 'Tambah Catatan Cepat'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 flex flex-col">
          {/* Warna Catatan */}
          <div className="shrink-0">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
              Warna Catatan
            </label>
            <div className="flex gap-2.5">
              {colors.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setColor(c.key)}
                  className={`w-7 h-7 rounded-full border-2 transition ${c.bg} ${
                    color === c.key ? `ring-2 ring-offset-2 ${c.ring} scale-110 shadow-sm` : 'opacity-70 hover:opacity-100'
                  }`}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Editor Header: Tabs & Toolbar */}
          <div className="space-y-1.5 flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
              {/* Write vs Preview Tabs */}
              <div className="flex items-center p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('write')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition font-medium ${
                    activeTab === 'write'
                      ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <PenLine className="w-3.5 h-3.5" />
                  <span>Tulis</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition font-medium ${
                    activeTab === 'preview'
                      ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Pratinjau</span>
                </button>
              </div>

              {/* Formatting Toolbar */}
              {activeTab === 'write' && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleInsertBullet}
                    className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-blue-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
                    title="Sisipkan Bullet List (• Simbol)"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleInsertNumber}
                    className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-blue-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
                    title="Sisipkan Numbering (1. Angka)"
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleInsertCheckbox}
                    className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-blue-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
                    title="Sisipkan Checkbox / To-Do"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleInsertBold}
                    className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-blue-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
                    title="Tebalkan Teks (**Bold**)"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>

                  <div className="h-4 w-px bg-zinc-200 dark:border-zinc-700 mx-1" />

                  {/* Sisipkan Gambar */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition border border-blue-200 dark:border-blue-900/60"
                    title="Sisipkan Gambar / Screenshot (atau langsung Paste Ctrl+V)"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Sisipkan Gambar</span>
                  </button>
                </div>
              )}
            </div>

            {/* Editor Body */}
            {activeTab === 'write' ? (
              <div className="flex-1 flex flex-col">
                <textarea
                  ref={textareaRef}
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onPaste={handlePaste}
                  placeholder={`Tuliskan catatan penting, temuan audit, atau reminder...\n\nTips:\n- Gunakan tombol toolbar untuk Bullet (•) dan Numbering (1.)\n- Anda dapat langsung Paste (Ctrl+V) tangkapan layar (screenshot) dari clipboard!`}
                  className="w-full flex-1 min-h-[180px] p-3 text-xs font-mono bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100 resize-y leading-relaxed"
                  required
                />
                <p className="text-[10px] text-zinc-400 mt-1 flex items-center justify-between">
                  <span>Mendukung Bullet (`- `), Numbering (`1. `), dan Tempel Gambar (`Ctrl+V`).</span>
                  <span>{content.length} karakter</span>
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-[180px]">
                <div className={`p-4 rounded-xl border shadow-sm flex-1 overflow-y-auto ${currentColorClass}`}>
                  <div className="flex items-center justify-between mb-2 pb-1 border-b border-black/10 dark:border-white/10 opacity-70">
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Pratinjau Catatan Tempel
                    </span>
                  </div>
                  {content.trim() ? (
                    <StickyContentRenderer content={content} />
                  ) : (
                    <p className="text-xs italic opacity-50">Belum ada isi catatan.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
            {sticky && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(sticky.id)
                  onClose()
                }}
                className="text-xs text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" /> Hapus Catatan
              </button>
            ) : (
              <div />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl font-medium transition"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition active:scale-95"
              >
                Simpan Catatan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
