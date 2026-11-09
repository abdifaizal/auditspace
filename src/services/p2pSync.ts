import { Peer, DataConnection } from 'peerjs'
import { AuditWorkspace } from '../types'
import { smartMergeWorkspaces } from './smartMerge'

export type CollabRole = 'host' | 'peer'
export type AccessMode = 'read-only' | 'read-write'

export interface PeerParticipant {
  id: string
  name: string
  color: string
  role: CollabRole
  isYou?: boolean
}

export interface CollabState {
  isConnected: boolean
  role: CollabRole | null
  roomId: string | null
  accessMode: AccessMode
  connectedPeersCount: number
  participants: PeerParticipant[]
  error: string | null
  wasUnexpectedDisconnect?: boolean
  lastRoomId?: string | null
  disconnectReason?: string | null
}

export type CollabMessage =
  | {
      type: 'INIT_SYNC'
      workspace: AuditWorkspace
      accessMode: AccessMode
      participants: PeerParticipant[]
    }
  | { type: 'WORKSPACE_UPDATE'; workspace: AuditWorkspace }
  | { type: 'PARTICIPANT_JOIN'; participant: PeerParticipant }
  | { type: 'PARTICIPANTS_UPDATE'; participants: PeerParticipant[] }
  | {
      type: 'OFFLINE_RESYNC_REQUEST'
      draftWorkspace: AuditWorkspace
      senderName: string
    }
  | {
      type: 'RESYNC_COMPLETED'
      mergedWorkspace: AuditWorkspace
      mergedSummary: string
    }
  | { type: 'HEARTBEAT' }
  | { type: 'PONG' }

const PARTICIPANT_COLORS = [
  '#2563eb', // blue
  '#10b981', // emerald
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#6366f1', // indigo
]

function getAvatarColor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % PARTICIPANT_COLORS.length
  return PARTICIPANT_COLORS[index]
}

class P2PSyncService {
  private peer: Peer | null = null
  private connections: Map<string, DataConnection> = new Map()
  private participantsMap: Map<string, PeerParticipant> = new Map()
  private myProfile: PeerParticipant | null = null

  private heartbeatInterval: any = null
  private watchdogTimeout: any = null

  private stateChangeListeners: ((state: CollabState) => void)[] = []
  private workspaceUpdateListeners: ((workspace: AuditWorkspace, accessMode: AccessMode) => void)[] = []
  private resyncListeners: ((summary: string) => void)[] = []
  private currentHostWorkspace: AuditWorkspace | null = null

  private currentState: CollabState = {
    isConnected: false,
    role: null,
    roomId: null,
    accessMode: 'read-only',
    connectedPeersCount: 0,
    participants: [],
    error: null,
    wasUnexpectedDisconnect: false,
    lastRoomId: null,
    disconnectReason: null,
  }

  public getState(): CollabState {
    return { ...this.currentState }
  }

  public subscribeState(listener: (state: CollabState) => void): () => void {
    this.stateChangeListeners.push(listener)
    listener(this.getState())
    return () => {
      this.stateChangeListeners = this.stateChangeListeners.filter((l) => l !== listener)
    }
  }

  public subscribeWorkspace(
    listener: (workspace: AuditWorkspace, accessMode: AccessMode) => void
  ): () => void {
    this.workspaceUpdateListeners.push(listener)
    return () => {
      this.workspaceUpdateListeners = this.workspaceUpdateListeners.filter((l) => l !== listener)
    }
  }

  public subscribeResyncCompleted(listener: (summary: string) => void): () => void {
    this.resyncListeners.push(listener)
    return () => {
      this.resyncListeners = this.resyncListeners.filter((l) => l !== listener)
    }
  }

  public sendOfflineResync(draftWorkspace: AuditWorkspace, senderName?: string) {
    if (!this.currentState.isConnected) return
    const msg: CollabMessage = {
      type: 'OFFLINE_RESYNC_REQUEST',
      draftWorkspace,
      senderName: senderName || this.myProfile?.name || 'Rekan',
    }
    this.broadcast(msg)
  }

  private updateState(partial: Partial<CollabState>) {
    this.currentState = { ...this.currentState, ...partial }
    this.stateChangeListeners.forEach((l) => l(this.getState()))
  }

