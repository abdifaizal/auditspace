import { AuditWorkspace } from '../types'
import { RECOVERED_QITA_WORKSPACE } from './recoveredQitaData'

export function getSampleWorkspace(): AuditWorkspace {
  const uniqueId = 'proj-' + Math.random().toString(36).substring(2, 9)
  return {
    version: '1.0.0',
    lastModified: new Date().toISOString(),
    projectMeta: {
      id: uniqueId,
      name: 'Workspace Audit 1',
      timeline: '01 Nov 2026 s.d. 31 Des 2026',
      startDate: '2026-11-01',
      endDate: '2026-12-31',
      auditeeName: 'Entitas Auditee',
      leadAuditor: 'Tim Auditor',
      description: 'Ruang kerja pelaksanaan audit sistem dan kepatuhan.',
    },
    meetings: [],
    materials: [],
    tasks: [],
    stickies: [],
    connections: [],
    columnTitles: {},
    customColumns: [],
    customCards: [],
  }
}

export function getRecoveredQitaWorkspace(): AuditWorkspace {
  return JSON.parse(JSON.stringify(RECOVERED_QITA_WORKSPACE))
}
