import React, { useState, useEffect } from 'react'
import {
  X,
  Sparkles,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  GitBranch,
  Loader2,
  RefreshCw,
} from 'lucide-react'

interface UpdateModalProps {
  isOpen: boolean
  onClose: () => void
}

interface UpdateInfo {
  version: string
  releaseDate?: string
  releaseNotes?: string
}

interface DownloadProgress {
  percent: number
  bytesPerSecond: number
  transferred: number
  total: number
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  const currentVersion = '1.0.0'
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'>('idle')
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [progress, setProgress] = useState<DownloadProgress | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const isElectron = Boolean((window as any).electronAPI?.isElectron)

  useEffect(() => {
    if (!isElectron) return

    const api = (window as any).electronAPI

    api.onUpdateAvailable((info: UpdateInfo) => {
      setUpdateInfo(info)
      setStatus('available')
    })

    api.onUpdateNotAvailable(() => {
      setStatus('not-available')
    })

    api.onDownloadProgress((prog: DownloadProgress) => {
      setProgress(prog)
      setStatus('downloading')
    })

    api.onUpdateDownloaded((info: UpdateInfo) => {
      setUpdateInfo(info)
      setStatus('downloaded')
    })

    api.onUpdateError((err: string) => {
      setErrorMessage(err)
      setStatus('error')
    })
  }, [isElectron])

  const handleCheckUpdates = () => {
    setStatus('checking')
    setErrorMessage(null)
    if (isElectron) {
      ;(window as any).electronAPI.checkForUpdates()
    } else {
      // Mock for browser view
      setTimeout(() => {
        setStatus('not-available')
      }, 1500)
    }
  }

  const handleDownloadUpdate = () => {
    setStatus('downloading')
    if (isElectron) {
      ;(window as any).electronAPI.downloadUpdate()
    }
  }

  const handleInstallAndRestart = () => {
    if (isElectron) {
      ;(window as any).electronAPI.quitAndInstall()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Pembaruan Aplikasi (Auto-Updater)
              </h3>
              <p className="text-xs text-zinc-500">
                Terhubung dengan GitHub Releases untuk pembaruan fitur rekan tim.
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

        {/* Content */}
        <div className="p-6 space-y-5 text-xs text-zinc-700 dark:text-zinc-300">
          {/* Current Version Box */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                Versi Saat Ini
              </span>
              <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                AuditSpace v{currentVersion}
              </span>
            </div>
            <button
              onClick={handleCheckUpdates}
              disabled={status === 'checking' || status === 'downloading'}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {status === 'checking' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Memeriksa...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Cek Pembaruan</span>
                </>
              )}
            </button>
          </div>

          {/* Status Responses */}
          {status === 'not-available' && (
            <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/20 flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              <div>
                <p className="font-semibold text-xs">Aplikasi Anda Sudah Versi Terbaru!</p>
                <p className="text-[11px] opacity-80">
                  Tidak ditemukan pembaruan baru di GitHub Releases saat ini.
                </p>
              </div>
            </div>
          )}

          {status === 'available' && updateInfo && (
            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-blue-800 dark:text-blue-300">
                    🎉 Versi Baru Tersedia: v{updateInfo.version}
                  </span>
                  {updateInfo.releaseDate && (
                    <p className="text-[10px] text-zinc-500">Rilis: {updateInfo.releaseDate}</p>
                  )}
                </div>
                <button
                  onClick={handleDownloadUpdate}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Pembaruan</span>
                </button>
              </div>

              {updateInfo.releaseNotes && (
                <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-blue-100 dark:border-zinc-700 text-[11px] text-zinc-700 dark:text-zinc-300">
                  <p className="font-semibold text-[10px] uppercase text-zinc-400 mb-1">
                    Catatan Perubahan:
                  </p>
                  <div dangerouslySetInnerHTML={{ __html: updateInfo.releaseNotes }} />
                </div>
              )}
            </div>
          )}

          {status === 'downloading' && (
            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-blue-800 dark:text-blue-300">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Sedang Mengunduh Pembaruan...
                </span>
                <span>{progress ? Math.round(progress.percent) : 0}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-blue-200 dark:bg-blue-900/60 overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-200"
                  style={{ width: `${progress ? progress.percent : 0}%` }}
                />
              </div>
              {progress && (
                <p className="text-[10px] text-zinc-500 text-right">
                  Kecepatan: {Math.round(progress.bytesPerSecond / 1024)} KB/s
                </p>
              )}
            </div>
          )}

          {status === 'downloaded' && (
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/20 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="font-semibold text-xs">Pembaruan Telah Berhasil Diunduh!</p>
                  <p className="text-[11px] opacity-80">
                    Klik tombol di bawah untuk memasang dan menjalankan versi baru seketika. Data audit Anda tetap aman.
                  </p>
                </div>
              </div>
              <button
                onClick={handleInstallAndRestart}
                className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow transition flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Mulai Ulang Aplikasi Sekarang</span>
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/20 flex items-start gap-2.5 text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-xs">Informasi Server Rilis</p>
                <p className="text-[11px] opacity-90 mt-0.5">
                  {errorMessage || 'Repository rilis GitHub belum dipublikasikan atau belum terhubung.'}
                </p>
              </div>
            </div>
          )}

          {/* Setup Guide for User & Colleagues */}
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/20 space-y-2 text-[11px] text-zinc-500">
            <p className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
              <GitBranch className="w-3.5 h-3.5" /> Cara Kerja Auto-Update untuk Rekan Kerja:
            </p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Anda mengunggah perubahan ke GitHub repository.</li>
              <li>Sistem CI/CD GitHub otomatis membuat versi baru (misal <code>v1.1.0</code>).</li>
              <li>Aplikasi di laptop rekan Anda otomatis mendeteksi dan memperbarui dirinya sendiri tanpa perlu mengirim file lagi!</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end bg-zinc-50/50 dark:bg-zinc-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
