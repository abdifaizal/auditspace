import React, { useState } from 'react'
import { MaterialVaultCard, Attachment, ExternalLink } from '../types'
import { X, Upload, FileText, Trash2, Plus, Globe, FolderArchive, Edit3, Check } from 'lucide-react'
import { fileToAttachment, formatBytes } from '../services/storage'
import { openExternalUrl } from '../services/nativeSave'

interface MaterialModalProps {
  material: MaterialVaultCard | null
  isOpen: boolean
  onClose: () => void
  onSave: (mat: MaterialVaultCard) => void
  onDelete?: (id: string) => void
  onPreviewPdf: (att: Attachment) => void
}

export const MaterialModal: React.FC<MaterialModalProps> = ({
  material,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onPreviewPdf,
}) => {
  if (!isOpen) return null

  const [title, setTitle] = useState(material?.title || '')
  const [description, setDescription] = useState(material?.description || '')
  const [attachments, setAttachments] = useState<Attachment[]>(material?.attachments || [])
  const [links, setLinks] = useState<ExternalLink[]>(material?.links || [])
  const [newLinkTitle, setNewLinkTitle] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  const processFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return
    setIsUploading(true)
    try {
      const newAtts: Attachment[] = []
      for (let i = 0; i < files.length; i++) {
        const att = await fileToAttachment(files[i])
        newAtts.push(att)
      }
      setAttachments((prev) => [...prev, ...newAtts])
    } catch (err) {
      alert('Gagal mengunggah dokumen: ' + err)
    } finally {
      setIsUploading(false)
      setIsDragOver(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) processFiles(files)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files)
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

  const handleRemoveAttachment = (id: string) => {
    setAttachments(attachments.filter((a) => a.id !== id))
  }

  const handleAddLink = () => {
    if (!newLinkUrl.trim()) return
    let formattedUrl = newLinkUrl.trim()
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl
    }
    const link: ExternalLink = {
      id: 'link-' + Math.random().toString(36).substring(2, 9),
      title: newLinkTitle.trim() || formattedUrl,
      url: formattedUrl,
    }
    setLinks([...links, link])
    setNewLinkTitle('')
    setNewLinkUrl('')
  }

  const handleStartEditLink = (link: ExternalLink) => {
    setEditingLinkId(link.id)
    setNewLinkTitle(link.title)
    setNewLinkUrl(link.url)
  }

  const handleCancelEditLink = () => {
    setEditingLinkId(null)
    setNewLinkTitle('')
    setNewLinkUrl('')
  }

  const handleSaveEditedLink = () => {
    if (!newLinkUrl.trim()) return
    let formattedUrl = newLinkUrl.trim()
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl
    }
    setLinks(
      links.map((l) =>
        l.id === editingLinkId
          ? {
              ...l,
              title: newLinkTitle.trim() || formattedUrl,
              url: formattedUrl,
            }
          : l
      )
    )
    handleCancelEditLink()
  }

  const handleRemoveLink = (id: string) => {
    if (editingLinkId === id) {
      handleCancelEditLink()
    }
    setLinks(links.filter((l) => l.id !== id))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      alert('Judul Materi/Vault wajib diisi!')
      return
    }

    const updated: MaterialVaultCard = {
      id: material?.id || 'mat-' + Math.random().toString(36).substring(2, 9),
      title: title.trim(),
      description: description.trim(),
      attachments,
      links,
      x: material?.x ?? 200,
      y: material?.y ?? 100,
    }
    onSave(updated)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/70 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <FolderArchive className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {material ? 'Kelola Materi & Repositori Auditee' : 'Tambah Materi Baru'}
                </h2>
                <p className="text-xs text-zinc-500">
                  Simpan dokumen teknis (SOP, diagram arsitektur) dan link referensi sistem auditee.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Scrollable Body */}
          <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
              Nama Kategori / Judul Materi *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Dokumen Arsitektur & SOP Keamanan"
              className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
              Deskripsi Catatan
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Keterangan singkat materi dari auditee..."
              className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          {/* Attachments list */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Dokumen & Berkas Terlampir ({attachments.length})
              </label>
              <span className="text-[11px] text-zinc-400">PDF, Word, Excel, Gambar, dll.</span>
            </div>

            {/* Drag & Drop Zone */}
            <label
              onDragOver={handleDragOver}
              onDragEnter={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center p-4 mb-3 border-2 border-dashed rounded-xl cursor-pointer transition ${
                isDragOver
                  ? 'border-purple-500 bg-purple-50/80 dark:bg-purple-950/60 ring-2 ring-purple-400 scale-[1.01]'
                  : 'border-zinc-300 dark:border-zinc-700 hover:border-purple-500 dark:hover:border-purple-400 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40'
              }`}
            >
              <Upload className={`w-5 h-5 mb-1 transition ${isDragOver ? 'text-purple-600 animate-bounce' : 'text-zinc-400'}`} />
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                {isDragOver
                  ? 'Lepaskan dokumen / PDF di sini!'
                  : isUploading
                  ? 'Sedang memproses dokumen...'
                  : 'Klik atau Tarik & Lepas (Drag & Drop) Berkas ke Sini'}
              </span>
              <span className="text-[10px] text-zinc-400 mt-0.5">Bisa pilih sekaligus banyak berkas</span>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                          {att.name}
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          {formatBytes(att.size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onPreviewPdf(att)}
                        className="px-2 py-0.5 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Pratinjau
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(att.id)}
                        className="p-1 text-zinc-400 hover:text-red-500"
                        title="Hapus berkas"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Links list */}
          <div className="pt-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-2">
              Tautan / Bookmark Web ({links.length})
            </label>

            {links.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {links.map((link) => (
                  <div
                    key={link.id}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs transition ${
                      editingLinkId === link.id
                        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700'
                        : 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/60 dark:border-blue-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {link.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => openExternalUrl(link.url)}
                        className="text-[11px] text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 hover:underline truncate max-w-xs text-left cursor-pointer"
                        title="Buka tautan di browser"
                      >
                        ({link.url})
                      </button>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={() => handleStartEditLink(link)}
                        className="p-1 text-zinc-400 hover:text-blue-500 rounded transition"
                        title="Edit tautan ini"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveLink(link.id)}
                        className="p-1 text-zinc-400 hover:text-red-500 rounded transition"
                        title="Hapus tautan ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Form Input / Edit Tautan */}
            <div
              className={`p-3 rounded-xl border transition ${
                editingLinkId
                  ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/80 ring-1 ring-amber-400/50'
                  : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700/80'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Globe className={`w-3.5 h-3.5 ${editingLinkId ? 'text-amber-600' : 'text-blue-500'}`} />
                  {editingLinkId ? 'Ubah / Edit Tautan Terpilih' : 'Tambah Tautan / Bookmark Baru'}
                </span>
                {editingLinkId && (
                  <span className="text-[10px] bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-medium">
                    Mode Edit Tautan
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2.5">
                <div>
                  <input
                    type="text"
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                    placeholder="Judul tautan (cth: Swagger API / Confluence)"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <input
                    type="url"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    placeholder="https://docs.internal/api"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Action buttons: left-aligned to completely decouple from bottom right 'Simpan Materi' */}
              <div className="flex items-center justify-start gap-2">
                {editingLinkId ? (
                  <>
                    <button
                      type="button"
                      onClick={handleSaveEditedLink}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center gap-1.5 shadow-sm transition"
                    >
                      <Check className="w-3.5 h-3.5" /> Simpan Perubahan Tautan
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEditLink}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition"
                    >
                      Batal Edit
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleAddLink}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 inline-flex items-center gap-1.5 shadow-sm transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Tambah ke Daftar URL
                  </button>
                )}
              </div>
            </div>
          </div>
          </div>

          {/* Pinned Sticky Footer Buttons */}
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/95 shrink-0 shadow-xs z-10">
            {material && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Yakin ingin menghapus materi vault ini?')) {
                    onDelete(material.id)
                    onClose()
                  }
                }}
                className="text-xs text-red-600 hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Hapus Vault
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
                className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow transition"
              >
                Simpan Materi
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
