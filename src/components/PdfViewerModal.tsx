import React from 'react'
import { Attachment } from '../types'
import { X, Download, FileText } from 'lucide-react'
import { formatBytes, downloadAttachment } from '../services/storage'

interface PdfViewerModalProps {
  attachment: Attachment | null
  onClose: () => void
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ attachment, onClose }) => {
  if (!attachment) return null

  const isPdf = attachment.type.includes('pdf') || attachment.name.endsWith('.pdf')
  const isImage = attachment.type.includes('image') || /\.(png|jpe?g|webp|gif|svg)$/i.test(attachment.name)

  const handleDownload = () => {
    downloadAttachment(attachment)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-4xl h-[85vh] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-md">
                {attachment.name}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {formatBytes(attachment.size)} • Diunggah {new Date(attachment.uploadedAt).toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
              title={`Unduh ${attachment.name}`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Berkas</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 w-full h-full bg-zinc-100 dark:bg-zinc-950 p-2 overflow-auto flex items-center justify-center">
          {isPdf ? (
            <iframe
              src={attachment.dataUrl}
              className="w-full h-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white"
              title={attachment.name}
            />
          ) : isImage ? (
            <div className="max-w-full max-h-full p-4 flex items-center justify-center">
              <img
                src={attachment.dataUrl}
                alt={attachment.name}
                className="max-h-[70vh] object-contain rounded-lg shadow-md border border-zinc-200 dark:border-zinc-800"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 text-center p-8">
              <FileText className="w-16 h-16 text-zinc-400" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  Pratinjau langsung tidak tersedia untuk format ini
                </p>
                <p className="text-xs text-zinc-500">
                  Format berkas: {attachment.type || 'Dokumen'}. Silakan unduh untuk membuka di aplikasi lokal.
                </p>
              </div>
              <button
                onClick={handleDownload}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow"
              >
                <Download className="w-4 h-4" />
                Unduh Berkas Sekarang ({attachment.name})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
