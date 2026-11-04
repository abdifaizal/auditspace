import React, { useRef, useState, useEffect } from 'react'
import {
  MeetingCard,
  MaterialVaultCard,
  TaskCard,
  StickyNote,
  Attachment,
  ConnectionLink,
} from '../types'
import {
  FileText,
  Calendar,
  Clock,
  Globe,
  CheckCircle2,
  AlertCircle,
  Plus,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  Move,
  Edit3,
  Wand2,
} from 'lucide-react'
import { formatBytes, formatDateString } from '../services/storage'

interface CanvasViewProps {
  meetings: MeetingCard[]
  materials: MaterialVaultCard[]
  tasks: TaskCard[]
  stickies: StickyNote[]
  connections: ConnectionLink[]
  onUpdateMeeting: (meeting: MeetingCard) => void
  onUpdateMaterial: (mat: MaterialVaultCard) => void
  onUpdateTask: (task: TaskCard) => void
  onUpdateSticky: (sticky: StickyNote) => void
  onEditMeeting: (meeting: MeetingCard) => void
  onEditMaterial: (mat: MaterialVaultCard) => void
  onEditTask: (task: TaskCard) => void
  onEditSticky: (sticky: StickyNote) => void
  onPreviewPdf: (att: Attachment) => void
  onAutoLayout: () => void
}

