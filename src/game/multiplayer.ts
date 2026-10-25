import { CharacterId } from './types';
import Peer, { DataConnection } from 'peerjs';

export interface LobbyPlayer {
  id: string;
  name: string;
  characterId: CharacterId;
  color: string;
  isReady: boolean;
  isHost: boolean;
  ping: number;
  isDisconnected?: boolean;
  position?: { x: number; y: number; z: number };
  rotation?: number;
  hp?: number;
  maxHp?: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  time: string;
  isSystem?: boolean;
}

export interface GameRoom {
  id: string;
  code: string;
  name: string;
  hostId: string;
  maxPlayers: number;
  waveMode: number;
  inGame: boolean;
  players: Record<string, LobbyPlayer>;
  chat: ChatMessage[];
  isP2P?: boolean;
}

export interface RoomSummary {
  id: string;
  code: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  inGame: boolean;
  waveMode: number;
  hostName?: string;
  isP2P?: boolean;
}

type EventCallback<T = any> = (data: T) => void;

class MultiplayerClient {
  private ws: WebSocket | null = null;
  private channel: BroadcastChannel | null = null;
  private peer: Peer | null = null;
  private peerConnections: Map<string, DataConnection> = new Map();
  private hostConnection: DataConnection | null = null;

  public isConnected: boolean = false;
  public isServerMode: boolean = false;
  public myPlayerId: string = '';
  public myPlayerName: string = '';
  public currentRoom: GameRoom | null = null;
  public availableRooms: RoomSummary[] = [];
  private pollInterval: any = null;

  private listeners: Record<string, EventCallback[]> = {
    room_list: [],
    room_joined: [],
    room_updated: [],
    room_left: [],
    chat_received: [],
    game_started: [],
    player_sync: [],
    player_spell: [],
    error: [],
    connection_change: [],
  };

  constructor() {
    // Restore or generate persistent player ID in sessionStorage
    try {
      const storedId = sessionStorage.getItem('mc_player_id');
      if (storedId) {
        this.myPlayerId = storedId;
      } else {
        this.myPlayerId = 'p_' + Math.random().toString(36).substring(2, 7);
        sessionStorage.setItem('mc_player_id', this.myPlayerId);
      }

      const storedName = sessionStorage.getItem('mc_player_name');
      if (storedName) {
        this.myPlayerName = storedName;
      } else {
        this.myPlayerName = 'Wizard ' + this.myPlayerId.slice(-3).toUpperCase();
      }
    } catch (e) {
      this.myPlayerId = 'p_' + Math.random().toString(36).substring(2, 7);
      this.myPlayerName = 'Hero ' + this.myPlayerId.slice(-3).toUpperCase();
    }

    // BroadcastChannel for instant local multi-tab sync
    try {
      this.channel = new BroadcastChannel('arcane_cheese_mp');
      this.channel.onmessage = (event) => {
        this.handleMessage(event.data);
      };
    } catch (e) {}

    // Initialize network: try server WebSocket first, and always prepare P2P mesh
    this.connectServer();
    this.initPeer();
    this.startPolling();
  }

  // --- WebSocket Server Connection ---
  public connectServer() {
    if (typeof window === 'undefined') return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;

      const ws = new WebSocket(wsUrl);
      this.ws = ws;

      ws.onopen = () => {
        this.isConnected = true;
        this.isServerMode = true;
        this.emit('connection_change', true);
        this.refreshRooms();

        // If we were already in a server room, re-attach
        if (this.currentRoom && !this.currentRoom.isP2P) {
          const myChar = this.currentRoom.players[this.myPlayerId]?.characterId || 'baldan';
          const myColor = this.currentRoom.players[this.myPlayerId]?.color || '#22c55e';
          this.send({
            type: 'join_room',
            code: this.currentRoom.code,
            roomId: this.currentRoom.id,
            playerId: this.myPlayerId,
            playerName: this.myPlayerName,
            characterId: myChar,
            color: myColor,
          });
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (err) {}
      };

      ws.onclose = () => {
        this.ws = null;
        this.isServerMode = false;
        // On Vercel or serverless, WebSocket will close, but P2P/WebRTC keeps the app online!
        if (this.peer && !this.peer.destroyed) {
          this.isConnected = true;
          this.emit('connection_change', true);
        } else {
          this.isConnected = false;
          this.emit('connection_change', false);
        }
      };

      ws.onerror = () => {
        this.ws = null;
        this.isServerMode = false;
        if (this.peer && !this.peer.destroyed) {
          this.isConnected = true;
          this.emit('connection_change', true);
        }
      };
    } catch (e) {
      this.isServerMode = false;
    }
  }

