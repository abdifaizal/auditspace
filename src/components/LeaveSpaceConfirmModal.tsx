import React from 'react'
import { HardDriveDownload, LogOut, AlertTriangle, X, ShieldAlert } from 'lucide-react'

interface LeaveSpaceConfirmModalProps {
  isOpen: boolean
  workspaceName: string
  offlineDraftCount?: number
  onClose: () => void // Cancels and stays in the space
  onSaveAsLocalAndLeave: () => void
  onDiscardAndLeave: () => void
}

export const LeaveSpaceConfirmModal: React.FC<LeaveSpaceConfirmModalProps> = ({
  isOpen,
  workspaceName,
  offlineDraftCount = 0,
  onClose,
  onSaveAsLocalAndLeave,
  onDiscardAndLeave,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Konfirmasi Keluar dari Ruang Bersama
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate max-w-xs sm:max-w-sm">
                Ruang aktif: <strong>{workspaceName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            title="Batal dan tetap di ruang ini"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs text-zinc-700 dark:text-zinc-300">
          {/* Draft warning if any */}
          {offlineDraftCount > 0 ? (
            <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-950 dark:text-amber-100 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs text-amber-900 dark:text-amber-200">
                  Perhatian: Terdapat {offlineDraftCount} Catatan Draft Offline
                </p>
                <p className="text-[11px] mt-1 text-amber-800 dark:text-amber-300/90 leading-relaxed">
                  Anda memiliki perubahan atau catatan yang dibuat saat terputus dari Host. Disarankan menyimpan salinan mandiri agar data tidak hilang.
                </p>
              </div>
            </div>
          ) : (
            <p className="leading-relaxed">
              Anda sedang membuka ruang kerja kolaborasi milik rekan Host. Sebelum kembali ke Space Lokal Anda, silakan tentukan apakah Anda ingin menyimpan salinan data ini di laptop Anda.
            </p>
          )}

          {/* Action Options Overview */}
          <div className="space-y-2.5">
            {/* Option 1: Save as Local */}
            <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20">
              <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300 text-xs">
                <HardDriveDownload className="w-4 h-4 text-emerald-600" />
                <span>Simpan sebagai Space Lokal Mandiri (Disarankan)</span>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400/90 mt-1 pl-6 leading-relaxed">
                Seluruh agenda, materi PDF, tugas, dan sticky note diduplikasi ke daftar Space pribadi laptop Anda. Anda dapat membuka dan mengeditnya kapan saja tanpa host.
              </p>
            </div>

            {/* Option 2: Discard */}
            <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30">
              <div className="flex items-center gap-2 font-bold text-zinc-800 dark:text-zinc-200 text-xs">
                <ShieldAlert className="w-4 h-4 text-zinc-500" />
                <span>Keluar Tanpa Menyimpan</span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 pl-6 leading-relaxed">
                Sesi ruang kolaborasi sementara ini akan dibersihkan dan Anda akan langsung kembali ke Space lokal Anda sebelumnya.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition order-3 sm:order-1 text-center"
          >
            Batal (Tetap di Ruang Ini)
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
            <button
              type="button"
              onClick={onDiscardAndLeave}
              className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold rounded-xl bg-red-100 dark:bg-red-950/50 hover:bg-red-200 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60 transition flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar Tanpa Simpan</span>
            </button>

            <button
              type="button"
              onClick={onSaveAsLocalAndLeave}
              className="w-full sm:w-auto px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition flex items-center justify-center gap-1.5"
            >
              <HardDriveDownload className="w-4 h-4" />
              <span>Simpan Salinan & Keluar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
