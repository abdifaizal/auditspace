import React, { useState } from 'react'
import { MeetingCard, Attachment } from '../types'
import {
  X,
  FileText,
  FileSpreadsheet,
  File,
  Calendar,
  Clock,
  Building,
  Copy,
  Check,
  Edit3,
  Save,
  CheckSquare,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ListTodo,
  Paperclip,
  Share2,
} from 'lucide-react'
import { formatBytes, formatDateString } from '../services/storage'

interface MeetingReaderModalProps {
  meeting: MeetingCard | null
  isOpen: boolean
  onClose: () => void
  onEditMeeting?: (meeting: MeetingCard) => void
  onSaveMeeting?: (updated: MeetingCard) => void
  onPreviewPdf: (att: Attachment) => void
}

export const MeetingReaderModal: React.FC<MeetingReaderModalProps> = ({
  meeting,
  isOpen,
  onClose,
  onEditMeeting,
  onSaveMeeting,
  onPreviewPdf,
}) => {
  if (!isOpen || !meeting) return null

  const [isEditing, setIsEditing] = useState(false)
  const [editedTranscript, setEditedTranscript] = useState(meeting.transcript || '')
  const [copied, setCopied] = useState(false)
  const [fontSizeLevel, setFontSizeLevel] = useState<number>(1) // 0: 12px, 1: 13px (Fokus/Default), 2: 14px, 3: 16px
  const [isFullWidth, setIsFullWidth] = useState(false) // Toggle between max-w-3xl (fokus) and full width

  const fontSizeLevels = [
    { label: '12px', bodyClass: 'text-xs leading-normal' },
    { label: '13px (Fokus)', bodyClass: 'text-[13px] leading-relaxed' },
    { label: '14px', bodyClass: 'text-sm leading-relaxed' },
    { label: '16px', bodyClass: 'text-base leading-normal' },
  ]

  const handleCopyTranscript = () => {
    const textToCopy = isEditing ? editedTranscript : meeting.transcript
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSaveEdit = () => {
    if (onSaveMeeting) {
      onSaveMeeting({
        ...meeting,
        transcript: editedTranscript.trim(),
      })
    }
    setIsEditing(false)
  }

  // Helper parser for formatted reading mode
  const renderFormattedLine = (line: string, idx: number) => {
    const trimmed = line.trim()
    if (!trimmed) {
      return <div key={idx} className="h-1.5" />
    }

    // Horizontal divider
    if (/^[-*_]{3,}$/.test(trimmed)) {
      return <hr key={idx} className="my-2.5 border-zinc-200 dark:border-zinc-800" />
    }

    // Detect indentation level (spaces or tabs before text)
    const leadingSpaces = line.match(/^(\s*)/)?.[1].length || 0
    const isNested = leadingSpaces >= 2

    // Inline bold formatting (**bold**)
    const formatInline = (text: string) => {
      const parts = text.split(/(\*\*.*?\*\*)/g)
      return parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} className="font-semibold text-zinc-900 dark:text-zinc-50">
              {part.slice(2, -2)}
            </strong>
          )
        }
        return part
      })
    }

    // Numbered list: "1. ", "1) ", "(1) " -> Clean section header
    const numberMatch = trimmed.match(/^(\d+[\.\)]|\(\d+\))\s+(.*)$/)
    if (numberMatch) {
      return (
        <div
          key={idx}
          className={`flex items-start gap-2 pt-2.5 pb-0.5 mt-1 border-t first:border-t-0 border-zinc-100 dark:border-zinc-800/80 ${
            isNested ? 'ml-5 pl-2' : ''
          }`}
        >
          <span className="font-bold text-blue-600 dark:text-blue-400 shrink-0 select-none min-w-[20px]">
            {numberMatch[1]}
          </span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100 flex-1 leading-snug">
            {formatInline(numberMatch[2])}
          </span>
        </div>
      )
    }

    // Bullet list: "- ", "* ", "• "
    const bulletMatch = trimmed.match(/^[-*•]\s+(.*)$/)
    if (bulletMatch) {
      return (
        <div
          key={idx}
          className={`flex items-start gap-2 py-0.5 ${
            isNested ? 'ml-5 pl-2 text-zinc-700 dark:text-zinc-300' : 'text-zinc-800 dark:text-zinc-200'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500/80 shrink-0 mt-1.5 select-none" />
          <span className="flex-1 leading-normal">
            {formatInline(bulletMatch[1])}
          </span>
        </div>
      )
    }

    // Checkbox: "[ ] " or "[x] "
    const checkMatch = trimmed.match(/^\[([ xX])\]\s+(.*)$/)
    if (checkMatch) {
      const isChecked = checkMatch[1].toLowerCase() === 'x'
      return (
        <div key={idx} className={`flex items-start gap-2 py-0.5 ${isNested ? 'ml-5 pl-2' : ''}`}>
          <span
            className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
              isChecked
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'border-zinc-300 dark:border-zinc-600'
            }`}
          >
            {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
          </span>
          <span
            className={`flex-1 leading-normal ${
              isChecked
                ? 'line-through text-zinc-400 dark:text-zinc-500'
                : 'text-zinc-800 dark:text-zinc-200'
            }`}
          >
            {formatInline(checkMatch[2])}
          </span>
        </div>
      )
    }

    // Headings: "### ", "## ", "# "
    if (trimmed.startsWith('#')) {
      const level = trimmed.match(/^#+/)?.[0].length || 1
      const text = trimmed.replace(/^#+\s*/, '')
      if (level === 1) {
        return (
          <h3
            key={idx}
            className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-3 mb-1 border-b border-zinc-200 dark:border-zinc-800 pb-1"
          >
            {formatInline(text)}
          </h3>
        )
      }
      return (
        <h4
          key={idx}
          className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-2.5 mb-1"
        >
          {formatInline(text)}
        </h4>
      )
    }

    // Standard paragraph or colon-ended subhead
    const isSubhead = trimmed.endsWith(':') && trimmed.length < 80
    if (isSubhead) {
      return (
        <p
          key={idx}
          className={`font-semibold text-zinc-900 dark:text-zinc-100 mt-2 mb-0.5 ${
            isNested ? 'ml-5 pl-2' : ''
          }`}
        >
          {formatInline(trimmed)}
        </p>
      )
    }

    return (
      <p
        key={idx}
        className={`text-zinc-800 dark:text-zinc-200 py-0.5 leading-normal ${
          isNested ? 'ml-5 pl-2 text-zinc-700 dark:text-zinc-300' : ''
        }`}
      >
        {formatInline(trimmed)}
      </p>
    )
  }

  const attachments =
    meeting.attachments && meeting.attachments.length > 0
      ? meeting.attachments
      : meeting.pdfInvite
      ? [meeting.pdfInvite]
      : []

  const wordsCount = (isEditing ? editedTranscript : meeting.transcript)
    ? (isEditing ? editedTranscript : meeting.transcript).trim().split(/\s+/).filter(Boolean).length
    : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-5xl h-[88vh] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/70 gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                  {meeting.title}
                </h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                  {meeting.auditeeUnit || 'Tim Auditee'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  {formatDateString(meeting.date)}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  {meeting.time} WIB
                </span>
                <span>•</span>
                <span>{wordsCount} kata</span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Font Zoom & Focus Width Controls */}
            {!isEditing && (
              <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 border border-zinc-200 dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => setFontSizeLevel((prev) => Math.max(0, prev - 1))}
                  disabled={fontSizeLevel === 0}
                  className="px-2 py-1 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 rounded disabled:opacity-30 transition"
                  title="Perkecil Ukuran Teks (A-)"
                >
                  A-
                </button>
                <span className="px-1.5 text-[11px] font-medium text-zinc-500 select-none">
                  {fontSizeLevels[fontSizeLevel].label}
                </span>
                <button
                  type="button"
                  onClick={() => setFontSizeLevel((prev) => Math.min(3, prev + 1))}
                  disabled={fontSizeLevel === 3}
                  className="px-2 py-1 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 rounded disabled:opacity-30 transition"
                  title="Perbesar Ukuran Teks (A+)"
                >
                  A+
                </button>
                <div className="w-[1px] h-3 bg-zinc-300 dark:bg-zinc-700 mx-1" />
                <button
                  type="button"
                  onClick={() => setIsFullWidth(!isFullWidth)}
                  className={`p-1 rounded text-xs transition ${
                    isFullWidth
                      ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-white dark:hover:bg-zinc-700'
                  }`}
                  title={isFullWidth ? 'Beralih ke Lebar Fokus Dokumen (Rekomendasi)' : 'Beralih ke Layar Penuh'}
                >
                  {isFullWidth ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopyTranscript}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
                copied
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-300 dark:border-emerald-800'
                  : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-750'
              }`}
              title="Salin isi transkrip ke clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Transkrip</span>
                </>
              )}
            </button>

            {/* Toggle Edit / Read */}
            {isEditing ? (
              <button
                type="button"
                onClick={handleSaveEdit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Perubahan</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEditedTranscript(meeting.transcript || '')
                  setIsEditing(true)
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
                title="Edit transkrip langsung di sini"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Teks</span>
              </button>
            )}

            {/* Edit Full Agenda in MeetingModal */}
            {onEditMeeting && !isEditing && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onEditMeeting(meeting)
                }}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-750 transition"
                title="Buka form edit agenda lengkap"
              >
                <span>Edit Agenda</span>
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition ml-1"
              title="Tutup (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Main Transcript Pane */}
          <div className="flex-1 p-6 overflow-y-auto bg-white dark:bg-zinc-900">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-500" />
                Rangkuman / Transkrip Hasil Diskusi
              </span>
              {isEditing && (
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200/50">
                  Mode Edit Langsung
                </span>
              )}
            </div>

            {isEditing ? (
              <div className={`space-y-3 h-[calc(100%-40px)] flex flex-col ${isFullWidth ? 'w-full' : 'max-w-3xl mx-auto'}`}>
                <textarea
                  value={editedTranscript}
                  onChange={(e) => setEditedTranscript(e.target.value)}
                  placeholder="Ketik atau tempel transkrip diskusi di sini..."
                  className="flex-1 w-full p-4 text-[13px] font-sans bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100 resize-none leading-relaxed"
                />
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>Mendukung teks biasa, baris penomoran (1.), bullet (-), dan bold (**teks**).</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      className="px-3 py-1 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
                    >
                      Simpan
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`${isFullWidth ? 'w-full' : 'max-w-3xl mx-auto'} transition-all duration-150`}>
                <div className={`space-y-0.5 font-sans ${fontSizeLevels[fontSizeLevel].bodyClass}`}>
                  {meeting.transcript ? (
                    meeting.transcript
                      .split('\n')
                      .map((line, idx) => renderFormattedLine(line, idx))
                  ) : (
                    <div className="p-8 text-center text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl my-4">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm font-medium">Belum ada transkrip atau ringkasan hasil diskusi.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setEditedTranscript('')
                          setIsEditing(true)
                        }}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Tulis Transkrip Sekarang</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Side Context Pane: Action Items & Attachments */}
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-5 overflow-y-auto space-y-5">
            {/* Action Items Panel */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                  <ListTodo className="w-4 h-4 text-emerald-500" />
                  Poin Tindak Lanjut ({meeting.actionPoints?.length || 0})
                </span>
              </div>

              {meeting.actionPoints && meeting.actionPoints.length > 0 ? (
                <div className="space-y-2">
                  {meeting.actionPoints.map((pt, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs flex items-start gap-2"
                    >
                      <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed">
                        {pt}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-400 italic bg-white dark:bg-zinc-800/50 p-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800">
                  Tidak ada poin tindak lanjut khusus.
                </p>
              )}
            </div>

            {/* Attachments Panel */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                  <Paperclip className="w-4 h-4 text-purple-500" />
                  Dokumen Terkait ({attachments.length})
                </span>
              </div>

              {attachments.length > 0 ? (
                <div className="space-y-2">
                  {attachments.map((att) => {
                    const name = att.name.toLowerCase()
                    const isXls =
                      name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')
                    const isTxt = name.endsWith('.txt') || name.endsWith('.log')

                    return (
                      <div
                        key={att.id}
                        className="p-2.5 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 truncate">
                          {isXls ? (
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : isTxt ? (
                            <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          ) : (
                            <File className="w-4 h-4 text-rose-600 shrink-0" />
                          )}
                          <div className="truncate">
                            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                              {att.name}
                            </p>
                            <p className="text-[10px] text-zinc-400">
                              {formatBytes(att.size)}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onPreviewPdf(att)}
                          className="px-2 py-1 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition shrink-0"
                        >
                          Buka
                        </button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-zinc-400 italic bg-white dark:bg-zinc-800/50 p-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800">
                  Tidak ada berkas lampiran.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between text-xs text-zinc-500">
          <span>
            Tekan <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono text-[10px]">Esc</kbd> untuk menutup jendela pembaca
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-medium hover:bg-zinc-300 dark:hover:bg-zinc-700 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