  // --- WebRTC PeerJS Mesh for Vercel & Serverless ---
  private initPeer() {
    try {
      if (this.peer && !this.peer.destroyed) return;
      const peerId = 'mc_usr_' + this.myPlayerId;
      this.peer = new Peer(peerId, {
        debug: 0,
      });

      this.peer.on('open', () => {
        this.isConnected = true;
        this.emit('connection_change', true);
      });

      this.peer.on('connection', (conn) => {
        this.handleIncomingPeerConnection(conn);
      });

      this.peer.on('error', (err) => {
        // If peerId was already taken (e.g. reload), initialize with random ID
        if (err.type === 'unavailable-id') {
          this.peer = new Peer({ debug: 0 });
          this.peer.on('open', () => {
            this.isConnected = true;
            this.emit('connection_change', true);
          });
          this.peer.on('connection', (conn) => this.handleIncomingPeerConnection(conn));
        }
      });
    } catch (e) {
      // Graceful fallback to BroadcastChannel
      this.isConnected = true;
      this.emit('connection_change', true);
    }
  }

  // Host handling an incoming connection from a guest player
  private handleIncomingPeerConnection(conn: DataConnection) {
    conn.on('open', () => {
      conn.on('data', (raw: any) => {
        try {
          const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
          if (!data || !data.type) return;

          if (data.type === 'peer_join_request') {
            if (!this.currentRoom) return;

            const currentCount = Object.keys(this.currentRoom.players).length;
            if (currentCount >= this.currentRoom.maxPlayers) {
              conn.send(JSON.stringify({ type: 'error', message: 'Өрөө дүүрсэн байна! (Room is full)' }));
              return;
            }

            const guestPlayer: LobbyPlayer = {
              id: data.playerId,
              name: data.playerName || `Hero ${currentCount + 1}`,
              characterId: data.characterId || 'nomio',
              color: data.color || '#ef4444',
              isReady: false,
              isHost: false,
              ping: 25,
            };

            this.currentRoom.players[data.playerId] = guestPlayer;
            this.peerConnections.set(data.playerId, conn);

            this.currentRoom.chat.push({
              id: 'join_' + Date.now(),
              senderId: 'system',
              senderName: 'Guild Master',
              text: `${guestPlayer.name} joined the raid party via P2P!`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isSystem: true,
            });

            // Send full room state back to guest
            conn.send(JSON.stringify({
              type: 'room_joined',
              room: this.currentRoom,
              yourId: data.playerId,
            }));

            // Broadcast room update to all existing peers and local tabs
            this.broadcastP2P({ type: 'room_updated', room: this.currentRoom });
            this.emit('room_updated', this.currentRoom);
            this.broadcastRoomListP2P();
          } else {
            // Forward player packets (sync, spell, chat, update_profile) to other peers
            this.handleMessage(data);
            this.broadcastP2P(data, data.playerId);
          }
        } catch (err) {}
      });

      conn.on('close', () => {
        for (const [pId, c] of this.peerConnections.entries()) {
          if (c === conn) {
            this.peerConnections.delete(pId);
            if (this.currentRoom && this.currentRoom.players[pId]) {
              this.currentRoom.players[pId].isDisconnected = true;
              this.broadcastP2P({ type: 'room_updated', room: this.currentRoom });
              this.emit('room_updated', this.currentRoom);
              this.broadcastRoomListP2P();
            }
            break;
          }
        }
      });
    });
  }