export const CanvasView: React.FC<CanvasViewProps> = ({
  meetings,
  materials,
  tasks,
  stickies,
  connections,
  onUpdateMeeting,
  onUpdateMaterial,
  onUpdateTask,
  onUpdateSticky,
  onEditMeeting,
  onEditMaterial,
  onEditTask,
  onEditSticky,
  onPreviewPdf,
  onAutoLayout,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  // Canvas Viewport State (Pan & Zoom)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 20, y: 20 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

  // Dragging cards
  const [draggingItem, setDraggingItem] = useState<{
    type: 'meeting' | 'material' | 'task' | 'sticky'
    id: string
    startX: number
    startY: number
    itemOrigX: number
    itemOrigY: number
  } | null>(null)

  // Handle Zoom with Mouse Wheel
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY < 0 ? 0.08 : -0.08
      setZoom((prev) => Math.min(Math.max(prev + delta, 0.4), 2.0))
    }
  }

  // Handle Pan Start
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only pan if clicking canvas background
    if (e.target === containerRef.current || (e.target as HTMLElement).id === 'canvas-board') {
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  // Handle Mouse Move (Pan or Card Drag)
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      })
      return
    }

    if (draggingItem) {
      const dx = (e.clientX - draggingItem.startX) / zoom
      const dy = (e.clientY - draggingItem.startY) / zoom
      const newX = Math.round(draggingItem.itemOrigX + dx)
      const newY = Math.round(draggingItem.itemOrigY + dy)

      if (draggingItem.type === 'meeting') {
        const item = meetings.find((m) => m.id === draggingItem.id)
        if (item) onUpdateMeeting({ ...item, x: newX, y: newY })
      } else if (draggingItem.type === 'material') {
        const item = materials.find((m) => m.id === draggingItem.id)
        if (item) onUpdateMaterial({ ...item, x: newX, y: newY })
      } else if (draggingItem.type === 'task') {
        const item = tasks.find((t) => t.id === draggingItem.id)
        if (item) onUpdateTask({ ...item, x: newX, y: newY })
      } else if (draggingItem.type === 'sticky') {
        const item = stickies.find((s) => s.id === draggingItem.id)
        if (item) onUpdateSticky({ ...item, x: newX, y: newY })
      }
    }
  }

  const handleMouseUp = () => {
    setIsPanning(false)
    setDraggingItem(null)
  }

  // Start dragging a specific card
  const startDragCard = (
    e: React.MouseEvent,
    type: 'meeting' | 'material' | 'task' | 'sticky',
    id: string,
    origX: number,
    origY: number
  ) => {
    e.stopPropagation()
    setDraggingItem({
      type,
      id,
      startX: e.clientX,
      startY: e.clientY,
      itemOrigX: origX,
      itemOrigY: origY,
    })
  }

  const resetView = () => {
    setZoom(1)
    setPan({ x: 40, y: 40 })
  }

  const fitView = () => {
    setZoom(0.85)
    setPan({ x: 20, y: 20 })
  }

  // Get item coordinate by ID for SVG line rendering
  const getItemCenter = (id: string): { x: number; y: number } | null => {
    const m = meetings.find((i) => i.id === id)
    if (m) return { x: m.x + 190, y: m.y + 120 }
    const mat = materials.find((i) => i.id === id)
    if (mat) return { x: mat.x + 200, y: mat.y + 140 }
    const t = tasks.find((i) => i.id === id)
    if (t) return { x: t.x + 180, y: t.y + 110 }
    return null
  }

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={`relative w-full h-[calc(100vh-4rem)] overflow-hidden canvas-grid ${
        isPanning ? 'cursor-grabbing' : 'cursor-default'
      }`}
    >
      {/* Zoom & Navigation Controls */}
      <div className="absolute bottom-6 right-6 z-20 flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 shadow-xl backdrop-blur-md">
        <button
          onClick={() => setZoom((z) => Math.min(z + 0.1, 2.0))}
          className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <span className="text-xs font-mono font-medium text-zinc-500 w-12 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.max(z - 0.1, 0.4))}
          className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-700" />
        <button
          onClick={resetView}
          className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
          title="Reset View 100%"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={fitView}
          className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
          title="Fit Overview"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-700" />
        <button
          onClick={onAutoLayout}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 font-medium text-xs transition"
          title="Tata Otomatis: Rapikan seluruh kartu ke kolom kategorinya masing-masing"
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>Tata Otomatis</span>
        </button>
      </div>

      {/* Canvas Transform Space */}
      <div
        id="canvas-board"
        className="w-full h-full transform-gpu origin-top-left"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          width: '5000px',
          height: '4000px',
        }}
      >
        {/* SVG Connection Lines */}
        <svg className="absolute inset-0 pointer-events-none w-full h-full overflow-visible">
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          {connections.map((c) => {
            const from = getItemCenter(c.fromId)
            const to = getItemCenter(c.toId)
            if (!from || !to) return null
            const midX = (from.x + to.x) / 2
            return (
              <path
                key={c.id}
                d={`M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`}
                fill="none"
                stroke="url(#lineGrad)"
                strokeWidth={2.5}
                strokeDasharray="5,5"
              />
            )
          })}
        </svg>

        {/* Category Lane Header Badges */}
        <div className="absolute top-8 left-[60px] pointer-events-none flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40 text-[11px] font-bold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span>Agenda & Diskusi ({meetings.length})</span>
        </div>

        <div className="absolute top-8 left-[480px] pointer-events-none flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100/70 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-900/40 text-[11px] font-bold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-purple-500" />
          <span>Materi & Dokumen ({materials.length})</span>
        </div>

        <div className="absolute top-8 left-[920px] pointer-events-none flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100/70 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40 text-[11px] font-bold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Tugas Aktif ({tasks.filter(t => t.status !== 'done').length})</span>
        </div>

        <div className="absolute top-8 left-[1320px] pointer-events-none flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40 text-[11px] font-bold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Selesai & Bukti Audit ({tasks.filter(t => t.status === 'done').length})</span>
        </div>

        <div className="absolute top-8 left-[1720px] pointer-events-none flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-200/70 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border border-zinc-300/60 dark:border-zinc-700 text-[11px] font-bold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Catatan Tempel ({stickies.length})</span>
        </div>

        {/* 1. MEETING CARDS */}
        {meetings.map((m) => (
          <div
            key={m.id}
            style={{ transform: `translate(${m.x}px, ${m.y}px)` }}
            className="absolute w-[380px] bg-white/95 dark:bg-zinc-900/95 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl shadow-xl shadow-zinc-200/40 dark:shadow-none backdrop-blur-md overflow-hidden transition-shadow hover:shadow-2xl group select-none"
          >
            {/* Card Drag Header */}
            <div
              onMouseDown={(e) => startDragCard(e, 'meeting', m.id, m.x, m.y)}
              className="flex items-center justify-between px-4 py-2.5 bg-blue-50/70 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/40 cursor-grab active:cursor-grabbing"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                  Agenda & Diskusi
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEditMeeting(m)}
                  className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md hover:bg-white/60 dark:hover:bg-zinc-800"
                  title="Edit Diskusi"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <Move className="w-3.5 h-3.5 text-zinc-400" />
              </div>
            </div>

            {/* Content Body */}
            <div className="p-4 space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                  {m.title}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{m.auditeeUnit}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {formatDateString(m.date)}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {m.time}
                  </span>
                </div>
              </div>

              {/* PDF Invite Pill */}
              {m.pdfInvite ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-200/80 dark:border-red-900/40">
                  <div className="flex items-center gap-2.5 truncate">
                    <FileText className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {m.pdfInvite.name}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        {formatBytes(m.pdfInvite.size)} • Undangan Diskusi
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onPreviewPdf(m.pdfInvite!)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 border border-zinc-200 dark:border-zinc-700 hover:bg-blue-50 dark:hover:bg-zinc-700 transition shrink-0"
                  >
                    Buka PDF
                  </button>
                </div>
              ) : (
                <div className="text-[11px] text-zinc-400 italic">Belum melampirkan PDF Undangan.</div>
              )}

              {/* Transcript Summary */}
              {m.transcript && (
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                  <p className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1 flex items-center gap-1">
                    <span>Ringkasan / Transkrip Hasil Wawancara:</span>
                  </p>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed max-h-32 overflow-y-auto">
                    {m.transcript}
                  </p>
                </div>
              )}

              {/* Action Points */}
              {m.actionPoints && m.actionPoints.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Tindak Lanjut ({m.actionPoints.length})
                  </p>
                  <div className="space-y-1">
                    {m.actionPoints.map((pt, i) => (
                      <div
                        key={i}
                        className="text-xs text-zinc-700 dark:text-zinc-300 flex items-start gap-1.5"
                      >
                        <ChevronRight className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* 2. MATERIAL VAULT CARDS */}
        {materials.map((mat) => (
          <div
            key={mat.id}
            style={{ transform: `translate(${mat.x}px, ${mat.y}px)` }}
            className="absolute w-[400px] bg-white/95 dark:bg-zinc-900/95 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl shadow-xl shadow-zinc-200/40 dark:shadow-none backdrop-blur-md overflow-hidden transition-shadow hover:shadow-2xl group select-none"
          >
            {/* Drag Header */}
            <div
              onMouseDown={(e) => startDragCard(e, 'material', mat.id, mat.x, mat.y)}
              className="flex items-center justify-between px-4 py-2.5 bg-purple-50/70 dark:bg-purple-950/30 border-b border-purple-100 dark:border-purple-900/40 cursor-grab active:cursor-grabbing"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                  Materi & Vault Auditee
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEditMaterial(mat)}
                  className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md hover:bg-white/60 dark:hover:bg-zinc-800"
                  title="Kelola Berkas & Link"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <Move className="w-3.5 h-3.5 text-zinc-400" />
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {mat.title}
                </h3>
                {mat.description && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {mat.description}
                  </p>
                )}
              </div>

              {/* Attachments */}
              {mat.attachments.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Dokumen Auditee ({mat.attachments.length})
                  </p>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {mat.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          <span className="text-zinc-800 dark:text-zinc-200 truncate">
                            {att.name}
                          </span>
                        </div>
                        <button
                          onClick={() => onPreviewPdf(att)}
                          className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline shrink-0 ml-2"
                        >
                          Lihat
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Links */}
              {mat.links.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Tautan Sistem & URL ({mat.links.length})
                  </p>
                  <div className="space-y-1.5">
                    {mat.links.map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-2 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100/60 dark:border-blue-900/30 hover:border-blue-300 transition text-xs group/link"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Globe className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="font-medium text-zinc-800 dark:text-zinc-200 group-hover/link:text-blue-600 truncate">
                            {link.title}
                          </span>
                        </div>
                        <ExternalLink className="w-3 h-3 text-zinc-400 shrink-0 ml-2" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* 3. TASK CARDS */}
        {tasks.map((t) => {
          const isDone = t.status === 'done'
          const isInProgress = t.status === 'in_progress'

          const priorityBadge = {
            low: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
            medium: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400',
            high: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400',
            critical: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400',
          }[t.priority]

          return (
            <div
              key={t.id}
              style={{ transform: `translate(${t.x}px, ${t.y}px)` }}
              className={`absolute w-[360px] bg-white/95 dark:bg-zinc-900/95 border rounded-2xl shadow-xl shadow-zinc-200/40 dark:shadow-none backdrop-blur-md overflow-hidden transition-shadow hover:shadow-2xl group select-none ${
                isDone
                  ? 'border-emerald-300 dark:border-emerald-900/60'
                  : 'border-zinc-200/90 dark:border-zinc-800'
              }`}
            >
              {/* Drag Header */}
              <div
                onMouseDown={(e) => startDragCard(e, 'task', t.id, t.x, t.y)}
                className={`flex items-center justify-between px-4 py-2.5 border-b cursor-grab active:cursor-grabbing ${
                  isDone
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40'
                    : isInProgress
                    ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40'
                    : 'bg-zinc-50/70 dark:bg-zinc-800/40 border-zinc-100 dark:border-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isDone
                        ? 'bg-emerald-600 text-white'
                        : isInProgress
                        ? 'bg-amber-500 text-white'
                        : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {isDone ? '✔ Selesai' : isInProgress ? 'In Progress' : 'To Do'}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${priorityBadge}`}>
                    {t.priority.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditTask(t)}
                    className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md hover:bg-white/60 dark:hover:bg-zinc-800"
                    title="Edit Tugas"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <Move className="w-3.5 h-3.5 text-zinc-400" />
                </div>
              </div>

              {/* Task Body */}
              <div className="p-4 space-y-2.5">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                  {t.title}
                </h3>
                {t.description && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {t.description}
                  </p>
                )}

                {/* Timeline & PIC */}
                <div className="pt-1 flex flex-col gap-1 text-xs text-zinc-600 dark:text-zinc-400">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400 font-medium">Timeline:</span>
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      {formatDateString(t.startDate)} - {formatDateString(t.dueDate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400 font-medium">PIC:</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{t.pic}</span>
                  </div>
                </div>

                {/* COMPLETED TASK AUDIT TRAIL & EVIDENCE ATTACHMENT */}
                {isDone && (
                  <div className="pt-2 border-t border-emerald-100 dark:border-emerald-900/40 space-y-2">
                    <div className="p-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 text-[11px] text-emerald-800 dark:text-emerald-300">
                      <p>
                        ✔ Diselesaikan oleh:{' '}
                        <strong className="font-semibold">{t.completedBy || t.pic}</strong>
                      </p>
                      {t.completedAt && (
                        <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
                          Pada: {new Date(t.completedAt).toLocaleString('id-ID')}
                        </p>
                      )}
                    </div>

                    {/* Attached Evidence */}
                    {t.evidenceAttachment && (
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-800 border border-emerald-200 dark:border-emerald-800 text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="text-zinc-800 dark:text-zinc-200 truncate font-medium">
                            {t.evidenceAttachment.name}
                          </span>
                        </div>
                        <button
                          onClick={() => onPreviewPdf(t.evidenceAttachment!)}
                          className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0 ml-2"
                        >
                          Bukti Uji
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* 4. STICKY NOTES */}
        {stickies.map((s) => {
          const colorStyles = {
            amber: 'bg-amber-100 text-amber-900 border-amber-300 shadow-amber-200/40',
            blue: 'bg-blue-100 text-blue-900 border-blue-300 shadow-blue-200/40',
            emerald: 'bg-emerald-100 text-emerald-900 border-emerald-300 shadow-emerald-200/40',
            purple: 'bg-purple-100 text-purple-900 border-purple-300 shadow-purple-200/40',
            rose: 'bg-rose-100 text-rose-900 border-rose-300 shadow-rose-200/40',
          }[s.color]

          return (
            <div
              key={s.id}
              style={{ transform: `translate(${s.x}px, ${s.y}px)` }}
              onMouseDown={(e) => startDragCard(e, 'sticky', s.id, s.x, s.y)}
              className={`absolute w-64 p-4 rounded-2xl border shadow-lg cursor-grab active:cursor-grabbing backdrop-blur-sm select-none ${colorStyles}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                  Catatan Cepat
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEditSticky(s)
                  }}
                  className="opacity-60 hover:opacity-100"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs leading-relaxed whitespace-pre-line font-medium font-sans">
                {s.content}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
