import React from 'react';
import { CharacterId, CharacterConfig } from '../game/types';
import { CHARACTER_PRESETS } from '../game/engine';
import { Check, Shield, Zap, Sparkles, X, Swords } from 'lucide-react';

interface CharacterSelectModalProps {
  selectedCharacterId: CharacterId;
  onSelectCharacter: (id: CharacterId) => void;
  onClose?: () => void;
  isGameRunning?: boolean;
}

export const CharacterSelectModal: React.FC<CharacterSelectModalProps> = ({
  selectedCharacterId,
  onSelectCharacter,
  onClose,
  isGameRunning = false,
}) => {
  const characters = Object.values(CHARACTER_PRESETS);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-3 sm:p-5 bg-stone-950/90 backdrop-blur-none animate-fade-in pointer-events-auto">
      <div className="bg-stone-900 border-2 border-amber-600/80 p-5 sm:p-7 rounded-3xl max-w-4xl w-full text-center shadow-[0_0_70px_rgba(245,158,11,0.4)] max-h-[94vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-amber-900/60">
          <div className="flex items-center gap-2">
            <Swords className="w-6 h-6 text-amber-400" />
            <h2 className="font-fantasy text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-300">
              CHOOSE YOUR HERO
            </h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <p className="text-amber-100/80 text-xs sm:text-sm text-center mb-6 max-w-xl mx-auto">
          Select your combatant to brave the 7-Wave Catacombs. Each hero features a distinct fighting style, bespoke skill set, and ultimate attack!
        </p>

        {/* 3 Characters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-left">
          {characters.map((char: CharacterConfig) => {
            const isSelected = selectedCharacterId === char.id;
            return (
              <div
                key={char.id}
                onClick={() => onSelectCharacter(char.id)}
                className={`group relative rounded-2xl p-4 sm:p-5 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-stone-950/95 shadow-[0_0_30px_rgba(245,158,11,0.5)] scale-[1.02]'
                    : 'bg-stone-950/60 hover:bg-stone-950/80 hover:border-amber-500/60'
                }`}
                style={{
                  borderColor: isSelected ? char.accentColor : 'rgba(120, 53, 15, 0.4)',
                }}
              >
                {/* Active Checkmark Pill */}
                {isSelected && (
                  <div
                    className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-stone-950 font-bold text-[10px] font-mono-numbers uppercase tracking-wider flex items-center gap-1 shadow-md"
                    style={{ backgroundColor: char.accentColor }}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>ACTIVE HERO</span>
                  </div>
                )}

                <div>
                  {/* Avatar & Title Lockup */}
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-lg border"
                      style={{
                        backgroundColor: `${char.accentColor}22`,
                        borderColor: char.accentColor,
                      }}
                    >
                      {char.avatarEmoji}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-fantasy text-xl font-bold text-amber-100 tracking-wide">
                          {char.name}
                        </h3>
                      </div>
                      <span
                        className="text-[11px] font-mono-numbers font-bold uppercase tracking-wider px-2 py-0.5 rounded-md inline-block mt-0.5"
                        style={{
                          color: char.accentColor,
                          backgroundColor: `${char.accentColor}20`,
                        }}
                      >
                        Style: {char.fightingStyle}
                      </span>
                    </div>
                  </div>

                  {/* Character Description */}
                  <p className="text-stone-300 text-xs mb-4 leading-relaxed min-h-[44px]">
                    {char.description}
                  </p>

                  {/* Base Stats Row */}
                  <div className="grid grid-cols-3 gap-1.5 bg-stone-900/90 p-2 rounded-xl border border-stone-800 text-center mb-4 text-xs font-mono-numbers">
                    <div>
                      <span className="text-[9px] text-stone-400 block uppercase">Health</span>
                      <span className="font-bold text-red-400 flex items-center justify-center gap-0.5">
                        <Shield className="w-3 h-3" /> {char.baseHp}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-stone-400 block uppercase">Mana</span>
                      <span className="font-bold text-sky-400 flex items-center justify-center gap-0.5">
                        <Zap className="w-3 h-3" /> {char.baseMana}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-stone-400 block uppercase">Speed</span>
                      <span className="font-bold text-amber-300">
                        {char.baseSpeed.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* Skill List with Exact User Requests */}
                  <div className="space-y-1.5 text-xs">
                    <div className="text-[10px] font-mono-numbers uppercase text-stone-400 font-bold border-b border-stone-800 pb-1">
                      Combat Skills:
                    </div>

                    {char.id === 'baldan' && (
                      <>
                        <div className="p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-900/40 flex items-start gap-2">
                          <span className="bg-emerald-700 text-stone-950 font-bold px-1.5 py-0.2 rounded text-[10px] shrink-0 font-mono-numbers">Q</span>
                          <div>
                            <span className="font-bold text-emerald-300 block">3 Arrow Attack <span className="text-emerald-400 font-mono-numbers font-black">[70 DMG]</span></span>
                            <span className="text-[10px] text-stone-400">Triple arrow spread barrage</span>
                          </div>
                        </div>

                        <div className="p-1.5 rounded-lg bg-orange-950/40 border border-orange-900/40 flex items-start gap-2">
                          <span className="bg-orange-600 text-stone-950 font-bold px-1.5 py-0.2 rounded text-[10px] shrink-0 font-mono-numbers">E</span>
                          <div>
                            <span className="font-bold text-orange-300 block">Fire Attack - Burn</span>
                            <span className="text-[10px] text-stone-400">Explosive flaming arrow with ground burn</span>
                          </div>
                        </div>

                        <div className="p-1.5 rounded-lg bg-teal-950/40 border border-teal-900/40 flex items-start gap-2">
                          <span className="bg-teal-600 text-stone-950 font-bold px-1.5 py-0.2 rounded text-[10px] shrink-0 font-mono-numbers">Shift</span>
                          <div>
                            <span className="font-bold text-teal-300 block">Invisible</span>
                            <span className="text-[10px] text-stone-400">Stealth camouflage, +50% speed, sneak crit</span>
                          </div>
                        </div>

                        <div className="p-1.5 rounded-lg bg-green-950/50 border border-green-600/50 flex items-start gap-2">
                          <span className="bg-green-400 text-stone-950 font-black px-1.5 py-0.2 rounded text-[10px] shrink-0 font-mono-numbers">R</span>
                          <div>
                            <span className="font-bold text-green-300 block">Big Big Arrow <span className="text-green-400 font-mono-numbers font-black">[100 DMG]</span></span>
                            <span className="text-[10px] text-stone-300">Titanic colossal piercing arrow of ruin</span>
                          </div>
                        </div>
                      </>
                    )}

                    {char.id === 'nomio' && (
                      <>
                        <div className="p-1.5 rounded-lg bg-red-950/40 border border-red-900/40 flex items-start gap-2">
                          <span className="bg-red-600 text-stone-950 font-bold px-1.5 py-0.2 rounded text-[10px] shrink-0 font-mono-numbers">Q</span>
                          <div>
                            <span className="font-bold text-red-300 block">One Punch <span className="text-red-400 font-mono-numbers font-black">[70 DMG]</span></span>
                            <span className="text-[10px] text-stone-400">Lunging straight knockout fist</span>
                          </div>
                        </div>

                        <div className="p-1.5 rounded-lg bg-amber-950/40 border border-amber-900/40 flex items-start gap-2">
                          <span className="bg-amber-600 text-stone-950 font-bold px-1.5 py-0.2 rounded text-[10px] shrink-0 font-mono-numbers">E</span>
                          <div>
                            <span className="font-bold text-amber-300 block">2 Jab <span className="text-amber-400 font-mono-numbers font-black">[50 DMG]</span></span>
                            <span className="text-[10px] text-stone-400">Lightning 2-punch combination</span>
                          </div>
                        </div>

                        <div className="p-1.5 rounded-lg bg-rose-950/40 border border-rose-900/40 flex items-start gap-2">
                          <span className="bg-rose-600 text-stone-950 font-bold px-1.5 py-0.2 rounded text-[10px] shrink-0 font-mono-numbers">Shift</span>
                          <div>
                            <span className="font-bold text-rose-300 block">Punch Spray <span className="text-rose-400 font-mono-numbers font-black">[80 DMG]</span></span>
                            <span className="text-[10px] text-stone-400">Machine-gun 5-punch shockwave spray</span>
                          </div>
                        </div>

                        <div className="p-1.5 rounded-lg bg-yellow-950/50 border border-yellow-500/60 flex items-start gap-2">
                          <span className="bg-yellow-400 text-stone-950 font-black px-1.5 py-0.2 rounded text-[10px] shrink-0 font-mono-numbers">R</span>
                          <div>
                            <span className="font-bold text-yellow-300 block">Big Punch <span className="text-yellow-400 font-mono-numbers font-black">[90 DMG]</span></span>
                            <span className="text-[10px] text-stone-300">Catastrophic seismic ground-pound smash</span>
                          </div>
                        </div>
                      </>
                    )}

                    {char.id === 'cheddalf' && (
                      <>
                        <div className="p-1.5 rounded-lg bg-sky-950/40 border border-sky-900/40 flex items-start gap-2">
                          <span className="bg-sky-600 text-stone-950 font-bold px-1.5 py-0.2 rounded text-[10px] shrink-0 font-mono-numbers">Q</span>
                          <div>
                            <span className="font-bold text-sky-300 block">Swiss Time Warp</span>
                            <span className="text-[10px] text-stone-400">Spacetime rift slowing foes by 80%</span>
                          </div>
                        </div>

                        <div className="p-1.5 rounded-lg bg-yellow-950/40 border border-yellow-900/40 flex items-start gap-2">
                          <span className="bg-yellow-600 text-stone-950 font-bold px-1.5 py-0.2 rounded text-[10px] shrink-0 font-mono-numbers">E</span>
                          <div>
                            <span className="font-bold text-yellow-300 block">Mozzarella Snare</span>
                            <span className="text-[10px] text-stone-400">Elastic melted cheese immobilizer web</span>
                          </div>
                        </div>

                        <div className="p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-900/40 flex items-start gap-2">
                          <span className="bg-emerald-600 text-stone-950 font-bold px-1.5 py-0.2 rounded text-[10px] shrink-0 font-mono-numbers">Shift</span>
                          <div>
                            <span className="font-bold text-emerald-300 block">Blue Cheese Miasma</span>
                            <span className="text-[10px] text-stone-400">Corrosive toxic rot cloud</span>
                          </div>
                        </div>

                        <div className="p-1.5 rounded-lg bg-red-950/50 border border-red-500/60 flex items-start gap-2">
                          <span className="bg-red-500 text-stone-950 font-black px-1.5 py-0.2 rounded text-[10px] shrink-0 font-mono-numbers">R</span>
                          <div>
                            <span className="font-bold text-red-300 block">Wheel of Destiny</span>
                            <span className="text-[10px] text-stone-300">Crushing giant rolling parmesan wheel</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Choose button inside card */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCharacter(char.id);
                    if (onClose) onClose();
                  }}
                  className={`w-full mt-4 py-2.5 px-4 rounded-xl font-fantasy font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-400 text-stone-950 shadow-md'
                      : 'bg-stone-800 hover:bg-stone-700 text-amber-200 border border-stone-700'
                  }`}
                >
                  {isSelected ? 'Selected' : `Play as ${char.name}`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Bottom Action Footer */}
        <div className="flex justify-center items-center gap-4">
          {onClose && (
            <button
              onClick={onClose}
              className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-amber-950 font-fantasy font-black px-8 py-3 rounded-xl text-base shadow-lg cursor-pointer"
            >
              {isGameRunning ? 'CONTINUE BATTLE' : 'CONFIRM & ENTER DUNGEON'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
