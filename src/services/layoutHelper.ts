import { AuditWorkspace, MeetingCard, MaterialVaultCard, TaskCard, StickyNote } from '../types'

export const CANVAS_COLUMNS = {
  MEETING_X: 60,
  MATERIAL_X: 480,
  ACTIVE_TASK_X: 920,
  DONE_TASK_X: 1320,
  STICKY_X: 1720,
}

// Calculate the bottom-most coordinate for a new meeting card
export function getNextMeetingPosition(meetings: MeetingCard[]): { x: number; y: number } {
  const x = CANVAS_COLUMNS.MEETING_X
  if (meetings.length === 0) return { x, y: 80 }
  const maxY = Math.max(...meetings.map((m) => m.y))
  return { x, y: maxY + 340 }
}

// Calculate the bottom-most coordinate for a new material vault card
export function getNextMaterialPosition(materials: MaterialVaultCard[]): { x: number; y: number } {
  const x = CANVAS_COLUMNS.MATERIAL_X
  if (materials.length === 0) return { x, y: 80 }
  const maxY = Math.max(...materials.map((m) => m.y))
  return { x, y: maxY + 340 }
}

// Calculate the bottom-most coordinate for a task (separated for active vs completed)
export function getNextTaskPosition(
  tasks: TaskCard[],
  status: 'todo' | 'in_progress' | 'done'
): { x: number; y: number } {
  if (status === 'done') {
    const x = CANVAS_COLUMNS.DONE_TASK_X
    const doneTasks = tasks.filter((t) => t.status === 'done')
    if (doneTasks.length === 0) return { x, y: 80 }
    const maxY = Math.max(...doneTasks.map((t) => t.y))
    return { x, y: maxY + 280 }
  } else {
    const x = CANVAS_COLUMNS.ACTIVE_TASK_X
    const activeTasks = tasks.filter((t) => t.status !== 'done')
    if (activeTasks.length === 0) return { x, y: 80 }
    const maxY = Math.max(...activeTasks.map((t) => t.y))
    return { x, y: maxY + 280 }
  }
}

// Calculate the bottom-most coordinate for a new sticky note
export function getNextStickyPosition(stickies: StickyNote[]): { x: number; y: number } {
  const x = CANVAS_COLUMNS.STICKY_X
  if (stickies.length === 0) return { x, y: 80 }
  const maxY = Math.max(...stickies.map((s) => s.y))
  return { x, y: maxY + 220 }
}

// Auto-organize all cards in workspace into neat categorized columns
export function autoLayoutWorkspace(workspace: AuditWorkspace): AuditWorkspace {
  let meetingY = 80
  const meetings = workspace.meetings.map((m) => {
    const updated = { ...m, x: CANVAS_COLUMNS.MEETING_X, y: meetingY }
    meetingY += 340
    return updated
  })

  let materialY = 80
  const materials = workspace.materials.map((mat) => {
    const updated = { ...mat, x: CANVAS_COLUMNS.MATERIAL_X, y: materialY }
    materialY += 340
    return updated
  })

  let activeTaskY = 80
  let doneTaskY = 80
  const tasks = workspace.tasks.map((t) => {
    if (t.status === 'done') {
      const updated = { ...t, x: CANVAS_COLUMNS.DONE_TASK_X, y: doneTaskY }
      doneTaskY += 280
      return updated
    } else {
      const updated = { ...t, x: CANVAS_COLUMNS.ACTIVE_TASK_X, y: activeTaskY }
      activeTaskY += 280
      return updated
    }
  })

  let stickyY = 80
  const stickies = workspace.stickies.map((s) => {
    const updated = { ...s, x: CANVAS_COLUMNS.STICKY_X, y: stickyY }
    stickyY += 220
    return updated
  })

  return {
    ...workspace,
    meetings,
    materials,
    tasks,
    stickies,
  }
}
