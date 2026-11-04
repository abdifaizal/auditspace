import { Peer, DataConnection } from 'peerjs'
import { AuditWorkspace } from '../types'

export type CollabRole = 'host' | 'peer'
export type AccessMode = 'read-only' | 'read-write'

export interface CollabState {
  isConnected: boolean
  role: CollabRole | null
  roomId: string | null
  accessMode: AccessMode
  connectedPeersCount: number
  error: string | null
}

export type CollabMessage =
  | { type: 'INIT_SYNC'; workspace: AuditWorkspace; accessMode: AccessMode }
  | { type: 'WORKSPACE_UPDATE'; workspace: AuditWorkspace }
  | { type: 'PONG' }

class P2PSyncService {
  private peer: Peer | null = null
  private connections: Map<string, DataConnection> = new Map()
  private stateChangeListeners: ((state: CollabState) => void)[] = []
  private workspaceUpdateListeners: ((workspace: AuditWorkspace, accessMode: AccessMode) => void)[] = []

  private currentState: CollabState = {
    isConnected: false,
    role: null,
    roomId: null,
    accessMode: 'read-only',
    connectedPeersCount: 0,
    error: null,
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

  private updateState(partial: Partial<CollabState>) {
    this.currentState = { ...this.currentState, ...partial }
    this.stateChangeListeners.forEach((l) => l(this.getState()))
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
    customCode?: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      this.disconnect()

      const rawCode = (customCode || this.generateRoomCode()).toUpperCase().trim()
      const peerId = `auditspace-room-${rawCode.replace(/[^A-Z0-9-]/g, '')}`

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
            error: null,
          })
          resolve(roomCode)
        })

        this.peer.on('connection', (conn) => {
          this.handleIncomingConnection(conn, initialWorkspace, accessMode)
        })

        this.peer.on('error', (err) => {
          const errStr = (err as any)?.type === 'unavailable-id'
            ? 'Kode ruang ini sedang aktif dipakai. Silakan gunakan kode lain atau buat kode acak.'
            : (err.message || 'Koneksi P2P error.')
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
      this.updateState({ connectedPeersCount: this.connections.size })

      // Send initial workspace to newly connected peer
      const initMsg: CollabMessage = {
        type: 'INIT_SYNC',
        workspace: initialWorkspace,
        accessMode,
      }
      conn.send(initMsg)
    })

    conn.on('data', (data: any) => {
      const msg = data as CollabMessage
      if (msg.type === 'WORKSPACE_UPDATE' && this.currentState.accessMode === 'read-write') {
        // Broadcast to all other peers and update local workspace
        this.workspaceUpdateListeners.forEach((l) => l(msg.workspace, this.currentState.accessMode))
        this.broadcast(msg, conn.peer)
      }
    })

    conn.on('close', () => {
      this.connections.delete(conn.peer)
      this.updateState({ connectedPeersCount: this.connections.size })
    })

    conn.on('error', () => {
      this.connections.delete(conn.peer)
      this.updateState({ connectedPeersCount: this.connections.size })
    })
  }

  // JOIN AN EXISTING ROOM
  public joinRoom(roomCode: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.disconnect()

      const cleanCode = roomCode.toUpperCase().trim().replace(/^AUDIT-/, '')
      const targetPeerId = `auditspace-room-AUDIT-${cleanCode}`

      try {
        this.peer = new Peer({
          debug: 1,
        })

        this.peer.on('open', () => {
          if (!this.peer) return
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
            })
            resolve()
          })

          conn.on('data', (data: any) => {
            const msg = data as CollabMessage
            if (msg.type === 'INIT_SYNC') {
              this.updateState({ accessMode: msg.accessMode })
              this.workspaceUpdateListeners.forEach((l) => l(msg.workspace, msg.accessMode))
            } else if (msg.type === 'WORKSPACE_UPDATE') {
              this.workspaceUpdateListeners.forEach((l) => l(msg.workspace, this.currentState.accessMode))
            }
          })

          conn.on('close', () => {
            this.updateState({
              isConnected: false,
              error: 'Koneksi dengan Host terputus.',
              connectedPeersCount: 0,
            })
          })

          conn.on('error', (err) => {
            const errStr = 'Gagal terhubung ke host. Pastikan kode ruang benar dan host masih aktif.'
            this.updateState({ error: errStr })
            reject(new Error(errStr))
          })
        })

        this.peer.on('error', (err) => {
          const errStr = 'Tidak dapat menghubungi server sinyal P2P. Pastikan koneksi internet aktif.'
          this.updateState({ error: errStr })
          reject(new Error(errStr))
        })
      } catch (err: any) {
        this.updateState({ error: err.message })
        reject(err)
      }
    })
  }

  // BROADCAST UPDATES TO CONNECTED PEERS
  public broadcastWorkspace(workspace: AuditWorkspace) {
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

  // DISCONNECT & CLEANUP
  public disconnect() {
    this.connections.forEach((conn) => {
      try {
        conn.close()
      } catch (e) {}
    })
    this.connections.clear()

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
      error: null,
    })
  }
}

export const p2pSync = new P2PSyncService()
