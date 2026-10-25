import { CharacterId } from './types';
import mqtt, { MqttClient } from 'mqtt';

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
  isCloud?: boolean;
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
  isCloud?: boolean;
}

type EventCallback<T = any> = (data: T) => void;

// Public secure WebSocket MQTT brokers with global high-availability
const MQTT_BROKERS = [
  'wss://broker.emqx.io:8084/mqtt',
  'wss://broker.hivemq.com:8884/mqtt',
];

class MultiplayerClient {
  private mqtt: MqttClient | null = null;
  private ws: WebSocket | null = null;
  private channel: BroadcastChannel | null = null;
  private currentBrokerIndex = 0;

  public isConnected: boolean = false;
  public myPlayerId: string = '';
  public myPlayerName: string = '';
  public currentRoom: GameRoom | null = null;
  public availableRooms: RoomSummary[] = [];

  private roomHeartbeatInterval: any = null;
  private localRoomsCache: Map<string, { summary: RoomSummary; timestamp: number }> = new Map();

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
    // 1. Restore or generate persistent player ID in sessionStorage
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

    // 2. BroadcastChannel for instant local multi-tab sync
    try {
      this.channel = new BroadcastChannel('arcane_cheese_mp');
      this.channel.onmessage = (event) => {
        this.handleMessage(event.data);
      };
    } catch (e) {}

    // 3. Connect to Global Cloud WSS Relay (works across different computers & networks on Vercel)
    this.connectCloudRelay();

