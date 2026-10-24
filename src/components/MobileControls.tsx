import React, { useRef, useState } from 'react';
import { SpellId, SpellInfo } from '../game/types';

interface MobileControlsProps {
  onJoystickMove: (x: number, y: number, active: boolean) => void;
  onCastSpell: (id: SpellId) => void;
  spells: Record<SpellId, SpellInfo>;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onJoystickMove,
  onCastSpell,
  spells,
}) => {
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });
  const baseRef = useRef<HTMLDivElement>(null);

  const spellList = Object.values(spells);
  const primarySpell = spellList[0];
  const qSpell = spellList[1];
  const rSpell = spellList[4];

  const handleTouchStart = (e: React.TouchEvent) => {
    handleTouchMove(e);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!baseRef.current) return;
    const touch = e.touches[0];
    const rect = baseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const maxRadius = 45;
    const dist = Math.hypot(dx, dy);

    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);

    const stickX = Math.cos(angle) * clampedDist;
    const stickY = Math.sin(angle) * clampedDist;

    setStickPos({ x: stickX, y: stickY });
    onJoystickMove(stickX / maxRadius, stickY / maxRadius, true);
  };

  const handleTouchEnd = () => {
    setStickPos({ x: 0, y: 0 });
    onJoystickMove(0, 0, false);
  };

  return (
    <div className="absolute inset-0 pointer-events-none md:hidden flex justify-between items-end p-4 z-15">
      {/* Virtual Joystick (Bottom Left) */}
      <div
        ref={baseRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className="w-28 h-28 rounded-full bg-stone-950/70 border-2 border-amber-600/50 relative flex items-center justify-center pointer-events-auto touch-none shadow-xl"
      >
        <div
          className="w-12 h-12 rounded-full bg-amber-500/80 border border-amber-300 shadow-md transform transition-transform"
          style={{
            transform: `translate(${stickPos.x}px, ${stickPos.y}px)`,
          }}
        />
      </div>

      {/* Quick Cast Buttons (Bottom Right) */}
      <div className="flex gap-2 items-end pointer-events-auto">
        {qSpell && (
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onCastSpell(qSpell.id);
            }}
            className="w-12 h-12 rounded-full bg-stone-900 border border-amber-500/80 text-amber-300 font-bold flex items-center justify-center text-xl shadow-lg active:scale-90"
            title={qSpell.name}
          >
            {qSpell.icon}
          </button>
        )}

        {rSpell && (
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onCastSpell(rSpell.id);
            }}
            className="w-12 h-12 rounded-full bg-red-950 border border-red-500 text-white font-bold flex items-center justify-center text-xl shadow-lg active:scale-90"
            title={rSpell.name}
          >
            {rSpell.icon}
          </button>
        )}

        {primarySpell && (
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onCastSpell(primarySpell.id);
            }}
            className="w-16 h-16 rounded-full bg-amber-500 border-2 border-amber-300 text-stone-950 font-bold flex items-center justify-center text-2xl shadow-xl active:scale-90"
            title={primarySpell.name}
          >
            {primarySpell.icon}
          </button>
        )}
      </div>
    </div>
  );
};
