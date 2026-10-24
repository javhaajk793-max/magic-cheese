import React from 'react';
import { PlayerStats, SpellId, SpellInfo, FloatingText, CustomColors } from '../game/types';
import { CHARACTER_PRESETS } from '../game/engine';
import { Volume2, VolumeX, Pause, Sparkles, Skull, Flame, Swords, Users } from 'lucide-react';

interface GameHUDProps {
  stats: PlayerStats;
  spells: Record<SpellId, SpellInfo>;
  floatingTexts: FloatingText[];
  wave: number;
  bossHp: { current: number; max: number; active: boolean; bossName?: string; bossStyle?: string };
  isMuted: boolean;
  customColors?: CustomColors;
  onToggleMute: () => void;
  onPause: () => void;
  onCastSpell: (id: SpellId) => void;
  onOpenColorAtelier: () => void;
  onOpenCharacterSelect: () => void;
  onTriggerCheeseStorm: () => void;
  onToggleTenThousandCooler?: () => void;
  onOpenMultiplayerLobby?: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  spells,
  floatingTexts,
  wave,
  bossHp,
  isMuted,
  customColors,
  onToggleMute,
  onPause,
  onCastSpell,
  onOpenColorAtelier,
  onOpenCharacterSelect,
  onTriggerCheeseStorm,
  onToggleTenThousandCooler,
  onOpenMultiplayerLobby,
}) => {
  const hpPercent = Math.max(0, Math.min(100, (stats.hp / stats.maxHp) * 100));
  const manaPercent = Math.max(0, Math.min(100, (stats.mana / stats.maxMana) * 100));
  const xpPercent = Math.max(0, Math.min(100, (stats.xp / stats.nextLevelXp) * 100));
  const collectorPercent = Math.max(0, Math.min(100, (stats.collectorCheese / stats.collectorGoal) * 100));

  const charConfig = CHARACTER_PRESETS[stats.characterId] || CHARACTER_PRESETS.baldan;

  // Active spells for current character
  const primarySpell = spells[charConfig.skills.primary] || Object.values(spells)[0];
  const qSpell = spells[charConfig.skills.q] || Object.values(spells)[1];
  const eSpell = spells[charConfig.skills.e] || Object.values(spells)[2];
  const shiftSpell = spells[charConfig.skills.shift] || Object.values(spells)[3];
  const rSpell = spells[charConfig.skills.r] || Object.values(spells)[4];

  // Determine boss theme colors & style icon
  const isArrowKing = bossHp.bossName?.toLowerCase().includes('dark of king');
  const isFighterKing = bossHp.bossName?.toLowerCase().includes('last of king');
  const bossTitle = bossHp.bossName ? bossHp.bossName.toUpperCase() : 'THE GREAT GOUDA GOLEM';
  const bossStyleTag = bossHp.bossStyle ? ` · ${bossHp.bossStyle.toUpperCase()}` : '';

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-10 overflow-hidden">
      {/* TOP BAR / PERIMETER CLUSTERS */}
      <div className="flex justify-between items-start w-full">
        {/* Top-Left: Hero Status Cluster & 10,000 Collector Meter */}
        <div className="flex flex-col gap-2 max-w-[280px] sm:max-w-sm pointer-events-auto">
          <div className="flex items-center gap-3 bg-stone-950/85 border border-amber-800/60 p-2.5 sm:p-3 rounded-2xl shadow-xl">
            {/* Avatar Icon */}
            <div
              className="relative w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner border"
              style={{
                backgroundColor: `${charConfig.accentColor}25`,
                borderColor: charConfig.accentColor,
              }}
            >
              <span className="text-2xl select-none" role="img" aria-label={charConfig.name}>
                {charConfig.avatarEmoji}
              </span>
              <div className="absolute -bottom-1 -right-1 bg-amber-500 text-stone-950 font-mono-numbers font-black text-[10px] px-1.5 py-0.2 rounded-md shadow">
                Lv.{stats.level}
              </div>
            </div>

            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-fantasy font-bold text-amber-200 tracking-wide truncate">
                    {charConfig.name}
                  </span>
                  <span
                    className="text-[9px] font-mono-numbers font-bold px-1.5 py-0.2 rounded"
                    style={{
                      color: charConfig.accentColor,
                      backgroundColor: `${charConfig.accentColor}22`,
                    }}
                  >
                    {charConfig.fightingStyle}
                  </span>
                  {stats.isInvisible && (
                    <span className="bg-emerald-500 text-stone-950 text-[9px] font-mono-numbers font-black px-1.5 py-0.2 rounded animate-pulse">
                      STEALTH
                    </span>
                  )}
                </div>
                <span className="font-mono-numbers text-[11px] text-amber-400/90 shrink-0">
                  {Math.round(stats.hp)} / {stats.maxHp}
                </span>
              </div>

              {/* Health Bar */}
              <div className="w-full h-2.5 bg-stone-900 rounded-full overflow-hidden border border-red-950/80">
                <div
                  className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 transition-all duration-150 rounded-full"
                  style={{ width: `${hpPercent}%` }}
                />
              </div>

              {/* Mana Bar */}
              <div className="w-full h-2 bg-stone-900 rounded-full overflow-hidden border border-sky-950/80">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 via-sky-400 to-cyan-300 transition-all duration-150 rounded-full"
                  style={{ width: `${manaPercent}%` }}
                />
              </div>

              {/* XP progress bar */}
              <div className="w-full h-1 bg-stone-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-200"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* 10,000 Cheese Collector Progress HUD */}
          <div className="bg-stone-950/85 border border-amber-500/60 p-2 sm:p-2.5 rounded-2xl shadow-xl flex flex-col gap-1">
            <div className="flex justify-between items-center text-[10px] sm:text-xs">
              <span className="font-fantasy font-bold text-amber-300 flex items-center gap-1">
                <span>🧀</span>
                <span>COLLECTOR 10,000</span>
              </span>
              <span className="font-mono-numbers text-amber-200 font-bold">
                {stats.collectorCheese.toLocaleString()} / 10,000
              </span>
            </div>

            {/* Collector Bar */}
            <div className="w-full h-2 bg-stone-900 rounded-full overflow-hidden border border-amber-900/60">
              <div
                className="h-full bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-300 transition-all duration-200 rounded-full"
                style={{ width: `${collectorPercent}%` }}
              />
            </div>

            {/* Active Combo Multiplier */}
            {stats.combo > 1 && (
              <div className="flex justify-between items-center text-[10px] font-mono-numbers pt-0.5">
                <span className="text-yellow-400 font-bold animate-pulse">
                  STREAK: {stats.combo} CHEESES
                </span>
                <span className="bg-amber-500 text-stone-950 font-black px-1.5 py-0.2 rounded text-[9px]">
                  x{stats.comboMultiplier.toFixed(1)} MULTIPLIER
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Top-Center: Dynamic Boss Health Bar (Waves 3, 5, 7) */}
        {bossHp.active && (
          <div className="flex flex-col items-center w-full max-w-xs sm:max-w-md mx-3 animate-fade-in pointer-events-auto">
            <div className="flex justify-between w-full text-xs font-fantasy font-bold drop-shadow mb-1 px-1">
              <span className={`flex items-center gap-1.5 ${isArrowKing ? 'text-purple-300' : isFighterKing ? 'text-rose-300' : 'text-amber-300'}`}>
                {isArrowKing ? (
                  <span>🏹</span>
                ) : isFighterKing ? (
                  <span>⚔️</span>
                ) : (
                  <Flame className="w-4 h-4 text-orange-500 animate-bounce" />
                )}
                <span>[{bossTitle}]{bossStyleTag}</span>
              </span>
              <span className={`font-mono-numbers font-bold ${isArrowKing ? 'text-purple-400' : isFighterKing ? 'text-rose-400' : 'text-orange-400'}`}>
                {Math.max(0, Math.round(bossHp.current))} / {bossHp.max}
              </span>
            </div>
            <div className={`w-full h-4 bg-stone-950 rounded-full border-2 overflow-hidden shadow-2xl ${
              isArrowKing
                ? 'border-purple-600/90 shadow-[0_0_20px_rgba(168,85,247,0.6)]'
                : isFighterKing
                ? 'border-red-600/90 shadow-[0_0_20px_rgba(239,68,68,0.7)]'
                : 'border-orange-600/80 shadow-[0_0_15px_rgba(234,88,12,0.5)]'
            }`}>
              <div
                className={`h-full transition-all duration-150 rounded-full ${
                  isArrowKing
                    ? 'bg-gradient-to-r from-indigo-600 via-purple-500 to-fuchsia-400'
                    : isFighterKing
                    ? 'bg-gradient-to-r from-red-600 via-orange-500 to-yellow-300'
                    : 'bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-300'
                }`}
                style={{ width: `${Math.max(0, Math.min(100, (bossHp.current / bossHp.max) * 100))}%` }}
              />
            </div>
          </div>
        )}

        {/* Top-Right: Wave & Action Cluster */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 bg-stone-950/85 border border-amber-800/60 px-3 py-2 rounded-2xl shadow-xl">
            <div className="flex items-center gap-1 text-xs font-mono-numbers text-amber-300 pr-2 border-r border-stone-800">
              <span className="text-amber-500 text-sm">🧀</span>
              <span>Wave {wave}/20</span>
            </div>

            <div className="flex items-center gap-1 text-xs font-mono-numbers text-amber-400 pr-2 border-r border-stone-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{stats.shards}</span>
            </div>

            <div className="flex items-center gap-1 text-xs font-mono-numbers text-rose-400">
              <Skull className="w-3.5 h-3.5" />
              <span>{stats.kills}</span>
            </div>
          </div>

          {/* Online Lobby / Party button */}
          {onOpenMultiplayerLobby && (
            <button
              onClick={onOpenMultiplayerLobby}
              className="flex items-center gap-1.5 p-2 sm:px-3 bg-cyan-950/85 hover:bg-cyan-900 border border-cyan-500/70 rounded-xl text-cyan-200 transition-all cursor-pointer shadow-md hover:scale-105"
              title="Online Co-Op Lobby & Party"
            >
              <Users className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="hidden sm:inline text-xs font-fantasy font-semibold">Party</span>
            </button>
          )}

          {/* Switch Hero button */}
          <button
            onClick={onOpenCharacterSelect}
            className="flex items-center gap-1.5 p-2 sm:px-3 bg-stone-950/85 hover:bg-stone-800 border border-amber-600/60 rounded-xl text-amber-200 transition-all cursor-pointer shadow-md hover:scale-105"
            title="Switch Hero (Baldan / Nomio / Cheddalf)"
          >
            <Swords className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline text-xs font-fantasy font-semibold">Heroes</span>
          </button>

          {/* Cheese Storm trigger button */}
          <button
            onClick={onTriggerCheeseStorm}
            className="p-2.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-600/70 rounded-xl text-amber-300 transition-all cursor-pointer shadow-md hover:scale-105"
            title="Summon Cheese Storm (+Cheese Drops)"
          >
            <span className="text-sm">🧀⚡</span>
          </button>

          {/* 10,000x COOLER Quick Toggle Button */}
          {onToggleTenThousandCooler && (
            <button
              onClick={onToggleTenThousandCooler}
              className={`flex items-center gap-1.5 p-2 sm:px-3 rounded-xl border transition-all cursor-pointer shadow-lg hover:scale-105 ${
                customColors?.tenThousandCooler
                  ? 'bg-gradient-to-r from-red-600 via-amber-500 via-emerald-500 to-purple-600 border-yellow-200 text-stone-950 font-black shadow-[0_0_22px_rgba(250,204,21,0.85)] animate-pulse'
                  : 'bg-stone-950/85 hover:bg-stone-800 border-amber-600/60 text-amber-300'
              }`}
              title="Toggle 10,000x COOLER Overdrive Mode (Prismatic Aura & Rainbow Fireworks)"
            >
              <Flame className={`w-4 h-4 ${customColors?.tenThousandCooler ? 'text-yellow-200 animate-bounce' : 'text-orange-400'}`} />
              <span className="hidden sm:inline text-xs font-fantasy font-bold">
                {customColors?.tenThousandCooler ? '10,000x COOL!' : '10,000x'}
              </span>
            </button>
          )}

          {/* 10,000 Colors Atelier button */}
          <button
            onClick={onOpenColorAtelier}
            className={`p-2 sm:px-2.5 rounded-xl border transition-all cursor-pointer shadow-md hover:scale-105 flex items-center gap-1 ${
              customColors?.rainbowMode
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 border-yellow-300 text-stone-950 font-bold shadow-[0_0_15px_rgba(234,179,8,0.6)]'
                : 'bg-stone-950/85 hover:bg-stone-800 border-amber-600/60 text-amber-300'
            }`}
            title="Open 10,000 Colors Atelier"
          >
            <span className="text-sm">🎨</span>
            <span className="hidden md:inline text-[11px] font-fantasy font-semibold">Atelier</span>
          </button>

          {/* Action buttons */}
          <button
            onClick={onToggleMute}
            className="p-2.5 bg-stone-950/85 hover:bg-stone-800 border border-amber-800/60 rounded-xl text-amber-300 transition-colors cursor-pointer"
            title="Toggle Audio"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-amber-500" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onPause}
            className="p-2.5 bg-stone-950/85 hover:bg-stone-800 border border-amber-800/60 rounded-xl text-amber-300 transition-colors cursor-pointer"
            title="Pause Game"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* FLOATING DAMAGE / REWARD TEXTS */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {floatingTexts.map(ft => (
          <div
            key={ft.id}
            className="absolute font-fantasy font-extrabold text-sm sm:text-base pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] animate-bounce"
            style={{
              left: `${50 + (ft.x / 24) * 40}%`,
              top: `${50 + (ft.y / 24) * 35}%`,
              color: ft.color,
              opacity: ft.life / ft.maxLife,
              transform: `translate(-50%, -${(1 - ft.life / ft.maxLife) * 35}px)`,
              transition: 'transform 0.05s linear',
            }}
          >
            {ft.text}
          </div>
        ))}
      </div>

      {/* BOTTOM CONTROL DOCK: Active Character Skill Bar & Ultimate Meter */}
      <div className="w-full flex justify-center pb-2 pointer-events-auto">
        <div className="flex items-center gap-2 sm:gap-3 bg-stone-950/90 border border-amber-800/70 p-2 sm:p-2.5 rounded-2xl shadow-2xl backdrop-blur-none max-w-fit">
          {/* Primary Attack (L-Click / Space) */}
          {primarySpell && (
            <SpellCard spell={primarySpell} onCast={() => onCastSpell(primarySpell.id)} />
          )}

          {/* Skill Q */}
          {qSpell && (
            <SpellCard spell={qSpell} onCast={() => onCastSpell(qSpell.id)} />
          )}

          {/* Skill E */}
          {eSpell && (
            <SpellCard spell={eSpell} onCast={() => onCastSpell(eSpell.id)} />
          )}

          {/* Skill Shift */}
          {shiftSpell && (
            <SpellCard spell={shiftSpell} onCast={() => onCastSpell(shiftSpell.id)} />
          )}

          {/* Divider */}
          <div className="h-10 w-px bg-amber-800/60 mx-1" />

          {/* Ultimate (R) */}
          {rSpell && (
            <div className="relative group">
              <button
                onClick={() => onCastSpell(rSpell.id)}
                disabled={stats.ultimateCharge < 100}
                className={`relative flex flex-col items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 transition-all cursor-pointer ${
                  stats.ultimateCharge >= 100
                    ? 'bg-gradient-to-br from-red-600 via-amber-600 to-yellow-500 border-yellow-300 shadow-[0_0_20px_rgba(239,68,68,0.8)] transform hover:scale-105 animate-pulse'
                    : 'bg-stone-900/90 border-stone-800 opacity-60 cursor-not-allowed'
                }`}
              >
                <span className="text-2xl">{rSpell.icon}</span>
                <span className="text-[10px] font-fantasy font-black text-amber-100">
                  {stats.ultimateCharge >= 100 ? 'READY' : `${Math.floor(stats.ultimateCharge)}%`}
                </span>
                <span className="absolute -top-2 -right-1 bg-red-800 text-white font-mono-numbers text-[9px] px-1 py-0.2 rounded font-bold">
                  R
                </span>
              </button>
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center bg-stone-950 border border-amber-800 p-2 rounded-lg text-xs w-48 text-center z-30 pointer-events-none">
                <span className="font-bold text-amber-300">{rSpell.name}</span>
                {rSpell.damageValue && (
                  <span className="text-red-400 font-mono-numbers font-bold">Damage: {rSpell.damageValue}</span>
                )}
                <span className="text-stone-300 text-[10px] mt-0.5">{rSpell.description}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface SpellCardProps {
  spell: SpellInfo;
  onCast: () => void;
}

const SpellCard: React.FC<SpellCardProps> = ({ spell, onCast }) => {
  const cdPercent = spell.cooldown > 0 ? (spell.currentCooldown / spell.cooldown) * 100 : 0;
  const isReady = spell.currentCooldown <= 0;

  return (
    <div className="relative group">
      <button
        onClick={onCast}
        disabled={!isReady}
        className={`relative flex flex-col items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl border transition-all overflow-hidden cursor-pointer ${
          isReady
            ? 'bg-stone-900/90 hover:bg-stone-800 border-amber-500/70 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
            : 'bg-stone-950 border-stone-800 opacity-50'
        }`}
      >
        <span className="text-xl sm:text-2xl select-none">{spell.icon}</span>

        {/* Cooldown overlay sweep */}
        {!isReady && (
          <div
            className="absolute inset-0 bg-stone-950/80 flex items-center justify-center"
            style={{ clipPath: `polygon(0 0, 100% 0, 100% ${cdPercent}%, 0 ${cdPercent}%)` }}
          >
            <span className="font-mono-numbers text-xs text-amber-200 font-bold">
              {spell.currentCooldown.toFixed(1)}s
            </span>
          </div>
        )}

        {/* Mana Cost Badge */}
        {spell.manaCost > 0 && (
          <div className="absolute bottom-0.5 right-1 text-[9px] font-mono-numbers text-sky-300 font-bold">
            {spell.manaCost}
          </div>
        )}

        {/* Key hint badge */}
        <div className="absolute top-0.5 left-1 text-[8px] font-mono-numbers text-amber-400/90 font-bold">
          {spell.keyHint.split('/')[0].trim()}
        </div>
      </button>

      {/* Hover Tooltip */}
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center bg-stone-950 border border-amber-800 p-2 rounded-lg text-xs w-52 text-center z-30 pointer-events-none">
        <span className="font-bold text-amber-300">{spell.name}</span>
        {spell.damageValue && (
          <span className="text-rose-400 font-mono-numbers font-bold text-[11px]">Damage: {spell.damageValue}</span>
        )}
        <span className="text-amber-500/90 text-[10px] italic">{spell.cheeseType}</span>
        <span className="text-stone-300 text-[10px] mt-1">{spell.description}</span>
      </div>
    </div>
  );
};
