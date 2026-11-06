import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  Download,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  ExternalLink,
  Key,
  Loader2,
  DownloadCloud,
} from 'lucide-react'
import { openExternalUrl, downloadAndInstallUpdate } from '../services/nativeSave'

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
const GITHUB_TOKEN_STORAGE_KEY = 'auditspace_github_token'

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

  const currentVersion = '1.0.13'
  const [status, setStatus] = useState<
    'idle' | 'checking' | 'available' | 'not-available' | 'error'
  >('idle')
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isNoReleasesYet, setIsNoReleasesYet] = useState(false)

  // In-app updater states
  const [isInAppUpdating, setIsInAppUpdating] = useState(false)
  const [inAppError, setInAppError] = useState<string | null>(null)
  const [isOpeningBrowser, setIsOpeningBrowser] = useState(false)

  // GitHub token for private repo
  const [githubToken, setGithubToken] = useState<string>(() => {
    return localStorage.getItem(GITHUB_TOKEN_STORAGE_KEY) || ''
  })
  const [showTokenInput, setShowTokenInput] = useState(false)

  const handleSaveToken = (val: string) => {
    setGithubToken(val)
    localStorage.setItem(GITHUB_TOKEN_STORAGE_KEY, val.trim())
  }

  const cleanLatestVersion = (updateInfo?.version || '').replace(/^v+/, '')
  const computedFallbackUrl = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/download/v${cleanLatestVersion}/AuditSpace_${cleanLatestVersion}_x64-setup.exe`
  const directDownloadUrl =
    updateInfo?.downloadUrl && updateInfo.downloadUrl.toLowerCase().endsWith('.exe')
      ? updateInfo.downloadUrl
      : computedFallbackUrl

  // In-App Seamless Update: Downloads inside app and launches installer
  const handleInAppUpdate = async () => {
    setIsInAppUpdating(true)
    setInAppError(null)
    try {
      const filename = `AuditSpace_${cleanLatestVersion}_x64-setup.exe`
      await downloadAndInstallUpdate(directDownloadUrl, filename)
    } catch (err: any) {
      setIsInAppUpdating(false)
      setInAppError(err?.message || String(err))
    }
  }

  // Fallback: Open in Browser
  const handleBrowserDownload = async () => {
    setIsOpeningBrowser(true)
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
        let releaseNotes = `### Pembaruan AuditSpace v${rawVersion} Tersedia 🎉\nVersi terbaru telah dipublikasikan di repositori GitHub.`
        try {
          const changelogRes = await fetch(
            `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/main/CHANGELOG.md?_t=${Date.now()}`
          )
          if (changelogRes.ok) {
            const clText = await changelogRes.text()
            const match = clText.match(new RegExp(`##\\s*\\[?${rawVersion}\\]?[\\s\\S]*?(?=(##\\s*\\[|\\Z))`, 'i'))
            if (match && match[0]) {
              releaseNotes = match[0].trim()
            }
          }
        } catch {
          // fallback to default
        }

        setUpdateInfo({
          version: 'v' + rawVersion,
          releaseDate: new Date().toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
          releaseNotes,
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
    setIsInAppUpdating(false)
    setInAppError(null)

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
          const fallbackExe = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/download/${release.tag_name}/AuditSpace_${latestTag}_x64-setup.exe`
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
            downloadUrl: exeAsset?.browser_download_url || fallbackExe,
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
            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 space-y-3.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-sm font-bold text-blue-800 dark:text-blue-300 block">
                    🎉 Versi Baru Tersedia: v{cleanLatestVersion}
                  </span>
                  {updateInfo.releaseDate && (
                    <p className="text-[10px] text-zinc-500">Rilis: {updateInfo.releaseDate}</p>
                  )}
                </div>

                {/* In-App Direct Update Button */}
                <button
                  type="button"
                  onClick={handleInAppUpdate}
                  disabled={isInAppUpdating}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-md shadow-blue-500/20 transition flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-75 disabled:pointer-events-none"
                >
                  {isInAppUpdating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mengunduh & Memasang...</span>
                    </>
                  ) : (
                    <>
                      <DownloadCloud className="w-4 h-4" />
                      <span>Perbarui Otomatis (In-App)</span>
                    </>
                  )}
                </button>
              </div>

              {/* In-App Downloading Banner */}
              {isInAppUpdating && (
                <div className="p-3 rounded-xl bg-blue-100/80 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 font-medium">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Aplikasi sedang mengunduh pembaruan v{cleanLatestVersion} langsung di latar belakang...</span>
                  </div>
                  <div className="w-full bg-blue-200 dark:bg-blue-900 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 dark:bg-blue-400 h-full w-2/3 animate-pulse rounded-full" />
                  </div>
                  <p className="text-[10px] text-blue-700 dark:text-blue-300 opacity-90">
                    Setelah selesai, installer akan otomatis berjalan untuk menerapkan pembaruan tanpa perlu membuka browser.
                  </p>
                </div>
              )}

              {/* In-App Error */}
              {inAppError && (
                <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-[11px] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{inAppError}</span>
                </div>
              )}

              {/* Formatted Changelog */}
              {updateInfo.releaseNotes && (
                <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-800/90 border border-blue-100 dark:border-zinc-700 space-y-1 shadow-xs">
                  <p className="font-bold text-[10px] uppercase text-zinc-400 tracking-wider">
                    Catatan Perubahan:
                  </p>
                  <div
                    className="max-h-52 overflow-y-auto space-y-1 pr-1 text-zinc-700 dark:text-zinc-300"
                    dangerouslySetInnerHTML={{
                      __html: formatReleaseNotes(updateInfo.releaseNotes),
                    }}
                  />
                </div>
              )}

              {/* Browser Download Fallback Link */}
              <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-blue-100 dark:border-zinc-800">
                <span>Pilihan lain:</span>
                <button
                  type="button"
                  onClick={handleBrowserDownload}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
                >
                  <Download className="w-3 h-3" />
                  <span>{isOpeningBrowser ? 'Membuka Browser...' : 'Unduh manual via browser (.exe)'}</span>
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

          {/* Optional GitHub Token */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <button
              onClick={() => setShowTokenInput(!showTokenInput)}
              className="text-[11px] text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 flex items-center gap-1.5 transition"
            >
              <Key className="w-3 h-3 text-amber-500" />
              <span>Opsi Tambahan: Token Repository Private (Opsional)</span>
            </button>
            {showTokenInput && (
              <div className="mt-2.5 space-y-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 animate-in fade-in">
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  Jika repository diset ke status Private, masukkan Personal Access Token (PAT)
                  GitHub dengan scope <code>repo</code> untuk mengizinkan pengecekan rilis.
                </p>
                <input
                  type="password"
                  value={githubToken}
                  onChange={(e) => handleSaveToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/70 flex items-center justify-between text-[11px] text-zinc-500">
          <span>
            Lihat rilis di browser:{' '}
            <button
              type="button"
              onClick={() => openExternalUrl(`https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases`)}
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
            >
              <span>github.com/{GITHUB_OWNER}/{GITHUB_REPO}/releases</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
