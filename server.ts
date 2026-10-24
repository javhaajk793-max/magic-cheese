import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface LobbyPlayer {
  id: string;
  name: string;
  characterId: 'baldan' | 'nomio' | 'cheddalf';
  color: string;
  isReady: boolean;
  isHost: boolean;
  ping: number;
  isDisconnected?: boolean;
  disconnectedAt?: number;
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
  waveMode: number; // 20 Waves Boss Gauntlet
  inGame: boolean;
  createdAt: number;
  lastActiveAt: number;
  players: Record<string, LobbyPlayer>;
  chat: ChatMessage[];
}

const rooms: Record<string, GameRoom> = {};
const clientRooms: Map<WebSocket, { roomId: string; playerId: string }> = new Map();

// Generate a memorable 4-letter room code (omitting confusing characters)
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let attempts = 0;
  while (attempts < 50) {
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Ensure code is unique among active rooms
    const exists = Object.values(rooms).some((r) => r.code === code);
    if (!exists) return code;
    attempts++;
  }
  return 'R' + Math.floor(100 + Math.random() * 900);
}

// Normalize room code to tolerate user typos (spaces, lowercase, 0 vs O, 1 vs I)
export function normalizeRoomCode(input: string): string {
  if (!input) return '';
  return input
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9]/g, '');
}

export function findRoomByCodeOrId(query: string): GameRoom | undefined {
  if (!query) return undefined;
  const clean = normalizeRoomCode(query);
  const raw = query.trim();

  // 1. Direct ID match
  if (rooms[raw]) return rooms[raw];

  // 2. Exact code match
  const directMatch = Object.values(rooms).find((r) => r.code.toUpperCase() === clean);
  if (directMatch) return directMatch;

  // 3. ID match by partial or exact
  const idMatch = Object.values(rooms).find((r) => r.id === raw || r.id.toLowerCase() === raw.toLowerCase());
  if (idMatch) return idMatch;

  // 4. Fuzzy match for lookalike characters (0/O, 1/I)
  const fuzzyClean = clean.replace(/0/g, 'O').replace(/1/g, 'I');
  return Object.values(rooms).find((r) => {
    const fuzzyRCode = r.code.toUpperCase().replace(/0/g, 'O').replace(/1/g, 'I');
    return fuzzyRCode === fuzzyClean;
  });
}

function broadcastToRoom(roomId: string, message: object, excludeWs?: WebSocket) {
  const room = rooms[roomId];
  if (!room) return;
  const payload = JSON.stringify(message);
  for (const [ws, info] of clientRooms.entries()) {
    if (info.roomId === roomId && ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(payload);
      } catch (e) {
        // Ignore dead socket send error
      }
    }
  }
}

function getRoomSummaries() {
  return Object.values(rooms).map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    playerCount: Object.values(r.players).filter((p) => !p.isDisconnected).length || Object.keys(r.players).length,
    maxPlayers: r.maxPlayers,
    inGame: r.inGame,
    waveMode: r.waveMode,
    hostName: r.players[r.hostId]?.name || 'Archmage',
  }));
}

function broadcastRoomList() {
  const roomList = getRoomSummaries();
  const payload = JSON.stringify({ type: 'room_list', rooms: roomList });
  for (const [ws, info] of clientRooms.entries()) {
    if (!info.roomId && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(payload);
      } catch (e) {}
    }
  }
}

