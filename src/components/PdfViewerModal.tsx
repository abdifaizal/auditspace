import React, { useState, useEffect } from 'react'
import { Attachment } from '../types'
import { X, Download, FileText, FileSpreadsheet, Copy, Check, File } from 'lucide-react'
import { formatBytes, downloadAttachment } from '../services/storage'

interface PdfViewerModalProps {
  attachment: Attachment | null
  onClose: () => void
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ attachment, onClose }) => {
  if (!attachment) return null

  const isPdf = attachment.type.includes('pdf') || /\.pdf$/i.test(attachment.name)
  const isImage = attachment.type.includes('image') || /\.(png|jpe?g|webp|gif|svg)$/i.test(attachment.name)
  const isExcel =
    /\.(xlsx|xls|csv)$/i.test(attachment.name) ||
    attachment.type.includes('spreadsheet') ||
    attachment.type.includes('excel')
  const isText =
    attachment.type.startsWith('text/') ||
    /\.(txt|log|csv|md|json|xml)$/i.test(attachment.name)

  const [textContent, setTextContent] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isText && attachment.dataUrl) {
      try {
        const parts = attachment.dataUrl.split(',')
        if (parts.length > 1) {
          const binary = atob(parts[1])
          const bytes = new Uint8Array(binary.length)
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i)
          }
          const decoded = new TextDecoder('utf-8').decode(bytes)
          setTextContent(decoded)
        } else {
          setTextContent(attachment.dataUrl)
        }
      } catch (e) {
        setTextContent('Gagal memuat isi teks berkas: ' + e)
      }
    } else {
      setTextContent(null)
    }
  }, [attachment, isText])

  const handleDownload = () => {
    downloadAttachment(attachment)
  }

  const handleCopyText = () => {
    if (textContent) {
      navigator.clipboard.writeText(textContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-4xl h-[85vh] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center justify-center w-9 h-9 rounded-xl ${
                isPdf
                  ? 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400'
                  : isExcel
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                  : isText
                  ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {isExcel ? (
                <FileSpreadsheet className="w-5 h-5" />
              ) : isText ? (
                <FileText className="w-5 h-5" />
              ) : (
                <File className="w-5 h-5" />
              )}
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
            {isText && textContent && (
              <button
                onClick={handleCopyText}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                title="Salin isi teks ke clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
              </button>
            )}
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition border border-blue-200/60 dark:border-blue-900/50"
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
          ) : isText && textContent !== null ? (
            <div className="w-full h-full p-4 flex flex-col">
              <div className="flex-1 overflow-auto bg-zinc-900 text-zinc-100 p-4 rounded-xl font-mono text-xs leading-relaxed select-text shadow-inner border border-zinc-800 whitespace-pre-wrap break-words">
                {textContent}
              </div>
            </div>
          ) : isExcel ? (
            <div className="flex flex-col items-center justify-center gap-4 text-center p-8 max-w-md">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg border border-emerald-200 dark:border-emerald-800">
                <FileSpreadsheet className="w-9 h-9" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {attachment.name}
                </p>
                <p className="text-xs text-zinc-500">
                  Lembar Kerja / Daftar Hadir Excel ({formatBytes(attachment.size)})
                </p>
                <p className="text-[11px] text-zinc-400 mt-2">
                  Berkas Excel dapat diunduh untuk diedit atau ditinjau menggunakan Microsoft Excel, LibreOffice, atau Google Sheets.
                </p>
              </div>
              <button
                onClick={handleDownload}
                className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition shadow-md"
              >
                <Download className="w-4 h-4" />
                Unduh & Buka di Excel
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 text-center p-8">
              <File className="w-16 h-16 text-zinc-400" />
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
