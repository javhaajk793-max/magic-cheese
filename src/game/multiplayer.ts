import { CharacterId } from './types';

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
}

type EventCallback<T = any> = (data: T) => void;

class MultiplayerClient {
  private ws: WebSocket | null = null;
  private channel: BroadcastChannel | null = null;
  public isConnected: boolean = false;
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
        this.myPlayerId = 'p_' + Math.random().toString(36).substr(2, 6);
        sessionStorage.setItem('mc_player_id', this.myPlayerId);
      }

      const storedName = sessionStorage.getItem('mc_player_name');
      if (storedName) {
        this.myPlayerName = storedName;
      } else {
        this.myPlayerName = 'Wizard ' + this.myPlayerId.slice(-3).toUpperCase();
      }
    } catch (e) {
      this.myPlayerId = 'p_' + Math.random().toString(36).substr(2, 6);
      this.myPlayerName = 'Hero ' + this.myPlayerId.slice(-3).toUpperCase();
    }

    // BroadcastChannel for instant local multi-tab sync
    try {
      this.channel = new BroadcastChannel('arcane_cheese_mp');
      this.channel.onmessage = (event) => {
        this.handleMessage(event.data);
      };
    } catch (e) {}

    this.connect();
    this.startPolling();
  }

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.emit('connection_change', true);
        this.refreshRooms();

        // If we were already in a room, re-attach to the room on the new WebSocket!
        if (this.currentRoom) {
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

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (err) {
          console.error('Failed to parse WS message:', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.ws = null;
        this.emit('connection_change', false);
        // Retry connection after delay
        setTimeout(() => this.connect(), 3000);
      };

      this.ws.onerror = () => {
        this.isConnected = false;
        this.emit('connection_change', false);
      };
    } catch (err) {
      this.isConnected = false;
      this.emit('connection_change', false);
    }
  }

  // Periodic polling fallback to guarantee rooms stay synchronized
  private startPolling() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = setInterval(async () => {
      // 1. If inside a room, fetch current room state
      if (this.currentRoom) {
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
      } else {
        // 2. If browsing lobby, refresh available rooms
        this.refreshRooms();
      }
    }, 3000);
  }

  private handleMessage(data: any) {
    if (!data || !data.type) return;

    switch (data.type) {
      case 'room_list': {
        this.availableRooms = data.rooms || [];
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

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(data));
      } catch (e) {}
    }
    // Also broadcast to other local browser tabs
    if (this.channel) {
      try {
        this.channel.postMessage(data);
      } catch (e) {}
    }
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
    // 1. Try REST fetch for 100% reliability
    try {
      const res = await fetch('/api/rooms');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.rooms)) {
          this.availableRooms = json.rooms;
          this.emit('room_list', this.availableRooms);
          return;
        }
      }
    } catch (e) {}

    // 2. Also ask WS
    this.send({ type: 'list_rooms' });
  }

  public async createRoom(
    roomName: string,
    maxPlayers: number,
    characterId: CharacterId,
    color: string
  ): Promise<GameRoom | null> {
    try {
      // 1. Call REST endpoint
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
      });

      const data = await res.json();
      if (data.success && data.room) {
        this.currentRoom = data.room;
        try {
          sessionStorage.setItem('mc_room_code', data.room.code);
          sessionStorage.setItem('mc_room_id', data.room.id);
        } catch (e) {}

        // Bind WebSocket
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
    } catch (err) {
      console.warn('REST createRoom failed, attempting WS fallback...', err);
    }

    // Fallback via WS
    this.send({
      type: 'create_room',
      playerId: this.myPlayerId,
      playerName: this.myPlayerName,
      roomName,
      maxPlayers,
      characterId,
      color,
    });
    return null;
  }

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

    // Clean code: uppercase, strip spaces
    const cleanCode = rawInput.toUpperCase().replace(/\s+/g, '');

    try {
      // 1. First attempt REST join for deterministic response & clear error messages
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
      });

      const data = await res.json();
      if (data.success && data.room) {
        this.currentRoom = data.room;
        try {
          sessionStorage.setItem('mc_room_code', data.room.code);
          sessionStorage.setItem('mc_room_id', data.room.id);
        } catch (e) {}

        // Associate with WebSocket connection
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
      } else {
        const errMsg = data.error || `"${cleanCode}" кодтой өрөө олдсонгүй!`;
        this.emit('error', errMsg);
        return { success: false, error: errMsg };
      }
    } catch (networkErr) {
      // If REST failed (e.g. offline or fetch error), fallback to WS
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({
          type: 'join_room',
          code: cleanCode,
          roomId: cleanCode,
          playerId: this.myPlayerId,
          playerName: this.myPlayerName,
          characterId,
          color,
        });
        return { success: true };
      }

      const errMsg = 'Сервертэй холбогдож чадсангүй. Та түр хүлээгээд дахин оролдоно уу.';
      this.emit('error', errMsg);
      return { success: false, error: errMsg };
    }
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

    // Send via WS
    this.send({
      type: 'update_profile',
      ...params,
    });

    // Also notify via REST
    if (this.currentRoom) {
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

    // Send via WS
    this.send({
      type: 'chat_message',
      text: text.trim(),
    });

    // Also fire via REST
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

  public startGame() {
    if (!this.currentRoom) return;

    this.send({
      type: 'start_game',
    });

    fetch('/api/rooms/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: this.currentRoom.id,
        playerId: this.myPlayerId,
      }),
    }).catch(() => {});
  }

  public leaveRoom() {
    if (this.currentRoom) {
      const rId = this.currentRoom.id;
      this.send({
        type: 'leave_room',
      });
      fetch('/api/rooms/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: rId,
          playerId: this.myPlayerId,
        }),
      }).catch(() => {});
    }
    this.currentRoom = null;
    try {
      sessionStorage.removeItem('mc_room_code');
      sessionStorage.removeItem('mc_room_id');
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
      spellId,
      pos,
      dir,
    });
  }

  // Add AI companion bot to fill lobby if playing solo or with 1 friend
  public addBotTeammate(characterId: CharacterId = 'nomio') {
    if (!this.currentRoom || !this.isHost()) return;
    if (Object.keys(this.currentRoom.players).length >= this.currentRoom.maxPlayers) return;

    const botId = 'bot_' + Math.random().toString(36).substr(2, 5);
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
  }

  public isHost(): boolean {
    if (!this.currentRoom) return false;
    return this.currentRoom.hostId === this.myPlayerId;
  }
}

export const mpClient = new MultiplayerClient();
