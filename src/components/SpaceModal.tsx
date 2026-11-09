import React, { useState, useEffect } from 'react'
import { ProjectMeta } from '../types'
import { X, ShieldCheck, Calendar, Building, User, FileText, CheckCircle2 } from 'lucide-react'

interface SpaceModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (meta: {
    name: string
    timeline: string
    auditeeName: string
    leadAuditor: string
    description: string
    useTemplate: boolean
  }) => void
  editingSpace?: ProjectMeta | null
}

export const SpaceModal: React.FC<SpaceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingSpace,
}) => {
  if (!isOpen) return null

  const isEditing = Boolean(editingSpace)

  const [name, setName] = useState(editingSpace?.name || '')
  const [timeline, setTimeline] = useState(editingSpace?.timeline || '')
  const [auditeeName, setAuditeeName] = useState(editingSpace?.auditeeName || '')
  const [leadAuditor, setLeadAuditor] = useState(editingSpace?.leadAuditor || '')
  const [description, setDescription] = useState(editingSpace?.description || '')
  const [useTemplate, setUseTemplate] = useState(!isEditing)

  useEffect(() => {
    if (editingSpace) {
      setName(editingSpace.name)
      setTimeline(editingSpace.timeline)
      setAuditeeName(editingSpace.auditeeName)
      setLeadAuditor(editingSpace.leadAuditor)
      setDescription(editingSpace.description)
    } else {
      setName('')
      setTimeline('01 Nov 2026 s.d. 31 Des 2026')
      setAuditeeName('')
      setLeadAuditor('Tim Auditor TI')
      setDescription('')
      setUseTemplate(false)
    }
  }, [editingSpace, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      alert('Nama Proyek Audit wajib diisi!')
      return
    }

    onSave({
      name: name.trim(),
      timeline: timeline.trim() || 'Nov - Des 2026',
      auditeeName: auditeeName.trim() || 'Entitas Auditee',
      leadAuditor: leadAuditor.trim() || 'Tim Auditor',
      description: description.trim(),
      useTemplate: false,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/70 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {isEditing ? 'Ubah Rincian Space Audit' : 'Buat Space Audit Baru'}
                </h2>
                <p className="text-xs text-zinc-500">
                  Kelola ruang kerja independen untuk penugasan audit spesifik.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Scrollable Body */}
          <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1">
              Nama Penugasan / Proyek Audit *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="cth: Audit Sistem Core Banking 2027"
              className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Timeline Pelaksanaan
            </label>
            <input
              type="text"
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              placeholder="cth: 01 November s.d. 31 Desember 2026"
              className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1 flex items-center gap-1">
                <Building className="w-3.5 h-3.5" /> Nama Auditee / Entitas
              </label>
              <input
                type="text"
                value={auditeeName}
                onChange={(e) => setAuditeeName(e.target.value)}
                placeholder="cth: Divisi Pengembang / IT Ops"
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Lead Auditor / Tim
              </label>
              <input
                type="text"
                value={leadAuditor}
                onChange={(e) => setLeadAuditor(e.target.value)}
                placeholder="cth: Tim Auditor TI Internal"
                className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Keterangan Ruang Lingkup (Scope)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tuliskan tujuan penugasan, standar audit (ISO/NIST), atau ruang lingkup aplikasi..."
              className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-900 dark:text-zinc-100"
            />
          </div>
          </div>

          {/* Pinned Sticky Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/95 shrink-0 shadow-xs z-10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow transition"
            >
              {isEditing ? 'Simpan Perubahan' : 'Buat Space Sekarang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
