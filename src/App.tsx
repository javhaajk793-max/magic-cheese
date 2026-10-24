import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MagicCheeseGame } from './game/engine';
import { GamePhase, PlayerStats, SpellId, SpellInfo, FloatingText, UpgradeOption, CustomColors, CharacterId } from './game/types';
import { sound } from './game/audio';
import { TitleScreen } from './components/TitleScreen';
import { GameHUD } from './components/GameHUD';
import { UpgradeModal } from './components/UpgradeModal';
import { PauseModal, GameOverModal, VictoryModal, CollectorVictoryModal } from './components/Modals';
import { ColorAtelierModal } from './components/ColorAtelierModal';
import { CharacterSelectModal } from './components/CharacterSelectModal';
import { MobileControls } from './components/MobileControls';
import { ArcadeJukebox } from './components/ArcadeJukebox';
import { MultiplayerLobbyModal } from './components/MultiplayerLobbyModal';
import { mpClient, GameRoom } from './game/multiplayer';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<MagicCheeseGame | null>(null);

  // React UI state synchronized from engine
  const [phase, setPhase] = useState<GamePhase>('title');
  const [selectedCharacterId, setSelectedCharacterId] = useState<CharacterId>('baldan');
  const [isCharacterSelectOpen, setIsCharacterSelectOpen] = useState<boolean>(false);
  const [isMultiplayerLobbyOpen, setIsMultiplayerLobbyOpen] = useState<boolean>(false);
  const [onlineRoom, setOnlineRoom] = useState<GameRoom | null>(null);

  const [stats, setStats] = useState<PlayerStats>({
    characterId: 'baldan',
    hp: 110,
    maxHp: 110,
    mana: 100,
    maxMana: 100,
    manaRegen: 18,
    moveSpeed: 8.0,
    spellPower: 1.0,
    shards: 0,
    level: 1,
    xp: 0,
    nextLevelXp: 80,
    ultimateCharge: 0,
    kills: 0,
    collectorCheese: 0,
    collectorGoal: 10000,
    magnetRadius: 6.0,
    combo: 0,
    comboMultiplier: 1.0,
    isInvisible: false,
    invisibleTimer: 0,
  });
  const [spells, setSpells] = useState<Record<SpellId, SpellInfo>>({} as Record<SpellId, SpellInfo>);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [wave, setWave] = useState<number>(1);
  const [bossHp, setBossHp] = useState<{
    current: number;
    max: number;
    active: boolean;
    bossName?: string;
    bossStyle?: string;
  }>({
    current: 850,
    max: 850,
    active: false,
    bossName: 'The Great Gouda Golem',
    bossStyle: 'Colossus',
  });
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // 10,000 Colors Atelier Modal
  const [isColorAtelierOpen, setIsColorAtelierOpen] = useState<boolean>(false);
  const [customColors, setCustomColors] = useState<CustomColors>({
    robeColor: '#312e81',
    hatColor: '#1e1b4b',
    staffGlowColor: '#fbbf24',
    rainbowMode: false,
    tenThousandCooler: false,
  });

  // Auto-open multiplayer lobby if ?room= query param exists in URL
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('room')) {
        setIsMultiplayerLobbyOpen(true);
      }
    } catch (e) {}
  }, []);

  // Mount engine once on mount
  useEffect(() => {
    if (!mountRef.current) return;

    let lastUiSync = 0;

    const game = new MagicCheeseGame(mountRef.current, {
      onUIUpdate: (newStats, newSpells, newTexts, newPhase) => {
        // Throttle React UI state updates to ~25fps to keep 60fps WebGL loop blazing fast
        const now = performance.now();
        if (now - lastUiSync > 40) {
          lastUiSync = now;
          setStats({ ...newStats });
          setSpells({ ...newSpells });
          setFloatingTexts([...newTexts]);
          setWave(game.wave);
          setPhase(newPhase);
          if (newStats.characterId) {
            setSelectedCharacterId(newStats.characterId);
          }
        }
      },
      onLevelUpTrigger: () => {
        setPhase('level_up');
        if (gameRef.current) {
          gameRef.current.phase = 'level_up';
        }
      },
      onBossHpUpdate: (curr, max, active, bossName, bossStyle) => {
        setBossHp({ current: curr, max, active, bossName, bossStyle });
      },
    });

    gameRef.current = game;
    setSpells({ ...game.spells });

    // Handle Escape for pause toggle
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (game.phase === 'playing') {
          game.setPhase('paused');
          setPhase('paused');
        } else if (game.phase === 'paused') {
          game.setPhase('playing');
          setPhase('playing');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      game.dispose();
      gameRef.current = null;
    };
  }, []);

  // Synchronize multiplayer teammates and spell events
  useEffect(() => {
    const unsubSync = mpClient.on('player_sync', (data) => {
      if (gameRef.current && data.playerId !== mpClient.myPlayerId) {
        gameRef.current.updateTeammatePosition(data.playerId, data.position, data.rotation, data.hp, data.maxHp);
      }
    });

    const unsubSpell = mpClient.on('player_spell', (data) => {
      if (gameRef.current && data.playerId !== mpClient.myPlayerId) {
        gameRef.current.castTeammateSpell(data.playerId, data.spellId, data.pos, data.dir);
      }
    });

    const unsubRoom = mpClient.on('room_updated', (room: GameRoom) => {
      setOnlineRoom({ ...room });
      if (gameRef.current) {
        Object.values(room.players).forEach((p) => {
          if (p.id !== mpClient.myPlayerId) {
            gameRef.current?.addTeammate(p.id, p.name, p.characterId, p.color, false);
          }
        });
      }
    });

    return () => {
      unsubSync();
      unsubSpell();
      unsubRoom();
    };
  }, []);

  const handleStartOnlineGame = useCallback((room: GameRoom) => {
    setOnlineRoom(room);
    setIsMultiplayerLobbyOpen(false);
    if (gameRef.current) {
      gameRef.current.startGame();
      setPhase('playing');
      // Add all teammates
      Object.values(room.players).forEach((p) => {
        if (p.id !== mpClient.myPlayerId) {
          gameRef.current?.addTeammate(p.id, p.name, p.characterId, p.color, false);
        }
      });
    }
  }, []);

  const handleStartGame = useCallback(() => {
    if (gameRef.current) {
      gameRef.current.startGame();
      setPhase('playing');
    }
  }, []);

  const handleRestartGame = useCallback(() => {
    if (gameRef.current) {
      gameRef.current.restartGame();
      setPhase('playing');
    }
  }, []);

  const handleResumeGame = useCallback(() => {
    if (gameRef.current) {
      gameRef.current.setPhase('playing');
      setPhase('playing');
    }
  }, []);

  const handlePauseGame = useCallback(() => {
    if (gameRef.current && gameRef.current.phase === 'playing') {
      gameRef.current.setPhase('paused');
      setPhase('paused');
    }
  }, []);

  const handleToggleMute = useCallback(() => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  }, []);

  const handleCastSpell = useCallback((id: SpellId) => {
    if (gameRef.current) {
      gameRef.current.castSpell(id);
    }
  }, []);

  const handleSelectUpgrade = useCallback((upgrade: UpgradeOption) => {
    if (gameRef.current) {
      upgrade.apply(gameRef.current.playerStats);
      gameRef.current.setPhase('playing');
      setPhase('playing');
    }
  }, []);

  const handleJoystickMove = useCallback((x: number, y: number, active: boolean) => {
    if (gameRef.current) {
      gameRef.current.joystickVec.x = x;
      gameRef.current.joystickVec.y = y;
      gameRef.current.joystickVec.active = active;
    }
  }, []);

  const handleOpenColorAtelier = useCallback(() => {
    setIsColorAtelierOpen(true);
  }, []);

  const handleCloseColorAtelier = useCallback(() => {
    setIsColorAtelierOpen(false);
  }, []);

  const handleOpenCharacterSelect = useCallback(() => {
    setIsCharacterSelectOpen(true);
  }, []);

  const handleCloseCharacterSelect = useCallback(() => {
    setIsCharacterSelectOpen(false);
  }, []);

  const handleSelectCharacter = useCallback((charId: CharacterId) => {
    setSelectedCharacterId(charId);
    if (gameRef.current) {
      gameRef.current.setCharacter(charId);
      setSpells({ ...gameRef.current.spells });
      setStats({ ...gameRef.current.playerStats });
    }
  }, []);

  const handleApplyColors = useCallback((colors: CustomColors) => {
    setCustomColors(colors);
    if (gameRef.current) {
      gameRef.current.setCustomColors(colors);
    }
  }, []);

  const handleToggleTenThousandCooler = useCallback(() => {
    setCustomColors((prev) => {
      const next = { ...prev, tenThousandCooler: !prev.tenThousandCooler };
      if (gameRef.current) {
        gameRef.current.setCustomColors(next);
      }
      return next;
    });
  }, []);

  const handleTriggerCheeseStorm = useCallback(() => {
    if (gameRef.current && gameRef.current.phase === 'playing') {
      gameRef.current.spawnCheeseRain(8);
      sound.playLevelUp();
      gameRef.current.spawnFloatingText('🧀 CHEESE STORM SUMMONED!', 0, 0, '#fbbf24');
    }
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-stone-950 font-sans select-none">
      {/* Isolated Three.js WebGL Mount Container */}
      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full z-0 cursor-crosshair touch-none"
      />

      {/* Title Screen Overlay */}
      {phase === 'title' && (
        <TitleScreen
          selectedCharacterId={selectedCharacterId}
          onStart={handleStartGame}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onOpenColorAtelier={handleOpenColorAtelier}
          onOpenCharacterSelect={handleOpenCharacterSelect}
          onOpenMultiplayerLobby={() => setIsMultiplayerLobbyOpen(true)}
        />
      )}

      {/* Playing Game HUD */}
      {(phase === 'playing' || phase === 'level_up' || phase === 'paused') && (
        <GameHUD
          stats={stats}
          spells={spells}
          floatingTexts={floatingTexts}
          wave={wave}
          bossHp={bossHp}
          isMuted={isMuted}
          customColors={customColors}
          onToggleMute={handleToggleMute}
          onPause={handlePauseGame}
          onCastSpell={handleCastSpell}
          onOpenColorAtelier={handleOpenColorAtelier}
          onOpenCharacterSelect={handleOpenCharacterSelect}
          onTriggerCheeseStorm={handleTriggerCheeseStorm}
          onToggleTenThousandCooler={handleToggleTenThousandCooler}
          onOpenMultiplayerLobby={() => setIsMultiplayerLobbyOpen(true)}
        />
      )}

      {/* Mobile Controls Overlay */}
      {phase === 'playing' && (
        <MobileControls
          onJoystickMove={handleJoystickMove}
          onCastSpell={handleCastSpell}
          spells={spells}
        />
      )}

      {/* Character Selection Modal */}
      {isCharacterSelectOpen && (
        <CharacterSelectModal
          selectedCharacterId={selectedCharacterId}
          onSelectCharacter={handleSelectCharacter}
          onClose={handleCloseCharacterSelect}
          isGameRunning={phase === 'playing'}
        />
      )}

      {/* Level Up Grimoire Modal */}
      {phase === 'level_up' && (
        <UpgradeModal
          stats={stats}
          onSelectUpgrade={handleSelectUpgrade}
        />
      )}

      {/* 10,000 Colors Atelier Modal */}
      {isColorAtelierOpen && (
        <ColorAtelierModal
          customColors={customColors}
          onApplyColors={handleApplyColors}
          onClose={handleCloseColorAtelier}
          selectedCharacterId={selectedCharacterId}
        />
      )}

      {/* Pause Modal */}
      {phase === 'paused' && (
        <PauseModal
          onResume={handleResumeGame}
          onRestart={handleRestartGame}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Game Over Modal */}
      {phase === 'game_over' && (
        <GameOverModal
          stats={stats}
          wave={wave}
          onRestart={handleRestartGame}
        />
      )}

      {/* Wave Victory Modal */}
      {phase === 'victory' && (
        <VictoryModal
          stats={stats}
          onRestart={handleRestartGame}
        />
      )}

      {/* 10,000 Cheese Collector Ascension Victory Modal */}
      {phase === 'collector_victory' && (
        <CollectorVictoryModal
          stats={stats}
          onContinue={handleResumeGame}
          onRestart={handleRestartGame}
        />
      )}

      {/* Arcade Jukebox Player (YouTube 1 Hour Arcade Gaming Music) */}
      <ArcadeJukebox
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        className="fixed bottom-4 left-4 z-40"
      />

      {/* Online Multiplayer Lobby Modal */}
      {isMultiplayerLobbyOpen && (
        <MultiplayerLobbyModal
          isOpen={isMultiplayerLobbyOpen}
          onClose={() => setIsMultiplayerLobbyOpen(false)}
          selectedCharacterId={selectedCharacterId}
          onSelectCharacter={handleSelectCharacter}
          onStartOnlineGame={handleStartOnlineGame}
        />
      )}
    </div>
  );
}