  public clearDisconnectAlert() {
    this.updateState({
      wasUnexpectedDisconnect: false,
      disconnectReason: null,
    })
  }

  // Generate a friendly 6-digit room code
  private generateRoomCode(): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return `AUDIT-${code}`
  }

  // START HOSTING A ROOM
  public startHosting(
    initialWorkspace: AuditWorkspace,
    accessMode: AccessMode,
    customCode?: string,
    hostName?: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      this.disconnect()

      const rawCode = (customCode || this.generateRoomCode()).toUpperCase().trim()
      const peerId = `auditspace-room-${rawCode.replace(/[^A-Z0-9-]/g, '')}`

      const resolvedHostName =
        hostName?.trim() || initialWorkspace.projectMeta.leadAuditor?.trim() || 'Auditor (Host)'

      this.myProfile = {
        id: 'host',
        name: resolvedHostName,
        color: '#2563eb',
        role: 'host',
        isYou: true,
      }

      this.participantsMap.clear()
      this.participantsMap.set('host', this.myProfile)
      this.currentHostWorkspace = initialWorkspace

      try {
        this.peer = new Peer(peerId, {
          debug: 1,
        })

        this.peer.on('open', (id) => {
          const roomCode = id.replace('auditspace-room-', '')
          this.updateState({
            isConnected: true,
            role: 'host',
            roomId: roomCode,
            accessMode,
            connectedPeersCount: 0,
            participants: Array.from(this.participantsMap.values()),
            error: null,
            wasUnexpectedDisconnect: false,
            disconnectReason: null,
          })

          this.startHostHeartbeat()
          resolve(roomCode)
        })

        this.peer.on('connection', (conn) => {
          this.handleIncomingConnection(conn, initialWorkspace, accessMode)
        })

        this.peer.on('error', (err) => {
          const errStr =
            (err as any)?.type === 'unavailable-id'
              ? 'Kode ruang ini sedang aktif dipakai. Silakan gunakan kode lain atau buat kode acak.'
              : err.message || 'Koneksi P2P error.'
          this.updateState({ error: errStr })
          reject(new Error(errStr))
        })
      } catch (err: any) {
        this.updateState({ error: err.message })
        reject(err)
      }
    })
  }

  private handleIncomingConnection(
    conn: DataConnection,
    initialWorkspace: AuditWorkspace,
    accessMode: AccessMode
  ) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn)
      this.updateState({
        connectedPeersCount: this.connections.size,
      })

      // Send initial workspace and current participant roster to newly connected peer
      const currentParticipants = Array.from(this.participantsMap.values()).map((p) => ({
        ...p,
        isYou: false,
      }))

      const initMsg: CollabMessage = {
        type: 'INIT_SYNC',
        workspace: initialWorkspace,
        accessMode,
        participants: currentParticipants,
      }
      conn.send(initMsg)
    })

    conn.on('data', (data: any) => {
      const msg = data as CollabMessage
      if (!msg || !msg.type) return

      if (msg.type === 'PARTICIPANT_JOIN') {
        // Register newly joined peer
        this.participantsMap.set(conn.peer, {
          ...msg.participant,
          id: conn.peer,
          role: 'peer',
        })
        this.broadcastParticipants()
      } else if (msg.type === 'OFFLINE_RESYNC_REQUEST') {
        const base = this.currentHostWorkspace || initialWorkspace
        const mergeResult = smartMergeWorkspaces(base, msg.draftWorkspace)
        this.currentHostWorkspace = mergeResult.mergedWorkspace

        // Notify local host workspace listeners
        this.workspaceUpdateListeners.forEach((l) =>
          l(mergeResult.mergedWorkspace, this.currentState.accessMode)
        )

        // Broadcast merged workspace to all connected peers
        this.broadcast({
          type: 'WORKSPACE_UPDATE',
          workspace: mergeResult.mergedWorkspace,
        })

        // Confirm back to sender peer
        conn.send({
          type: 'RESYNC_COMPLETED',
          mergedWorkspace: mergeResult.mergedWorkspace,
          mergedSummary: mergeResult.summary,
        })
      } else if (msg.type === 'WORKSPACE_UPDATE' && this.currentState.accessMode === 'read-write') {
        this.currentHostWorkspace = msg.workspace
        // Broadcast to all other peers and update local workspace
        this.workspaceUpdateListeners.forEach((l) => l(msg.workspace, this.currentState.accessMode))
        this.broadcast(msg, conn.peer)
      } else if (msg.type === 'PONG') {
        // Peer is alive
      }
    })

    const handlePeerDisconnect = () => {
      if (this.connections.has(conn.peer)) {
        this.connections.delete(conn.peer)
        this.participantsMap.delete(conn.peer)
        this.broadcastParticipants()
        this.updateState({ connectedPeersCount: this.connections.size })
      }
    }

    conn.on('close', handlePeerDisconnect)
    conn.on('error', handlePeerDisconnect)
  }

  private broadcastParticipants() {
    const list = Array.from(this.participantsMap.values())
    this.updateState({
      participants: list.map((p) => ({
        ...p,
        isYou: p.id === 'host',
      })),
      connectedPeersCount: this.connections.size,
    })

    const msg: CollabMessage = {
      type: 'PARTICIPANTS_UPDATE',
      participants: list,
    }
    this.broadcast(msg)
  }

  private startHostHeartbeat() {
    this.stopHeartbeat()
    this.heartbeatInterval = setInterval(() => {
      if (this.currentState.isConnected && this.currentState.role === 'host') {
        this.broadcast({ type: 'HEARTBEAT' })
      }
    }, 4000)
  }

  // JOIN AN EXISTING ROOM
  public joinRoom(
    roomCode: string,
    peerName?: string,
    draftToResync?: AuditWorkspace
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.disconnect()

      const cleanCode = roomCode.toUpperCase().trim().replace(/^AUDIT-/, '')
      const targetPeerId = `auditspace-room-AUDIT-${cleanCode}`

      const resolvedName = peerName?.trim() || 'Rekan Auditor'
      const assignedColor = getAvatarColor(resolvedName + Date.now())

      try {
        this.peer = new Peer({
          debug: 1,
        })

        this.peer.on('open', (myPeerId) => {
          if (!this.peer) return

          this.myProfile = {
            id: myPeerId,
            name: resolvedName,
            color: assignedColor,
            role: 'peer',
            isYou: true,
          }

          const conn = this.peer.connect(targetPeerId, {
            reliable: true,
          })

          conn.on('open', () => {
            this.connections.set(conn.peer, conn)
            this.updateState({
              isConnected: true,
              role: 'peer',
              roomId: `AUDIT-${cleanCode}`,
              connectedPeersCount: 1,
              error: null,
              wasUnexpectedDisconnect: false,
              disconnectReason: null,
            })

            // Introduce self to host
            if (this.myProfile) {
              conn.send({
                type: 'PARTICIPANT_JOIN',
                participant: this.myProfile,
              })
            }

            // If we have an offline draft to resync, send it to the host
            if (draftToResync) {
              conn.send({
                type: 'OFFLINE_RESYNC_REQUEST',
                draftWorkspace: draftToResync,
                senderName: resolvedName,
              })
            }

            this.resetPeerWatchdog(conn)
            resolve()
          })

          conn.on('data', (data: any) => {
            const msg = data as CollabMessage
            if (!msg || !msg.type) return

            this.resetPeerWatchdog(conn)

            if (msg.type === 'INIT_SYNC') {
              this.updateState({ accessMode: msg.accessMode })
              this.updatePeerParticipants(msg.participants)
              this.workspaceUpdateListeners.forEach((l) => l(msg.workspace, msg.accessMode))
            } else if (msg.type === 'RESYNC_COMPLETED') {
              this.workspaceUpdateListeners.forEach((l) =>
                l(msg.mergedWorkspace, this.currentState.accessMode)
              )
              this.resyncListeners.forEach((l) => l(msg.mergedSummary))
            } else if (msg.type === 'WORKSPACE_UPDATE') {
              this.workspaceUpdateListeners.forEach((l) =>
                l(msg.workspace, this.currentState.accessMode)
              )
            } else if (msg.type === 'PARTICIPANTS_UPDATE') {
              this.updatePeerParticipants(msg.participants)
            } else if (msg.type === 'HEARTBEAT') {
              conn.send({ type: 'PONG' })
            }
          })

          const handleConnClose = () => {
            this.handleHostDisconnected('Koneksi dengan Host terputus (Host keluar atau offline).')
          }

          conn.on('close', handleConnClose)

          conn.on('error', (err) => {
            const errStr =
              'Gagal terhubung ke host. Pastikan kode ruang benar dan host masih aktif.'
            this.updateState({ error: errStr })
            reject(new Error(errStr))
          })
        })

        this.peer.on('error', (err) => {
          const errStr =
            'Tidak dapat menghubungi server sinyal P2P. Pastikan koneksi internet aktif.'
          this.updateState({ error: errStr })
          reject(new Error(errStr))
        })
      } catch (err: any) {
        this.updateState({ error: err.message })
        reject(err)
      }
    })
  }

  private updatePeerParticipants(participants: PeerParticipant[]) {
    const myId = this.myProfile?.id
    const updated = participants.map((p) => ({
      ...p,
      isYou: p.id === myId || p.name === this.myProfile?.name,
    }))
    this.updateState({
      participants: updated,
      connectedPeersCount: updated.length,
    })
  }

  private resetPeerWatchdog(conn: DataConnection) {
    if (this.watchdogTimeout) clearTimeout(this.watchdogTimeout)
    // If no message or heartbeat within 9 seconds, host is unreachable (e.g. laptop sleep or network dead)
    this.watchdogTimeout = setTimeout(() => {
      if (this.currentState.isConnected && this.currentState.role === 'peer') {
        try {
          conn.close()
        } catch (e) {}
        this.handleHostDisconnected(
          'Deteksi Timeout: Tidak ada respon dari Host (kemungkinan laptop host sleep, ditutup, atau jaringan terputus).'
        )
      }
    }, 9000)
  }

  private handleHostDisconnected(reason: string) {
    this.stopWatchdog()
    this.stopHeartbeat()
    const lastRoom = this.currentState.roomId

    this.connections.forEach((conn) => {
      try {
        conn.close()
      } catch (e) {}
    })
    this.connections.clear()
    this.participantsMap.clear()

    if (this.peer) {
      try {
        this.peer.destroy()
      } catch (e) {}
      this.peer = null
    }

    this.updateState({
      isConnected: false,
      role: null,
      wasUnexpectedDisconnect: true,
      lastRoomId: lastRoom,
      disconnectReason: reason,
      connectedPeersCount: 0,
      participants: [],
      error: reason,
    })
  }

  // BROADCAST UPDATES TO CONNECTED PEERS
  public broadcastWorkspace(workspace: AuditWorkspace) {
    if (this.currentState.role === 'host') {
      this.currentHostWorkspace = workspace
    }
    if (!this.currentState.isConnected) return
    const msg: CollabMessage = {
      type: 'WORKSPACE_UPDATE',
      workspace,
    }
    this.broadcast(msg)
  }

  private broadcast(msg: CollabMessage, excludePeerId?: string) {
    this.connections.forEach((conn, peerId) => {
      if (peerId !== excludePeerId && conn.open) {
        try {
          conn.send(msg)
        } catch (e) {
          console.error('Error sending message to peer:', peerId, e)
        }
      }
    })
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private stopWatchdog() {
    if (this.watchdogTimeout) {
      clearTimeout(this.watchdogTimeout)
      this.watchdogTimeout = null
    }
  }

  // DISCONNECT & CLEANUP
  public disconnect() {
    this.stopHeartbeat()
    this.stopWatchdog()

    this.connections.forEach((conn) => {
      try {
        conn.close()
      } catch (e) {}
    })
    this.connections.clear()
    this.participantsMap.clear()

    if (this.peer) {
      try {
        this.peer.destroy()
      } catch (e) {}
      this.peer = null
    }

    this.updateState({
      isConnected: false,
      role: null,
      roomId: null,
      connectedPeersCount: 0,
      participants: [],
      error: null,
    })
  }
}

export const p2pSync = new P2PSyncService()
