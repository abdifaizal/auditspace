import React, { useState } from 'react'
import { X, AlertTriangle, Trash2, RotateCcw, ShieldAlert } from 'lucide-react'

interface ResetConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  currentSpaceName: string
  onResetCurrentSpace: () => void
  onFactoryResetAll: () => void
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onClose,
  currentSpaceName,
  onResetCurrentSpace,
  onFactoryResetAll,
}) => {
  if (!isOpen) return null

  const [confirmInput, setConfirmInput] = useState('')
  const [resetType, setResetType] = useState<'current' | 'all'>('current')

  const handleExecute = () => {
    if (resetType === 'current') {
      onResetCurrentSpace()
      onClose()
    } else {
      if (confirmInput.trim().toUpperCase() !== 'RESET') {
        alert('Silakan ketik kata "RESET" pada kotak konfirmasi untuk melanjutkan Reset Total.')
        return
      }
      onFactoryResetAll()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header Warning */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-red-100 dark:border-red-950/60 bg-red-50/60 dark:bg-red-950/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-red-900 dark:text-red-200">
                Peringatan: Reset Data Aplikasi
              </h3>
              <p className="text-xs text-red-700/80 dark:text-red-400/80">
                Tindakan ini akan mengosongkan atau menghapus data yang tersimpan.
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
          <p className="font-medium text-zinc-900 dark:text-zinc-100">
            Pilih jenis pembersihan yang ingin Anda lakukan:
          </p>

          {/* Option 1: Reset Current Space */}
          <div
            onClick={() => setResetType('current')}
            className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
              resetType === 'current'
                ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 ring-1 ring-blue-500'
                : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
            }`}
          >
            <RotateCcw className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                Kosongkan Space "{currentSpaceName}" Saja
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Hanya menghapus kartu, tugas, dan berkas di space aktif ini. Space audit lain yang Anda miliki tetap aman.
              </p>
            </div>
          </div>

          {/* Option 2: Factory Reset Total */}
          <div
            onClick={() => setResetType('all')}
            className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
              resetType === 'all'
                ? 'border-red-500 bg-red-50/40 dark:bg-red-950/30 ring-1 ring-red-500'
                : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
            }`}
          >
            <Trash2 className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-600 dark:text-red-400 text-xs">
                ⚠️ Reset Total dari 0 (Factory Reset Seluruh Aplikasi)
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Menghapus seluruh space, seluruh histori, dan seluruh database lokal. Aplikasi akan kembali 100% seperti baru diinstal pertama kali.
              </p>
            </div>
          </div>

          {/* Safety Confirm Input if Factory Reset selected */}
          {resetType === 'all' && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 space-y-2 animate-in fade-in">
              <label className="block text-[11px] font-semibold text-red-900 dark:text-red-300">
                Ketik kata <span className="font-mono font-bold uppercase underline">RESET</span> di bawah ini untuk konfirmasi:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="Ketik RESET"
                className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-white dark:bg-zinc-900 border border-red-300 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
          >
            Batal
          </button>

          <button
            onClick={handleExecute}
            className={`px-4 py-2 text-xs font-semibold rounded-xl text-white shadow transition flex items-center gap-1.5 ${
              resetType === 'all'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {resetType === 'all' ? (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eksekusi Reset Total</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Kosongkan Space Ini</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
