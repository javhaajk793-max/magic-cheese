import React, { useState } from 'react';
import { CustomColors, CharacterId } from '../game/types';
import { Palette, Sparkles, Check, X, Flame, Zap, Shield, Sun } from 'lucide-react';

interface ColorAtelierModalProps {
  customColors: CustomColors;
  onApplyColors: (colors: CustomColors) => void;
  onClose: () => void;
  selectedCharacterId?: CharacterId;
}

interface PalettePreset {
  name: string;
  desc: string;
  c1: string;
  c2: string;
  c3: string;
  icon: string;
}

const BALDAN_PALETTES: PalettePreset[] = [
  {
    name: 'Forest Ranger',
    desc: 'Verdant camouflage woven from evergreen herbs',
    c1: '#166534',
    c2: '#92400e',
    c3: '#22c55e',
    icon: '🏹',
  },
  {
    name: 'Golden Falcon',
    desc: 'Solar gilded bow and plumage of the high cliffs',
    c1: '#ca8a04',
    c2: '#78350f',
    c3: '#fef08a',
    icon: '🦅',
  },
  {
    name: 'Cyberpunk Sniper',
    desc: 'Neon cyan cloaking with ultraviolet energy sights',
    c1: '#0891b2',
    c2: '#1e1b4b',
    c3: '#f43f5e',
    icon: '⚡',
  },
  {
    name: 'Night Stalker',
    desc: 'Midnight obsidian concealment with shadow violet aura',
    c1: '#09090b',
    c2: '#27272a',
    c3: '#a855f7',
    icon: '🌑',
  },
  {
    name: 'Phoenix Archer',
    desc: 'Flaming plumage arrows imbued with primal magma',
    c1: '#c2410c',
    c2: '#451a03',
    c3: '#f97316',
    icon: '🔥',
  },
  {
    name: 'Prismatic Spectra',
    desc: 'Chromatic prism arrow of 10,000 iridescent lights',
    c1: '#db2777',
    c2: '#4f46e5',
    c3: '#10b981',
    icon: '🌈',
  },
];

const NOMIO_PALETTES: PalettePreset[] = [
  {
    name: 'Crimson Dragon',
    desc: 'Fierce martial gi with ignited ember gauntlets',
    c1: '#991b1b',
    c2: '#ef4444',
    c3: '#f97316',
    icon: '🥊',
  },
  {
    name: 'Golden Champion',
    desc: 'Aged golden parmesan boxing gear with blinding aura',
    c1: '#d97706',
    c2: '#78350f',
    c3: '#fde047',
    icon: '🏆',
  },
  {
    name: 'Shadow Brawler',
    desc: 'Stealth combat wraps and dark titanium knuckle spikes',
    c1: '#18181b',
    c2: '#3f3f46',
    c3: '#ef4444',
    icon: '🥋',
  },
  {
    name: 'Thunderbolt Bruce',
    desc: 'High-voltage azure martial storm fists',
    c1: '#0284c7',
    c2: '#0369a1',
    c3: '#38bdf8',
    icon: '⚡',
  },
  {
    name: 'Toxic Bruiser',
    desc: 'Noxious wasabi-infused heavy leather pugilism',
    c1: '#166534',
    c2: '#15803d',
    c3: '#4ade80',
    icon: '🧪',
  },
  {
    name: 'Neon Overdrive',
    desc: 'Hyper-synthwave vaporwave boxing champion',
    c1: '#c026d3',
    c2: '#701a75',
    c3: '#f43f5e',
    icon: '🎆',
  },
];

