import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PlayerStats } from '../game/types';
import { Play, RotateCcw, Trophy, Skull, Sparkles, Volume2, VolumeX } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({ onResume, onRestart, isMuted, onToggleMute }) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-none animate-fade-in">
      <div className="bg-stone-900 border-2 border-amber-700/80 p-6 sm:p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl">
        <h2 className="font-fantasy text-3xl font-bold text-amber-200 mb-1">GAME PAUSED</h2>
        <p className="text-stone-400 text-xs mb-6">Rest your paws, Archmage Cheddalf</p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onResume}
            className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold py-3 px-6 rounded-xl transition-transform hover:scale-102 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-stone-950" />
            <span>Resume Quest</span>
          </button>

          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-700 text-amber-200 font-semibold py-3 px-6 rounded-xl border border-stone-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart Dungeon</span>
          </button>

          <button
            onClick={onToggleMute}
            className="flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-medium py-2.5 px-4 rounded-xl border border-stone-700 text-xs transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-amber-500" /> : <Volume2 className="w-4 h-4 text-amber-300" />}
            <span>{isMuted ? 'Unmute Audio' : 'Mute Audio'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface GameOverModalProps {
  stats: PlayerStats;
  wave: number;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ stats, wave, onRestart }) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-none animate-fade-in">
      <div className="bg-stone-900 border-2 border-rose-900/80 p-6 sm:p-8 rounded-3xl max-w-md w-full text-center shadow-[0_0_50px_rgba(225,29,72,0.3)]">
        <div className="w-16 h-16 rounded-full bg-rose-950/80 border-2 border-rose-700 flex items-center justify-center mx-auto mb-4">
          <Skull className="w-8 h-8 text-rose-500" />
        </div>

        <h2 className="font-fantasy text-3xl font-extrabold text-rose-400 mb-1">FALLEN IN BATTLE</h2>
        <p className="text-stone-400 text-xs mb-6">The mold corruption proved too pungent this day...</p>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2.5 bg-stone-950/70 p-4 rounded-2xl border border-stone-800 mb-6">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-stone-500 uppercase font-mono-numbers">Wave</span>
            <span className="font-mono-numbers text-xl font-bold text-amber-300">{wave}/20</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-stone-500 uppercase font-mono-numbers">Monsters Vanquished</span>
            <span className="font-mono-numbers text-xl font-bold text-rose-400">{stats.kills}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-stone-500 uppercase font-mono-numbers">Cheeses Collected</span>
            <span className="font-mono-numbers text-xl font-bold text-amber-400">{stats.collectorCheese.toLocaleString()}</span>
          </div>
        </div>

        <button
          onClick={onRestart}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-amber-500/30 cursor-pointer"
        >
          <RotateCcw className="w-5 h-5" />
          <span className="font-fantasy tracking-wider">TRY AGAIN</span>
        </button>
      </div>
    </div>
  );
};

