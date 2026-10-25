import React, { useState, useEffect } from 'react';
import { mpClient, GameRoom, RoomSummary } from '../game/multiplayer';
import { CharacterId } from '../game/types';
import { CHARACTER_PRESETS } from '../game/engine';
import {
  Users,
  Plus,
  Play,
  Copy,
  Check,
  Send,
  Bot,
  RefreshCw,
  LogOut,
  Radio,
  Sparkles,
  MessageSquare,
  AlertCircle,
  Share2,
  Info,
  Loader2,
} from 'lucide-react';

interface MultiplayerLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCharacterId: CharacterId;
  onSelectCharacter: (charId: CharacterId) => void;
  onStartOnlineGame: (room: GameRoom) => void;
}

export const MultiplayerLobbyModal: React.FC<MultiplayerLobbyModalProps> = ({
  isOpen,
  onClose,
  selectedCharacterId,
  onSelectCharacter,
  onStartOnlineGame,
}) => {
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(mpClient.currentRoom);
  const [availableRooms, setAvailableRooms] = useState<RoomSummary[]>(mpClient.availableRooms);
  const [playerName, setPlayerName] = useState<string>(mpClient.myPlayerName);
  const [roomNameInput, setRoomNameInput] = useState<string>('Grand 20-Wave Raid');
  const [roomCodeInput, setRoomCodeInput] = useState<string>('');
  const [chatInput, setChatInput] = useState<string>('');
  const [isCopiedCode, setIsCopiedCode] = useState<boolean>(false);
  const [isCopiedLink, setIsCopiedLink] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState<boolean>(false);
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [maxPlayers, setMaxPlayers] = useState<number>(4);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(mpClient.isConnected);

  // Auto-detect room code from URL on load
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const roomParam = urlParams.get('room');
      if (roomParam) {
        setRoomCodeInput(roomParam.trim().toUpperCase());
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    const unsubList = mpClient.on('room_list', (rooms: RoomSummary[]) => {
      setAvailableRooms(rooms);
    });
    const unsubJoined = mpClient.on('room_joined', (room: GameRoom) => {
      setCurrentRoom(room);
      setIsCreatingRoom(false);
      setIsJoining(false);
      setErrorMessage(null);
      const me = room.players[mpClient.myPlayerId];
      if (me) setIsReady(me.isReady);
    });
    const unsubUpdated = mpClient.on('room_updated', (room: GameRoom) => {
      setCurrentRoom({ ...room });
      const me = room.players[mpClient.myPlayerId];
      if (me) setIsReady(me.isReady);
    });
    const unsubLeft = mpClient.on('room_left', () => {
      setCurrentRoom(null);
      setIsReady(false);
      setIsJoining(false);
    });
    const unsubStarted = mpClient.on('game_started', (room: GameRoom) => {
      onStartOnlineGame(room);
      onClose();
    });
    const unsubChat = mpClient.on('chat_received', () => {
      if (mpClient.currentRoom) {
        setCurrentRoom({ ...mpClient.currentRoom });
      }
    });
    const unsubError = mpClient.on('error', (err: string) => {
      setErrorMessage(err);
      setIsJoining(false);
    });
    const unsubConn = mpClient.on('connection_change', (conn: boolean) => {
      setIsConnected(conn);
    });

    mpClient.refreshRooms();

    return () => {
      unsubList();
      unsubJoined();
      unsubUpdated();
      unsubLeft();
      unsubStarted();
      unsubChat();
      unsubError();
      unsubConn();
    };
  }, [onStartOnlineGame, onClose]);

  if (!isOpen) return null;

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsJoining(true);
    const config = CHARACTER_PRESETS[selectedCharacterId];
    mpClient.myPlayerName = playerName;
    const room = await mpClient.createRoom(roomNameInput, maxPlayers, selectedCharacterId, config.accentColor);
    if (room) {
      setCurrentRoom(room);
      setIsCreatingRoom(false);
    }
    setIsJoining(false);
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = roomCodeInput.trim().toUpperCase().replace(/\s+/g, '');
    if (!clean) {
      setErrorMessage('Өрөөний 4 оронтой кодыг оруулна уу! (Enter room code)');
      return;
    }
    setErrorMessage(null);
    setIsJoining(true);
    const config = CHARACTER_PRESETS[selectedCharacterId];
    mpClient.myPlayerName = playerName;
    const res = await mpClient.joinRoom(clean, selectedCharacterId, config.accentColor);
    if (!res.success && res.error) {
      setErrorMessage(res.error);
    }
    setIsJoining(false);
  };

  const handleQuickJoin = async (roomIdOrCode: string) => {
    setErrorMessage(null);
    setIsJoining(true);
    const config = CHARACTER_PRESETS[selectedCharacterId];
    mpClient.myPlayerName = playerName;
    const res = await mpClient.joinRoom(roomIdOrCode, selectedCharacterId, config.accentColor);
    if (!res.success && res.error) {
      setErrorMessage(res.error);
    }
    setIsJoining(false);
  };

  const handleToggleReady = () => {
    const nextReady = !isReady;
    setIsReady(nextReady);
    mpClient.updateProfile({ isReady: nextReady });
  };

  const handleChangeCharacter = (charId: CharacterId) => {
    onSelectCharacter(charId);
    const config = CHARACTER_PRESETS[charId];
    mpClient.updateProfile({ characterId: charId, color: config.accentColor });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.slice(0, 16);
    setPlayerName(val);
    mpClient.updateProfile({ name: val });
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    mpClient.sendChat(chatInput);
    setChatInput('');
  };

  const handleQuickChat = (text: string) => {
    mpClient.sendChat(text);
  };

  const handleCopyCode = () => {
    if (!currentRoom) return;
    navigator.clipboard.writeText(currentRoom.code);
    setIsCopiedCode(true);
    setTimeout(() => setIsCopiedCode(false), 2000);
  };

  const handleCopyShareLink = () => {
    if (!currentRoom) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}?room=${currentRoom.code}`;
    navigator.clipboard.writeText(shareUrl);
    setIsCopiedLink(true);
    setTimeout(() => setIsCopiedLink(false), 2500);
  };

  const handleStartGame = () => {
    if (!currentRoom) return;
    mpClient.startGame();
    onStartOnlineGame(currentRoom);
    onClose();
  };

  const isHost = currentRoom ? currentRoom.hostId === mpClient.myPlayerId : false;
  const playersList = currentRoom ? Object.values(currentRoom.players) : [];
  const emptySlotsCount = currentRoom ? Math.max(0, currentRoom.maxPlayers - playersList.length) : 0;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-stone-950/90 backdrop-blur-md animate-fade-in pointer-events-auto">
      <div className="bg-stone-900 border-2 border-amber-600/80 rounded-3xl max-w-4xl w-full h-[92vh] max-h-[760px] flex flex-col shadow-[0_0_60px_rgba(245,158,11,0.4)] overflow-hidden">
        {/* LOBBY HEADER */}
        <div className="flex justify-between items-center px-4 sm:px-6 py-3.5 border-b border-amber-800/60 bg-stone-950/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500 flex items-center justify-center shadow">
              <Users className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-fantasy font-bold text-lg sm:text-xl text-amber-200 tracking-wide">
                  ONLINE CO-OP LOBBY
                </h2>
                <span
                  className={`flex items-center gap-1 text-[10px] font-mono-numbers px-2.5 py-0.5 rounded-full font-bold border ${
                    isConnected
                      ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300'
                      : 'bg-amber-950/90 border-amber-500 text-amber-300 animate-pulse'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}
                  />
                  {isConnected ? 'ONLINE (Global Cloud Relay)' : 'CONNECTING...'}
                </span>
              </div>
              <p className="text-stone-400 text-[11px] hidden sm:block">
                Өөр өөр интернет (Wi-Fi, 4G) болон өөр компьютерууд 4 оронтой кодоор шууд холбогдоно! (Vercel Ready)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {currentRoom && (
              <button
                onClick={() => mpClient.leaveRoom()}
                className="flex items-center gap-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700/80 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Өрөөнөөс гарах</span>
                <span className="sm:hidden">Гарах</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-100 text-2xl font-bold px-2 cursor-pointer transition-colors"
            >
              &times;
            </button>
          </div>
        </div>

        {/* ERROR BANNER IF ANY */}
        {errorMessage && (
          <div className="bg-rose-950/90 border-b border-rose-700/80 px-4 py-2.5 flex items-center justify-between text-rose-200 text-xs animate-shake">
            <div className="flex items-center gap-2 font-mono-numbers">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-100 text-sm font-bold ml-2 cursor-pointer"
            >
              &times;
            </button>
          </div>
        )}

        {/* LOBBY BODY */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {!currentRoom ? (
            /* --- SCREEN 1: ROOM BROWSER & CODE ENTRY --- */
            <div className="flex-1 flex flex-col md:flex-row p-4 sm:p-5 gap-4 sm:gap-5 overflow-y-auto">
              {/* Left Column: Player Profile & Quick Code Join */}
              <div className="w-full md:w-84 flex flex-col gap-3.5 shrink-0">
                {/* Profile Card */}
                <div className="bg-stone-950/80 p-4 rounded-2xl border border-amber-800/50 flex flex-col gap-3 shadow">
                  <div className="flex justify-between items-center text-xs text-amber-400 font-fantasy font-bold">
                    <span>ТОГЛОГЧИЙН ПРОФАЙЛ (YOUR HERO)</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  </div>

                  <div>
                    <label className="text-[11px] text-stone-400 block mb-1">Тоглогчийн нэр / Name</label>
                    <input
                      type="text"
                      value={playerName}
                      onChange={handleNameChange}
                      placeholder="Нэрээ оруулна уу..."
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-amber-100 font-semibold focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Hero Switcher */}
                  <div>
                    <label className="text-[11px] text-stone-400 block mb-1.5">Баатар сонгох / Hero</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['baldan', 'nomio', 'cheddalf'] as CharacterId[]).map((cId) => {
                        const cfg = CHARACTER_PRESETS[cId];
                        const isSel = selectedCharacterId === cId;
                        return (
                          <button
                            key={cId}
                            onClick={() => handleChangeCharacter(cId)}
                            className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                              isSel
                                ? 'bg-amber-950/70 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)] scale-102'
                                : 'bg-stone-900/60 border-stone-800 hover:border-stone-700'
                            }`}
                          >
                            <span className="text-xl mb-0.5">{cfg.avatarEmoji}</span>
                            <span className="text-[10px] font-bold text-amber-200 truncate w-full">
                              {cfg.name}
                            </span>
                            <span className="text-[9px] text-stone-400 font-mono-numbers">
                              {cfg.fightingStyle}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Join By Room Code Card */}
                <form
                  onSubmit={handleJoinByCode}
                  className="bg-stone-950/90 p-4 rounded-2xl border-2 border-amber-500/70 shadow-[0_0_20px_rgba(245,158,11,0.2)] flex flex-col gap-2.5"
                >
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-amber-300 font-fantasy font-bold flex items-center gap-1.5">
                      <span>КОДООР НЭГДЭХ (JOIN WITH CODE)</span>
                    </label>
                    <span className="text-[10px] text-amber-400 font-mono-numbers">4 Үсэг/Тоо</span>
                  </div>

                  <p className="text-[11px] text-stone-400 leading-tight">
                    Найзынхаа үүсгэсэн өрөөний 4 оронтой кодыг энд бичээд <span className="text-amber-300 font-bold">JOIN</span> дарна уу:
                  </p>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={roomCodeInput}
                      onChange={(e) => {
                        setRoomCodeInput(e.target.value.toUpperCase());
                        setErrorMessage(null);
                      }}
                      placeholder="жишээ: MTPL"
                      maxLength={6}
                      className="flex-1 bg-stone-900 border-2 border-amber-600/70 rounded-xl px-3 py-2 text-base text-center uppercase tracking-widest font-mono-numbers text-amber-200 focus:outline-none focus:border-amber-400 font-black shadow-inner"
                    />
                    <button
                      type="submit"
                      disabled={isJoining || !roomCodeInput.trim()}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold font-fantasy flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isJoining || !roomCodeInput.trim()
                          ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 shadow-md hover:scale-103'
                      }`}
                    >
                      {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>НЭГДЭХ</span>}
                    </button>
                  </div>
                </form>

                {/* Create Room Toggle Button */}
                <button
                  onClick={() => {
                    setIsCreatingRoom((prev) => !prev);
                    setErrorMessage(null);
                  }}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-stone-950 font-bold py-3 px-4 rounded-2xl shadow-lg cursor-pointer transition-transform hover:scale-102 text-xs font-fantasy tracking-wider"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isCreatingRoom ? 'БУЦАХ (CANCEL)' : 'ШИНЭ ӨРӨӨ ҮҮСГЭХ (CREATE PARTY)'}</span>
                </button>

                {/* How to Play Guide Box */}
                <div className="bg-stone-950/60 p-3 rounded-2xl border border-amber-900/40 text-[11px] text-stone-300 space-y-1.5">
                  <div className="flex items-center gap-1 text-amber-400 font-bold font-fantasy">
                    <Info className="w-3.5 h-3.5" />
                    <span>Хамт тоглох заавар (Vercel & Олон компьютер):</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-stone-400 leading-normal font-sans text-[11px]">
                    <li>Нэг тоглогч нь <b>Шинэ өрөө үүсгэх</b> дарж 4 оронтой код авна.</li>
                    <li>Найздаа тэр 4 оронтой кодоо явуулна (эсвэл Линк хуулж явуулна).</li>
                    <li>Найз нь өөр компьютер, өөр Wi-Fi эсвэл 4G интернетээс кодоо бичээд <b>НЭГДЭХ</b> дарна.</li>
                  </ol>
                </div>
              </div>

              {/* Right Column: Room Browser or Create Form */}
              <div className="flex-1 flex flex-col bg-stone-950/70 p-4 rounded-2xl border border-amber-800/40 min-w-0 shadow">
                {isCreatingRoom ? (
                  /* Create Room Form */
                  <form onSubmit={handleCreateRoom} className="flex flex-col gap-4 max-w-md mx-auto my-auto w-full">
                    <div className="text-center">
                      <h3 className="font-fantasy font-bold text-lg text-amber-200">
                        ШИНЭ ӨРӨӨ ҮҮСГЭХ
                      </h3>
                      <p className="text-stone-400 text-xs">20 Үе &middot; 9 Хаан Боссын Co-Op дайралт</p>
                    </div>

                    <div>
                      <label className="text-xs text-stone-300 block mb-1">Өрөөний нэр / Party Name</label>
                      <input
                        type="text"
                        value={roomNameInput}
                        onChange={(e) => setRoomNameInput(e.target.value)}
                        className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-amber-100 font-medium focus:outline-none focus:border-amber-500"
                        maxLength={24}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs text-stone-300 block mb-1">Тоглогчдын тоо / Max Players (2 - 4)</label>
                      <div className="flex gap-3">
                        {[2, 3, 4].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setMaxPlayers(num)}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              maxPlayers === num
                                ? 'bg-amber-500 text-stone-950 border-amber-400 shadow'
                                : 'bg-stone-900 text-stone-300 border-stone-700 hover:border-stone-600'
                            }`}
                          >
                            {num} Хүн
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-amber-950/40 border border-amber-800/40 p-3 rounded-xl text-[11px] text-amber-300/90 font-mono-numbers">
                      ✨ Үеүд: 20 Wave Gauntlet &middot; 9 King Bosses (Waves 3, 5, 7, 9, 11, 13, 15, 17, 20)
                    </div>

                    <button
                      type="submit"
                      disabled={isJoining}
                      className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-bold py-3 rounded-xl font-fantasy text-sm shadow-lg transition-transform hover:scale-102 cursor-pointer mt-2 flex items-center justify-center gap-2"
                    >
                      {isJoining ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <span>ӨРӨӨ ҮҮСГЭЖ КОД АВАХ</span>
                      )}
                    </button>
                  </form>
                ) : (
                  /* Public Lobbies List */
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2 text-xs font-fantasy font-bold text-amber-300">
                        <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                        <span>НЭЭЛТТЭЙ ӨРӨӨНҮҮД / ACTIVE LOBBIES ({availableRooms.length})</span>
                      </div>
                      <button
                        onClick={() => mpClient.refreshRooms()}
                        className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-amber-300 transition-colors cursor-pointer bg-stone-900 border border-stone-800 px-2.5 py-1 rounded-lg"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Шинэчлэх</span>
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-1">
                      {availableRooms.length === 0 ? (
                        <div className="flex flex-col items-center justify-center my-auto p-6 text-center text-stone-500">
                          <Users className="w-12 h-12 mb-3 opacity-40 text-amber-400" />
                          <p className="text-sm font-fantasy text-stone-300 mb-1">
                            Одоогоор идэвхтэй өрөө алга байна
                          </p>
                          <p className="text-xs max-w-xs text-stone-400 mb-4">
                            Та өөрөө түрүүлж өрөө үүсгэн кодоо найздаа илгээж тоглоорой!
                          </p>
                          <button
                            onClick={() => setIsCreatingRoom(true)}
                            className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-5 py-2.5 rounded-xl text-xs cursor-pointer shadow transition-transform hover:scale-103 font-fantasy"
                          >
                            + ШИНЭ ӨРӨӨ ҮҮСГЭХ
                          </button>
                        </div>
                      ) : (
                        availableRooms.map((r) => (
                          <div
                            key={r.id}
                            className="flex items-center justify-between p-3.5 rounded-xl bg-stone-900/90 hover:bg-stone-900 border border-amber-900/40 hover:border-amber-500/60 transition-all shadow"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-amber-950/80 border-2 border-amber-500/60 flex flex-col items-center justify-center text-sm font-black text-amber-300 font-mono-numbers shadow">
                                <span className="text-[9px] text-stone-400 tracking-normal font-sans font-normal">КОД</span>
                                <span>{r.code}</span>
                              </div>
                              <div>
                                <h4 className="font-fantasy font-bold text-amber-100 text-sm">
                                  {r.name}
                                </h4>
                                <div className="flex items-center gap-2 text-[11px] text-stone-400 font-mono-numbers">
                                  <span>Хост: <b className="text-amber-300 font-sans">{r.hostName || 'Leader'}</b></span>
                                  <span>&middot;</span>
                                  <span className={r.inGame ? 'text-amber-400' : 'text-emerald-400 font-semibold'}>
                                    {r.inGame ? 'Тулалдаж байна' : 'Хүлээлгийн өрөөнд'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono-numbers font-bold text-amber-300 bg-stone-950 px-3 py-1.5 rounded-lg border border-stone-800">
                                {r.playerCount} / {r.maxPlayers}
                              </span>
                              <button
                                onClick={() => handleQuickJoin(r.code)}
                                disabled={r.playerCount >= r.maxPlayers || isJoining}
                                className={`px-4 py-2 rounded-xl text-xs font-bold font-fantasy cursor-pointer transition-transform hover:scale-105 ${
                                  r.playerCount >= r.maxPlayers
                                    ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                                    : 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow'
                                }`}
                              >
                                НЭГДЭХ
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* --- SCREEN 2: ACTIVE PARTY LOBBY --- */
            <div className="flex-1 flex flex-col md:flex-row p-4 gap-4 overflow-hidden">
              {/* Left Column: 4 Player Pods & Controls */}
              <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
                {/* Room Info & Code Sharing Header */}
                <div className="bg-stone-950/90 p-3.5 rounded-2xl border-2 border-amber-600/70 shadow flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-amber-400 font-mono-numbers uppercase font-bold">
                        ӨРӨӨ / PARTY:
                      </span>
                      <h3 className="font-fantasy font-bold text-amber-200 text-base">{currentRoom.name}</h3>
                    </div>
                    <span className="text-[11px] text-stone-400 font-mono-numbers">
                      Горим: 20 Үе &middot; 9 Хаан Босс &middot; {playersList.length}/{currentRoom.maxPlayers} Тоглогч
                    </span>
                  </div>

                  {/* Room Code & Quick Copy Buttons */}
                  <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end bg-stone-900/80 p-2 sm:p-2.5 rounded-xl border border-amber-800/60">
                    <div className="text-left sm:text-right pr-2">
                      <span className="text-[9px] text-stone-400 block uppercase font-mono-numbers">
                        ӨРӨӨНИЙ КОД (CODE)
                      </span>
                      <span className="font-mono-numbers font-black text-amber-300 text-lg sm:text-xl tracking-widest">
                        {currentRoom.code}
                      </span>
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        onClick={handleCopyCode}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 transition-colors cursor-pointer border border-amber-500/50 text-xs font-bold"
                        title="Код хуулах"
                      >
                        {isCopiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        <span>{isCopiedCode ? 'Хууллаа!' : 'Код хуулах'}</span>
                      </button>

                      <button
                        onClick={handleCopyShareLink}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 transition-colors cursor-pointer text-xs font-bold font-fantasy"
                        title="Шууд орох холбоос хуулах"
                      >
                        {isCopiedLink ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                        <span>{isCopiedLink ? 'Холбоос хууллаа!' : 'Линк хуулах'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4 Player Slots Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                  {/* Occupied Player Pods */}
                  {playersList.map((player) => {
                    const cfg = CHARACTER_PRESETS[player.characterId] || CHARACTER_PRESETS.baldan;
                    const isMe = player.id === mpClient.myPlayerId;

                    return (
                      <div
                        key={player.id}
                        className={`p-3 rounded-2xl border flex flex-col justify-between transition-all ${
                          isMe
                            ? 'bg-amber-950/40 border-amber-400/90 shadow-[0_0_18px_rgba(245,158,11,0.3)]'
                            : 'bg-stone-950/80 border-stone-800'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border shadow-inner"
                              style={{
                                backgroundColor: `${player.color || cfg.accentColor}25`,
                                borderColor: player.color || cfg.accentColor,
                              }}
                            >
                              {cfg.avatarEmoji}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-fantasy font-bold text-amber-100 text-sm">
                                  {player.name}
                                </span>
                                {player.isHost && (
                                  <span className="bg-amber-500 text-stone-950 font-black text-[9px] px-1.5 py-0.2 rounded font-mono-numbers">
                                    ХОСТ
                                  </span>
                                )}
                                {isMe && (
                                  <span className="bg-sky-500 text-stone-950 font-bold text-[9px] px-1 py-0.2 rounded font-mono-numbers">
                                    ТА
                                  </span>
                                )}
                              </div>
                              <span
                                className="text-[11px] font-mono-numbers font-semibold block"
                                style={{ color: cfg.accentColor }}
                              >
                                {cfg.styleTitle} &middot; {cfg.fightingStyle}
                              </span>
                            </div>
                          </div>

                          {/* Ready Status Badge */}
                          <div
                            className={`flex items-center gap-1 text-[10px] font-mono-numbers font-bold px-2.5 py-1 rounded-full border ${
                              player.isReady
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                                : 'bg-stone-900 text-stone-400 border-stone-700'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${player.isReady ? 'bg-emerald-400' : 'bg-stone-500'}`}
                            />
                            <span>{player.isReady ? 'БЭЛЭН' : 'ХҮЛЭЭЖ БАЙНА'}</span>
                          </div>
                        </div>

                        {/* Interactive Character Select for 'You' */}
                        {isMe && (
                          <div className="mt-2.5 pt-2 border-t border-amber-900/40 flex items-center justify-between">
                            <span className="text-[10px] text-stone-400 font-mono-numbers">Баатар солих:</span>
                            <div className="flex gap-1.5">
                              {(['baldan', 'nomio', 'cheddalf'] as CharacterId[]).map((cId) => (
                                <button
                                  key={cId}
                                  onClick={() => handleChangeCharacter(cId)}
                                  className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                                    selectedCharacterId === cId
                                      ? 'bg-amber-500 text-stone-950 border-amber-400 font-black'
                                      : 'bg-stone-900 text-stone-300 border-stone-700 hover:border-stone-500'
                                  }`}
                                >
                                  {CHARACTER_PRESETS[cId].name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Empty Slots with Bot Fill option */}
                  {Array.from({ length: emptySlotsCount }).map((_, idx) => (
                    <div
                      key={`empty_${idx}`}
                      className="p-4 rounded-2xl border border-dashed border-stone-800 bg-stone-950/40 flex flex-col items-center justify-center text-center gap-2 min-h-[110px]"
                    >
                      <span className="text-stone-600 text-xs font-fantasy">Хоосон байрлал (Empty Slot)</span>
                      {isHost && (
                        <button
                          onClick={() => mpClient.addBotTeammate(idx % 2 === 0 ? 'nomio' : 'baldan')}
                          className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 border border-amber-700/50 hover:border-amber-500 text-amber-300 px-3 py-1.5 rounded-xl text-[11px] font-semibold cursor-pointer transition-all hover:scale-105"
                        >
                          <Bot className="w-3.5 h-3.5" />
                          <span>+ БОТ ТУСЛАХ НЭМЭХ</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Bottom Action Bar */}
                <div className="flex items-center gap-3 pt-2">
                  {/* Ready Toggle */}
                  <button
                    onClick={handleToggleReady}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-fantasy font-bold text-sm transition-all shadow-lg cursor-pointer ${
                      isReady
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                        : 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-amber-500/30 hover:scale-102'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>{isReady ? 'ТА БЭЛЭН БОЛСОН! (READY)' : 'БЭЛЭН БОЛОХ (READY UP)'}</span>
                  </button>

                  {/* Host Start Raid Button */}
                  {isHost ? (
                    <button
                      onClick={handleStartGame}
                      className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-extrabold py-3 rounded-2xl font-fantasy text-sm shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all transform hover:scale-102 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-stone-950" />
                      <span>20 ҮЕИЙН ТУЛААН ЭХЛҮҮЛЭХ</span>
                    </button>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-xs text-stone-400 font-mono-numbers bg-stone-950/80 border border-stone-800 py-3 rounded-2xl">
                      Өрөө үүсгэгч (Хост) тулааныг эхлүүлэхийг хүлээж байна...
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Party Chat & Tactical Comms */}
              <div className="w-full md:w-80 flex flex-col bg-stone-950/90 rounded-2xl border border-amber-800/50 p-3 overflow-hidden shadow">
                <div className="flex items-center gap-1.5 text-xs font-fantasy font-bold text-amber-300 pb-2 border-b border-amber-900/50">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                  <span>БАГИЙН ЧАТ (PARTY COMMS)</span>
                </div>

                {/* Chat Log */}
                <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 py-2 pr-1 text-xs font-mono-numbers">
                  {currentRoom.chat.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-2 rounded-xl leading-tight ${
                        msg.isSystem
                          ? 'bg-amber-950/40 border border-amber-800/40 text-amber-300/90 text-[11px]'
                          : msg.senderId === mpClient.myPlayerId
                          ? 'bg-amber-500/20 text-amber-100 self-end border border-amber-600/40 max-w-[90%]'
                          : 'bg-stone-900 text-stone-200 self-start border border-stone-800 max-w-[90%]'
                      }`}
                    >
                      {!msg.isSystem && (
                        <div className="flex justify-between text-[10px] text-stone-400 mb-0.5">
                          <span className="font-bold text-amber-400">{msg.senderName}</span>
                          <span className="text-stone-500">{msg.time}</span>
                        </div>
                      )}
                      <span>{msg.text}</span>
                    </div>
                  ))}
                </div>

                {/* Tactical Quick Pings */}
                <div className="grid grid-cols-2 gap-1 py-1.5 border-t border-amber-900/40">
                  <button
                    onClick={() => handleQuickChat('⚔️ Би бэлэн!')}
                    className="bg-stone-900 hover:bg-stone-800 text-stone-300 text-[10px] p-1.5 rounded-lg border border-stone-800 text-left truncate cursor-pointer"
                  >
                    ⚔️ Би бэлэн!
                  </button>
                  <button
                    onClick={() => handleQuickChat('🧀 20-р үеийг давъя!')}
                    className="bg-stone-900 hover:bg-stone-800 text-stone-300 text-[10px] p-1.5 rounded-lg border border-stone-800 text-left truncate cursor-pointer"
                  >
                    🧀 20-р үеийг давъя!
                  </button>
                  <button
                    onClick={() => handleQuickChat('🛡️ Би боссыг саатуулья!')}
                    className="bg-stone-900 hover:bg-stone-800 text-stone-300 text-[10px] p-1.5 rounded-lg border border-stone-800 text-left truncate cursor-pointer"
                  >
                    🛡️ Би боссыг саатуулья!
                  </button>
                  <button
                    onClick={() => handleQuickChat('👑 Хааныг цуг цохьё!')}
                    className="bg-stone-900 hover:bg-stone-800 text-stone-300 text-[10px] p-1.5 rounded-lg border border-stone-800 text-left truncate cursor-pointer"
                  >
                    👑 Хааныг цуг цохьё!
                  </button>
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSendChat} className="flex gap-1.5 pt-1">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Чат бичих..."
                    className="flex-1 bg-stone-900 border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs text-amber-100 focus:outline-none focus:border-amber-500 font-mono-numbers"
                  />
                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-400 text-stone-950 p-2 rounded-xl transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