const CHEDDALF_PALETTES: PalettePreset[] = [
  {
    name: 'Mystic Amethyst',
    desc: 'Classic wizard robes with celestial starlight glow',
    c1: '#312e81',
    c2: '#1e1b4b',
    c3: '#fbbf24',
    icon: '🔮',
  },
  {
    name: 'Golden Cheddar',
    desc: 'Pure aged golden cheddar consecrated by dairy monks',
    c1: '#d97706',
    c2: '#78350f',
    c3: '#fef08a',
    icon: '🧀',
  },
  {
    name: 'Emerald Roquefort',
    desc: 'Verdant mold alchemy with glowing toxic mint crystal',
    c1: '#065f46',
    c2: '#022c22',
    c3: '#34d399',
    icon: '🌿',
  },
  {
    name: 'Molten Fondue',
    desc: 'Volcanic simmering cheese with fiery plasma sparks',
    c1: '#b91c1c',
    c2: '#450a0a',
    c3: '#ff5500',
    icon: '🌋',
  },
  {
    name: 'Void Gorgonzola',
    desc: 'Deep cosmic obsidian infused with astral violet runes',
    c1: '#09090b',
    c2: '#18181b',
    c3: '#c084fc',
    icon: '🌌',
  },
  {
    name: 'Rose Camembert',
    desc: 'Delicate blossom curd with ruby luminescence',
    c1: '#e11d48',
    c2: '#4c0519',
    c3: '#f472b6',
    icon: '🌸',
  },
];