interface VictoryModalProps {
  stats: PlayerStats;
  onRestart: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({ stats, onRestart }) => {
  useEffect(() => {
    // Launch celebratory confetti
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#fbbf24', '#fef08a', '#a855f7', '#ef4444', '#10b981'],
    });
  }, []);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-none animate-fade-in">
      <div className="bg-stone-900 border-2 border-amber-500/90 p-6 sm:p-8 rounded-3xl max-w-lg w-full text-center shadow-[0_0_60px_rgba(245,158,11,0.5)]">
        <div className="w-16 h-16 rounded-full bg-amber-950/80 border-2 border-amber-400 flex items-center justify-center mx-auto mb-3 animate-bounce">
          <Trophy className="w-8 h-8 text-amber-300" />
        </div>

        <div className="inline-flex items-center gap-1.5 text-amber-400 font-mono-numbers text-[11px] font-bold uppercase tracking-widest bg-amber-950/90 px-3 py-1 rounded-full border border-amber-700/60 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>ALL 20 WAVES CONQUERED &middot; 9 KINGS OVERTHROWN</span>
        </div>

        <h2 className="font-fantasy text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-300 mb-2">
          SUPREME VICTORY OVER ALL KINGS!
        </h2>
        <p className="text-amber-100/90 text-xs sm:text-sm mb-4">
          All 9 ancient kings and the Supreme Sovereign have fallen! The Fromage Realm has achieved ultimate liberation!
        </p>

        {/* Boss Defeat Badges */}
        <div className="grid grid-cols-3 gap-2 bg-stone-950/90 p-3 rounded-2xl border border-amber-800/40 mb-4 text-xs">
          <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-700/40 flex flex-col items-center">
            <span className="text-sm">🧀</span>
            <span className="font-bold text-amber-300 mt-1">Waves 3, 5, 7</span>
            <span className="text-[10px] text-amber-400/80">Golem & Kings</span>
          </div>
          <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-700/40 flex flex-col items-center">
            <span className="text-sm">👑</span>
            <span className="font-bold text-cyan-300 mt-1">Waves 9, 11, 13</span>
            <span className="text-[10px] text-cyan-400/80">Phantom & Iron</span>
          </div>
          <div className="p-2 rounded-xl bg-yellow-950/40 border border-yellow-700/40 flex flex-col items-center">
            <span className="text-sm">⚔️</span>
            <span className="font-bold text-yellow-300 mt-1">Wave 20 Final</span>
            <span className="text-[10px] text-yellow-400/80">Supreme Sovereign</span>
          </div>
        </div>

        {/* Stats breakdown */}
        <div className="grid grid-cols-3 gap-2.5 bg-stone-950/70 p-3.5 rounded-2xl border border-stone-800 mb-6">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-stone-500 uppercase font-mono-numbers">Archmage Level</span>
            <span className="font-mono-numbers text-xl font-bold text-amber-300">Lv.{stats.level}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-stone-500 uppercase font-mono-numbers">Total Slain</span>
            <span className="font-mono-numbers text-xl font-bold text-rose-400">{stats.kills}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-stone-500 uppercase font-mono-numbers">Cheeses Gathered</span>
            <span className="font-mono-numbers text-xl font-bold text-amber-400">{stats.collectorCheese.toLocaleString()}</span>
          </div>
        </div>

        <button
          onClick={onRestart}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-amber-500/40 cursor-pointer"
        >
          <RotateCcw className="w-5 h-5" />
          <span className="font-fantasy tracking-wider">CONQUER AGAIN</span>
        </button>
      </div>
    </div>
  );
};

interface CollectorVictoryModalProps {
  stats: PlayerStats;
  onContinue: () => void;
  onRestart: () => void;
}

export const CollectorVictoryModal: React.FC<CollectorVictoryModalProps> = ({
  stats,
  onContinue,
  onRestart,
}) => {
  useEffect(() => {
    // Mega rainbow confetti blast
    const count = 200;
    const defaults = { origin: { y: 0.6 } };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  }, []);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-stone-950/90 backdrop-blur-none animate-fade-in pointer-events-auto">
      <div className="bg-stone-900 border-4 border-yellow-400 p-6 sm:p-8 rounded-3xl max-w-lg w-full text-center shadow-[0_0_80px_rgba(234,179,8,0.7)] animate-bounce-short">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 via-yellow-300 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
          <span className="text-4xl">👑</span>
        </div>

        <div className="inline-flex items-center gap-1.5 text-stone-950 font-mono-numbers text-xs font-black uppercase tracking-widest bg-gradient-to-r from-yellow-300 to-amber-400 px-3.5 py-1.5 rounded-full mb-3 shadow">
          <Sparkles className="w-3.5 h-3.5 text-stone-950" />
          <span>10,000 CHEESE ASCENSION ACHIEVED!</span>
        </div>

        <h2 className="font-fantasy text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-400 mb-2">
          SUPREME CHEESE COLLECTOR
        </h2>
        <p className="text-amber-100/90 text-sm mb-6 max-w-md mx-auto">
          Cheddalf has gathered an astounding <span className="text-yellow-300 font-bold">10,000 mystical cheese units</span>! The ancient cheese gods have consecrated your staff with eternal rainbow luminescence.
        </p>

        {/* Stats breakdown */}
        <div className="grid grid-cols-3 gap-2.5 bg-stone-950/80 p-4 rounded-2xl border border-amber-600/50 mb-6">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-stone-400 uppercase font-mono-numbers">Cheeses Gathered</span>
            <span className="font-mono-numbers text-xl font-bold text-yellow-400">{stats.collectorCheese.toLocaleString()}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-stone-400 uppercase font-mono-numbers">Highest Combo</span>
            <span className="font-mono-numbers text-xl font-bold text-amber-300">{stats.combo}x</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-stone-400 uppercase font-mono-numbers">Total Foes Slain</span>
            <span className="font-mono-numbers text-xl font-bold text-rose-400">{stats.kills}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onContinue}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-stone-950 font-black py-3 px-5 rounded-xl transition-all shadow-lg cursor-pointer font-fantasy text-sm"
          >
            <span>KEEP COLLECTING</span>
          </button>

          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-700 text-amber-200 font-semibold py-3 px-5 rounded-xl border border-stone-700 transition-colors cursor-pointer text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>NEW RUN</span>
          </button>
        </div>
      </div>
    </div>
  );
};

