import * as THREE from 'three';

interface Particle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  color: THREE.Color;
  size: number;
  life: number;
  maxLife: number;
  active: boolean;
}

export class ParticleSystem {
  private maxParticles = 600;
  private particles: Particle[] = [];
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  public points: THREE.Points;

  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;

  constructor(scene: THREE.Scene) {
    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);
    this.sizes = new Float32Array(this.maxParticles);

    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        pos: new THREE.Vector3(0, -999, 0),
        vel: new THREE.Vector3(),
        color: new THREE.Color(),
        size: 0.1,
        life: 0,
        maxLife: 1,
        active: false,
      });
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    // Create soft circular particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.4, 'rgba(255, 240, 180, 0.8)');
    grad.addColorStop(1, 'rgba(255, 200, 50, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(32, 32, 30, 0, Math.PI * 2);
    ctx.fill();

    const pTex = new THREE.CanvasTexture(canvas);

    this.material = new THREE.PointsMaterial({
      size: 0.45,
      map: pTex,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  public emit(pos: THREE.Vector3, count: number, options: {
    colorHex?: number;
    speed?: number;
    size?: number;
    life?: number;
    spreadY?: boolean;
  } = {}) {
    const colorHex = options.colorHex ?? 0xf59e0b;
    const speed = options.speed ?? 4;
    const baseSize = options.size ?? 0.35;
    const lifeDuration = options.life ?? 0.6;
    const spreadY = options.spreadY ?? true;

    let emitted = 0;
    for (let i = 0; i < this.maxParticles && emitted < count; i++) {
      const p = this.particles[i];
      if (!p.active) {
        p.active = true;
        p.pos.copy(pos);
        const theta = Math.random() * Math.PI * 2;
        const phi = (Math.random() - 0.5) * Math.PI;
        const spd = speed * (0.4 + Math.random() * 0.8);

        p.vel.set(
          Math.cos(theta) * Math.cos(phi) * spd,
          spreadY ? (Math.random() * 0.7 + 0.3) * spd : (Math.random() * 0.4) * spd,
          Math.sin(theta) * Math.cos(phi) * spd
        );

        p.color.setHex(colorHex);
        p.size = baseSize * (0.7 + Math.random() * 0.6);
        p.life = lifeDuration * (0.8 + Math.random() * 0.4);
        p.maxLife = p.life;
        emitted++;
      }
    }
  }

  public update(dt: number) {
    const posAttr = this.geometry.attributes.position as THREE.BufferAttribute;
    const colAttr = this.geometry.attributes.color as THREE.BufferAttribute;

    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (p.active) {
        p.life -= dt;
        if (p.life <= 0) {
          p.active = false;
          p.pos.set(0, -999, 0);
        } else {
          p.pos.addScaledVector(p.vel, dt);
          p.vel.y -= 7.5 * dt; // gravity
          p.vel.x *= 0.96; // drag
          p.vel.z *= 0.96;

          // Fade color towards death
          const progress = p.life / p.maxLife;
          this.colors[i * 3] = p.color.r * progress;
          this.colors[i * 3 + 1] = p.color.g * progress;
          this.colors[i * 3 + 2] = p.color.b * progress;
        }
      }

      this.positions[i * 3] = p.pos.x;
      this.positions[i * 3 + 1] = p.pos.y;
      this.positions[i * 3 + 2] = p.pos.z;
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  }

  public dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}