// Background room cleanup: keep rooms alive for 15 minutes of zero activity so tab switches don't erase rooms!
setInterval(() => {
  const now = Date.now();
  const fifteenMinutes = 15 * 60 * 1000;
  for (const [roomId, room] of Object.entries(rooms)) {
    const activePlayers = Object.values(room.players).filter((p) => !p.isDisconnected);
    if (activePlayers.length === 0 && now - room.lastActiveAt > fifteenMinutes) {
      delete rooms[roomId];
      broadcastRoomList();
    }
  }
}, 30000);

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      roomsCount: Object.keys(rooms).length,
      activeClients: clientRooms.size,
    });
  });

  // REST Room listing endpoint
  app.get('/api/rooms', (_req, res) => {
    res.json({ success: true, rooms: getRoomSummaries() });
  });

  // REST Single room lookup
  app.get('/api/rooms/:codeOrId', (req, res) => {
    const found = findRoomByCodeOrId(req.params.codeOrId);
    if (!found) {
      res.status(404).json({ success: false, error: 'Room not found. Check code.' });
      return;
    }
    res.json({ success: true, room: found });
  });

  // REST Create Room (Fail-safe guarantee)
  app.post('/api/rooms/create', (req, res) => {
    const data = req.body || {};
    const roomId = 'room_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const code = generateRoomCode();
    const playerId = data.playerId || 'player_' + Math.random().toString(36).substr(2, 6);

    const hostPlayer: LobbyPlayer = {
      id: playerId,
      name: data.playerName || 'Archmage',
      characterId: data.characterId || 'baldan',
      color: data.color || '#22c55e',
      isReady: true,
      isHost: true,
      ping: 18,
      isDisconnected: false,
    };

    const room: GameRoom = {
      id: roomId,
      code,
      name: data.roomName || 'Arcane Raid Team',
      hostId: playerId,
      maxPlayers: Math.min(4, Math.max(2, data.maxPlayers || 4)),
      waveMode: 20,
      inGame: false,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      players: { [playerId]: hostPlayer },
      chat: [
        {
          id: 'sys_' + Date.now(),
          senderId: 'system',
          senderName: 'Guild Master',
          text: `Party created! Room Code: ${code}. Share with your friends!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isSystem: true,
        },
      ],
    };

    rooms[roomId] = room;
    broadcastRoomList();

    res.json({
      success: true,
      room,
      code,
      yourId: playerId,
    });
  });

  // REST Join Room (Fail-safe guarantee with detailed validation)
  app.post('/api/rooms/join', (req, res) => {
    const data = req.body || {};
    const inputCode = data.code || data.roomId || '';
    const targetRoom = findRoomByCodeOrId(inputCode);

    if (!targetRoom) {
      res.status(404).json({
        success: false,
        error: `"${inputCode.toUpperCase()}" кодтой өрөө олдсонгүй! Кодоо зөв оруулсан эсэхээ шалгана уу. (Room not found)`,
      });
      return;
    }

    const playerId = data.playerId || 'player_' + Math.random().toString(36).substr(2, 6);
    const existingPlayer = targetRoom.players[playerId];

    // If player is already in room, re-activate them!
    if (existingPlayer) {
      existingPlayer.isDisconnected = false;
      existingPlayer.name = data.playerName || existingPlayer.name;
      existingPlayer.characterId = data.characterId || existingPlayer.characterId;
      targetRoom.lastActiveAt = Date.now();
      broadcastToRoom(targetRoom.id, { type: 'room_updated', room: targetRoom });
      res.json({ success: true, room: targetRoom, yourId: playerId });
      return;
    }

    const currentActiveCount = Object.values(targetRoom.players).filter((p) => !p.isDisconnected).length;
    if (currentActiveCount >= targetRoom.maxPlayers) {
      res.status(400).json({
        success: false,
        error: 'Энэ өрөө дүүрсэн байна! (Room is already full)',
      });
      return;
    }

    const newPlayer: LobbyPlayer = {
      id: playerId,
      name: data.playerName || `Hero ${Object.keys(targetRoom.players).length + 1}`,
      characterId: data.characterId || 'nomio',
      color: data.color || '#ef4444',
      isReady: false,
      isHost: false,
      ping: 24,
      isDisconnected: false,
    };

    targetRoom.players[playerId] = newPlayer;
    targetRoom.lastActiveAt = Date.now();
    targetRoom.chat.push({
      id: 'join_' + Date.now(),
      senderId: 'system',
      senderName: 'Guild Master',
      text: `${newPlayer.name} joined the raid party!`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSystem: true,
    });

    broadcastToRoom(targetRoom.id, {
      type: 'room_updated',
      room: targetRoom,
    });
    broadcastRoomList();

    res.json({
      success: true,
      room: targetRoom,
      yourId: playerId,
    });
  });

  // REST Update profile
  app.post('/api/rooms/profile', (req, res) => {
    const { roomId, playerId, name, characterId, color, isReady } = req.body || {};
    const room = rooms[roomId];
    if (!room || !room.players[playerId]) {
      res.status(404).json({ success: false, error: 'Room or player not found' });
      return;
    }
    const player = room.players[playerId];
    if (name) player.name = name;
    if (characterId) player.characterId = characterId;
    if (color) player.color = color;
    if (typeof isReady === 'boolean') player.isReady = isReady;
    room.lastActiveAt = Date.now();

    broadcastToRoom(roomId, { type: 'room_updated', room });
    res.json({ success: true, room });
  });

  // REST Send Chat
  app.post('/api/rooms/chat', (req, res) => {
    const { roomId, playerId, text } = req.body || {};
    const room = rooms[roomId];
    if (!room || !room.players[playerId]) {
      res.status(404).json({ success: false, error: 'Room or player not found' });
      return;
    }
    const player = room.players[playerId];
    const msg: ChatMessage = {
      id: 'msg_' + Date.now(),
      senderId: playerId,
      senderName: player.name,
      text: (text || '').slice(0, 150),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    room.chat.push(msg);
    if (room.chat.length > 50) room.chat.shift();
    room.lastActiveAt = Date.now();

    broadcastToRoom(roomId, { type: 'chat_received', message: msg });
    res.json({ success: true, message: msg });
  });

  // REST Start Game
  app.post('/api/rooms/start', (req, res) => {
    const { roomId, playerId } = req.body || {};
    const room = rooms[roomId];
    if (!room || room.hostId !== playerId) {
      res.status(403).json({ success: false, error: 'Only party host can start raid' });
      return;
    }
    room.inGame = true;
    room.lastActiveAt = Date.now();
    broadcastToRoom(roomId, { type: 'game_started', room });
    broadcastRoomList();
    res.json({ success: true, room });
  });

  // REST Leave Room
  app.post('/api/rooms/leave', (req, res) => {
    const { roomId, playerId } = req.body || {};
    const room = rooms[roomId];
    if (room && room.players[playerId]) {
      delete room.players[playerId];
      const remaining = Object.keys(room.players);
      if (remaining.length === 0) {
        delete rooms[roomId];
      } else {
        if (room.hostId === playerId) {
          room.hostId = remaining[0];
          room.players[room.hostId].isHost = true;
        }
        broadcastToRoom(roomId, { type: 'room_updated', room });
      }
      broadcastRoomList();
    }
    res.json({ success: true });
  });

  // WebSocket connection handler
  wss.on('connection', (ws: WebSocket) => {
    clientRooms.set(ws, { roomId: '', playerId: '' });

    // Send initial room list immediately on connect
    ws.send(JSON.stringify({ type: 'room_list', rooms: getRoomSummaries() }));

    ws.on('message', (raw: string) => {
      try {
        const data = JSON.parse(raw.toString());
        const clientInfo = clientRooms.get(ws) || { roomId: '', playerId: '' };

        switch (data.type) {
          case 'list_rooms': {
            ws.send(JSON.stringify({ type: 'room_list', rooms: getRoomSummaries() }));
            break;
          }

          case 'create_room': {
            const roomId = data.roomId || 'room_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            const code = data.code || generateRoomCode();
            const playerId = data.playerId || 'player_' + Math.random().toString(36).substr(2, 6);

            const hostPlayer: LobbyPlayer = {
              id: playerId,
              name: data.playerName || 'Archmage',
              characterId: data.characterId || 'baldan',
              color: data.color || '#22c55e',
              isReady: true,
              isHost: true,
              ping: 18,
              isDisconnected: false,
            };

            const room: GameRoom = {
              id: roomId,
              code,
              name: data.roomName || 'Arcane Raid Team',
              hostId: playerId,
              maxPlayers: Math.min(4, Math.max(2, data.maxPlayers || 4)),
              waveMode: 20,
              inGame: false,
              createdAt: Date.now(),
              lastActiveAt: Date.now(),
              players: { [playerId]: hostPlayer },
              chat: [
                {
                  id: 'sys_' + Date.now(),
                  senderId: 'system',
                  senderName: 'Guild Master',
                  text: `Lobby created! Room Code: ${code}. Share with your party!`,
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  isSystem: true,
                },
              ],
            };

            rooms[roomId] = room;
            clientRooms.set(ws, { roomId, playerId });

            ws.send(JSON.stringify({ type: 'room_joined', room, yourId: playerId }));
            broadcastRoomList();
            break;
          }

          case 'join_room': {
            const inputCode = data.code || data.roomId || '';
            const targetRoom = findRoomByCodeOrId(inputCode);

            if (!targetRoom) {
              ws.send(
                JSON.stringify({
                  type: 'error',
                  message: `"${inputCode.toUpperCase()}" кодтой өрөө олдсонгүй! (Room not found)`,
                })
              );
              return;
            }

            const playerId = data.playerId || 'player_' + Math.random().toString(36).substr(2, 6);
            const existingPlayer = targetRoom.players[playerId];

            if (existingPlayer) {
              existingPlayer.isDisconnected = false;
              if (data.playerName) existingPlayer.name = data.playerName;
              if (data.characterId) existingPlayer.characterId = data.characterId;
              clientRooms.set(ws, { roomId: targetRoom.id, playerId });
              targetRoom.lastActiveAt = Date.now();

              ws.send(JSON.stringify({ type: 'room_joined', room: targetRoom, yourId: playerId }));
              broadcastToRoom(targetRoom.id, { type: 'room_updated', room: targetRoom });
              broadcastRoomList();
              return;
            }

            const activeCount = Object.values(targetRoom.players).filter((p) => !p.isDisconnected).length;
            if (activeCount >= targetRoom.maxPlayers) {
              ws.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Энэ өрөө дүүрсэн байна! (Room is already full)',
                })
              );
              return;
            }

            const newPlayer: LobbyPlayer = {
              id: playerId,
              name: data.playerName || `Hero ${Object.keys(targetRoom.players).length + 1}`,
              characterId: data.characterId || 'nomio',
              color: data.color || '#ef4444',
              isReady: false,
              isHost: false,
              ping: 24,
              isDisconnected: false,
            };

            targetRoom.players[playerId] = newPlayer;
            targetRoom.lastActiveAt = Date.now();
            clientRooms.set(ws, { roomId: targetRoom.id, playerId });

            targetRoom.chat.push({
              id: 'join_' + Date.now(),
              senderId: 'system',
              senderName: 'Guild Master',
              text: `${newPlayer.name} joined the raid party!`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isSystem: true,
            });

            ws.send(JSON.stringify({ type: 'room_joined', room: targetRoom, yourId: playerId }));
            broadcastToRoom(targetRoom.id, { type: 'room_updated', room: targetRoom });
            broadcastRoomList();
            break;
          }

          case 'update_profile': {
            const { roomId, playerId } = clientInfo;
            const room = rooms[roomId];
            if (!room || !room.players[playerId]) return;

            const player = room.players[playerId];
            if (data.name) player.name = data.name;
            if (data.characterId) player.characterId = data.characterId;
            if (data.color) player.color = data.color;
            if (typeof data.isReady === 'boolean') player.isReady = data.isReady;
            room.lastActiveAt = Date.now();

            broadcastToRoom(roomId, { type: 'room_updated', room });
            break;
          }

          case 'chat_message': {
            const { roomId, playerId } = clientInfo;
            const room = rooms[roomId];
            if (!room || !room.players[playerId]) return;

            const player = room.players[playerId];
            const msg: ChatMessage = {
              id: 'msg_' + Date.now(),
              senderId: playerId,
              senderName: player.name,
              text: (data.text || '').slice(0, 150),
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            room.chat.push(msg);
            if (room.chat.length > 50) room.chat.shift();
            room.lastActiveAt = Date.now();

            broadcastToRoom(roomId, { type: 'chat_received', message: msg });
            break;
          }

          case 'start_game': {
            const { roomId, playerId } = clientInfo;
            const room = rooms[roomId];
            if (!room || room.hostId !== playerId) return;

            room.inGame = true;
            room.lastActiveAt = Date.now();
            broadcastToRoom(roomId, { type: 'game_started', room });
            broadcastRoomList();
            break;
          }

          case 'player_sync': {
            const { roomId, playerId } = clientInfo;
            if (!roomId) return;
            broadcastToRoom(
              roomId,
              {
                type: 'player_sync',
                playerId,
                position: data.position,
                rotation: data.rotation,
                isMoving: data.isMoving,
                hp: data.hp,
                maxHp: data.maxHp,
                kills: data.kills,
              },
              ws
            );
            break;
          }

          case 'player_spell': {
            const { roomId, playerId } = clientInfo;
            if (!roomId) return;
            broadcastToRoom(
              roomId,
              {
                type: 'player_spell',
                playerId,
                spellId: data.spellId,
                pos: data.pos,
                dir: data.dir,
              },
              ws
            );
            break;
          }

          case 'leave_room': {
            const { roomId, playerId } = clientInfo;
            const room = rooms[roomId];
            if (room) {
              delete room.players[playerId];
              const remaining = Object.keys(room.players);
              if (remaining.length === 0) {
                delete rooms[roomId];
              } else {
                if (room.hostId === playerId) {
                  room.hostId = remaining[0];
                  room.players[room.hostId].isHost = true;
                }
                broadcastToRoom(roomId, { type: 'room_updated', room });
              }
              broadcastRoomList();
            }
            clientRooms.set(ws, { roomId: '', playerId: '' });
            ws.send(JSON.stringify({ type: 'room_left' }));
            break;
          }
        }
      } catch (err) {
        console.error('WS Error:', err);
      }
    });

    ws.on('close', () => {
      const clientInfo = clientRooms.get(ws);
      if (clientInfo && clientInfo.roomId) {
        const { roomId, playerId } = clientInfo;
        const room = rooms[roomId];
        if (room && room.players[playerId]) {
          // Soft-disconnect with grace period: Do NOT delete room immediately!
          // This allows players to switch apps, copy code, or reconnect without losing the lobby.
          room.players[playerId].isDisconnected = true;
          room.players[playerId].disconnectedAt = Date.now();
          room.lastActiveAt = Date.now();

          broadcastToRoom(roomId, {
            type: 'room_updated',
            room,
          });
          broadcastRoomList();
        }
      }
      clientRooms.delete(ws);
    });
  });

  const isProduction = process.env.NODE_ENV === 'production';
  const distDir = path.resolve(__dirname, 'dist');
  const distIndex = path.resolve(distDir, 'index.html');

  if (isProduction && fs.existsSync(distIndex)) {
    // Production mode serving pre-built bundle
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(distIndex);
    });
  } else {
    // Vite middleware mode with explicit SPA fallback
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Guarantee that any subroute or root route serves index.html via Vite
    app.use('*', async (req, res, next) => {
      try {
        const url = req.originalUrl;
        const htmlPath = path.resolve(__dirname, 'index.html');
        if (fs.existsSync(htmlPath)) {
          let template = fs.readFileSync(htmlPath, 'utf-8');
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
        } else {
          next();
        }
      } catch (e) {
        next(e);
      }
    });
  }

  // App must run on port 3000 (nginx listens on 8080 and reverse proxies to 3000)
  const PORT = 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
