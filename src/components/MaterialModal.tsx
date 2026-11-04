import React, { useState } from 'react'
import { MaterialVaultCard, Attachment, ExternalLink } from '../types'
import { X, Upload, FileText, Trash2, Plus, Globe, FolderArchive } from 'lucide-react'
import { fileToAttachment, formatBytes } from '../services/storage'

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
  const [isUploading, setIsUploading] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setIsUploading(true)
    try {
      const newAtts: Attachment[] = []
      for (let i = 0; i < files.length; i++) {
        const att = await fileToAttachment(files[i])
        newAtts.push(att)
      }
      setAttachments([...attachments, ...newAtts])
    } catch (err) {
      alert('Gagal mengunggah dokumen: ' + err)
    } finally {
      setIsUploading(false)
    }
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

  const handleRemoveLink = (id: string) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
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
              <label className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer transition">
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploading ? 'Memproses...' : 'Tambah Berkas'}</span>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {attachments.length > 0 ? (
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
            ) : (
              <div className="p-4 text-center border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-xs text-zinc-400">
                Belum ada dokumen yang dilampirkan. Klik "Tambah Berkas" untuk mengunggah.
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
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {link.title}
                      </span>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-zinc-500 hover:underline truncate max-w-xs"
                      >
                        ({link.url})
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(link.id)}
                      className="text-zinc-400 hover:text-red-500 shrink-0 ml-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newLinkTitle}
                onChange={(e) => setNewLinkTitle(e.target.value)}
                placeholder="Judul tautan (cth: Swagger API)"
                className="w-full sm:w-1/3 px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
              />
              <input
                type="url"
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                placeholder="https://docs.internal/api"
                className="flex-1 px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
              />
              <button
                type="button"
                onClick={handleAddLink}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-600 inline-flex items-center gap-1 justify-center shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah URL
              </button>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
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
