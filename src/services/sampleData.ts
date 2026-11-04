import { AuditWorkspace } from '../types'

export function getSampleWorkspace(): AuditWorkspace {
  return {
    version: '1.0.0',
    lastModified: new Date().toISOString(),
    projectMeta: {
      id: 'proj-default-1',
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
