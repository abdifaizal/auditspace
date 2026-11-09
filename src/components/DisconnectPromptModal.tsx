import React from 'react'
import {
  AlertTriangle,
  HardDriveDownload,
  RefreshCw,
  LogOut,
  Edit3,
  Loader2,
  Clock,
} from 'lucide-react'

interface DisconnectPromptModalProps {
  isOpen: boolean
  roomCode: string
  workspaceName: string
  reason?: string | null
  isReconnecting?: boolean
  offlineDraftCount?: number
  onContinueDraft: () => void
  onSaveAsLocal: () => void
  onReconnect: () => void
  onDiscardAndLeave: () => void
}

export const DisconnectPromptModal: React.FC<DisconnectPromptModalProps> = ({
  isOpen,
  roomCode,
  workspaceName,
  reason,
  isReconnecting = false,
  offlineDraftCount = 0,
  onContinueDraft,
  onSaveAsLocal,
  onReconnect,
  onDiscardAndLeave,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-amber-300 dark:border-amber-800/80 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header with warning banner */}
        <div className="px-6 py-4 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Koneksi ke Ruang Host Terputus
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-extrabold text-[9px] uppercase tracking-wider">
                Mode Draft Aktif
              </span>
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-400/90 mt-0.5">
              Kode Ruang: <strong>{roomCode}</strong> • {workspaceName}
            </p>
          </div>
        </div>

        {/* Body content */}
        <div className="p-6 space-y-4 text-xs text-zinc-700 dark:text-zinc-300">
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 leading-relaxed text-zinc-600 dark:text-zinc-300">
            <div className="flex items-center justify-between font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Pencatatan Waktu Terkalibrasi (GMT+7 / WIB)</span>
              </span>
              {offlineDraftCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold border border-amber-300">
                  {offlineDraftCount} Draft Belum Terkirim
                </span>
              )}
            </div>
            {reason ||
              'Laptop Host mungkin sleep, ditutup, atau koneksi terputus. Anda dapat tetap mengetik dalam Mode Draft, dan menyinkronkannya (Re-sync) saat Host kembali terhubung.'}
          </div>

          <div className="space-y-3 pt-1">
            <label className="block text-[11px] font-bold uppercase text-zinc-400">
              Pilih tindakan yang ingin dilakukan:
            </label>

            {/* OPTION 1: CONTINUE IN OFFLINE DRAFT MODE */}
            <button
              onClick={onContinueDraft}
              className="w-full p-3.5 rounded-xl border-2 border-amber-500 bg-amber-50/60 dark:bg-amber-950/30 hover:bg-amber-100/70 dark:hover:bg-amber-950/50 text-left transition group"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 font-bold text-xs text-amber-900 dark:text-amber-200">
                  <Edit3 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Lanjutkan Mengetik di Mode Draft (Offline)</span>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-600 text-white rounded-full uppercase tracking-wider">
                  Bisa Ngetik Bebas
                </span>
              </div>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed pl-6">
                Anda tetap dapat mengedit catatan, menambah agenda, dan checklist. Perubahan dicatat secara lokal dan dapat di-resync saat Host online kembali.
              </p>
            </button>

            {/* OPTION 2: RECONNECT & RESYNC */}
            <button
              onClick={onReconnect}
              disabled={isReconnecting}
              className="w-full p-3.5 rounded-xl border border-blue-300 dark:border-blue-800/80 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100/60 dark:hover:bg-blue-950/50 text-left transition disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 font-bold text-xs text-blue-700 dark:text-blue-300">
                  {isReconnecting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  ) : (
                    <RefreshCw className="w-4 h-4 text-blue-500" />
                  )}
                  <span>
                    {isReconnecting
                      ? 'Sedang Menyambung & Menyatukan Draft...'
                      : 'Sambung Ulang & Re-sync ke Host'}
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                  Smart Merge
                </span>
              </div>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed pl-6">
                Hubungkan kembali ke ruang {roomCode} dan gabungkan seluruh draft Anda secara aman ke ruang Host (tanpa menghapus pekerjaan Host).
              </p>
            </button>

            {/* OPTION 3: SAVE AS LOCAL PERMANENT SPACE */}
            <button
              onClick={onSaveAsLocal}
              disabled={isReconnecting}
              className="w-full p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-100/50 text-left transition disabled:opacity-50"
            >
              <div className="flex items-center gap-2 font-bold text-xs text-emerald-800 dark:text-emerald-300 mb-1">
                <HardDriveDownload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Simpan sebagai Space Mandiri (Lokal)</span>
              </div>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed pl-6">
                Salin seluruh hasil diskusi dan draft saat ini menjadi ruang kerja lokal permanen milik Anda sendiri.
              </p>
            </button>

            {/* OPTION 4: DISCARD & LEAVE */}
            <button
              onClick={onDiscardAndLeave}
              disabled={isReconnecting}
              className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-red-50 dark:hover:bg-red-950/20 text-left transition group disabled:opacity-50"
            >
              <div className="flex items-center gap-2 font-semibold text-xs text-zinc-500 group-hover:text-red-600 transition">
                <LogOut className="w-3.5 h-3.5 text-zinc-400 group-hover:text-red-500" />
                <span>Tinggalkan Ruang & Kembali ke Space Saya</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