    // 4. Also connect to local Node WebSocket server if available (e.g. Cloud Run full-stack container)
    this.connectLocalServer();
  }

  // --- Global Cloud WSS Connection (EMQX / HiveMQ) ---
  private connectCloudRelay() {
    if (typeof window === 'undefined') return;

    const brokerUrl = MQTT_BROKERS[this.currentBrokerIndex % MQTT_BROKERS.length];
    const clientId = `mc_${this.myPlayerId}_${Math.random().toString(36).substring(2, 6)}`;

    try {
      this.mqtt = mqtt.connect(brokerUrl, {
        clientId,
        clean: true,
        connectTimeout: 5000,
        reconnectPeriod: 3000,
        keepalive: 30,
      });

      this.mqtt.on('connect', () => {
        this.isConnected = true;
        this.emit('connection_change', true);

        // Subscribe to global lobby room announcements
        this.mqtt?.subscribe('magiccheese/v2/lobby/announce', { qos: 0 });

        // If we are currently in a room, re-subscribe to room topics
        if (this.currentRoom) {
          this.subscribeToRoom(this.currentRoom.code);
        }
      });

      this.mqtt.on('message', (topic, payload) => {
        try {
          const str = payload.toString();
          const data = JSON.parse(str);
          this.handleCloudPacket(topic, data);
        } catch (err) {}
      });

      this.mqtt.on('error', () => {
        // Switch to secondary broker if connection fails
        this.currentBrokerIndex++;
        if (this.mqtt) {
          try {
            this.mqtt.end(true);
          } catch (e) {}
        }
        setTimeout(() => this.connectCloudRelay(), 2000);
      });

      this.mqtt.on('offline', () => {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
          this.isConnected = false;
          this.emit('connection_change', false);
        }
      });
    } catch (e) {
      // Retry secondary broker
      this.currentBrokerIndex++;
      setTimeout(() => this.connectCloudRelay(), 3000);
    }
  }

  // --- Local Server Connection (for Node.js fullstack container) ---
  private connectLocalServer() {
    if (typeof window === 'undefined') return;
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;

      const ws = new WebSocket(wsUrl);
      this.ws = ws;

      ws.onopen = () => {
        this.isConnected = true;
        this.emit('connection_change', true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (err) {}
      };

      ws.onclose = () => {
        this.ws = null;
        // Even if local server is down (like on Vercel), Cloud Relay keeps us online!
        if (this.mqtt && this.mqtt.connected) {
          this.isConnected = true;
          this.emit('connection_change', true);
        }
      };

      ws.onerror = () => {
        this.ws = null;
      };
    } catch (e) {}
  }

  // Subscribe to room topics when entering a room
  private subscribeToRoom(code: string) {
    if (!this.mqtt || !this.mqtt.connected) return;
    const clean = code.toUpperCase();
    this.mqtt.subscribe(`magiccheese/v2/room/${clean}/broadcast`, { qos: 0 });
    this.mqtt.subscribe(`magiccheese/v2/room/${clean}/to/${this.myPlayerId}`, { qos: 0 });
    this.mqtt.subscribe(`magiccheese/v2/room/${clean}/join`, { qos: 0 });
  }

  // Unsubscribe from room topics when leaving
  private unsubscribeFromRoom(code: string) {
    if (!this.mqtt || !this.mqtt.connected) return;
    const clean = code.toUpperCase();
    this.mqtt.unsubscribe(`magiccheese/v2/room/${clean}/broadcast`);
    this.mqtt.unsubscribe(`magiccheese/v2/room/${clean}/to/${this.myPlayerId}`);
    this.mqtt.unsubscribe(`magiccheese/v2/room/${clean}/join`);
  }

  // Handle incoming packets from Cloud Relay (MQTT)
  private handleCloudPacket(topic: string, data: any) {
    if (!data || !data.type) return;

    // 1. Lobby room announcement
    if (topic === 'magiccheese/v2/lobby/announce') {
      if (data.room && data.room.code) {
        this.localRoomsCache.set(data.room.code, {
          summary: data.room,
          timestamp: Date.now(),
        });
        this.pruneAndEmitRooms();
      }
      return;
    }

    // 2. Host receiving a join request from a guest player
    if (topic.endsWith('/join') && data.type === 'peer_join_request') {
      if (!this.currentRoom || !this.isHost()) return;
      if (data.code !== this.currentRoom.code) return;

      const guestId = data.playerId;
      const currentCount = Object.keys(this.currentRoom.players).length;

      if (currentCount >= this.currentRoom.maxPlayers) {
        this.publishCloud(`magiccheese/v2/room/${this.currentRoom.code}/to/${guestId}`, {
          type: 'error',
          message: 'Өрөө дүүрсэн байна! (Room is already full - 4/4)',
        });
        return;
      }

      // Add guest to room
      const guestPlayer: LobbyPlayer = {
        id: guestId,
        name: data.playerName || `Hero ${currentCount + 1}`,
        characterId: data.characterId || 'nomio',
        color: data.color || '#ef4444',
        isReady: false,
        isHost: false,
        ping: 22,
        isDisconnected: false,
      };

      this.currentRoom.players[guestId] = guestPlayer;
      this.currentRoom.chat.push({
        id: 'join_' + Date.now(),
        senderId: 'system',
        senderName: 'Guild Master',
        text: `${guestPlayer.name} joined the raid party!`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isSystem: true,
      });

      // Send room_joined directly to the new guest
      this.publishCloud(`magiccheese/v2/room/${this.currentRoom.code}/to/${guestId}`, {
        type: 'room_joined',
        room: this.currentRoom,
        yourId: guestId,
      });

      // Broadcast room update to everyone in room
      this.publishCloud(`magiccheese/v2/room/${this.currentRoom.code}/broadcast`, {
        type: 'room_updated',
        room: this.currentRoom,
      });

      this.emit('room_updated', this.currentRoom);
      return;
    }

    // 3. Regular room event packets (room_updated, chat, sync, spells, game_started)
    // Ignore echo of our own player movements/spells
    if (data.playerId === this.myPlayerId && (data.type === 'player_sync' || data.type === 'player_spell')) {
      return;
    }

    this.handleMessage(data);
  }

  private pruneAndEmitRooms() {
    const now = Date.now();
    const active: RoomSummary[] = [];
    for (const [code, entry] of this.localRoomsCache.entries()) {
      if (now - entry.timestamp < 15000) {
        active.push(entry.summary);
      } else {
        this.localRoomsCache.delete(code);
      }
    }
    this.availableRooms = active;
    this.emit('room_list', active);
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
        this.subscribeToRoom(data.room.code);
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

  // Multi-transport publish (Cloud MQTT + Local WebSocket + BroadcastChannel)
  private send(data: any) {
    const payload = JSON.stringify(data);

    // 1. Cloud Relay
    if (this.currentRoom && this.mqtt && this.mqtt.connected) {
      this.publishCloud(`magiccheese/v2/room/${this.currentRoom.code}/broadcast`, data);
    }

    // 2. Local WebSocket
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(payload);
      } catch (e) {}
    }

    // 3. Local BroadcastChannel
    if (this.channel) {
      try {
        this.channel.postMessage(data);
      } catch (e) {}
    }
  }

  private publishCloud(topic: string, data: any) {
    if (!this.mqtt || !this.mqtt.connected) return;
    try {
      this.mqtt.publish(topic, JSON.stringify(data), { qos: 0 });
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
    // 1. Try local Node server if available
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const res = await fetch('/api/rooms', { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.rooms) && json.rooms.length > 0) {
          this.availableRooms = json.rooms;
          this.emit('room_list', this.availableRooms);
          return;
        }
      }
    } catch (e) {}

    // 2. Discover rooms from cloud relay cache
    this.pruneAndEmitRooms();
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Create Room: Works 100% on Vercel, different computers, same Wi-Fi, and anywhere!
  public async createRoom(
    roomName: string,
    maxPlayers: number,
    characterId: CharacterId,
    color: string
  ): Promise<GameRoom | null> {
    const code = this.generateRoomCode();
    const roomId = 'room_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    const hostPlayer: LobbyPlayer = {
      id: this.myPlayerId,
      name: this.myPlayerName || 'Archmage',
      characterId,
      color,
      isReady: true,
      isHost: true,
      ping: 15,
      isDisconnected: false,
    };

    const room: GameRoom = {
      id: roomId,
      code,
      name: roomName || 'Arcane Raid Team',
      hostId: this.myPlayerId,
      maxPlayers: Math.min(4, Math.max(2, maxPlayers || 4)),
      waveMode: 20,
      inGame: false,
      players: { [this.myPlayerId]: hostPlayer },
      isCloud: true,
      chat: [
        {
          id: 'sys_' + Date.now(),
          senderId: 'system',
          senderName: 'Guild Master',
          text: `Party Lobby created! Room Code: ${code}. Share with friends on any computer/Wi-Fi to raid together!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSystem: true,
        },
      ],
    };

    this.currentRoom = room;
    this.isConnected = true;
    this.emit('connection_change', true);

    try {
      sessionStorage.setItem('mc_room_code', code);
      sessionStorage.setItem('mc_room_id', roomId);
    } catch (e) {}

    // Subscribe to room topics on Cloud Relay
    this.subscribeToRoom(code);

    // Start periodic heartbeat so other computers discover the room in their lobby list
    if (this.roomHeartbeatInterval) clearInterval(this.roomHeartbeatInterval);
    this.roomHeartbeatInterval = setInterval(() => {
      if (!this.currentRoom || !this.isHost()) {
        clearInterval(this.roomHeartbeatInterval);
        return;
      }
      const summary: RoomSummary = {
        id: this.currentRoom.id,
        code: this.currentRoom.code,
        name: this.currentRoom.name,
        playerCount: Object.keys(this.currentRoom.players).length,
        maxPlayers: this.currentRoom.maxPlayers,
        inGame: this.currentRoom.inGame,
        waveMode: this.currentRoom.waveMode,
        hostName: this.currentRoom.players[this.currentRoom.hostId]?.name || 'Archmage',
        isCloud: true,
      };
      this.publishCloud('magiccheese/v2/lobby/announce', { room: summary });
    }, 2500);

    // Also inform local Node server if running
    fetch('/api/rooms/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomName,
        maxPlayers,
        characterId,
        color,
        playerName: this.myPlayerName,
        playerId: this.myPlayerId,
        code,
      }),
    }).catch(() => {});

    this.emit('room_joined', room);
    return room;
  }

  // Join Room: Connects across DIFFERENT computers, DIFFERENT Wi-Fi, or SAME Wi-Fi on Vercel
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

    // 1. Subscribe to Cloud Relay topics for this room code
    this.subscribeToRoom(cleanCode);

    return new Promise((resolve) => {
      let resolved = false;

      const finishJoin = (room: GameRoom) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(joinTimeout);
        this.currentRoom = room;
        try {
          sessionStorage.setItem('mc_room_code', room.code);
          sessionStorage.setItem('mc_room_id', room.id);
        } catch (e) {}
        this.emit('room_joined', room);
        resolve({ success: true });
      };

      // Listen for direct room_joined packet from Host via Cloud Relay
      const unsubJoined = this.on('room_joined', (room: GameRoom) => {
        if (room && room.code.toUpperCase() === cleanCode) {
          unsubJoined();
          finishJoin(room);
        }
      });

      // Send join request via Cloud Relay (reaches Host on ANY computer across the internet)
      const sendJoinRequest = () => {
        const payload = {
          type: 'peer_join_request',
          code: cleanCode,
          playerId: this.myPlayerId,
          playerName: this.myPlayerName,
          characterId,
          color,
        };

        // Publish to Cloud Relay
        this.publishCloud(`magiccheese/v2/room/${cleanCode}/join`, payload);

        // Also publish to local BroadcastChannel (for same-machine multi-tab)
        if (this.channel) {
          try {
            this.channel.postMessage(payload);
          } catch (e) {}
        }
      };

      // Send immediately and retry once after 1 second
      sendJoinRequest();
      const retryTimer = setTimeout(sendJoinRequest, 1000);

      // Also try local Node server in parallel if available
      fetch('/api/rooms/join', {
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
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success && data.room) {
            clearTimeout(retryTimer);
            finishJoin(data.room);
          }
        })
        .catch(() => {});

      // Timeout after 4.5 seconds if Host is offline or code does not exist
      const joinTimeout = setTimeout(() => {
        clearTimeout(retryTimer);
        unsubJoined();
        if (resolved) return;
        resolved = true;
        const errMsg = `"${cleanCode}" кодтой өрөө олдсонгүй! Өрөө үүсгэгч хост өрөөгөө нээсэн эсэх болон 4 оронтой кодоо зөв бичсэн эсэхээ шалгана уу.`;
        this.emit('error', errMsg);
        resolve({ success: false, error: errMsg });
      }, 4500);
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
      type: 'room_updated',
      room: this.currentRoom,
    });
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
      type: 'chat_received',
      message: msg,
    });
  }

  public startGame() {
    if (!this.currentRoom) return;
    this.currentRoom.inGame = true;
    this.emit('game_started', this.currentRoom);

    this.send({
      type: 'game_started',
      room: this.currentRoom,
    });
  }

  public leaveRoom() {
    if (this.currentRoom) {
      const code = this.currentRoom.code;
      if (this.roomHeartbeatInterval) {
        clearInterval(this.roomHeartbeatInterval);
        this.roomHeartbeatInterval = null;
      }

      this.unsubscribeFromRoom(code);
      this.send({
        type: 'room_left',
        roomId: this.currentRoom.id,
        playerId: this.myPlayerId,
      });
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
