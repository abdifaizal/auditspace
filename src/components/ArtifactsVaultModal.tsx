import React, { useState } from 'react'
import { AuditWorkspace, Attachment } from '../types'
import {
  X,
  FileText,
  Download,
  Search,
  Filter,
  Eye,
  FolderArchive,
  Layers,
  Award,
  Archive,
} from 'lucide-react'
import { formatBytes, downloadAttachment } from '../services/storage'
import JSZip from 'jszip'

interface ArtifactsVaultModalProps {
  workspace: AuditWorkspace
  isOpen: boolean
  onClose: () => void
  onPreviewPdf: (att: Attachment) => void
}

interface VaultItem {
  id: string
  name: string
  type: string
  size: number
  uploadedAt: string
  category: 'invite' | 'material' | 'evidence'
  sourceTitle: string
  attachment: Attachment
}

export const ArtifactsVaultModal: React.FC<ArtifactsVaultModalProps> = ({
  workspace,
  isOpen,
  onClose,
  onPreviewPdf,
}) => {
  if (!isOpen) return null

  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'invite' | 'material' | 'evidence'>('all')
  const [isZipping, setIsZipping] = useState(false)

  // Collect all uploaded artifacts across the current active space
  const items: VaultItem[] = []

  // 1. From meetings (invites, attendance sheets, transcripts, etc.)
  workspace.meetings.forEach((m) => {
    const list = m.attachments && m.attachments.length > 0 ? m.attachments : (m.pdfInvite ? [m.pdfInvite] : [])
    list.forEach((att) => {
      items.push({
        id: att.id,
        name: att.name,
        type: att.type,
        size: att.size,
        uploadedAt: att.uploadedAt,
        category: 'invite',
        sourceTitle: m.title,
        attachment: att,
      })
    })
  })

  // 2. From materials
  workspace.materials.forEach((mat) => {
    mat.attachments.forEach((a) => {
      items.push({
        id: a.id,
        name: a.name,
        type: a.type,
        size: a.size,
        uploadedAt: a.uploadedAt,
        category: 'material',
        sourceTitle: mat.title,
        attachment: a,
      })
    })
  })

  // 3. From tasks (evidence)
  workspace.tasks.forEach((t) => {
    if (t.evidenceAttachment) {
      items.push({
        id: t.evidenceAttachment.id,
        name: t.evidenceAttachment.name,
        type: t.evidenceAttachment.type,
        size: t.evidenceAttachment.size,
        uploadedAt: t.evidenceAttachment.uploadedAt,
        category: 'evidence',
        sourceTitle: t.title,
        attachment: t.evidenceAttachment,
      })
    }
  })

  // Calculate total size
  const totalSizeBytes = items.reduce((acc, curr) => acc + curr.size, 0)

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sourceTitle.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const handleDownloadSingle = (att: Attachment) => {
    downloadAttachment(att)
  }

  const handleDownloadAllZip = async () => {
    if (items.length === 0) return
    setIsZipping(true)
    try {
      const zip = new JSZip()
      items.forEach((item) => {
        const parts = item.attachment.dataUrl.split(',')
        const base64 = parts.length > 1 ? parts[1] : parts[0]
        const folderName =
          item.category === 'invite'
            ? 'Undangan_Diskusi'
            : item.category === 'material'
            ? 'Materi_Auditee'
            : 'Bukti_Uji_Evidence'
        zip.folder(folderName)?.file(item.name, base64, { base64: true })
      })

      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Artifacts_${workspace.projectMeta.name.replace(/[^a-zA-Z0-9]/g, '_')}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Gagal membuat paket ZIP seluruh berkas: ' + err)
    } finally {
      setIsZipping(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-6 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Artifact & Evidence Vault (Koleksi Seluruh Berkas)
              </h3>
              <p className="text-xs text-zinc-500">
                Total {items.length} berkas terunggah ({formatBytes(totalSizeBytes)}) di space ini.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadAllZip}
              disabled={isZipping || items.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow transition disabled:opacity-50"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>{isZipping ? 'Mengompres...' : 'Unduh Semua (.ZIP)'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama berkas atau sumber..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                categoryFilter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              Semua ({items.length})
            </button>
            <button
              onClick={() => setCategoryFilter('invite')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                categoryFilter === 'invite'
                  ? 'bg-red-600 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              Undangan ({items.filter((i) => i.category === 'invite').length})
            </button>
            <button
              onClick={() => setCategoryFilter('material')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                categoryFilter === 'material'
                  ? 'bg-purple-600 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              Materi Auditee ({items.filter((i) => i.category === 'material').length})
            </button>
            <button
              onClick={() => setCategoryFilter('evidence')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                categoryFilter === 'evidence'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              Bukti Uji ({items.filter((i) => i.category === 'evidence').length})
            </button>
          </div>
        </div>

        {/* Files List Table */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredItems.length > 0 ? (
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="py-2.5 px-3">Nama Berkas</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3">Sumber Kartu Terkait</th>
                    <th className="py-2.5 px-3">Ukuran</th>
                    <th className="py-2.5 px-3">Waktu Unggah</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition"
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2 truncate max-w-xs">
                          <FileText
                            className={`w-4 h-4 shrink-0 ${
                              item.category === 'invite'
                                ? 'text-red-500'
                                : item.category === 'material'
                                ? 'text-purple-500'
                                : 'text-emerald-500'
                            }`}
                          />
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {item.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            item.category === 'invite'
                              ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                              : item.category === 'material'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                          }`}
                        >
                          {item.category === 'invite'
                            ? 'Undangan PDF'
                            : item.category === 'material'
                            ? 'Materi Auditee'
                            : 'Bukti Uji (Done)'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-400 truncate max-w-[200px]">
                        {item.sourceTitle}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-500 font-mono text-[11px]">
                        {formatBytes(item.size)}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-500 text-[11px] whitespace-nowrap">
                        {new Date(item.uploadedAt).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onPreviewPdf(item.attachment)}
                            className="p-1.5 text-zinc-500 hover:text-blue-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
                            title="Pratinjau / Preview"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDownloadSingle(item.attachment)}
                            className="p-1.5 text-zinc-500 hover:text-purple-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
                            title="Unduh Berkas Ini"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 space-y-2">
              <FolderArchive className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto" />
              <p className="text-xs text-zinc-500">
                Belum ada berkas lampiran yang cocok dengan kriteria pencarian.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