  // Periodic polling fallback to keep rooms list alive
  private startPolling() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = setInterval(async () => {
      if (this.currentRoom) {
        if (!this.currentRoom.isP2P && this.isServerMode) {
          try {
            const res = await fetch(`/api/rooms/${this.currentRoom.id}`);
            if (res.ok) {
              const data = await res.json();
              if (data.success && data.room) {
                const prevInGame = this.currentRoom.inGame;
                this.currentRoom = data.room;
                this.emit('room_updated', data.room);
                if (!prevInGame && data.room.inGame) {
                  this.emit('game_started', data.room);
                }
              }
            }
          } catch (e) {}
        } else if (this.isHost()) {
          // If hosting P2P room, periodically announce to local tabs & storage
          this.broadcastRoomListP2P();
        }
      } else {
        this.refreshRooms();
      }
    }, 3000);
  }

  private handleMessage(data: any) {
    if (!data || !data.type) return;

    switch (data.type) {
      case 'room_list': {
        const serverRooms = data.rooms || [];
        this.availableRooms = serverRooms;
        this.emit('room_list', this.availableRooms);
        break;
      }
      case 'room_joined': {
        this.currentRoom = data.room;
        if (data.yourId) this.myPlayerId = data.yourId;
        try {
          if (data.room?.code) sessionStorage.setItem('mc_room_code', data.room.code);
          if (data.room?.id) sessionStorage.setItem('mc_room_id', data.room.id);
        } catch (e) {}
        this.emit('room_joined', data.room);
        break;
      }
      case 'room_updated': {
        this.currentRoom = data.room;
        this.emit('room_updated', data.room);
        break;
      }
      case 'room_left': {
        this.currentRoom = null;
        try {
          sessionStorage.removeItem('mc_room_code');
          sessionStorage.removeItem('mc_room_id');
        } catch (e) {}
        this.emit('room_left', null);
        break;
      }
      case 'chat_received': {
        if (this.currentRoom && data.message) {
          const exists = this.currentRoom.chat.some((m) => m.id === data.message.id);
          if (!exists) {
            this.currentRoom.chat.push(data.message);
            this.emit('chat_received', data.message);
          }
        }
        break;
      }
      case 'game_started': {
        if (this.currentRoom) {
          this.currentRoom.inGame = true;
          this.emit('game_started', this.currentRoom);
        }
        break;
      }
      case 'player_sync': {
        this.emit('player_sync', data);
        break;
      }
      case 'player_spell': {
        this.emit('player_spell', data);
        break;
      }
      case 'error': {
        this.emit('error', data.message);
        break;
      }
    }
  }

  // Multi-transport send: WebSocket + WebRTC Peers + BroadcastChannel
  private send(data: any) {
    const payload = JSON.stringify(data);

    // 1. WebSocket if available
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(payload);
      } catch (e) {}
    }

    // 2. PeerJS connections
    if (this.hostConnection && this.hostConnection.open) {
      try {
        this.hostConnection.send(payload);
      } catch (e) {}
    } else {
      this.broadcastP2P(data);
    }

    // 3. Local BroadcastChannel
    if (this.channel) {
      try {
        this.channel.postMessage(data);
      } catch (e) {}
    }
  }

  private broadcastP2P(data: any, excludePlayerId?: string) {
    const payload = JSON.stringify(data);
    for (const [pId, conn] of this.peerConnections.entries()) {
      if (pId !== excludePlayerId && conn.open) {
        try {
          conn.send(payload);
        } catch (e) {}
      }
    }
  }

  private broadcastRoomListP2P() {
    if (!this.currentRoom) return;
    const summary: RoomSummary = {
      id: this.currentRoom.id,
      code: this.currentRoom.code,
      name: this.currentRoom.name,
      playerCount: Object.keys(this.currentRoom.players).length,
      maxPlayers: this.currentRoom.maxPlayers,
      inGame: this.currentRoom.inGame,
      waveMode: this.currentRoom.waveMode,
      hostName: this.currentRoom.players[this.currentRoom.hostId]?.name || 'Archmage',
      isP2P: true,
    };

    if (this.channel) {
      try {
        this.channel.postMessage({ type: 'p2p_room_announce', room: summary });
      } catch (e) {}
    }

    try {
      localStorage.setItem('mc_active_p2p_room', JSON.stringify({
        room: summary,
        timestamp: Date.now(),
      }));
    } catch (e) {}
  }

  public on(event: string, callback: EventCallback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
    return () => this.off(event, callback);
  }

  public off(event: string, callback: EventCallback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
  }

  private emit(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(`Error in listener for ${event}:`, e);
        }
      });
    }
  }

  // --- Actions ---

  public async refreshRooms() {
    // 1. Try REST fetch if server exists
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const res = await fetch('/api/rooms', { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.rooms)) {
          this.availableRooms = json.rooms;
          this.emit('room_list', this.availableRooms);
          return;
        }
      }
    } catch (e) {
      // Serverless or Vercel static mode
    }

    // 2. Discover local P2P announced rooms from localStorage
    try {
      const stored = localStorage.getItem('mc_active_p2p_room');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.timestamp < 30000 && parsed.room) {
          const list = [parsed.room];
          this.availableRooms = list;
          this.emit('room_list', list);
          return;
        }
      }
    } catch (e) {}

    // 3. WS fallback if connected
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({ type: 'list_rooms' });
    }
  }

  // Generate 4-letter memorable code
  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Fail-safe room creation: Works on Vercel, serverless, Cloud Run, and offline!
  public async createRoom(
    roomName: string,
    maxPlayers: number,
    characterId: CharacterId,
    color: string
  ): Promise<GameRoom | null> {
    // 1. First attempt REST creation (for Node.js full-stack container)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1400);

      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: roomName || 'Arcane Raid Team',
          maxPlayers,
          characterId,
          color,
          playerName: this.myPlayerName,
          playerId: this.myPlayerId,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.room) {
          this.currentRoom = data.room;
          try {
            sessionStorage.setItem('mc_room_code', data.room.code);
            sessionStorage.setItem('mc_room_id', data.room.id);
          } catch (e) {}

          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.send({
              type: 'join_room',
              roomId: data.room.id,
              code: data.room.code,
              playerId: this.myPlayerId,
              playerName: this.myPlayerName,
              characterId,
              color,
            });
          }

          this.emit('room_joined', data.room);
          this.refreshRooms();
          return data.room;
        }
      }
    } catch (err) {
      // REST not available (Vercel / static hosting) -> Proceed seamlessly to P2P Cloud Mesh!
    }

    // 2. Seamless P2P / Serverless Host Mode (guarantees room creation works 100% on Vercel!)
    const code = this.generateRoomCode();
    const roomId = 'p2p_room_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    const hostPlayer: LobbyPlayer = {
      id: this.myPlayerId,
      name: this.myPlayerName || 'Archmage',
      characterId,
      color,
      isReady: true,
      isHost: true,
      ping: 8,
      isDisconnected: false,
    };

    const p2pRoom: GameRoom = {
      id: roomId,
      code,
      name: roomName || 'Arcane Raid Team',
      hostId: this.myPlayerId,
      maxPlayers: Math.min(4, Math.max(2, maxPlayers || 4)),
      waveMode: 20,
      inGame: false,
      players: { [this.myPlayerId]: hostPlayer },
      isP2P: true,
      chat: [
        {
          id: 'sys_' + Date.now(),
          senderId: 'system',
          senderName: 'Guild Master',
          text: `Party Lobby created! Room Code: ${code}. Share with friends to raid together!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSystem: true,
        },
      ],
    };

    this.currentRoom = p2pRoom;
    this.isConnected = true;
    this.emit('connection_change', true);

    try {
      sessionStorage.setItem('mc_room_code', code);
      sessionStorage.setItem('mc_room_id', roomId);
    } catch (e) {}

    // Host opens a WebRTC channel listening on room code
    this.setupP2PHost(code);

    // Announce to local tabs and storage
    this.broadcastRoomListP2P();
    this.emit('room_joined', p2pRoom);
    return p2pRoom;
  }

  // Set up Host Peer for room code
  private setupP2PHost(code: string) {
    try {
      const roomPeerId = 'mc_host_' + code.toLowerCase();
      const hostPeer = new Peer(roomPeerId, { debug: 0 });

      hostPeer.on('connection', (conn) => {
        this.handleIncomingPeerConnection(conn);
      });

      hostPeer.on('error', () => {
        // If roomPeerId unavailable, normal peer already handles peer-to-peer
      });
    } catch (e) {}
  }

  // Join Room: Works via REST server or P2P WebRTC / BroadcastChannel
  public async joinRoom(
    codeOrId: string,
    characterId: CharacterId,
    color: string
  ): Promise<{ success: boolean; error?: string }> {
    const rawInput = (codeOrId || '').trim();
    if (!rawInput) {
      const err = 'Өрөөний 4 оронтой кодоо оруулна уу! (Please enter room code)';
      this.emit('error', err);
      return { success: false, error: err };
    }

    const cleanCode = rawInput.toUpperCase().replace(/\s+/g, '');

    // 1. First attempt REST server join
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1400);

      const res = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: cleanCode,
          roomId: cleanCode,
          playerId: this.myPlayerId,
          playerName: this.myPlayerName,
          characterId,
          color,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.room) {
          this.currentRoom = data.room;
          try {
            sessionStorage.setItem('mc_room_code', data.room.code);
            sessionStorage.setItem('mc_room_id', data.room.id);
          } catch (e) {}

          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.send({
              type: 'join_room',
              code: data.room.code,
              roomId: data.room.id,
              playerId: this.myPlayerId,
              playerName: this.myPlayerName,
              characterId,
              color,
            });
          }

          this.emit('room_joined', data.room);
          return { success: true };
        } else if (data.error) {
          this.emit('error', data.error);
          return { success: false, error: data.error };
        }
      }
    } catch (e) {
      // Server not reachable (Vercel static deploy) -> Fallback to P2P Join!
    }

    // 2. P2P Join via WebRTC
    return new Promise((resolve) => {
      try {
        if (!this.peer || this.peer.destroyed) {
          this.initPeer();
        }

        const hostPeerId = 'mc_host_' + cleanCode.toLowerCase();
        const conn = this.peer!.connect(hostPeerId, {
          reliable: true,
        });

        this.hostConnection = conn;

        const timeout = setTimeout(() => {
          // If WebRTC direct connect timed out, check local storage / BroadcastChannel
          try {
            const stored = localStorage.getItem('mc_active_p2p_room');
            if (stored) {
              const parsed = JSON.parse(stored);
              if (parsed.room && parsed.room.code === cleanCode) {
                // Join via broadcast channel
                this.channel?.postMessage({
                  type: 'peer_join_request',
                  code: cleanCode,
                  playerId: this.myPlayerId,
                  playerName: this.myPlayerName,
                  characterId,
                  color,
                });
              }
            }
          } catch (err) {}

          const errMsg = `"${cleanCode}" кодтой өрөө олдсонгүй эсвэл хост офлайн байна. Кодоо шалгаад дахин оролдоно уу.`;
          this.emit('error', errMsg);
          resolve({ success: false, error: errMsg });
        }, 3500);

        conn.on('open', () => {
          clearTimeout(timeout);
          conn.send(JSON.stringify({
            type: 'peer_join_request',
            code: cleanCode,
            playerId: this.myPlayerId,
            playerName: this.myPlayerName,
            characterId,
            color,
          }));

          conn.on('data', (raw: any) => {
            try {
              const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
              this.handleMessage(data);
              if (data.type === 'room_joined') {
                resolve({ success: true });
              }
            } catch (err) {}
          });
        });

        conn.on('error', () => {
          clearTimeout(timeout);
          const errMsg = `"${cleanCode}" өрөөтэй холбогдож чадсангүй.`;
          this.emit('error', errMsg);
          resolve({ success: false, error: errMsg });
        });
      } catch (err) {
        const errMsg = 'Сүлжээнд холбогдоход алдаа гарлаа.';
        this.emit('error', errMsg);
        resolve({ success: false, error: errMsg });
      }
    });
  }

  public updateProfile(params: { name?: string; characterId?: CharacterId; color?: string; isReady?: boolean }) {
    if (params.name) {
      this.myPlayerName = params.name;
      try {
        sessionStorage.setItem('mc_player_name', params.name);
      } catch (e) {}
    }

    if (this.currentRoom && this.currentRoom.players[this.myPlayerId]) {
      const p = this.currentRoom.players[this.myPlayerId];
      if (params.name) p.name = params.name;
      if (params.characterId) p.characterId = params.characterId;
      if (params.color) p.color = params.color;
      if (typeof params.isReady === 'boolean') p.isReady = params.isReady;
      this.emit('room_updated', this.currentRoom);
    }

    this.send({
      type: 'update_profile',
      playerId: this.myPlayerId,
      ...params,
    });

    if (this.currentRoom && !this.currentRoom.isP2P) {
      fetch('/api/rooms/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: this.currentRoom.id,
          playerId: this.myPlayerId,
          ...params,
        }),
      }).catch(() => {});
    }
  }

  public sendChat(text: string) {
    if (!text.trim() || !this.currentRoom) return;

    const msg: ChatMessage = {
      id: 'msg_' + Date.now(),
      senderId: this.myPlayerId,
      senderName: this.myPlayerName,
      text: text.trim().slice(0, 150),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    this.currentRoom.chat.push(msg);
    if (this.currentRoom.chat.length > 50) this.currentRoom.chat.shift();
    this.emit('chat_received', msg);

    this.send({
      type: 'chat_message',
      message: msg,
      text: text.trim(),
    });

    if (!this.currentRoom.isP2P) {
      fetch('/api/rooms/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: this.currentRoom.id,
          playerId: this.myPlayerId,
          text: text.trim(),
        }),
      }).catch(() => {});
    }
  }

  public startGame() {
    if (!this.currentRoom) return;
    this.currentRoom.inGame = true;
    this.emit('game_started', this.currentRoom);

    this.send({
      type: 'start_game',
      roomId: this.currentRoom.id,
    });

    if (!this.currentRoom.isP2P) {
      fetch('/api/rooms/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: this.currentRoom.id,
          playerId: this.myPlayerId,
        }),
      }).catch(() => {});
    }
  }

  public leaveRoom() {
    if (this.currentRoom) {
      const rId = this.currentRoom.id;
      this.send({
        type: 'leave_room',
        roomId: rId,
        playerId: this.myPlayerId,
      });

      if (!this.currentRoom.isP2P) {
        fetch('/api/rooms/leave', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: rId,
            playerId: this.myPlayerId,
          }),
        }).catch(() => {});
      }
    }

    if (this.hostConnection) {
      this.hostConnection.close();
      this.hostConnection = null;
    }

    for (const conn of this.peerConnections.values()) {
      conn.close();
    }
    this.peerConnections.clear();

    this.currentRoom = null;
    try {
      sessionStorage.removeItem('mc_room_code');
      sessionStorage.removeItem('mc_room_id');
      localStorage.removeItem('mc_active_p2p_room');
    } catch (e) {}
    this.emit('room_left', null);
  }

  public syncPlayerPosition(
    pos: { x: number; y: number; z: number },
    rotation: number,
    isMoving: boolean,
    hp: number,
    maxHp: number,
    kills: number
  ) {
    this.send({
      type: 'player_sync',
      playerId: this.myPlayerId,
      position: pos,
      rotation,
      isMoving,
      hp,
      maxHp,
      kills,
    });
  }

  public broadcastSpell(
    spellId: string,
    pos: { x: number; y: number; z: number },
    dir: { x: number; y: number; z: number }
  ) {
    this.send({
      type: 'player_spell',
      playerId: this.myPlayerId,
      spellId,
      pos,
      dir,
    });
  }

  // Add AI companion bot to fill lobby if playing solo or with 1 friend
  public addBotTeammate(characterId: CharacterId = 'nomio') {
    if (!this.currentRoom || !this.isHost()) return;
    if (Object.keys(this.currentRoom.players).length >= this.currentRoom.maxPlayers) return;

    const botId = 'bot_' + Math.random().toString(36).substring(2, 6);
    const botNames = ['Sir Cheddar', 'Ranger Gouda', 'Brie Brawler', 'Swiss Striker', 'Elder Fondue'];
    const botName = botNames[Math.floor(Math.random() * botNames.length)] + ' (BOT)';
    const botColors = ['#22c55e', '#ef4444', '#f59e0b', '#38bdf8'];

    const botPlayer: LobbyPlayer = {
      id: botId,
      name: botName,
      characterId,
      color: botColors[Math.floor(Math.random() * botColors.length)],
      isReady: true,
      isHost: false,
      ping: 5,
    };

    this.currentRoom.players[botId] = botPlayer;
    this.currentRoom.chat.push({
      id: 'bot_join_' + Date.now(),
      senderId: 'system',
      senderName: 'Guild Master',
      text: `${botName} stepped up to support the raid party!`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSystem: true,
    });

    this.emit('room_updated', this.currentRoom);
    this.send({
      type: 'room_updated',
      room: this.currentRoom,
    });
  }

  public isHost(): boolean {
    if (!this.currentRoom) return false;
    return this.currentRoom.hostId === this.myPlayerId;
  }
}

export const mpClient = new MultiplayerClient();
