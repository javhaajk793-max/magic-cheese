import React from 'react';
import { PlayerStats, UpgradeOption } from '../game/types';
import { Sparkles } from 'lucide-react';

interface UpgradeModalProps {
  stats: PlayerStats;
  onSelectUpgrade: (upgrade: UpgradeOption) => void;
}

const ALL_UPGRADES: UpgradeOption[] = [
  {
    id: 'camembert_vitality',
    name: 'Heart of Camembert',
    cheeseName: 'Velvety Camembert',
    description: 'Increases Max HP by +35 and instantly restores health to maximum.',
    icon: '💖',
    rarity: 'rare',
    apply: (s) => {
      s.maxHp += 35;
      s.hp = s.maxHp;
    },
  },
  {
    id: 'fontina_conduit',
    name: 'Fontina Mana Conduit',
    cheeseName: 'Alpine Fontina',
    description: 'Increases Mana Regeneration by +60% and expands Max Mana pool by +30.',
    icon: '⚡',
    rarity: 'common',
    apply: (s) => {
      s.manaRegen += 10;
      s.maxMana += 30;
      s.mana = s.maxMana;
    },
  },
  {
    id: 'gouda_pyromancy',
    name: 'Smoked Gouda Mastery',
    cheeseName: 'Aged Gouda',
    description: 'Infuses all cheese spells with +30% amplified spell power.',
    icon: '🔥',
    rarity: 'rare',
    apply: (s) => {
      s.spellPower += 0.3;
    },
  },
  {
    id: 'whey_swiftness',
    name: 'Speed of the Whey',
    cheeseName: 'Clarified Whey',
    description: 'Increases movement speed by +22% to easily kite mold monsters.',
    icon: '💨',
    rarity: 'common',
    apply: (s) => {
      s.moveSpeed += 1.6;
    },
  },
  {
    id: 'parmesan_celestial',
    name: 'Cosmic Parmesan Shards',
    cheeseName: 'Starlight Parmesan',
    description: 'Cheese drops grant +50% more ultimate charge and heal +15 HP.',
    icon: '⭐',
    rarity: 'legendary',
    apply: (s) => {
      s.spellPower += 0.2;
      s.maxHp += 20;
    },
  },
  {
    id: 'roquefort_decay',
    name: 'Pungent Roquefort Rot',
    cheeseName: 'Ancient Roquefort',
    description: 'Blue cheese miasma deals +50% extra rot damage and expands area.',
    icon: '🧪',
    rarity: 'rare',
    apply: (s) => {
      s.spellPower += 0.25;
    },
  },
];

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ stats, onSelectUpgrade }) => {
  // Pick 3 random distinct upgrades
  const [choices] = React.useState<UpgradeOption[]>(() => {
    const shuffled = [...ALL_UPGRADES].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  });

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-none animate-fade-in">
      <div className="bg-stone-900 border-2 border-amber-600/80 p-6 sm:p-8 rounded-3xl max-w-xl w-full text-center shadow-[0_0_50px_rgba(245,158,11,0.4)]">
        {/* Header */}
        <div className="inline-flex items-center gap-2 text-amber-400 font-mono-numbers text-xs font-bold uppercase tracking-widest bg-amber-950/80 px-4 py-1.5 rounded-full border border-amber-700/60 mb-3">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>CHEDDALF REACHED LEVEL {stats.level}</span>
        </div>

        <h2 className="font-fantasy text-2xl sm:text-3xl font-extrabold text-amber-200 mb-2">
          CHOOSE A CHEESE ENCHANTMENT
        </h2>
        <p className="text-amber-100/70 text-xs sm:text-sm mb-6">
          The ancient grimoire of Fromage unlocks secrets of forbidden dairy arcana.
        </p>

        {/* 3 Upgrade Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-2">
          {choices.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onSelectUpgrade(opt)}
              className="flex flex-col items-center p-4 rounded-2xl bg-stone-950/90 hover:bg-stone-800 border-2 border-amber-800 hover:border-amber-400 text-left transition-all hover:scale-105 cursor-pointer group text-center shadow-lg"
            >
              <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">{opt.icon}</span>
              <span className="font-fantasy font-bold text-amber-200 text-sm mb-1 leading-snug">
                {opt.name}
              </span>
              <span className="text-[10px] text-amber-500 font-semibold mb-2">{opt.cheeseName}</span>
              <span className="text-xs text-stone-300/90 leading-relaxed">{opt.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
