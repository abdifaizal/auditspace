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
  Key,
} from 'lucide-react'

interface UpdateModalProps {
  isOpen: boolean
  onClose: () => void
}

interface UpdateInfo {
  version: string
  releaseDate?: string
  releaseNotes?: string
  downloadUrl?: string
}

interface DownloadProgress {
  percent: number
  bytesPerSecond: number
  transferred: number
  total: number
}

const GITHUB_OWNER = 'abdifaizal'
const GITHUB_REPO = 'auditspace'
const GITHUB_TOKEN_STORAGE_KEY = 'auditspace_github_token_v1'

export const UpdateModal: React.FC<UpdateModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  const currentVersion = '1.0.0'
  const [status, setStatus] = useState<
    'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'
  >('idle')
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [progress, setProgress] = useState<DownloadProgress | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isNoReleasesYet, setIsNoReleasesYet] = useState(false)

  // GitHub token for private repo
  const [githubToken, setGithubToken] = useState<string>(() => {
    return localStorage.getItem(GITHUB_TOKEN_STORAGE_KEY) || ''
  })
  const [showTokenInput, setShowTokenInput] = useState(false)

  const isElectron = Boolean((window as any).electronAPI?.isElectron)

  useEffect(() => {
    if (!isElectron) return

    const api = (window as any).electronAPI

    api.onUpdateAvailable((info: UpdateInfo) => {
      setUpdateInfo(info)
      setStatus('available')
      setIsNoReleasesYet(false)
    })

    api.onUpdateNotAvailable(() => {
      setStatus('not-available')
      setIsNoReleasesYet(false)
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
      const errStr = (err || '').toString()
      // If 404, it means repository exists but no releases have been published yet!
      if (errStr.includes('404') || errStr.toLowerCase().includes('cannot find') || errStr.toLowerCase().includes('no published versions')) {
        setIsNoReleasesYet(true)
        setStatus('not-available')
      } else {
        setErrorMessage(errStr)
        setStatus('error')
      }
    })
  }, [isElectron])

  const handleSaveToken = (val: string) => {
    setGithubToken(val)
    localStorage.setItem(GITHUB_TOKEN_STORAGE_KEY, val.trim())
  }

  const handleCheckUpdates = () => {
    setStatus('checking')
    setErrorMessage(null)
    setIsNoReleasesYet(false)

    if (isElectron) {
      ;(window as any).electronAPI.checkForUpdates(githubToken.trim() || undefined)
    } else {
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github.v3+json',
      }
      if (githubToken.trim()) {
        headers['Authorization'] = `Bearer ${githubToken.trim()}`
      }

      fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`, {
        headers,
      })
        .then(async (res) => {
          if (res.status === 404) {
            setIsNoReleasesYet(true)
            setStatus('not-available')
            return
          }
          if (!res.ok) {
            throw new Error(`GitHub API: ${res.status} ${res.statusText}`)
          }
          const release = await res.json()
          const tag = (release.tag_name || '').replace(/^v/, '')
          const current = currentVersion.replace(/^v/, '')

          if (tag && tag !== current) {
            const exeAsset = release.assets?.find((a: any) =>
              a.name?.toLowerCase().endsWith('.exe')
            )
            setUpdateInfo({
              version: release.tag_name,
              releaseDate: release.published_at
                ? new Date(release.published_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : undefined,
              releaseNotes: release.body || 'Tidak ada catatan rilis.',
              downloadUrl: exeAsset?.browser_download_url || release.html_url,
            })
            setStatus('available')
          } else {
            setStatus('not-available')
          }
        })
        .catch((err) => {
          setErrorMessage(err.message || 'Gagal memeriksa rilis dari GitHub.')
          setStatus('error')
        })
    }
  }

  const handleDownloadUpdate = () => {
    if (isElectron) {
      setStatus('downloading')
      ;(window as any).electronAPI.downloadUpdate()
    } else if (updateInfo?.downloadUrl) {
      window.open(updateInfo.downloadUrl, '_blank')
    } else {
      window.open(`https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases`, '_blank')
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
                Terhubung ke GitHub: <strong>{GITHUB_OWNER}/{GITHUB_REPO}</strong>
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
        <div className="p-6 space-y-4 text-xs text-zinc-700 dark:text-zinc-300">
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

          {/* Status: Up to date */}
          {status === 'not-available' && (
            <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/20 flex items-start gap-2.5 text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-semibold text-xs">
                  {isNoReleasesYet
                    ? 'Repository Terhubung (Belum Ada Rilis Baru)'
                    : 'Aplikasi Anda Sudah Versi Terbaru!'}
                </p>
                <p className="text-[11px] opacity-80 mt-0.5 leading-relaxed">
                  {isNoReleasesYet
                    ? `Repository '${GITHUB_OWNER}/${GITHUB_REPO}' berhasil dihubungi. Versi v${currentVersion} yang Anda gunakan adalah versi aktif.`
                    : `Tidak ada pembaruan versi baru di GitHub Releases saat ini. Versi ${currentVersion} sudah mutakhir.`}
                </p>
              </div>
            </div>
          )}

          {/* Status: Update Available */}
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

          {/* Status: Downloading */}
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

          {/* Status: Downloaded */}
          {status === 'downloaded' && (
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/20 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="font-semibold text-xs">Pembaruan Berhasil Diunduh!</p>
                  <p className="text-[11px] opacity-80">
                    Klik tombol di bawah untuk memasang dan menjalankan versi baru seketika. Seluruh data audit Anda tetap aman.
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

          {/* Status: Error */}
          {status === 'error' && (
            <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/20 flex items-start gap-2.5 text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-xs">Koneksi Server Rilis</p>
                <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">
                  {errorMessage || 'Tidak dapat terhubung ke GitHub Releases. Pastikan koneksi internet aktif.'}
                </p>
              </div>
            </div>
          )}

          {/* Private Repository Token Option (Collapsible) */}
          <div className="pt-1">
            <button
              onClick={() => setShowTokenInput(!showTokenInput)}
              className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1"
            >
              <Key className="w-3 h-3 text-amber-500" />
              <span>Opsi Tambahan: Token Repository Private (Opsional)</span>
            </button>

            {showTokenInput && (
              <div className="mt-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 space-y-2 animate-in fade-in">
                <label className="block text-[10px] uppercase font-bold text-zinc-500">
                  GitHub Personal Access Token (Hanya jika repository di-set Private):
                </label>
                <input
                  type="password"
                  value={githubToken}
                  onChange={(e) => handleSaveToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100"
                />
                <p className="text-[10px] text-zinc-400">
                  Jika repository Anda <strong>Public</strong>, biarkan kolom ini kosong.
                </p>
              </div>
            )}
          </div>

          {/* Link to GitHub Releases Page */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px]">
            <span className="text-zinc-400">Lihat rilis di browser:</span>
            <a
              href={`https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases`}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>github.com/{GITHUB_OWNER}/{GITHUB_REPO}/releases</span>
              <ExternalLink className="w-3 h-3" />
            </a>
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
