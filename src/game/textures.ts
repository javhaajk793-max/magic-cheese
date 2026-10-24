import * as THREE from 'three';

/**
 * Procedural Canvas Texture generator for Magic Cheese: Arcane Fromage.
 * Guarantees zero 404s and sharp PBR rendering.
 */

export function createCheeseFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Dark dungeon stone base
  ctx.fillStyle = '#1c1613';
  ctx.fillRect(0, 0, 1024, 1024);

  // Cobblestone tiles
  const tileSize = 128;
  for (let x = 0; x < 1024; x += tileSize) {
    for (let y = 0; y < 1024; y += tileSize) {
      // Slight stone color variation
      const shade = Math.floor(28 + Math.random() * 20);
      ctx.fillStyle = `rgb(${shade + 10}, ${shade}, ${shade - 5})`;
      ctx.fillRect(x + 4, y + 4, tileSize - 8, tileSize - 8);

      // Stone texture noise
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      for (let i = 0; i < 40; i++) {
        const nx = x + 6 + Math.random() * (tileSize - 12);
        const ny = y + 6 + Math.random() * (tileSize - 12);
        ctx.fillRect(nx, ny, 3, 3);
      }

      // Occasional glowing cheese rune etched into stones
      if ((x + y) % (tileSize * 3) === 0) {
        ctx.save();
        ctx.translate(x + tileSize / 2, y + tileSize / 2);
        ctx.strokeStyle = '#f59e0b';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 12;
        ctx.lineWidth = 4;

        // Draw cheese wedge rune
        ctx.beginPath();
        ctx.moveTo(0, -22);
        ctx.lineTo(24, 18);
        ctx.arc(0, 18, 24, 0, Math.PI, false);
        ctx.closePath();
        ctx.stroke();

        // Rune circles
        ctx.beginPath();
        ctx.arc(-6, 2, 3, 0, Math.PI * 2);
        ctx.arc(6, -2, 4, 0, Math.PI * 2);
        ctx.arc(2, 10, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#fbbf24';
        ctx.fill();

        ctx.restore();
      }
    }
  }

  // Stone grout lines
  ctx.strokeStyle = '#0d0a08';
  ctx.lineWidth = 6;
  for (let x = 0; x <= 1024; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
    ctx.stroke();
  }
  for (let y = 0; y <= 1024; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 16);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createCheeseWedgeTexture(baseColor = '#f59e0b', holeColor = '#b45309'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Smooth warm cheese gradient
  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#fef08a');
  grad.addColorStop(0.5, baseColor);
  grad.addColorStop(1, '#d97706');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Swiss cheese holes with inner shadow
  const holePositions = [
    { x: 120, y: 140, r: 35 },
    { x: 380, y: 100, r: 45 },
    { x: 260, y: 280, r: 55 },
    { x: 100, y: 390, r: 40 },
    { x: 410, y: 370, r: 38 },
    { x: 230, y: 110, r: 24 },
    { x: 320, y: 440, r: 30 },
  ];

  holePositions.forEach(hole => {
    // Outer cavity
    ctx.beginPath();
    ctx.arc(hole.x, hole.y, hole.r, 0, Math.PI * 2);
    ctx.fillStyle = holeColor;
    ctx.fill();

    // Inner shadow for 3D depth
    ctx.beginPath();
    ctx.arc(hole.x - hole.r * 0.2, hole.y - hole.r * 0.2, hole.r * 0.85, 0, Math.PI * 2);
    ctx.fillStyle = '#78350f';
    ctx.fill();

    // Highlight crescent
    ctx.beginPath();
    ctx.arc(hole.x + hole.r * 0.25, hole.y + hole.r * 0.25, hole.r * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(254, 240, 138, 0.25)';
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createRuneCircleTexture(color = '#f59e0b'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 512, 512);

  const cx = 256;
  const cy = 256;

  // Outer glowing ring
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(cx, cy, 220, 0, Math.PI * 2);
  ctx.stroke();

  // Inner ring
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, 180, 0, Math.PI * 2);
  ctx.stroke();

  // Cheese star runes (hexagram-like)
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const x = cx + Math.cos(angle) * 175;
    const y = cy + Math.sin(angle) * 175;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();

  // Sacred cheese triangles at 6 points
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const px = cx + Math.cos(angle) * 200;
    const py = cy + Math.sin(angle) * 200;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(10, 10);
    ctx.lineTo(-10, 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createWebTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 512, 512);
  ctx.strokeStyle = '#fef08a';
  ctx.fillStyle = 'rgba(254, 240, 138, 0.2)';
  ctx.lineWidth = 6;
  ctx.shadowColor = '#f59e0b';
  ctx.shadowBlur = 10;

  const cx = 256;
  const cy = 256;

  // Radiating melted cheese threads
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI) / 6;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    const ex = cx + Math.cos(angle) * 230;
    const ey = cy + Math.sin(angle) * 230;
    // Wavy curve
    ctx.quadraticCurveTo(cx + Math.cos(angle + 0.2) * 120, cy + Math.sin(angle + 0.2) * 120, ex, ey);
    ctx.stroke();
  }

  // Concentric cheese web rings
  [60, 120, 180, 230].forEach(r => {
    ctx.beginPath();
    for (let i = 0; i <= 12; i++) {
      const angle = (i * Math.PI) / 6;
      const px = cx + Math.cos(angle) * (r + (Math.random() * 8 - 4));
      const py = cy + Math.sin(angle) * (r + (Math.random() * 8 - 4));
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
