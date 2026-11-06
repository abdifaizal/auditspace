import React, { useState, useEffect } from 'react'
import {
  X,
  Radio,
  Users,
  Copy,
  Check,
  Shield,
  Eye,
  Edit3,
  Loader2,
  FileCode,
  Link,
  PowerOff,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { AuditWorkspace } from '../types'
import { p2pSync, CollabState, AccessMode } from '../services/p2pSync'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  workspace: AuditWorkspace
  onExportHtmlReport: () => void
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  workspace,
  onExportHtmlReport,
}) => {
  const [activeTab, setActiveTab] = useState<'host' | 'join'>('host')
  const [accessMode, setAccessMode] = useState<AccessMode>('read-only')
  const [customCodeInput, setCustomCodeInput] = useState('')
  const [joinCodeInput, setJoinCodeInput] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  const [collabState, setCollabState] = useState<CollabState>(p2pSync.getState())

  useEffect(() => {
    const unsub = p2pSync.subscribeState((st) => {
      setCollabState(st)
      if (st.isConnected) {
        setIsConnecting(false)
      }
    })
    return () => unsub()
  }, [])

  if (!isOpen) return null

  const handleStartHosting = async () => {
    setIsConnecting(true)
    try {
      await p2pSync.startHosting(workspace, accessMode, customCodeInput.trim() || undefined)
    } catch (err) {
      console.error('Failed to start hosting:', err)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleJoinRoom = async () => {
    if (!joinCodeInput.trim()) {
      alert('Masukkan kode ruang rekan terlebih dahulu!')
      return
    }
    setIsConnecting(true)
    try {
      await p2pSync.joinRoom(joinCodeInput.trim())
    } catch (err) {
      console.error('Failed to join room:', err)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleCopyCode = () => {
    if (collabState.roomId) {
      navigator.clipboard.writeText(collabState.roomId)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  const handleDisconnect = () => {
    p2pSync.disconnect()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Kolaborasi Langsung (P2P Live Share)
              </h3>
              <p className="text-xs text-zinc-500">
                Bagikan ruang kerja langsung ke sesama laptop AuditSpace
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
          {/* Active Connection Status Banner */}
          {collabState.isConnected && (
            <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span>
                    Sesi P2P Aktif ({collabState.role === 'host' ? 'Host Ruang' : 'Terkoneksi sebagai Rekan'})
                  </span>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-100/60 dark:hover:bg-red-950/40 rounded-lg transition flex items-center gap-1 border border-red-200 dark:border-red-900/40"
                >
                  <PowerOff className="w-3 h-3" />
                  <span>{collabState.role === 'peer' ? 'Keluar & Kembali ke Space Saya' : 'Putuskan Sesi'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900/40">
                <div>
                  <span className="text-[10px] uppercase text-zinc-400 font-bold block">
                    Kode Ruang Kolaborasi:
                  </span>
                  <span className="text-base font-extrabold tracking-wider text-blue-600 dark:text-blue-400">
                    {collabState.roomId}
                  </span>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 transition"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Tersalin!' : 'Salin Kode'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-500">
                <span>
                  Hak Akses Rekan: <strong>{collabState.accessMode === 'read-only' ? 'Peninjau (Read-Only)' : 'Editor (Read-Write)'}</strong>
                </span>
                <span>
                  Perangkat Terhubung: <strong>{collabState.connectedPeersCount}</strong>
                </span>
              </div>
            </div>
          )}

          {/* Error message */}
          {collabState.error && (
            <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">{collabState.error}</p>
            </div>
          )}

          {/* Not connected yet: Tab navigation */}
          {!collabState.isConnected && (
            <>
              <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                <button
                  onClick={() => setActiveTab('host')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                    activeTab === 'host'
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  Buka Sesi Berbagi (Host)
                </button>
                <button
                  onClick={() => setActiveTab('join')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                    activeTab === 'join'
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  Gabung ke Ruang Rekan (Join)
                </button>
              </div>

              {/* TAB 1: HOST */}
              {activeTab === 'host' && (
                <div className="space-y-4 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1.5">
                      Pilih Hak Akses Rekan:
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setAccessMode('read-only')}
                        className={`p-3 rounded-xl border text-left transition ${
                          accessMode === 'read-only'
                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20'
                            : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                          <Eye className="w-3.5 h-3.5 text-blue-500" />
                          <span>Peninjau (Read-Only)</span>
                        </div>
                        <p className="text-[10px] text-zinc-500 leading-relaxed">
                          Rekan hanya dapat melihat kanban & bukti, tidak dapat mengubah data.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAccessMode('read-write')}
                        className={`p-3 rounded-xl border text-left transition ${
                          accessMode === 'read-write'
                            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                            : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
                          <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Editor (Read-Write)</span>
                        </div>
                        <p className="text-[10px] text-zinc-500 leading-relaxed">
                          Rekan dapat mengedit, menambah, dan mencentang tugas secara real-time.
                        </p>
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleStartHosting}
                    disabled={isConnecting}
                    className="w-full py-2.5 px-4 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Membuka Ruang Kolaborasi...</span>
                      </>
                    ) : (
                      <>
                        <Radio className="w-4 h-4" />
                        <span>Mulai Sesi Kolaborasi & Buat Kode</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* TAB 2: JOIN */}
              {activeTab === 'join' && (
                <div className="space-y-4 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-zinc-500 mb-1">
                      Masukkan Kode Ruang Rekan:
                    </label>
                    <input
                      type="text"
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                      placeholder="Contoh: AUDIT-7842AB"
                      className="w-full px-3 py-2 text-sm font-mono tracking-wider bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
                    />
                    <p className="text-[10px] text-zinc-400 mt-1">
                      Minta kode 6 digit dari rekan Anda yang bertindak sebagai Host.
                    </p>
                  </div>

                  <button
                    onClick={handleJoinRoom}
                    disabled={isConnecting || !joinCodeInput.trim()}
                    className="w-full py-2.5 px-4 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Menyambungkan ke Laptop Rekan...</span>
                      </>
                    ) : (
                      <>
                        <Link className="w-4 h-4" />
                        <span>Sambungkan ke Ruang Rekan</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}

          {/* OPSI C SECTION: INSTANT STANDALONE HTML REPORT */}
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <div className="p-3.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/70 dark:border-purple-900/40 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 font-semibold text-xs text-purple-900 dark:text-purple-300">
                  <FileCode className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Opsi Alternatif: Dasbor Interaktif (.html)</span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  1 file HTML mandiri bisa dibuka di browser apa saja tanpa instalasi (100% Read-Only).
                </p>
              </div>

              <button
                onClick={() => {
                  onExportHtmlReport()
                  onClose()
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow transition shrink-0 ml-2"
              >
                Unduh .HTML
              </button>
            </div>
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
