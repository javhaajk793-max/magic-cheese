import React, { useEffect } from 'react';
import { CharacterId } from '../game/types';
import { CHARACTER_PRESETS } from '../game/engine';
import { Sparkles, Play, Volume2, VolumeX, Swords, Palette, Users } from 'lucide-react';

interface TitleScreenProps {
  selectedCharacterId: CharacterId;
  onStart: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenColorAtelier: () => void;
  onOpenCharacterSelect: () => void;
  onOpenMultiplayerLobby: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  selectedCharacterId,
  onStart,
  isMuted,
  onToggleMute,
  onOpenColorAtelier,
  onOpenCharacterSelect,
  onOpenMultiplayerLobby,
}) => {
  const activeChar = CHARACTER_PRESETS[selectedCharacterId] || CHARACTER_PRESETS.baldan;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onStart]);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6 md:p-10 z-20 overflow-hidden">
      {/* Top Header Row with sound toggle and buttons */}
      <div className="flex justify-between items-center w-full">
        <div className="flex items-center gap-2 text-amber-400 text-xs tracking-widest uppercase font-semibold font-mono-numbers bg-amber-950/60 border border-amber-800/60 px-3 py-1.5 rounded-full pointer-events-auto shadow">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>20 WAVES BOSS GAUNTLET &middot; 9 KINGS</span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Multiplayer Online Lobby Button */}
          <button
            onClick={onOpenMultiplayerLobby}
            className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-950/90 to-blue-950/90 hover:from-cyan-900 hover:to-blue-900 border border-cyan-500/80 px-3.5 py-1.5 rounded-full text-cyan-200 transition-all cursor-pointer text-xs font-mono-numbers shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:scale-105"
            title="Open Online Co-Op Lobby"
          >
            <Users className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="font-fantasy font-semibold">Online Lobby</span>
          </button>

          {/* Hero Selection Button */}
          <button
            onClick={onOpenCharacterSelect}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-950/80 to-amber-950/80 hover:from-emerald-900 hover:to-amber-900 border border-emerald-500/70 px-3.5 py-1.5 rounded-full text-emerald-200 transition-all cursor-pointer text-xs font-mono-numbers shadow-lg hover:scale-105"
            title="Choose Hero (Baldan / Nomio / Cheddalf)"
          >
            <Swords className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-fantasy font-semibold">3 Heroes</span>
          </button>

          <button
            onClick={onOpenColorAtelier}
            className="flex items-center gap-1.5 bg-gradient-to-r from-purple-950/80 to-amber-950/80 hover:from-purple-900 hover:to-amber-900 border border-amber-600/70 px-3.5 py-1.5 rounded-full text-amber-200 transition-all cursor-pointer text-xs font-mono-numbers shadow-lg hover:scale-105"
            title="Open 10,000 Colors Atelier"
          >
            <span>🎨</span>
            <span className="font-fantasy font-semibold">10,000 Colors</span>
          </button>

          <button
            onClick={onToggleMute}
            className="flex items-center gap-2 bg-amber-950/70 hover:bg-amber-900 border border-amber-800/80 px-3 py-1.5 rounded-full text-amber-200 transition-colors cursor-pointer text-xs font-mono-numbers"
            title="Toggle Audio"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-amber-500" /> : <Volume2 className="w-4 h-4 text-amber-300" />}
            <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Sound On'}</span>
          </button>
        </div>
      </div>

      {/* Hero Centerpiece: Bespoke SVG Title Lockup */}
      <div className="flex flex-col items-center justify-center my-auto text-center max-w-2xl mx-auto">
        {/* Bespoke Inline SVG Logo */}
        <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 mb-3 sm:mb-5 cheese-glow">
          <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
            <defs>
              <linearGradient id="cheeseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
              <linearGradient id="runeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Arcane Rune Halo */}
            <circle cx="100" cy="100" r="90" fill="none" stroke="url(#runeGrad)" strokeWidth="2.5" strokeDasharray="8 6" opacity="0.8" />
            <circle cx="100" cy="100" r="80" fill="none" stroke="#f59e0b" strokeWidth="1.5" opacity="0.6" />

            {/* Glowing Golden Cheese Wedge */}
            <path
              d="M 100,28 L 168,145 A 90 90 0 0 1 32,145 Z"
              fill="url(#cheeseGrad)"
              stroke="#fef08a"
              strokeWidth="3"
              filter="url(#glow)"
            />

            {/* Swiss Cheese Arcane Cavities */}
            <circle cx="100" cy="88" r="16" fill="#78350f" opacity="0.9" />
            <circle cx="97" cy="85" r="14" fill="#451a03" />
            <circle cx="132" cy="125" r="12" fill="#78350f" opacity="0.9" />
            <circle cx="70" cy="120" r="14" fill="#78350f" opacity="0.9" />
            <circle cx="100" cy="138" r="8" fill="#78350f" opacity="0.8" />

            {/* Archmage Wizard Staff overlay */}
            <line x1="130" y1="40" x2="65" y2="165" stroke="#451a03" strokeWidth="6" strokeLinecap="round" />
            <circle cx="130" cy="40" r="8" fill="#38bdf8" filter="url(#glow)" />
          </svg>
        </div>

        {/* Title Lockup */}
        <h1 className="font-fantasy text-3xl sm:text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-300 to-amber-600 tracking-wider drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] mb-1">
          MAGIC CHEESE
        </h1>
        <p className="font-fantasy text-sm sm:text-lg text-amber-200/90 tracking-widest font-semibold uppercase mb-3">
          Arcane Fromage &middot; 20 Waves Boss Gauntlet &middot; Co-Op Multiplayer
        </p>

        {/* Active Selected Character Pill Card */}
        <div
          onClick={onOpenCharacterSelect}
          className="pointer-events-auto group mb-4 flex items-center gap-3 bg-stone-950/90 border p-2 sm:px-4 sm:py-2 rounded-2xl shadow-xl hover:scale-105 transition-all cursor-pointer"
          style={{ borderColor: activeChar.accentColor }}
        >
          <span className="text-2xl">{activeChar.avatarEmoji}</span>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-400 font-mono-numbers uppercase">Selected Hero:</span>
              <span className="font-fantasy font-bold text-amber-100 text-sm">{activeChar.name}</span>
            </div>
            <span
              className="text-[11px] font-mono-numbers font-semibold block"
              style={{ color: activeChar.accentColor }}
            >
              Style: {activeChar.fightingStyle} &middot; Click to Change
            </span>
          </div>
        </div>

        {/* 20-Wave Boss Gauntlet Preview */}
        <div className="grid grid-cols-3 gap-2 w-full max-w-lg mx-auto mb-5 bg-stone-950/80 p-2.5 rounded-2xl border border-amber-800/50 text-left">
          <div className="bg-amber-950/40 p-2 rounded-xl border border-amber-700/40">
            <div className="flex items-center gap-1 text-[11px] text-amber-400 font-mono-numbers font-bold">
              <span>🧀</span> Waves 3, 5, 7
            </div>
            <div className="text-[11px] font-fantasy font-bold text-amber-200 mt-0.5 truncate">Golem & Kings</div>
            <div className="text-[9px] text-amber-300/70 font-mono-numbers">Dark & Last King</div>
          </div>

          <div className="bg-cyan-950/40 p-2 rounded-xl border border-cyan-700/50">
            <div className="flex items-center gap-1 text-[11px] text-cyan-300 font-mono-numbers font-bold">
              <span>👑</span> Waves 9, 11, 13
            </div>
            <div className="text-[11px] font-fantasy font-bold text-cyan-200 mt-0.5 truncate">Phantom & Iron</div>
            <div className="text-[9px] text-cyan-300/80 font-mono-numbers font-semibold">Shadow Gorgonzola</div>
          </div>

          <div className="bg-yellow-950/40 p-2 rounded-xl border border-yellow-700/50">
            <div className="flex items-center gap-1 text-[11px] text-yellow-300 font-mono-numbers font-bold">
              <span>⚔️</span> Waves 15, 17, 20
            </div>
            <div className="text-[11px] font-fantasy font-bold text-yellow-200 mt-0.5 truncate">Roquefort & Supreme</div>
            <div className="text-[9px] text-yellow-300/80 font-mono-numbers font-semibold">Overlord King</div>
          </div>
        </div>

        {/* Buttons Row */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <button
            onClick={onStart}
            className="pointer-events-auto group relative inline-flex items-center gap-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-amber-950 font-bold px-6 py-3 rounded-xl text-base shadow-[0_0_28px_rgba(245,158,11,0.6)] hover:shadow-[0_0_36px_rgba(245,158,11,0.85)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-amber-950 transition-transform group-hover:scale-110" />
            <span className="font-fantasy tracking-wider">SOLO RAID</span>
          </button>

          <button
            onClick={onOpenMultiplayerLobby}
            className="pointer-events-auto group relative inline-flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-stone-950 font-extrabold px-6 py-3 rounded-xl text-base shadow-[0_0_25px_rgba(6,182,212,0.6)] hover:shadow-[0_0_35px_rgba(6,182,212,0.9)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <Users className="w-5 h-5" />
            <span className="font-fantasy tracking-wider">ONLINE CO-OP LOBBY</span>
          </button>

          <button
            onClick={onOpenCharacterSelect}
            className="pointer-events-auto inline-flex items-center gap-1.5 bg-stone-900/90 hover:bg-stone-800 text-amber-300 border border-amber-600/70 font-fantasy font-bold px-3.5 py-3 rounded-xl text-sm transition-all shadow-md cursor-pointer hover:scale-105"
          >
            <Swords className="w-4 h-4 text-amber-400" />
            <span>HEROES</span>
          </button>

          <button
            onClick={onOpenColorAtelier}
            className="pointer-events-auto inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-950 via-purple-950 to-pink-950 hover:border-yellow-300 text-amber-200 border border-purple-500/70 font-fantasy font-bold px-3.5 py-3 rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)] cursor-pointer hover:scale-105"
          >
            <Palette className="w-4 h-4 text-pink-400" />
            <span>10,000 COLORS</span>
          </button>
        </div>
      </div>

      {/* Flat Control-Hint Line */}
      <div className="w-full flex justify-center items-center pb-1">
        <p className="text-[11px] sm:text-xs font-mono-numbers text-amber-300/80 bg-stone-950/80 px-4 py-1.5 rounded-lg border border-amber-900/40 text-center tracking-wide">
          WASD Move &middot; Space / Click Primary Attack &middot; Q Skill 1 &middot; E Skill 2 &middot; Shift Skill 3 &middot; R Ultimate &middot; Esc Pause
        </p>
      </div>
    </div>
  );
};
