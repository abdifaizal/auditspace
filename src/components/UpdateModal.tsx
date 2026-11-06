import React, { useState, useEffect } from 'react'
import {
  X,
  Sparkles,
  Download,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Loader2,
  RefreshCw,
  Key,
} from 'lucide-react'
import { openExternalUrl } from '../services/nativeSave'

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

const GITHUB_OWNER = 'abdifaizal'
const GITHUB_REPO = 'auditspace'
const GITHUB_TOKEN_STORAGE_KEY = 'auditspace_github_token_v1'

function formatReleaseNotes(notes: string): string {
  if (!notes) return '<p class="text-zinc-400 italic">Tidak ada catatan rilis.</p>'
  return notes
    .split('\n')
    .map((line) => {
      const trimmed = line.trim()
      if (!trimmed) return ''
      if (trimmed.startsWith('## ')) {
        return `<h4 class="font-bold text-xs text-blue-600 dark:text-blue-400 mt-2.5 mb-1">${trimmed.replace('## ', '')}</h4>`
      }
      if (trimmed.startsWith('### ')) {
        return `<h5 class="font-bold text-[11px] text-zinc-800 dark:text-zinc-200 mt-2 mb-1">${trimmed.replace('### ', '')}</h5>`
      }
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const content = trimmed
          .substring(2)
          .replace(/\*\*(.*?)\*\*/g, '<strong class="text-zinc-900 dark:text-zinc-100">$1</strong>')
          .replace(/`([^`]+)`/g, '<code class="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-[10px]">$1</code>')
        return `<li class="ml-4 list-disc text-zinc-600 dark:text-zinc-400 leading-relaxed text-[11px]">${content}</li>`
      }
      if (/^\d+\.\s/.test(trimmed)) {
        const content = trimmed
          .replace(/^\d+\.\s/, '')
          .replace(/\*\*(.*?)\*\*/g, '<strong class="text-zinc-900 dark:text-zinc-100">$1</strong>')
          .replace(/`([^`]+)`/g, '<code class="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-[10px]">$1</code>')
        return `<li class="ml-4 list-decimal text-zinc-700 dark:text-zinc-300 leading-relaxed text-[11px] font-medium mt-1.5">${content}</li>`
      }
      const formatted = trimmed
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-zinc-900 dark:text-zinc-100">$1</strong>')
        .replace(/`([^`]+)`/g, '<code class="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-[10px]">$1</code>')
      return `<p class="leading-relaxed text-[11px] my-1">${formatted}</p>`
    })
    .join('')
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  const currentVersion = '1.0.5'
  const [status, setStatus] = useState<
    'idle' | 'checking' | 'available' | 'not-available' | 'error'
  >('idle')
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isNoReleasesYet, setIsNoReleasesYet] = useState(false)

  // GitHub token for private repo
  const [githubToken, setGithubToken] = useState<string>(() => {
    return localStorage.getItem(GITHUB_TOKEN_STORAGE_KEY) || ''
  })
  const [showTokenInput, setShowTokenInput] = useState(false)
  const [isOpeningDownload, setIsOpeningDownload] = useState(false)

  const handleSaveToken = (val: string) => {
    setGithubToken(val)
    localStorage.setItem(GITHUB_TOKEN_STORAGE_KEY, val.trim())
  }

  const handleDownloadClick = async () => {
    setIsOpeningDownload(true)
    try {
      await openExternalUrl(directDownloadUrl)
    } catch (err) {
      alert('Gagal membuka link unduhan: ' + err)
    }
  }

  const checkViaRawFallback = async () => {
    try {
      const rawRes = await fetch(
        `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/package.json?_t=${Date.now()}`
      )
      if (!rawRes.ok) throw new Error('Raw fallback returned status ' + rawRes.status)
      const pkg = await rawRes.json()
      const rawVersion = (pkg.version || '').replace(/^v+/, '')
      const current = currentVersion.replace(/^v+/, '')

      if (rawVersion && rawVersion !== current) {
        setUpdateInfo({
          version: 'v' + rawVersion,
          releaseDate: new Date().toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
          releaseNotes: `### Pembaruan AuditSpace v${rawVersion} Tersedia 🎉\nVersi terbaru telah dipublikasikan di repositori GitHub. Anda dapat mengunduh installer .exe langsung di bawah ini.`,
          downloadUrl: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/download/v${rawVersion}/AuditSpace_${rawVersion}_x64-setup.exe`,
        })
        setStatus('available')
      } else {
        setStatus('not-available')
      }
    } catch {
      setErrorMessage(
        'Batas panggilan GitHub API tercapai (403 Rate Limit) atau koneksi terputus. Silakan klik tautan rilis di bawah untuk mengunduh di browser.'
      )
      setStatus('error')
    }
  }

  const handleCheckUpdates = () => {
    setStatus('checking')
    setErrorMessage(null)
    setIsNoReleasesYet(false)

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
        if (res.status === 403) {
          // GitHub API Rate Limit reached: automatically fall back to raw.githubusercontent.com
          return checkViaRawFallback()
        }
        if (!res.ok) {
          throw new Error(`GitHub API: ${res.status} ${res.statusText}`)
        }
        const release = await res.json()
        const latestTag = (release.tag_name || '').replace(/^v+/, '')
        const current = currentVersion.replace(/^v+/, '')

        if (latestTag && latestTag !== current) {
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
        console.warn('GitHub API check failed, trying raw CDN fallback:', err)
        checkViaRawFallback()
      })
  }

  // Auto-check once when opened
  useEffect(() => {
    handleCheckUpdates()
  }, [])

  const cleanLatestVersion = (updateInfo?.version || '').replace(/^v+/, '')
  const directDownloadUrl =
    updateInfo?.downloadUrl ||
    `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/tag/${updateInfo?.version || 'v1.0.5'}`

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
              disabled={status === 'checking'}
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
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-xs font-bold text-blue-800 dark:text-blue-300 block">
                    🎉 Versi Baru Tersedia: v{cleanLatestVersion}
                  </span>
                  {updateInfo.releaseDate && (
                    <p className="text-[10px] text-zinc-500">Rilis: {updateInfo.releaseDate}</p>
                  )}
                </div>

                {/* Direct Download Button */}
                <button
                  type="button"
                  onClick={handleDownloadClick}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isOpeningDownload ? 'Membuka Browser...' : 'Unduh Pembaruan (.exe)'}</span>
                </button>
              </div>

              {isOpeningDownload && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Browser Anda telah dibuka untuk mengunduh installer <strong>AuditSpace_{cleanLatestVersion}_x64-setup.exe</strong>. Silakan periksa jendela/tab download browser Anda.
                  </span>
                </div>
              )}

              {/* Formatted Changelog */}
              {updateInfo.releaseNotes && (
                <div className="p-3 rounded-xl bg-white dark:bg-zinc-800/90 border border-blue-100 dark:border-zinc-700 space-y-1">
                  <p className="font-bold text-[10px] uppercase text-zinc-400 tracking-wider">
                    Catatan Perubahan:
                  </p>
                  <div
                    className="max-h-48 overflow-y-auto space-y-1 pr-1 text-zinc-700 dark:text-zinc-300"
                    dangerouslySetInnerHTML={{
                      __html: formatReleaseNotes(updateInfo.releaseNotes),
                    }}
                  />
                </div>
              )}

              {/* Direct Link fallback */}
              <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
                <span>File installer:</span>
                <button
                  type="button"
                  onClick={handleDownloadClick}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 text-left"
                >
                  <span>AuditSpace_{cleanLatestVersion}_x64-setup.exe</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
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
            <button
              type="button"
              onClick={() => openExternalUrl(`https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases`)}
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer bg-transparent border-none p-0"
            >
              <span>github.com/{GITHUB_OWNER}/{GITHUB_REPO}/releases</span>
              <ExternalLink className="w-3 h-3" />
            </button>
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
