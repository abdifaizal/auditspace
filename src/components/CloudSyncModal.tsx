import React, { useState } from 'react'
import { AuditWorkspace } from '../types'
import {
  X,
  Cloud,
  CheckCircle2,
  HardDrive,
  Download,
  FolderSync,
  RefreshCw,
  ExternalLink,
} from 'lucide-react'
import { exportAuditPackage } from '../services/storage'

interface CloudSyncModalProps {
  workspace: AuditWorkspace
  isOpen: boolean
  onClose: () => void
  lastSavedTime: string
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  workspace,
  isOpen,
  onClose,
  lastSavedTime,
}) => {
  if (!isOpen) return null

  const [isBackingUp, setIsBackingUp] = useState(false)
  const [backupSuccess, setBackupSuccess] = useState<string | null>(null)

  const handleCloudBackup = async (provider: 'Google Drive' | 'OneDrive') => {
    setIsBackingUp(true)
    setBackupSuccess(null)
    try {
      await exportAuditPackage(workspace)
      setBackupSuccess(
        `File bundle "${workspace.projectMeta.name}.auditpkg" berhasil dibuat. Silakan simpan langsung ke folder sinkronisasi ${provider} Anda di laptop.`
      )
    } catch (err) {
      alert('Gagal membuat paket cadangan: ' + err)
    } finally {
      setIsBackingUp(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Pencadangan & Sinkronisasi Cloud Drive
              </h3>
              <p className="text-xs text-zinc-500">
                Sinkronkan berkas paket audit ke Google Drive & Microsoft OneDrive.
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
          {/* Status Autosave Lokal */}
          <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/20 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-semibold text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Status Autosave Lokal: AKTIF (Tersimpan Otomatis)</span>
            </div>
            <p className="text-[11px] text-emerald-900/80 dark:text-emerald-300/80 leading-relaxed">
              Setiap kali Anda menambah tugas, mengunggah PDF, atau mengedit catatan, sistem langsung menyimpannya secara otomatis ke penyimpanan lokal portable komputer Anda.
            </p>
            <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono pt-1">
              • Waktu simpan terakhir: <strong>{lastSavedTime || 'Baru saja'}</strong>
            </div>
          </div>

          {/* Cloud Sync Providers */}
          <div>
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-[11px] mb-2">
              Pilihan Sinkronisasi Cloud
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Google Drive Card */}
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                    <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold">
                      G
                    </div>
                    <span>Google Drive</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Simpan berkas paket <code>.auditpkg</code> langsung ke folder Google Drive lokal (misal: <code>G:\My Drive</code>). Google Drive akan otomatis mengunggahnya ke cloud secara real-time.
                  </p>
                </div>
                <button
                  onClick={() => handleCloudBackup('Google Drive')}
                  disabled={isBackingUp}
                  className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow transition flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Cadangkan ke GDrive</span>
                </button>
              </div>

              {/* OneDrive Card */}
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                    <div className="w-6 h-6 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center font-bold">
                      O
                    </div>
                    <span>Microsoft OneDrive</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Simpan berkas paket <code>.auditpkg</code> ke folder OneDrive Anda (misal: <code>C:\Users\...\OneDrive</code>). Microsoft Cloud akan membackup seluruh isi database dan PDF secara instan.
                  </p>
                </div>
                <button
                  onClick={() => handleCloudBackup('OneDrive')}
                  disabled={isBackingUp}
                  className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow transition flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Cadangkan ke OneDrive</span>
                </button>
              </div>
            </div>
          </div>

          {/* Feedback message */}
          {backupSuccess && (
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-800 dark:text-blue-300 text-xs">
              {backupSuccess}
            </div>
          )}

          {/* Panduan Cloud Mirroring */}
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/60 dark:bg-zinc-800/20 space-y-1 text-[11px] text-zinc-500">
            <p className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
              <FolderSync className="w-3.5 h-3.5 text-blue-500" /> Tips Sinkronisasi Otomatis Antar Perangkat:
            </p>
            <p>
              Karena aplikasi ini bersifat portable, Anda cukup menyimpan file <code>.auditpkg</code> di folder cloud drive yang sama. Di laptop mana pun Anda membuka aplikasi <code>AuditSpace.exe</code>, cukup klik <strong>"Import"</strong> dan pilih file dari Google Drive/OneDrive Anda!
            </p>
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