export const ColorAtelierModal: React.FC<ColorAtelierModalProps> = ({
  customColors,
  onApplyColors,
  onClose,
  selectedCharacterId = 'baldan',
}) => {
  const [c1, setC1] = useState(customColors.robeColor || '#166534');
  const [c2, setC2] = useState(customColors.hatColor || '#78350f');
  const [c3, setC3] = useState(customColors.staffGlowColor || '#22c55e');
  const [rainbowMode, setRainbowMode] = useState(customColors.rainbowMode || false);
  const [tenThousandCooler, setTenThousandCooler] = useState(customColors.tenThousandCooler || false);
  const [hueValue, setHueValue] = useState(180);

  // Character specific label names
  const slotLabels = {
    baldan: {
      slot1: 'Tunic & Cowl',
      slot2: 'Recurve Bow',
      slot3: 'Arrow Light Glow',
      title: 'Baldan (Arrow Ranger)',
    },
    nomio: {
      slot1: 'Warrior Gi & Vest',
      slot2: 'Battle Headband',
      slot3: 'Knuckle Plasma Flames',
      title: 'Nomio (Fighter Pugilist)',
    },
    cheddalf: {
      slot1: 'Wizard Robe',
      slot2: 'Pointy Hat',
      slot3: 'Staff Crystal Glow',
      title: 'Cheddalf (Dairy Sorcerer)',
    },
  }[selectedCharacterId] || {
    slot1: 'Primary Robe/Tunic',
    slot2: 'Secondary Gear',
    slot3: 'Energy Glow',
    title: 'Hero Style',
  };

  const palettes = selectedCharacterId === 'nomio'
    ? NOMIO_PALETTES
    : selectedCharacterId === 'cheddalf'
    ? CHEDDALF_PALETTES
    : BALDAN_PALETTES;

  const handleApplyPreset = (p: PalettePreset) => {
    setC1(p.c1);
    setC2(p.c2);
    setC3(p.c3);
    setRainbowMode(false);
    onApplyColors({
      robeColor: p.c1,
      hatColor: p.c2,
      staffGlowColor: p.c3,
      rainbowMode: false,
      tenThousandCooler,
    });
  };

  const handleToggleRainbow = () => {
    const next = !rainbowMode;
    setRainbowMode(next);
    onApplyColors({
      robeColor: c1,
      hatColor: c2,
      staffGlowColor: c3,
      rainbowMode: next,
      tenThousandCooler,
    });
  };

  const handleToggleTenThousandCooler = () => {
    const next = !tenThousandCooler;
    setTenThousandCooler(next);
    onApplyColors({
      robeColor: c1,
      hatColor: c2,
      staffGlowColor: c3,
      rainbowMode,
      tenThousandCooler: next,
    });
  };

  const handleColorChange = (slot: 1 | 2 | 3, val: string) => {
    setRainbowMode(false);
    let next1 = c1;
    let next2 = c2;
    let next3 = c3;
    if (slot === 1) {
      next1 = val;
      setC1(val);
    } else if (slot === 2) {
      next2 = val;
      setC2(val);
    } else {
      next3 = val;
      setC3(val);
    }
    onApplyColors({
      robeColor: next1,
      hatColor: next2,
      staffGlowColor: next3,
      rainbowMode: false,
      tenThousandCooler,
    });
  };

  // Continuous 10,000 Color Spectrum Hue slider
  const handleHueSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hue = parseInt(e.target.value, 10);
    setHueValue(hue);
    setRainbowMode(false);

    // Convert HSL to Hex
    const hslToHex = (h: number, s: number, l: number) => {
      l /= 100;
      const a = (s * Math.min(l, 1 - l)) / 100;
      const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
      };
      return `#${f(0)}${f(8)}${f(4)}`;
    };

    const newC1 = hslToHex(hue, 85, 45);
    const newC2 = hslToHex((hue + 45) % 360, 90, 30);
    const newC3 = hslToHex((hue + 180) % 360, 100, 60);

    setC1(newC1);
    setC2(newC2);
    setC3(newC3);

    onApplyColors({
      robeColor: newC1,
      hatColor: newC2,
      staffGlowColor: newC3,
      rainbowMode: false,
      tenThousandCooler,
    });
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-3 sm:p-5 bg-stone-950/85 backdrop-blur-none animate-fade-in pointer-events-auto">
      <div className="bg-stone-900 border-2 border-amber-600/80 p-5 sm:p-7 rounded-3xl max-w-lg w-full text-center shadow-[0_0_70px_rgba(245,158,11,0.4)] max-h-[94vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-amber-900/50">
          <div className="flex items-center gap-2">
            <Palette className="w-6 h-6 text-amber-400" />
            <div className="text-left">
              <h2 className="font-fantasy text-xl sm:text-2xl font-bold text-amber-200">
                10,000 COLORS & COOLER ATELIER
              </h2>
              <span className="text-[11px] font-mono-numbers text-amber-400 font-semibold uppercase">
                Active: {slotLabels.title}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 10,000x COOLER OVERDRIVE Feature Hero Button */}
        <div className="mb-4">
          <button
            onClick={handleToggleTenThousandCooler}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden group ${
              tenThousandCooler
                ? 'bg-gradient-to-r from-red-600 via-amber-500 via-emerald-500 via-sky-500 to-purple-600 border-yellow-200 shadow-[0_0_35px_rgba(250,204,21,0.9)] text-stone-950 font-black'
                : 'bg-stone-950 border-amber-500/50 hover:border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl animate-pulse">🔥⚡</span>
              <div className="text-left">
                <span className="font-fantasy text-sm font-extrabold flex items-center gap-1.5">
                  10,000x COOLER OVERDRIVE
                  {tenThousandCooler ? (
                    <span className="bg-stone-950 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-mono-numbers">
                      ACTIVE
                    </span>
                  ) : (
                    <span className="bg-amber-950/80 text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-mono-numbers border border-amber-600">
                      OFF
                    </span>
                  )}
                </span>
                <span className="text-[10px] opacity-90 block">
                  Prismatic aura, rainbow dash trails & extra death fireworks!
                </span>
              </div>
            </div>
            {tenThousandCooler ? <Check className="w-6 h-6 stroke-[3]" /> : <Flame className="w-5 h-5 text-amber-400" />}
          </button>
        </div>

        {/* 10,000 Color Rainbow Cycle Feature Button */}
        <div className="mb-4">
          <button
            onClick={handleToggleRainbow}
            className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer ${
              rainbowMode
                ? 'bg-gradient-to-r from-pink-600 via-purple-600 via-blue-600 to-teal-500 border-yellow-300 shadow-[0_0_25px_rgba(234,179,8,0.7)] text-stone-950 font-black'
                : 'bg-stone-950 border-stone-800 hover:border-amber-600/80 text-amber-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🌈</span>
              <div className="text-left">
                <span className="font-fantasy text-xs sm:text-sm block">10,000 Color Rainbow Cycle</span>
                <span className="text-[10px] opacity-80 block">Continuous real-time RGB chromatic spectrum shifts</span>
              </div>
            </div>
            {rainbowMode && <Check className="w-5 h-5 stroke-[3]" />}
          </button>
        </div>

        {/* Continuous 10,000 Color Spectrum Hue Slider */}
        <div className="bg-stone-950 p-3 rounded-2xl border border-stone-800 mb-4 text-left">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-fantasy font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Continuous 10,000 Color Slider
            </span>
            <span className="text-[10px] font-mono-numbers text-stone-400">
              Hue: {hueValue}°
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            value={hueValue}
            onChange={handleHueSliderChange}
            className="w-full h-3 rounded-lg appearance-none cursor-pointer"
            style={{
              background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
            }}
          />
          <span className="text-[10px] text-stone-400 mt-1 block">
            Slide continuously to generate thousands of unique chromatic variations in real-time.
          </span>
        </div>

        {/* Custom Hex Color Pickers for Selected Hero */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mb-4 bg-stone-950 p-3.5 rounded-2xl border border-stone-800">
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-semibold text-amber-300 mb-1.5 text-center leading-tight">
              {slotLabels.slot1}
            </span>
            <input
              type="color"
              value={c1}
              onChange={(e) => handleColorChange(1, e.target.value)}
              className="w-12 h-12 rounded-xl cursor-pointer border-2 border-stone-700 bg-transparent"
            />
            <span className="font-mono-numbers text-[10px] text-stone-400 mt-1 uppercase">{c1}</span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[11px] font-semibold text-amber-300 mb-1.5 text-center leading-tight">
              {slotLabels.slot2}
            </span>
            <input
              type="color"
              value={c2}
              onChange={(e) => handleColorChange(2, e.target.value)}
              className="w-12 h-12 rounded-xl cursor-pointer border-2 border-stone-700 bg-transparent"
            />
            <span className="font-mono-numbers text-[10px] text-stone-400 mt-1 uppercase">{c2}</span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[11px] font-semibold text-amber-300 mb-1.5 text-center leading-tight">
              {slotLabels.slot3}
            </span>
            <input
              type="color"
              value={c3}
              onChange={(e) => handleColorChange(3, e.target.value)}
              className="w-12 h-12 rounded-xl cursor-pointer border-2 border-stone-700 bg-transparent"
            />
            <span className="font-mono-numbers text-[10px] text-stone-400 mt-1 uppercase">{c3}</span>
          </div>
        </div>

        {/* Curated Presets for Current Character */}
        <div className="text-left mb-2">
          <span className="text-xs font-fantasy font-bold text-amber-300 uppercase tracking-wider block mb-2">
            Curated Hero Palettes
          </span>
          <div className="grid grid-cols-2 gap-2">
            {palettes.map((p) => (
              <button
                key={p.name}
                onClick={() => handleApplyPreset(p)}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-950/70 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/80 text-left transition-colors cursor-pointer group"
              >
                <span className="text-lg shrink-0">{p.icon}</span>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-amber-200 block truncate group-hover:text-amber-100">
                    {p.name}
                  </span>
                  <div className="flex gap-1 mt-1">
                    <span className="w-3 h-3 rounded-full border border-stone-900" style={{ backgroundColor: p.c1 }} />
                    <span className="w-3 h-3 rounded-full border border-stone-900" style={{ backgroundColor: p.c2 }} />
                    <span className="w-3 h-3 rounded-full border border-stone-900" style={{ backgroundColor: p.c3 }} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Done CTA */}
        <button
          onClick={onClose}
          className="mt-4 w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer font-fantasy shadow-lg"
        >
          CONFIRM & RETURN TO BATTLE
        </button>
      </div>
    </div>
  );
};
