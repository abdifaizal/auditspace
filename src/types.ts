export interface Attachment {
  id: string
  name: string
  type: string
  size: number
  dataUrl: string // Base64 data or data URL
  uploadedAt: string
}

export interface ExternalLink {
  id: string
  title: string
  url: string
}

export interface MeetingCard {
  id: string
  title: string
  auditeeUnit: string
  date: string
  time: string
  pdfInvite: Attachment | null
  transcript: string
  actionPoints: string[]
  x: number
  y: number
}

export interface MaterialVaultCard {
  id: string
  title: string
  description: string
  attachments: Attachment[]
  links: ExternalLink[]
  x: number
  y: number
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'
export type TaskStatus = 'todo' | 'in_progress' | 'done'

export interface TaskCard {
  id: string
  title: string
  description: string
  startDate: string
  dueDate: string
  pic: string
  priority: TaskPriority
  status: TaskStatus
  completedAt?: string
  completedBy?: string
  evidenceAttachment?: Attachment | null
  x: number
  y: number
}

export interface StickyNote {
  id: string
  content: string
  color: 'amber' | 'blue' | 'emerald' | 'purple' | 'rose'
  x: number
  y: number
}

export interface ConnectionLink {
  id: string
  fromId: string
  toId: string
}

export interface ProjectMeta {
  id: string
  name: string
  timeline: string
  startDate: string
  endDate: string
  auditeeName: string
  leadAuditor: string
  description: string
}

export interface AuditWorkspace {
  version: string
  lastModified: string
  projectMeta: ProjectMeta
  meetings: MeetingCard[]
  materials: MaterialVaultCard[]
  tasks: TaskCard[]
  stickies: StickyNote[]
  connections: ConnectionLink[]
}

export interface MultiSpaceStore {
  activeSpaceId: string
  spaces: AuditWorkspace[]
}
