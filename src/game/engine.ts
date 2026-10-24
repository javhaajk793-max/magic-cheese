import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { sound } from './audio';
import { ParticleSystem } from './particles';
import {
  createCheeseFloorTexture,
  createRuneCircleTexture,
  createWebTexture,
} from './textures';
import {
  createCheddalfWizard,
  createBaldanHero,
  createNomioHero,
  createRatEnemy,
  createWispEnemy,
  createSpitterEnemy,
  createGoudaGolemBoss,
  createDarkOfKingBoss,
  createLastOfKingBoss,
  createPhantomKingBoss,
  createIronKingBoss,
  createShadowGorgonzolaKingBoss,
  createRoquefortEmperorBoss,
  createParmesanWarlordBoss,
  createSupremeOverlordKingBoss,
  createDarkArrowMesh,
  createFighterSlashMesh,
  createPhantomOrbMesh,
  createSovereignBeamMesh,
  createCheeseDropMesh,
  createDestinyWheelMesh,
  createBaldanArrowMesh,
  createBaldanFireArrowMesh,
  createBaldanBigArrowMesh,
  createNomioPunchWaveMesh,
  updateCheddalfColors,
  updateHeroColors,
} from './models';
import {
  GamePhase,
  CharacterId,
  CharacterConfig,
  PlayerStats,
  SpellId,
  SpellInfo,
  Enemy,
  BossId,
  Projectile,
  CheeseDrop,
  AoEZone,
  FloatingText,
  CustomColors,
} from './types';
import { mpClient } from './multiplayer';

// Pre-allocated math objects to eliminate GC in render loop
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _mousePos3D = new THREE.Vector3();
const _groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const _raycaster = new THREE.Raycaster();
const _mouseNDC = new THREE.Vector2();

export const ALL_SPELLS: Record<SpellId, SpellInfo> = {
  // Cheddalf (Mage)
  gouda_flare: {
    id: 'gouda_flare',
    name: 'Gouda Flare',
    cheeseType: 'Smoked Gouda',
    description: 'Hurls an explosive fiery gouda orb that bounces and scorches enemies.',
    manaCost: 14,
    cooldown: 0.35,
    currentCooldown: 0,
    icon: '🧀',
    color: '#f59e0b',
    keyHint: 'L-Click / Space',
    damageValue: 32,
  },
  swiss_rift: {
    id: 'swiss_rift',
    name: 'Swiss Time Warp',
    cheeseType: 'Cosmic Swiss',
    description: 'Bends spacetime through sacred Swiss holes, slowing time to 20% for enemies.',
    manaCost: 45,
    cooldown: 8.0,
    currentCooldown: 0,
    icon: '⏳',
    color: '#38bdf8',
    keyHint: 'Q / 1',
  },
  mozzarella_trap: {
    id: 'mozzarella_trap',
    name: 'Mozzarella Snare',
    cheeseType: 'Stretchy Mozzarella',
    description: 'Lays elastic melted cheese webs that snare and immobilize foes.',
    manaCost: 28,
    cooldown: 3.5,
    currentCooldown: 0,
    icon: '🕸️',
    color: '#fef08a',
    keyHint: 'E / 2',
  },
  blue_spore: {
    id: 'blue_spore',
    name: 'Blue Cheese Miasma',
    cheeseType: 'Pungent Roquefort',
    description: 'Releases a noxious cloud of blue cheese spores causing corrosive rot.',
    manaCost: 35,
    cooldown: 5.0,
    currentCooldown: 0,
    icon: '☁️',
    color: '#10b981',
    keyHint: 'Shift / 3',
  },
  wheel_destiny: {
    id: 'wheel_destiny',
    name: 'Wheel of Destiny',
    cheeseType: 'Colossal Parmesan',
    description: 'Rolls a gargantuan flaming cheese wheel that crushes all enemies in its wake!',
    manaCost: 0,
    cooldown: 12.0,
    currentCooldown: 0,
    icon: '🔥',
    color: '#ef4444',
    keyHint: 'R / Ult',
    damageValue: 120,
  },

  // Baldan (Fighting Style: Arrow)
  baldan_shot: {
    id: 'baldan_shot',
    name: 'Ranger Arrow',
    cheeseType: 'Cedar Cheddar',
    description: 'Fires a rapid precision piercing arrow at distant enemies.',
    manaCost: 6,
    cooldown: 0.25,
    currentCooldown: 0,
    icon: '🏹',
    color: '#22c55e',
    keyHint: 'L-Click / Space',
    damageValue: 35,
  },
  arrow_trio: {
    id: 'arrow_trio',
    name: '3 Arrow Attack',
    cheeseType: 'Triple Gouda Fletch',
    description: 'Unleashes a lethal spread of 3 piercing arrows dealing heavy burst damage.',
    manaCost: 24,
    cooldown: 3.0,
    currentCooldown: 0,
    icon: '🎯',
    color: '#4ade80',
    keyHint: 'Q / 1',
    damageValue: 70,
  },
  fire_burn: {
    id: 'fire_burn',
    name: 'Fire Attack - Burn',
    cheeseType: 'Blazing Pepperjack',
    description: 'Fires an incendiary arrow that explodes on impact and scorches the ground with continuous burn.',
    manaCost: 30,
    cooldown: 4.2,
    currentCooldown: 0,
    icon: '🔥',
    color: '#f97316',
    keyHint: 'E / 2',
    damageValue: 45,
  },
  stealth_invis: {
    id: 'stealth_invis',
    name: 'Invisible Stealth',
    cheeseType: 'Camouflage Curd',
    description: 'Blends into shadows with complete invisibility and +50% move speed. Enemies lose sight, next strike crits for +40 dmg.',
    manaCost: 28,
    cooldown: 6.5,
    currentCooldown: 0,
    icon: '👤',
    color: '#a7f3d0',
    keyHint: 'Shift / 3',
  },
  big_big_arrow: {
    id: 'big_big_arrow',
    name: 'Big Big Arrow',
    cheeseType: 'Titanic Starlight Wheel',
    description: 'Channels all arcane archery power into a gigantic colossal arrow that pierces every foe for 100 massive damage!',
    manaCost: 0,
    cooldown: 10.0,
    currentCooldown: 0,
    icon: '✨',
    color: '#86efac',
    keyHint: 'R / Ult',
    damageValue: 100,
  },

  // Nomio (Fighting Style: Fighter)
  nomio_jab: {
    id: 'nomio_jab',
    name: 'Pugilist Jab',
    cheeseType: 'Sharp Brawler Rind',
    description: 'Snappy forward fist strike that batters close foes.',
    manaCost: 0,
    cooldown: 0.22,
    currentCooldown: 0,
    icon: '👊',
    color: '#ef4444',
    keyHint: 'L-Click / Space',
    damageValue: 30,
  },
  one_punch: {
    id: 'one_punch',
    name: 'One Punch',
    cheeseType: 'Knockout Cheddar',
    description: 'Charges forward with a devastating lunging straight punch that shatters enemy defenses for 70 damage.',
    manaCost: 18,
    cooldown: 2.8,
    currentCooldown: 0,
    icon: '💥',
    color: '#f87171',
    keyHint: 'Q / 1',
    damageValue: 70,
  },
  double_jab: {
    id: 'double_jab',
    name: '2 Jab Combo',
    cheeseType: 'Double Brie Impact',
    description: 'Delivers a rapid one-two lightning jab combo that knocks enemies back for 50 damage.',
    manaCost: 22,
    cooldown: 3.2,
    currentCooldown: 0,
    icon: '🥊',
    color: '#fb923c',
    keyHint: 'E / 2',
    damageValue: 50,
  },
  punch_spray: {
    id: 'punch_spray',
    name: 'Punch Spray',
    cheeseType: 'Flurry Fondue Fist',
    description: 'Unleashes an explosive machine-gun flurry of rapid punches spraying shockwaves in front for 80 damage.',
    manaCost: 32,
    cooldown: 5.0,
    currentCooldown: 0,
    icon: '🌪️',
    color: '#dc2626',
    keyHint: 'Shift / 3',
    damageValue: 80,
  },
  big_punch: {
    id: 'big_punch',
    name: 'Big Punch',
    cheeseType: 'Seismic Parmesan Titan',
    description: 'Leaps and crashes down with a catastrophic colossal fist slam, sending a devastating seismic shockwave for 90 damage!',
    manaCost: 0,
    cooldown: 11.0,
    currentCooldown: 0,
    icon: '🌋',
    color: '#facc15',
    keyHint: 'R / Ult',
    damageValue: 90,
  },
};

export const CHARACTER_PRESETS: Record<CharacterId, CharacterConfig> = {
  baldan: {
    id: 'baldan',
    name: 'Baldan',
    fightingStyle: 'Arrow',
    styleTitle: 'Cheese Ranger',
    avatarEmoji: '🏹',
    description: 'Master cheese archer wielding rapid precision arrows, searing fiery volleys, camouflage invisibility, and the colossal Big Big Arrow.',
    accentColor: '#22c55e',
    borderColor: '#16a34a',
    glowColor: 'rgba(34, 197, 94, 0.5)',
    baseHp: 110,
    baseMana: 100,
    baseSpeed: 8.0,
    skills: {
      primary: 'baldan_shot',
      q: 'arrow_trio',
      e: 'fire_burn',
      shift: 'stealth_invis',
      r: 'big_big_arrow',
    },
  },
  nomio: {
    id: 'nomio',
    name: 'Nomio',
    fightingStyle: 'Fighter',
    styleTitle: 'Cheese Pugilist',
    avatarEmoji: '🥊',
    description: 'Fierce martial cheese brawler who unleashes destructive One Punches, lightning Double Jabs, relentless Punch Sprays, and the seismic Big Punch.',
    accentColor: '#ef4444',
    borderColor: '#dc2626',
    glowColor: 'rgba(239, 68, 68, 0.5)',
    baseHp: 150,
    baseMana: 80,
    baseSpeed: 7.4,
    skills: {
      primary: 'nomio_jab',
      q: 'one_punch',
      e: 'double_jab',
      shift: 'punch_spray',
      r: 'big_punch',
    },
  },
  cheddalf: {
    id: 'cheddalf',
    name: 'Cheddalf',
    fightingStyle: 'Mage',
    styleTitle: 'Grand Archmage',
    avatarEmoji: '🧙‍♂️',
    description: 'Legendary dairy sorcerer commanding fiery Gouda Flares, Swiss spacetime rifts, Mozzarella snares, Roquefort miasma, and the crushing Wheel of Destiny.',
    accentColor: '#f59e0b',
    borderColor: '#d97706',
    glowColor: 'rgba(245, 158, 11, 0.5)',
    baseHp: 100,
    baseMana: 120,
    baseSpeed: 7.2,
    skills: {
      primary: 'gouda_flare',
      q: 'swiss_rift',
      e: 'mozzarella_trap',
      shift: 'blue_spore',
      r: 'wheel_destiny',
    },
  },
};

export class MagicCheeseGame {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private particles: ParticleSystem;

  private clock = new THREE.Clock();
  private animFrameId: number | null = null;
  private isDestroyed = false;

  // Game Phase & State
  public phase: GamePhase = 'title';
  public wave: number = 1;
  public maxWaves: number = 20;
  public bossDefeated: boolean = false;

  // 10,000 Colors Atelier state
  public customColors: CustomColors = {
    robeColor: '#312e81',
    hatColor: '#1e1b4b',
    staffGlowColor: '#fbbf24',
    rainbowMode: false,
    tenThousandCooler: false,
  };

  // Combo & Collector Milestones
  private comboTimer: number = 0;
  private milestonesPassed = new Set<number>();
  private cheeseStormTimer: number = 0;

  // Player Entity & Stats
  public playerGroup: THREE.Group;
  public playerStats: PlayerStats = {
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
  };

  // Spells configuration
  public spells: Record<SpellId, SpellInfo> = {
    baldan_shot: ALL_SPELLS.baldan_shot,
    arrow_trio: ALL_SPELLS.arrow_trio,
    fire_burn: ALL_SPELLS.fire_burn,
    stealth_invis: ALL_SPELLS.stealth_invis,
    big_big_arrow: ALL_SPELLS.big_big_arrow,
  } as Record<SpellId, SpellInfo>;

  // Collections
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private cheeseDrops: CheeseDrop[] = [];
  private aoeZones: AoEZone[] = [];
  public floatingTexts: FloatingText[] = [];

  // Online Multiplayer Teammates
  public teammates: Map<
    string,
    {
      id: string;
      name: string;
      characterId: CharacterId;
      color: string;
      mesh: THREE.Group;
      hp: number;
      maxHp: number;
      targetPos: THREE.Vector3;
      targetRot: number;
      isBot?: boolean;
      botAttackTimer?: number;
    }
  > = new Map();
  private mpSyncTimer = 0;

  // Input state
  private keys: Record<string, boolean> = {
    KeyW: false,
    KeyA: false,
    KeyS: false,
    KeyD: false,
    ArrowUp: false,
    ArrowLeft: false,
    ArrowDown: false,
    ArrowRight: false,
    Space: false,
  };
  private isPointerDown = false;
  private rawMouseX = 0;
  private rawMouseY = 0;

  // Virtual touch joystick support
  public joystickVec = { x: 0, y: 0, active: false };

  // Game feel & Camera shake
  private cameraTarget = new THREE.Vector3(0, 0, 0);
  private cameraOffset = new THREE.Vector3(0, 15, 12);
  private cameraTrauma = 0;
  private hitstopDuration = 0;

  // Spawner & wave timers
  private waveSpawnTimer = 0;
  private waveTotalSpawned = 0;
  private waveMaxToSpawn = 15;
  private nextEntityId = 1;

  // React callbacks
  private onUIUpdate?: (stats: PlayerStats, spells: Record<SpellId, SpellInfo>, texts: FloatingText[], phase: GamePhase) => void;
  private onLevelUpTrigger?: () => void;
  private onBossHpUpdate?: (current: number, max: number, active: boolean, bossName?: string, bossStyle?: string) => void;

  constructor(
    container: HTMLElement,
    callbacks?: {
      onUIUpdate?: (stats: PlayerStats, spells: Record<SpellId, SpellInfo>, texts: FloatingText[], phase: GamePhase) => void;
      onLevelUpTrigger?: () => void;
      onBossHpUpdate?: (current: number, max: number, active: boolean, bossName?: string, bossStyle?: string) => void;
    }
  ) {
    this.container = container;
    this.onUIUpdate = callbacks?.onUIUpdate;
    this.onLevelUpTrigger = callbacks?.onLevelUpTrigger;
    this.onBossHpUpdate = callbacks?.onBossHpUpdate;

    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x160f0b);
    this.scene.fog = new THREE.Fog(0x160f0b, 16, 42);

    this.camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      100
    );
    this.camera.position.set(0, 16, 13);
    this.camera.lookAt(0, 0, 0);

    // 2. Renderer setup with ACESFilmic & SRGB
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 3. Studio PBR Environment Map via RoomEnvironment
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // 4. Lighting Rig (Warm Key + Cool Fill + Rim)
    const keyLight = new THREE.DirectionalLight(0xffedd5, 2.2);
    keyLight.position.set(12, 22, 10);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 50;
    keyLight.shadow.camera.left = -18;
    keyLight.shadow.camera.right = 18;
    keyLight.shadow.camera.top = 18;
    keyLight.shadow.camera.bottom = -18;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    this.scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0x60a5fa, 0x78350f, 0.9);
    this.scene.add(hemiLight);

    // 5. Arena Floor & Perimeters
    this.buildDungeonArena();

    // 6. Player Character (Default: Baldan - Arrow Style)
    this.playerGroup = createBaldanHero();
    this.scene.add(this.playerGroup);

    // 7. Particle System
    this.particles = new ParticleSystem(this.scene);

    // 8. Event Listeners
    this.setupInputs();

    // 9. Pre-warm shaders
    this.renderer.compile(this.scene, this.camera);

    // 10. Start Animation Loop
    this.loop = this.loop.bind(this);
    this.animFrameId = requestAnimationFrame(this.loop);
  }

  private buildDungeonArena() {
    // Large circular dungeon floor
    const floorGeo = new THREE.CircleGeometry(24, 48);
    const floorTex = createCheeseFloorTexture();
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.65,
      metalness: 0.15,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Center Arcane Cheese Summoning Seal
    const runeTex = createRuneCircleTexture('#f59e0b');
    const runeGeo = new THREE.PlaneGeometry(8, 8);
    const runeMat = new THREE.MeshBasicMaterial({
      map: runeTex,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });
    const runeMesh = new THREE.Mesh(runeGeo, runeMat);
    runeMesh.rotation.x = -Math.PI / 2;
    runeMesh.position.y = 0.025; // prevent z-fighting
    this.scene.add(runeMesh);

    // Perimeter ancient cheese pillars & crystal stalagmites
    const pillarCount = 12;
    const radius = 22;
    const cheeseMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0x92400e,
      emissiveIntensity: 0.4,
      roughness: 0.4,
      metalness: 0.2,
    });
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.9, metalness: 0.05 });

    for (let i = 0; i < pillarCount; i++) {
      const angle = (i * Math.PI * 2) / pillarCount;
      const px = Math.cos(angle) * radius;
      const pz = Math.sin(angle) * radius;

      // Stone base
      const pillarGroup = new THREE.Group();
      const baseMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.1, 1.2, 8), stoneMat);
      baseMesh.position.y = 0.6;
      baseMesh.castShadow = true;
      pillarGroup.add(baseMesh);

      // Glowing cheese crystal on top
      const crystalMesh = new THREE.Mesh(new THREE.ConeGeometry(0.65, 2.2, 6), cheeseMat);
      crystalMesh.position.y = 2.1;
      crystalMesh.castShadow = true;
      pillarGroup.add(crystalMesh);

      // Soft amber torch point light
      const torchLight = new THREE.PointLight(0xf59e0b, 1.2, 7);
      torchLight.position.y = 2.6;
      pillarGroup.add(torchLight);

      pillarGroup.position.set(px, 0, pz);
      this.scene.add(pillarGroup);
    }
  }

  private setupInputs() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      const charConfig = CHARACTER_PRESETS[this.playerStats.characterId] || CHARACTER_PRESETS.baldan;
      if (e.code === 'KeyQ' || e.code === 'Digit1') this.castSpell(charConfig.skills.q);
      if (e.code === 'KeyE' || e.code === 'Digit2') this.castSpell(charConfig.skills.e);
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'Digit3') this.castSpell(charConfig.skills.shift);
      if (e.code === 'KeyR' || e.code === 'Digit4') this.castSpell(charConfig.skills.r);
      if (e.code === 'Space') {
        e.preventDefault();
        this.castSpell(charConfig.skills.primary);
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener('blur', () => {
      // Clear all inputs on window blur
      Object.keys(this.keys).forEach(k => (this.keys[k] = false));
      this.isPointerDown = false;
      this.joystickVec.active = false;
    });

    const dom = this.renderer.domElement;
    dom.addEventListener('pointerdown', (e) => {
      this.isPointerDown = true;
      this.updateMousePos(e.clientX, e.clientY);
      if (this.phase === 'playing') {
        const charConfig = CHARACTER_PRESETS[this.playerStats.characterId] || CHARACTER_PRESETS.baldan;
        this.castSpell(charConfig.skills.primary);
      }
    });

    dom.addEventListener('pointermove', (e) => {
      this.updateMousePos(e.clientX, e.clientY);
    });

    dom.addEventListener('pointerup', () => {
      this.isPointerDown = false;
    });

    window.addEventListener('resize', this.onResize.bind(this));
  }

  private updateMousePos(clientX: number, clientY: number) {
    this.rawMouseX = clientX;
    this.rawMouseY = clientY;
    const rect = this.container.getBoundingClientRect();
    _mouseNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    _mouseNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    _raycaster.setFromCamera(_mouseNDC, this.camera);
    _raycaster.ray.intersectPlane(_groundPlane, _mousePos3D);
  }

  private onResize() {
    if (!this.container || this.isDestroyed) return;
    const width = this.container.clientWidth;
    const height = Math.max(this.container.clientHeight, 1);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // --- Game Lifecycle Actions ---

  public startGame() {
    this.phase = 'playing';
    this.wave = 1;
    this.bossDefeated = false;
    const config = CHARACTER_PRESETS[this.playerStats.characterId] || CHARACTER_PRESETS.baldan;
    this.playerStats.maxHp = config.baseHp;
    this.playerStats.hp = config.baseHp;
    this.playerStats.maxMana = config.baseMana;
    this.playerStats.mana = config.baseMana;
    this.playerStats.moveSpeed = config.baseSpeed;
    this.playerStats.isInvisible = false;
    this.playerStats.invisibleTimer = 0;
    this.playerStats.level = 1;
    this.playerStats.xp = 0;
    this.playerStats.nextLevelXp = 80;
    this.playerStats.ultimateCharge = 0;
    this.playerStats.kills = 0;
    this.playerStats.shards = 0;

    // Reset entities
    this.clearAllEntities();
    this.playerGroup.position.set(0, 0, 0);

    sound.startMusic();
    this.spawnFloatingText(`${config.name.toUpperCase()} (WAVE 1)`, 0, 2, config.accentColor);
  }

  public restartGame() {
    this.startGame();
  }

  public setPhase(phase: GamePhase) {
    this.phase = phase;
    if (phase === 'playing') {
      sound.startMusic();
    }
  }

  private clearAllEntities() {
    this.enemies.forEach(e => {
      this.scene.remove(e.mesh);
      if (e.telegraphMesh) this.scene.remove(e.telegraphMesh);
    });
    this.enemies = [];

    this.projectiles.forEach(p => this.scene.remove(p.mesh));
    this.projectiles = [];

    this.cheeseDrops.forEach(d => this.scene.remove(d.mesh));
    this.cheeseDrops = [];

    this.aoeZones.forEach(z => this.scene.remove(z.mesh));
    this.aoeZones = [];

    this.floatingTexts = [];
    this.waveSpawnTimer = 0;
    this.waveTotalSpawned = 0;
  }

  // --- Spell Casting System ---

  public castSpell(id: SpellId) {
    if (this.phase !== 'playing') return;
    const spell = this.spells[id];
    if (!spell) return;

    // Ultimate requires 100% charge
    if (id === 'wheel_destiny' || id === 'big_big_arrow' || id === 'big_punch') {
      if (this.playerStats.ultimateCharge < 100) return;
      this.playerStats.ultimateCharge = 0;
    } else {
      if (spell.currentCooldown > 0) return;
      if (this.playerStats.mana < spell.manaCost) return;
      this.playerStats.mana -= spell.manaCost;
    }

    spell.currentCooldown = spell.cooldown;

    // Aim direction towards mouse ground intersection
    _dir.subVectors(_mousePos3D, this.playerGroup.position);
    _dir.y = 0;
    if (_dir.lengthSq() < 0.1) {
      _dir.set(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.playerGroup.rotation.y);
    }
    _dir.normalize();

    // Face aiming direction
    this.playerGroup.rotation.y = Math.atan2(_dir.x, _dir.z);

    // Animate weapons
    const staff = this.playerGroup.userData.staffGroup as THREE.Group | undefined;
    if (staff) {
      staff.rotation.x = 0.5;
      setTimeout(() => { if (staff) staff.rotation.x = 0; }, 180);
    }
    const bow = this.playerGroup.userData.bowGroup as THREE.Group | undefined;
    if (bow) {
      bow.rotation.x = -0.4;
      setTimeout(() => { if (bow) bow.rotation.x = 0; }, 160);
    }
    const rightFist = this.playerGroup.userData.rightFist as THREE.Group | undefined;
    if (rightFist) {
      rightFist.position.z += 0.45;
      setTimeout(() => { if (rightFist) rightFist.position.z -= 0.45; }, 140);
    }

    // Break stealth on attacking (except when activating stealth)
    if (this.playerStats.isInvisible && id !== 'stealth_invis') {
      this.playerStats.isInvisible = false;
      this.setPlayerOpacity(1.0);
      this.spawnFloatingText('SNEAK ATTACK! +40 DMG', this.playerGroup.position.x, this.playerGroup.position.z, '#a7f3d0');
      sound.playLevelUp();
    }

    // Broadcast spell to online party members
    mpClient.broadcastSpell(
      id,
      { x: this.playerGroup.position.x, y: this.playerGroup.position.y, z: this.playerGroup.position.z },
      { x: _dir.x, y: _dir.y, z: _dir.z }
    );

    switch (id) {
      // Cheddalf (Mage)
      case 'gouda_flare':
        this.castGoudaFlare(_dir);
        break;
      case 'mozzarella_trap':
        this.castMozzarellaTrap();
        break;
      case 'blue_spore':
        this.castBlueSpore();
        break;
      case 'swiss_rift':
        this.castSwissRift();
        break;
      case 'wheel_destiny':
        this.castWheelOfDestiny(_dir);
        break;

      // Baldan (Arrow)
      case 'baldan_shot':
        this.castBaldanShot(_dir);
        break;
      case 'arrow_trio':
        this.castBaldanArrowTrio(_dir);
        break;
      case 'fire_burn':
        this.castBaldanFireBurn(_dir);
        break;
      case 'stealth_invis':
        this.castBaldanInvisible();
        break;
      case 'big_big_arrow':
        this.castBaldanBigBigArrow(_dir);
        break;

      // Nomio (Fighter)
      case 'nomio_jab':
        this.castNomioJab(_dir);
        break;
      case 'one_punch':
        this.castNomioOnePunch(_dir);
        break;
      case 'double_jab':
        this.castNomioDoubleJab(_dir);
        break;
      case 'punch_spray':
        this.castNomioPunchSpray(_dir);
        break;
      case 'big_punch':
        this.castNomioBigPunch(_dir);
        break;
    }
  }

  private castGoudaFlare(dir: THREE.Vector3) {
    sound.playGoudaCast();

    // Gouda fireball projectile
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 10, 10),
      new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xd97706,
        emissiveIntensity: 1.2,
        roughness: 0.3,
      })
    );
    const startPos = this.playerGroup.position.clone().add(new THREE.Vector3(0, 1.2, 0)).addScaledVector(dir, 0.6);
    mesh.position.copy(startPos);
    mesh.castShadow = true;
    this.scene.add(mesh);

    this.projectiles.push({
      id: this.nextEntityId++,
      mesh,
      position: startPos,
      velocity: dir.clone().multiplyScalar(22),
      damage: 32 * this.playerStats.spellPower,
      radius: 0.4,
      life: 2.2,
      maxLife: 2.2,
      type: 'player_gouda',
    });

    this.particles.emit(startPos, 12, { colorHex: 0xfbbf24, speed: 3, size: 0.3 });
  }

  private castMozzarellaTrap() {
    sound.playStringTrap();
    const trapPos = this.playerGroup.position.clone();
    trapPos.y = 0.03;

    const webTex = createWebTexture();
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 6),
      new THREE.MeshBasicMaterial({
        map: webTex,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.copy(trapPos);
    this.scene.add(mesh);

    this.aoeZones.push({
      id: this.nextEntityId++,
      mesh,
      position: trapPos,
      radius: 3.2,
      duration: 5.0,
      maxDuration: 5.0,
      type: 'mozzarella_web',
      tickTimer: 0,
    });

    this.particles.emit(trapPos, 24, { colorHex: 0xfef08a, speed: 2.5, size: 0.4 });
    this.spawnFloatingText('Mozzarella Trap!', trapPos.x, trapPos.z, '#fef08a');
  }

  private castBlueSpore() {
    sound.playToxicCloud();
    const pos = this.playerGroup.position.clone();
    pos.y = 0.4;

    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(3.5, 12, 10),
      new THREE.MeshPhysicalMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0.35,
        transmission: 0.5,
        depthWrite: false,
      })
    );
    mesh.position.copy(pos);
    this.scene.add(mesh);

    this.aoeZones.push({
      id: this.nextEntityId++,
      mesh,
      position: pos,
      radius: 3.8,
      duration: 5.5,
      maxDuration: 5.5,
      type: 'blue_miasma',
      tickTimer: 0,
    });

    this.particles.emit(pos, 35, { colorHex: 0x34d399, speed: 3.5, size: 0.5 });
    this.spawnFloatingText('Pungent Spores!', pos.x, pos.z, '#34d399');
  }

  private castSwissRift() {
    sound.playTimeRift();
    const pos = this.playerGroup.position.clone();
    pos.y = 0.04;

    const runeTex = createRuneCircleTexture('#38bdf8');
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 8),
      new THREE.MeshBasicMaterial({
        map: runeTex,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
      })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.copy(pos);
    this.scene.add(mesh);

    this.aoeZones.push({
      id: this.nextEntityId++,
      mesh,
      position: pos,
      radius: 4.2,
      duration: 4.5,
      maxDuration: 4.5,
      type: 'swiss_rift',
      tickTimer: 0,
    });

    this.particles.emit(pos, 45, { colorHex: 0x38bdf8, speed: 5, size: 0.4 });
    this.spawnFloatingText('Swiss Time Dilation!', pos.x, pos.z, '#38bdf8');
  }

  private castWheelOfDestiny(dir: THREE.Vector3) {
    sound.playWheelDestiny();
    this.addCameraTrauma(0.85);

    const mesh = createDestinyWheelMesh();
    const startPos = this.playerGroup.position.clone().addScaledVector(dir, 1.2);
    startPos.y = 0;
    mesh.position.copy(startPos);
    this.scene.add(mesh);

    this.projectiles.push({
      id: this.nextEntityId++,
      mesh,
      position: startPos,
      velocity: dir.clone().multiplyScalar(15),
      damage: 180 * this.playerStats.spellPower,
      radius: 1.4,
      life: 3.0,
      maxLife: 3.0,
      type: 'player_wheel',
    });

    this.particles.emit(startPos, 50, { colorHex: 0xff4500, speed: 7, size: 0.6 });
    this.spawnFloatingText('WHEEL OF DESTINY!', startPos.x, startPos.z, '#ef4444');
  }

  // --- Baldan (Fighting Style: Arrow) Spells ---

  private castBaldanShot(dir: THREE.Vector3) {
    sound.playGoudaCast();
    const mesh = createBaldanArrowMesh();
    const startPos = this.playerGroup.position.clone().add(new THREE.Vector3(0, 0.9, 0)).addScaledVector(dir, 0.6);
    mesh.position.copy(startPos);
    mesh.rotation.y = Math.atan2(dir.x, dir.z);
    mesh.castShadow = true;
    this.scene.add(mesh);

    this.projectiles.push({
      id: this.nextEntityId++,
      mesh,
      position: startPos,
      velocity: dir.clone().multiplyScalar(26),
      damage: 35 * this.playerStats.spellPower,
      radius: 0.35,
      life: 2.2,
      maxLife: 2.2,
      type: 'baldan_arrow',
    });

    this.particles.emit(startPos, 8, { colorHex: 0x22c55e, speed: 3, size: 0.3 });
  }

  // Skill Q: 3 arrow atack 70
  private castBaldanArrowTrio(dir: THREE.Vector3) {
    sound.playGoudaCast();
    this.addCameraTrauma(0.2);
    this.spawnFloatingText('3 ARROW ATTACK (70 DMG)!', this.playerGroup.position.x, this.playerGroup.position.z, '#4ade80');

    [-0.18, 0, 0.18].forEach((angle) => {
      const spreadDir = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angle).normalize();
      const mesh = createBaldanArrowMesh();
      const startPos = this.playerGroup.position.clone().add(new THREE.Vector3(0, 0.9, 0)).addScaledVector(spreadDir, 0.6);
      mesh.position.copy(startPos);
      mesh.rotation.y = Math.atan2(spreadDir.x, spreadDir.z);
      mesh.castShadow = true;
      this.scene.add(mesh);

      this.projectiles.push({
        id: this.nextEntityId++,
        mesh,
        position: startPos,
        velocity: spreadDir.multiplyScalar(28),
        damage: 70 * this.playerStats.spellPower,
        radius: 0.4,
        life: 2.4,
        maxLife: 2.4,
        type: 'baldan_arrow',
      });
    });

    this.particles.emit(this.playerGroup.position, 18, { colorHex: 0x4ade80, speed: 4, size: 0.35 });
  }

  // Skill E: fire atack-burn
  private castBaldanFireBurn(dir: THREE.Vector3) {
    sound.playExplosion(0.5);
    this.spawnFloatingText('FIRE ATTACK - BURN!', this.playerGroup.position.x, this.playerGroup.position.z, '#f97316');

    const mesh = createBaldanFireArrowMesh();
    const startPos = this.playerGroup.position.clone().add(new THREE.Vector3(0, 0.9, 0)).addScaledVector(dir, 0.6);
    mesh.position.copy(startPos);
    mesh.rotation.y = Math.atan2(dir.x, dir.z);
    mesh.castShadow = true;
    this.scene.add(mesh);

    this.projectiles.push({
      id: this.nextEntityId++,
      mesh,
      position: startPos,
      velocity: dir.clone().multiplyScalar(25),
      damage: 45 * this.playerStats.spellPower,
      radius: 0.5,
      life: 2.5,
      maxLife: 2.5,
      type: 'baldan_fire_arrow',
    });

    this.particles.emit(startPos, 16, { colorHex: 0xff3b00, speed: 4.5, size: 0.4 });
  }

  // Skill Shift: invisible
  private castBaldanInvisible() {
    sound.playToxicCloud();
    this.playerStats.isInvisible = true;
    this.playerStats.invisibleTimer = 4.5;
    this.setPlayerOpacity(0.28);

    this.spawnFloatingText('INVISIBLE STEALTH!', this.playerGroup.position.x, this.playerGroup.position.z, '#a7f3d0');
    this.particles.emit(this.playerGroup.position, 28, { colorHex: 0xa7f3d0, speed: 3, size: 0.35 });
  }

  // Skill R: big big arrow damage 100
  private castBaldanBigBigArrow(dir: THREE.Vector3) {
    sound.playWheelDestiny();
    this.addCameraTrauma(0.65);
    this.spawnFloatingText('BIG BIG ARROW (100 DMG)!', this.playerGroup.position.x, this.playerGroup.position.z, '#86efac');

    const mesh = createBaldanBigArrowMesh();
    const startPos = this.playerGroup.position.clone().add(new THREE.Vector3(0, 1.0, 0)).addScaledVector(dir, 1.2);
    mesh.position.copy(startPos);
    mesh.rotation.y = Math.atan2(dir.x, dir.z);
    mesh.castShadow = true;
    this.scene.add(mesh);

    this.projectiles.push({
      id: this.nextEntityId++,
      mesh,
      position: startPos,
      velocity: dir.clone().multiplyScalar(22),
      damage: 100 * this.playerStats.spellPower,
      radius: 1.1,
      life: 3.0,
      maxLife: 3.0,
      type: 'baldan_big_arrow',
    });

    this.particles.emit(startPos, 45, { colorHex: 0x4ade80, speed: 6, size: 0.5 });
  }

  // --- Nomio (Fighting Style: Fighter) Spells ---

  private castNomioJab(dir: THREE.Vector3) {
    sound.playPlayerHit();
    const mesh = createNomioPunchWaveMesh();
    const startPos = this.playerGroup.position.clone().add(new THREE.Vector3(0, 0.8, 0)).addScaledVector(dir, 0.8);
    mesh.position.copy(startPos);
    mesh.rotation.y = Math.atan2(dir.x, dir.z);
    this.scene.add(mesh);

    this.projectiles.push({
      id: this.nextEntityId++,
      mesh,
      position: startPos,
      velocity: dir.clone().multiplyScalar(20),
      damage: 30 * this.playerStats.spellPower,
      radius: 0.7,
      life: 0.45,
      maxLife: 0.45,
      type: 'nomio_punch_wave',
    });

    this.particles.emit(startPos, 10, { colorHex: 0xf59e0b, speed: 4, size: 0.35 });
  }

  // Skill Q: one punch damage 70
  private castNomioOnePunch(dir: THREE.Vector3) {
    sound.playBossRoar();
    this.addCameraTrauma(0.5);
    this.spawnFloatingText('ONE PUNCH (70 DMG)!', this.playerGroup.position.x, this.playerGroup.position.z, '#f87171');

    // Lunge forward
    this.playerGroup.position.addScaledVector(dir, 2.5);

    const punchPos = this.playerGroup.position.clone().add(new THREE.Vector3(0, 0.8, 0)).addScaledVector(dir, 0.8);
    const mesh = createNomioPunchWaveMesh();
    mesh.scale.set(1.5, 1.5, 1.5);
    mesh.position.copy(punchPos);
    mesh.rotation.y = Math.atan2(dir.x, dir.z);
    this.scene.add(mesh);

    this.projectiles.push({
      id: this.nextEntityId++,
      mesh,
      position: punchPos,
      velocity: dir.clone().multiplyScalar(22),
      damage: 70 * this.playerStats.spellPower,
      radius: 1.2,
      life: 0.55,
      maxLife: 0.55,
      type: 'nomio_punch_wave',
    });

    this.particles.emit(punchPos, 30, { colorHex: 0xef4444, speed: 6, size: 0.45 });
  }

  // Skill E: 2 jab damage 50
  private castNomioDoubleJab(dir: THREE.Vector3) {
    sound.playPlayerHit();
    this.spawnFloatingText('2 JAB (50 DMG)!', this.playerGroup.position.x, this.playerGroup.position.z, '#fb923c');

    this.fireNomioJabWave(dir, 25, 0);

    setTimeout(() => {
      this.fireNomioJabWave(dir, 25, 0.1);
      sound.playPlayerHit();
    }, 120);
  }

  private fireNomioJabWave(dir: THREE.Vector3, dmg: number, angleOffset: number) {
    const punchDir = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angleOffset).normalize();
    const mesh = createNomioPunchWaveMesh();
    const startPos = this.playerGroup.position.clone().add(new THREE.Vector3(0, 0.8, 0)).addScaledVector(punchDir, 0.7);
    mesh.position.copy(startPos);
    mesh.rotation.y = Math.atan2(punchDir.x, punchDir.z);
    this.scene.add(mesh);

    this.projectiles.push({
      id: this.nextEntityId++,
      mesh,
      position: startPos,
      velocity: punchDir.multiplyScalar(22),
      damage: dmg * this.playerStats.spellPower,
      radius: 0.8,
      life: 0.5,
      maxLife: 0.5,
      type: 'nomio_punch_wave',
    });
  }

  // Skill Shift: punch spray 80 damage
  private castNomioPunchSpray(dir: THREE.Vector3) {
    sound.playExplosion(0.6);
    this.addCameraTrauma(0.35);
    this.spawnFloatingText('PUNCH SPRAY (80 DMG)!', this.playerGroup.position.x, this.playerGroup.position.z, '#dc2626');

    // 5 rapid fist shockwaves in fan
    const angles = [-0.3, -0.15, 0, 0.15, 0.3];
    angles.forEach((angle, idx) => {
      setTimeout(() => {
        const spreadDir = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angle).normalize();
        const mesh = createNomioPunchWaveMesh();
        const startPos = this.playerGroup.position.clone().add(new THREE.Vector3(0, 0.8, 0)).addScaledVector(spreadDir, 0.6);
        mesh.position.copy(startPos);
        mesh.rotation.y = Math.atan2(spreadDir.x, spreadDir.z);
        this.scene.add(mesh);

        this.projectiles.push({
          id: this.nextEntityId++,
          mesh,
          position: startPos,
          velocity: spreadDir.multiplyScalar(24),
          damage: 16 * this.playerStats.spellPower, // 5 x 16 = 80 dmg total
          radius: 0.75,
          life: 0.55,
          maxLife: 0.55,
          type: 'nomio_punch_wave',
        });

        this.particles.emit(startPos, 6, { colorHex: 0xef4444, speed: 4, size: 0.3 });
      }, idx * 60);
    });
  }

  // Skill R: big punch damage 90
  private castNomioBigPunch(dir: THREE.Vector3) {
    sound.playBossRoar();
    this.addCameraTrauma(0.8);
    this.spawnFloatingText('BIG PUNCH (90 DMG)!', this.playerGroup.position.x, this.playerGroup.position.z, '#facc15');

    this.playerGroup.position.addScaledVector(dir, 3.2);

    const slamPos = this.playerGroup.position.clone();
    slamPos.y = 0.04;

    const ringGeo = new THREE.RingGeometry(0.5, 5.5, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const shockMesh = new THREE.Mesh(ringGeo, ringMat);
    shockMesh.rotation.x = -Math.PI / 2;
    shockMesh.position.copy(slamPos);
    this.scene.add(shockMesh);

    this.aoeZones.push({
      id: this.nextEntityId++,
      mesh: shockMesh,
      position: slamPos,
      radius: 5.5,
      duration: 1.0,
      maxDuration: 1.0,
      type: 'nomio_shockwave_zone',
      tickTimer: 0,
    });

    this.particles.emit(slamPos, 50, { colorHex: 0xfacc15, speed: 7, size: 0.6 });
  }

  public setPlayerOpacity(opacity: number) {
    this.playerGroup.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => {
            m.transparent = opacity < 1.0;
            m.opacity = opacity;
          });
        } else {
          child.material.transparent = opacity < 1.0;
          child.material.opacity = opacity;
        }
      }
    });
  }

  public setCharacter(charId: CharacterId) {
    const config = CHARACTER_PRESETS[charId];
    if (!config) return;

    const oldPos = this.playerGroup ? this.playerGroup.position.clone() : new THREE.Vector3(0, 0, 0);
    const oldRot = this.playerGroup ? this.playerGroup.rotation.y : 0;

    if (this.playerGroup) {
      this.scene.remove(this.playerGroup);
    }

    if (charId === 'baldan') {
      this.playerGroup = createBaldanHero();
    } else if (charId === 'nomio') {
      this.playerGroup = createNomioHero();
    } else {
      this.playerGroup = createCheddalfWizard();
    }

    if (!this.customColors.rainbowMode) {
      updateHeroColors(
        this.playerGroup,
        charId,
        this.customColors.robeColor,
        this.customColors.hatColor,
        this.customColors.staffGlowColor
      );
    }

    this.playerGroup.position.copy(oldPos);
    this.playerGroup.rotation.y = oldRot;
    this.scene.add(this.playerGroup);

    this.playerStats.characterId = charId;
    this.playerStats.maxHp = config.baseHp;
    this.playerStats.hp = config.baseHp;
    this.playerStats.maxMana = config.baseMana;
    this.playerStats.mana = config.baseMana;
    this.playerStats.moveSpeed = config.baseSpeed;
    this.playerStats.isInvisible = false;
    this.playerStats.invisibleTimer = 0;

    this.spells = {
      [config.skills.primary]: ALL_SPELLS[config.skills.primary],
      [config.skills.q]: ALL_SPELLS[config.skills.q],
      [config.skills.e]: ALL_SPELLS[config.skills.e],
      [config.skills.shift]: ALL_SPELLS[config.skills.shift],
      [config.skills.r]: ALL_SPELLS[config.skills.r],
    } as Record<SpellId, SpellInfo>;

    sound.playLevelUp();
    this.particles.emit(oldPos, 35, { colorHex: parseInt(config.accentColor.replace('#', '0x')), speed: 4.5, size: 0.45 });
    this.spawnFloatingText(`${config.name.toUpperCase()} ACTIVATED!`, oldPos.x, oldPos.z, config.accentColor);
  }

  // --- Spawning & Waves ---

  private updateSpawns(dt: number) {
    // Boss waves: 3, 5, 7, 9, 11, 13, 15, 17, 20
    const BOSS_WAVES = [3, 5, 7, 9, 11, 13, 15, 17, 20];
    if (BOSS_WAVES.includes(this.wave)) {
      if (this.waveTotalSpawned === 0) {
        this.waveTotalSpawned = 1;
        sound.playBossRoar();
        this.addCameraTrauma(0.85);

        if (this.wave === 3) {
          this.spawnBossGolem();
          this.spawnFloatingText('WAVE 3 BOSS: THE GOUDA GOLEM (COLOSSUS)!', 0, -8, '#f59e0b');
        } else if (this.wave === 5) {
          this.spawnBossDarkOfKing();
          this.spawnFloatingText('WAVE 5 BOSS: [DARK OF KING] (ARROW STYLE)!', 0, -8, '#a855f7');
        } else if (this.wave === 7) {
          this.spawnBossLastOfKing();
          this.spawnFloatingText('WAVE 7 BOSS: [LAST OF KING] (FIGHTER STYLE)!', 0, -8, '#ef4444');
        } else if (this.wave === 9) {
          this.spawnBossPhantomKing();
          this.spawnFloatingText('WAVE 9 BOSS: [PHANTOM KING OF BRIE] (SPECTRAL MAGE)!', 0, -8, '#38bdf8');
        } else if (this.wave === 11) {
          this.spawnBossIronKing();
          this.spawnFloatingText('WAVE 11 BOSS: [IRON CHEDDAR KING] (JUGGERNAUT)!', 0, -8, '#94a3b8');
        } else if (this.wave === 13) {
          this.spawnBossShadowGorgonzola();
          this.spawnFloatingText('WAVE 13 BOSS: [SHADOW GORGONZOLA KING] (ASSASSIN)!', 0, -8, '#10b981');
        } else if (this.wave === 15) {
          this.spawnBossRoquefortEmperor();
          this.spawnFloatingText('WAVE 15 BOSS: [EMPEROR ROQUEFORT] (PLAGUE SPORE)!', 0, -8, '#06b6d4');
        } else if (this.wave === 17) {
          this.spawnBossParmesanWarlord();
          this.spawnFloatingText('WAVE 17 BOSS: [PARMESAN WARLORD KING] (SEISMIC TITAN)!', 0, -8, '#f97316');
        } else if (this.wave === 20) {
          this.spawnBossSupremeOverlord();
          this.spawnFloatingText('FINAL WAVE 20: [SUPREME SOVEREIGN OF ALL KINGS]!', 0, -8, '#facc15');
        }
      }

      // Reinforcement minions during boss encounters
      this.waveSpawnTimer += dt;
      const reinforcementInterval = this.wave >= 15 ? 5.5 : 7.0;
      const maxMinions = this.wave >= 15 ? 7 : 5;
      if (this.waveSpawnTimer > reinforcementInterval && this.enemies.length < maxMinions) {
        this.waveSpawnTimer = 0;
        const r = Math.random();
        if (r < 0.4) this.spawnEnemy('wisp');
        else if (r < 0.75) this.spawnEnemy('rat');
        else this.spawnEnemy('spitter');
      }
      return;
    }

    // Normal waves: 1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 19
    this.waveSpawnTimer += dt;
    const interval = Math.max(0.65, 1.8 - (this.wave - 1) * 0.08);

    if (this.waveSpawnTimer >= interval && this.waveTotalSpawned < this.waveMaxToSpawn) {
      this.waveSpawnTimer = 0;
      this.waveTotalSpawned++;

      if (this.wave <= 2) {
        const r = Math.random();
        if (this.wave === 1 || r < 0.6) this.spawnEnemy('wisp');
        else this.spawnEnemy('rat');
      } else {
        const r = Math.random();
        const wispRatio = Math.max(0.15, 0.45 - this.wave * 0.02);
        const ratRatio = Math.max(0.35, 0.75 - this.wave * 0.02);
        if (r < wispRatio) this.spawnEnemy('wisp');
        else if (r < ratRatio) this.spawnEnemy('rat');
        else this.spawnEnemy('spitter');
      }
    }

    // Advance wave when all cleared
    if (this.waveTotalSpawned >= this.waveMaxToSpawn && this.enemies.length === 0) {
      this.wave++;
      this.waveTotalSpawned = 0;
      this.waveSpawnTimer = 0;

      // Set target counts for regular waves
      if (this.wave === 2) this.waveMaxToSpawn = 18;
      else if (this.wave === 4) this.waveMaxToSpawn = 22;
      else if (this.wave === 6) this.waveMaxToSpawn = 26;
      else if (this.wave === 8) this.waveMaxToSpawn = 28;
      else if (this.wave === 10) this.waveMaxToSpawn = 30;
      else if (this.wave === 12) this.waveMaxToSpawn = 32;
      else if (this.wave === 14) this.waveMaxToSpawn = 34;
      else if (this.wave === 16) this.waveMaxToSpawn = 36;
      else if (this.wave === 18) this.waveMaxToSpawn = 38;
      else if (this.wave === 19) this.waveMaxToSpawn = 42;

      sound.playLevelUp();
      this.addCameraTrauma(0.5);

      const waveTitles: Record<number, string> = {
        2: 'Wave 2: Fondue Depths!',
        3: 'Wave 3 Boss: The Great Gouda Golem!',
        4: 'Wave 4: Abyssal Whey Caverns!',
        5: 'Wave 5 Boss: [Dark of King]!',
        6: 'Wave 6: Twilight Fromage Rift!',
        7: 'Wave 7 Boss: [Last of King]!',
        8: 'Wave 8: Fungal Curd Catacombs!',
        9: 'Wave 9 Boss: [Phantom King of Brie]!',
        10: 'Wave 10: Molten Cheddar Forge!',
        11: 'Wave 11 Boss: [Iron Cheddar King]!',
        12: 'Wave 12: Crystal Rind Labyrinth!',
        13: 'Wave 13 Boss: [Shadow Gorgonzola King]!',
        14: 'Wave 14: Dread Whey Abyss!',
        15: 'Wave 15 Boss: [Emperor Roquefort]!',
        16: 'Wave 16: Spore Miasma Sanctum!',
        17: 'Wave 17 Boss: [Parmesan Warlord King]!',
        18: 'Wave 18: Royal Fromage Citadel!',
        19: 'Wave 19: The King\'s Praetorian Vanguard!',
        20: 'FINAL WAVE 20: [SUPREME SOVEREIGN OF ALL KINGS]!',
      };

      const title = waveTitles[this.wave] || `Wave ${this.wave}!`;
      const isBoss = BOSS_WAVES.includes(this.wave);
      this.spawnFloatingText(title, 0, 0, isBoss ? '#facc15' : '#38bdf8');
    }
  }

  private spawnEnemy(type: 'wisp' | 'rat' | 'spitter') {
    const angle = Math.random() * Math.PI * 2;
    const dist = 16 + Math.random() * 5;
    const px = Math.cos(angle) * dist;
    const pz = Math.sin(angle) * dist;

    let mesh: THREE.Group;
    let hp = 45;
    let speed = 4.2;
    let attackDamage = 10;
    let attackRange = 1.2;
    let score = 50;

    if (type === 'wisp') {
      mesh = createWispEnemy();
      hp = 35 + this.wave * 12;
      speed = 5.2;
      attackDamage = 8;
      attackRange = 1.0;
      score = 40;
    } else if (type === 'rat') {
      mesh = createRatEnemy();
      hp = 65 + this.wave * 18;
      speed = 4.4;
      attackDamage = 16;
      attackRange = 1.4;
      score = 75;
    } else {
      mesh = createSpitterEnemy();
      hp = 50 + this.wave * 15;
      speed = 2.8;
      attackDamage = 14;
      attackRange = 11.0; // Ranged attacker
      score = 90;
    }

    mesh.position.set(px, 0, pz);
    this.scene.add(mesh);

    this.enemies.push({
      id: this.nextEntityId++,
      type,
      mesh,
      hp,
      maxHp: hp,
      speed,
      baseSpeed: speed,
      attackDamage,
      attackRange,
      attackCooldown: type === 'spitter' ? 2.5 : 1.2,
      attackTimer: Math.random() * 1.5,
      windupTimer: 0,
      isWindingUp: false,
      slowTimer: 0,
      poisonTimer: 0,
      poisonTickTimer: 0,
      radius: type === 'wisp' ? 0.6 : 0.75,
      isDead: false,
      scoreValue: score,
    });
  }

  private spawnBossGolem() {
    const mesh = createGoudaGolemBoss();
    mesh.position.set(0, 0, -14);
    this.scene.add(mesh);

    const maxHp = 850;
    this.enemies.push({
      id: this.nextEntityId++,
      type: 'boss',
      bossId: 'gouda_golem',
      bossName: 'The Great Gouda Golem',
      mesh,
      hp: maxHp,
      maxHp,
      speed: 2.2,
      baseSpeed: 2.2,
      attackDamage: 30,
      attackRange: 3.5,
      attackCooldown: 3.0,
      attackTimer: 1.5,
      windupTimer: 0,
      isWindingUp: false,
      slowTimer: 0,
      poisonTimer: 0,
      poisonTickTimer: 0,
      radius: 2.2,
      isDead: false,
      scoreValue: 2000,
    });

    if (this.onBossHpUpdate) {
      this.onBossHpUpdate(maxHp, maxHp, true, 'The Great Gouda Golem', 'Colossus');
    }
  }

  private spawnBossDarkOfKing() {
    const mesh = createDarkOfKingBoss();
    mesh.position.set(0, 0, -14);
    this.scene.add(mesh);

    const maxHp = 1500;
    this.enemies.push({
      id: this.nextEntityId++,
      type: 'boss',
      bossId: 'dark_of_king',
      bossName: 'Dark of King',
      mesh,
      hp: maxHp,
      maxHp,
      speed: 4.6,
      baseSpeed: 4.6,
      attackDamage: 24,
      attackRange: 16.0, // Arrow fighting style
      attackCooldown: 2.2,
      attackTimer: 1.0,
      windupTimer: 0,
      isWindingUp: false,
      slowTimer: 0,
      poisonTimer: 0,
      poisonTickTimer: 0,
      radius: 1.8,
      isDead: false,
      scoreValue: 3500,
    });

    if (this.onBossHpUpdate) {
      this.onBossHpUpdate(maxHp, maxHp, true, 'Dark of King', 'Arrow Style');
    }
  }

  private spawnBossLastOfKing() {
    const mesh = createLastOfKingBoss();
    mesh.position.set(0, 0, -14);
    this.scene.add(mesh);

    const maxHp = 2500;
    this.enemies.push({
      id: this.nextEntityId++,
      type: 'boss',
      bossId: 'last_of_king',
      bossName: 'Last of King',
      mesh,
      hp: maxHp,
      maxHp,
      speed: 4.2,
      baseSpeed: 4.2,
      attackDamage: 38,
      attackRange: 4.0, // Fighter fighting style
      attackCooldown: 2.4,
      attackTimer: 1.0,
      windupTimer: 0,
      isWindingUp: false,
      slowTimer: 0,
      poisonTimer: 0,
      poisonTickTimer: 0,
      radius: 2.4,
      isDead: false,
      scoreValue: 6000,
    });

    if (this.onBossHpUpdate) {
      this.onBossHpUpdate(maxHp, maxHp, true, 'Last of King', 'Fighter Style');
    }
  }

  private spawnBossPhantomKing() {
    const mesh = createPhantomKingBoss();
    mesh.position.set(0, 0, -14);
    this.scene.add(mesh);

    const maxHp = 3200;
    this.enemies.push({
      id: this.nextEntityId++,
      type: 'boss',
      bossId: 'phantom_king',
      bossName: 'Phantom King of Brie',
      mesh,
      hp: maxHp,
      maxHp,
      speed: 3.8,
      baseSpeed: 3.8,
      attackDamage: 28,
      attackRange: 14.0,
      attackCooldown: 2.5,
      attackTimer: 1.0,
      windupTimer: 0,
      isWindingUp: false,
      slowTimer: 0,
      poisonTimer: 0,
      poisonTickTimer: 0,
      radius: 2.0,
      isDead: false,
      scoreValue: 4500,
    });

    if (this.onBossHpUpdate) {
      this.onBossHpUpdate(maxHp, maxHp, true, 'Phantom King of Brie', 'Spectral Mage');
    }
  }

  private spawnBossIronKing() {
    const mesh = createIronKingBoss();
    mesh.position.set(0, 0, -14);
    this.scene.add(mesh);

    const maxHp = 4200;
    this.enemies.push({
      id: this.nextEntityId++,
      type: 'boss',
      bossId: 'iron_king',
      bossName: 'Iron Cheddar King',
      mesh,
      hp: maxHp,
      maxHp,
      speed: 3.5,
      baseSpeed: 3.5,
      attackDamage: 36,
      attackRange: 3.8,
      attackCooldown: 2.2,
      attackTimer: 1.0,
      windupTimer: 0,
      isWindingUp: false,
      slowTimer: 0,
      poisonTimer: 0,
      poisonTickTimer: 0,
      radius: 2.3,
      isDead: false,
      scoreValue: 5500,
    });

    if (this.onBossHpUpdate) {
      this.onBossHpUpdate(maxHp, maxHp, true, 'Iron Cheddar King', 'Juggernaut');
    }
  }

  private spawnBossShadowGorgonzola() {
    const mesh = createShadowGorgonzolaKingBoss();
    mesh.position.set(0, 0, -14);
    this.scene.add(mesh);

    const maxHp = 5200;
    this.enemies.push({
      id: this.nextEntityId++,
      type: 'boss',
      bossId: 'shadow_gorgonzola',
      bossName: 'Shadow Gorgonzola King',
      mesh,
      hp: maxHp,
      maxHp,
      speed: 4.8,
      baseSpeed: 4.8,
      attackDamage: 32,
      attackRange: 15.0,
      attackCooldown: 2.0,
      attackTimer: 1.0,
      windupTimer: 0,
      isWindingUp: false,
      slowTimer: 0,
      poisonTimer: 0,
      poisonTickTimer: 0,
      radius: 1.9,
      isDead: false,
      scoreValue: 6500,
    });

    if (this.onBossHpUpdate) {
      this.onBossHpUpdate(maxHp, maxHp, true, 'Shadow Gorgonzola King', 'Shadow Assassin');
    }
  }

  private spawnBossRoquefortEmperor() {
    const mesh = createRoquefortEmperorBoss();
    mesh.position.set(0, 0, -14);
    this.scene.add(mesh);

    const maxHp = 6500;
    this.enemies.push({
      id: this.nextEntityId++,
      type: 'boss',
      bossId: 'roquefort_emperor',
      bossName: 'Emperor Roquefort',
      mesh,
      hp: maxHp,
      maxHp,
      speed: 3.2,
      baseSpeed: 3.2,
      attackDamage: 34,
      attackRange: 12.0,
      attackCooldown: 2.6,
      attackTimer: 1.0,
      windupTimer: 0,
      isWindingUp: false,
      slowTimer: 0,
      poisonTimer: 0,
      poisonTickTimer: 0,
      radius: 2.2,
      isDead: false,
      scoreValue: 7800,
    });

    if (this.onBossHpUpdate) {
      this.onBossHpUpdate(maxHp, maxHp, true, 'Emperor Roquefort', 'Plague Spore');
    }
  }

  private spawnBossParmesanWarlord() {
    const mesh = createParmesanWarlordBoss();
    mesh.position.set(0, 0, -14);
    this.scene.add(mesh);

    const maxHp = 8000;
    this.enemies.push({
      id: this.nextEntityId++,
      type: 'boss',
      bossId: 'parmesan_warlord',
      bossName: 'Parmesan Warlord King',
      mesh,
      hp: maxHp,
      maxHp,
      speed: 4.0,
      baseSpeed: 4.0,
      attackDamage: 45,
      attackRange: 4.5,
      attackCooldown: 2.5,
      attackTimer: 1.0,
      windupTimer: 0,
      isWindingUp: false,
      slowTimer: 0,
      poisonTimer: 0,
      poisonTickTimer: 0,
      radius: 2.5,
      isDead: false,
      scoreValue: 9000,
    });

    if (this.onBossHpUpdate) {
      this.onBossHpUpdate(maxHp, maxHp, true, 'Parmesan Warlord King', 'Seismic Titan');
    }
  }

  private spawnBossSupremeOverlord() {
    const mesh = createSupremeOverlordKingBoss();
    mesh.position.set(0, 0, -14);
    this.scene.add(mesh);

    const maxHp = 10000;
    this.enemies.push({
      id: this.nextEntityId++,
      type: 'boss',
      bossId: 'supreme_sovereign',
      bossName: 'Supreme Sovereign of All Kings',
      mesh,
      hp: maxHp,
      maxHp,
      speed: 4.4,
      baseSpeed: 4.4,
      attackDamage: 48,
      attackRange: 16.0,
      attackCooldown: 1.8,
      attackTimer: 1.0,
      windupTimer: 0,
      isWindingUp: false,
      slowTimer: 0,
      poisonTimer: 0,
      poisonTickTimer: 0,
      radius: 2.6,
      isDead: false,
      scoreValue: 15000,
    });

    if (this.onBossHpUpdate) {
      this.onBossHpUpdate(maxHp, maxHp, true, 'Supreme Sovereign of All Kings', 'Omni King');
    }
  }

  // --- Entity Updates & Combat ---

  private updatePlayer(dt: number) {
    // Regenerate mana
    if (this.playerStats.mana < this.playerStats.maxMana) {
      this.playerStats.mana = Math.min(
        this.playerStats.maxMana,
        this.playerStats.mana + this.playerStats.manaRegen * dt
      );
    }

    // Cooldown reductions
    (Object.keys(this.spells) as SpellId[]).forEach((key) => {
      if (this.spells[key].currentCooldown > 0) {
        this.spells[key].currentCooldown = Math.max(0, this.spells[key].currentCooldown - dt);
      }
    });

    // Movement vector
    _v1.set(0, 0, 0);
    if (this.keys.KeyW || this.keys.ArrowUp) _v1.z -= 1;
    if (this.keys.KeyS || this.keys.ArrowDown) _v1.z += 1;
    if (this.keys.KeyA || this.keys.ArrowLeft) _v1.x -= 1;
    if (this.keys.KeyD || this.keys.ArrowRight) _v1.x += 1;

    // Mobile virtual joystick input support
    if (this.joystickVec.active) {
      _v1.x = this.joystickVec.x;
      _v1.z = this.joystickVec.y;
    }

    const isMoving = _v1.lengthSq() > 0.01;
    if (isMoving) {
      _v1.normalize();
      this.playerGroup.position.addScaledVector(_v1, this.playerStats.moveSpeed * dt);

      // Bound player within arena radius
      const distFromCenter = Math.hypot(this.playerGroup.position.x, this.playerGroup.position.z);
      if (distFromCenter > 21) {
        this.playerGroup.position.x = (this.playerGroup.position.x / distFromCenter) * 21;
        this.playerGroup.position.z = (this.playerGroup.position.z / distFromCenter) * 21;
      }

      // Smoothly rotate towards movement direction if not clicking/aiming
      if (!this.isPointerDown) {
        const targetRot = Math.atan2(_v1.x, _v1.z);
        this.playerGroup.rotation.y = THREE.MathUtils.damp(this.playerGroup.rotation.y, targetRot, 14, dt);
      }

      // Subtle walk bobbing animation
      const walkCycle = Date.now() * 0.012;
      this.playerGroup.position.y = Math.abs(Math.sin(walkCycle)) * 0.12;
      const head = this.playerGroup.userData.head as THREE.Mesh | undefined;
      if (head) head.rotation.z = Math.sin(walkCycle) * 0.1;
    } else {
      this.playerGroup.position.y = 0;
    }

    // Invisibility timer handling
    if (this.playerStats.isInvisible) {
      this.playerStats.invisibleTimer -= dt;
      if (this.playerStats.invisibleTimer <= 0) {
        this.playerStats.isInvisible = false;
        this.setPlayerOpacity(1.0);
        this.spawnFloatingText('STEALTH EXPIRED', this.playerGroup.position.x, this.playerGroup.position.z, '#94a3b8');
      }
    }

    // Auto-fire primary skill on pointer held down
    if (this.isPointerDown) {
      const charConfig = CHARACTER_PRESETS[this.playerStats.characterId] || CHARACTER_PRESETS.baldan;
      this.castSpell(charConfig.skills.primary);
    }

    // Staff crystal breathing glow
    const staffCheese = this.playerGroup.userData.staffCheese as THREE.Mesh | undefined;
    if (staffCheese) {
      const glowScale = 1 + Math.sin(Date.now() * 0.005) * 0.15;
      staffCheese.scale.set(glowScale, glowScale, glowScale);
    }
  }

  private updateEnemies(dt: number) {
    const playerPos = this.playerGroup.position;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.isDead) continue;

      // Status effects
      if (e.slowTimer > 0) {
        e.slowTimer -= dt;
        e.speed = e.baseSpeed * 0.25;
      } else {
        e.speed = e.baseSpeed;
      }

      if (e.poisonTimer > 0) {
        e.poisonTimer -= dt;
        e.poisonTickTimer += dt;
        if (e.poisonTickTimer >= 0.5) {
          e.poisonTickTimer = 0;
          this.damageEnemy(e, 8 * this.playerStats.spellPower, '#10b981', false);
          this.particles.emit(e.mesh.position, 4, { colorHex: 0x10b981, speed: 2, size: 0.25 });
        }
      }

      const distToPlayer = e.mesh.position.distanceTo(playerPos);

      // Facing player (or wandering if player is invisible)
      const seesPlayer = !this.playerStats.isInvisible || distToPlayer < 2.5;
      if (seesPlayer) {
        _dir.subVectors(playerPos, e.mesh.position);
        _dir.y = 0;
        if (_dir.lengthSq() > 0.01) {
          _dir.normalize();
          e.mesh.rotation.y = Math.atan2(_dir.x, _dir.z);
        }
      } else {
        _dir.set(Math.sin(e.id * 1.5 + Date.now() * 0.001), 0, Math.cos(e.id * 1.5 + Date.now() * 0.001)).normalize();
        e.mesh.rotation.y = Math.atan2(_dir.x, _dir.z);
      }

      // AI Movement & Attack
      if (e.type === 'spitter') {
        // Spitter keeps distance and shoots spores
        if (distToPlayer < 7) {
          e.mesh.position.addScaledVector(_dir, -e.speed * dt);
        } else if (distToPlayer > 12) {
          e.mesh.position.addScaledVector(_dir, e.speed * dt);
        }

        e.attackTimer += dt;
        if (e.attackTimer >= e.attackCooldown && distToPlayer <= e.attackRange) {
          e.attackTimer = 0;
          this.fireEnemySpore(e.mesh.position, _dir, e.attackDamage);
        }
      } else if (e.type === 'boss') {
        e.attackTimer += dt;

        if (e.bossId === 'dark_of_king') {
          // --- Wave 5 Boss: Dark of King (Fighting Style: Arrow) ---
          // Maintain distance (8 to 14m)
          if (distToPlayer < 6.5) {
            // Shadow dash retreat
            e.mesh.position.addScaledVector(_dir, -e.speed * 1.4 * dt);
            this.particles.emit(e.mesh.position, 2, { colorHex: 0xa855f7, speed: 2, size: 0.3 });
          } else if (distToPlayer > 13.5) {
            e.mesh.position.addScaledVector(_dir, e.speed * dt);
          }

          if (e.attackTimer >= e.attackCooldown) {
            e.attackTimer = 0;
            const r = Math.random();
            if (r < 0.42) {
              this.darkKingArrowVolley(e.mesh.position, _dir);
            } else if (r < 0.75) {
              this.darkKingSnipeArrow(e.mesh.position, _dir);
            } else {
              this.darkKingArrowRain(playerPos);
            }
          }
        } else if (e.bossId === 'last_of_king') {
          // --- Wave 7 Final Boss: Last of King (Fighting Style: Fighter) ---
          // Aggressive relentless pursuit
          if (distToPlayer > e.attackRange) {
            e.mesh.position.addScaledVector(_dir, e.speed * dt);
          }

          if (e.attackTimer >= e.attackCooldown) {
            e.attackTimer = 0;
            const r = Math.random();
            if (r < 0.38) {
              this.lastKingLeapSmash(e, playerPos);
            } else if (r < 0.72) {
              this.lastKingSlashWaves(e.mesh.position, _dir);
            } else {
              this.lastKingWhirlwind(e);
            }
          }
        } else if (e.bossId === 'phantom_king') {
          // Hovering spectral king
          e.mesh.position.y = 0.5 + Math.sin(Date.now() * 0.003) * 0.3;
          if (distToPlayer < 7.0) {
            e.mesh.position.addScaledVector(_dir, -e.speed * 1.3 * dt);
            this.particles.emit(e.mesh.position, 2, { colorHex: 0x38bdf8, speed: 2, size: 0.3 });
          } else if (distToPlayer > 13.0) {
            e.mesh.position.addScaledVector(_dir, e.speed * dt);
          }
          if (e.attackTimer >= e.attackCooldown) {
            e.attackTimer = 0;
            this.phantomKingSpiritOrbs(e.mesh.position, _dir);
          }
        } else if (e.bossId === 'iron_king') {
          if (distToPlayer > e.attackRange) {
            e.mesh.position.addScaledVector(_dir, e.speed * dt);
          }
          if (e.attackTimer >= e.attackCooldown) {
            e.attackTimer = 0;
            if (Math.random() < 0.5) {
              this.ironKingGroundStomp(e.mesh.position);
            } else {
              this.lastKingSlashWaves(e.mesh.position, _dir);
            }
          }
        } else if (e.bossId === 'shadow_gorgonzola') {
          if (distToPlayer < 6.0) {
            e.mesh.position.addScaledVector(_dir, -e.speed * 1.5 * dt);
            this.particles.emit(e.mesh.position, 3, { colorHex: 0x10b981, speed: 3, size: 0.35 });
          } else if (distToPlayer > 13.0) {
            e.mesh.position.addScaledVector(_dir, e.speed * dt);
          }
          if (e.attackTimer >= e.attackCooldown) {
            e.attackTimer = 0;
            this.darkKingArrowVolley(e.mesh.position, _dir);
          }
        } else if (e.bossId === 'roquefort_emperor') {
          if (distToPlayer > 8.0) {
            e.mesh.position.addScaledVector(_dir, e.speed * dt);
          }
          if (e.attackTimer >= e.attackCooldown) {
            e.attackTimer = 0;
            this.roquefortSporeNova(e.mesh.position);
          }
        } else if (e.bossId === 'parmesan_warlord') {
          if (distToPlayer > e.attackRange) {
            e.mesh.position.addScaledVector(_dir, e.speed * dt);
          }
          if (e.attackTimer >= e.attackCooldown) {
            e.attackTimer = 0;
            if (Math.random() < 0.5) {
              this.lastKingLeapSmash(e, playerPos);
            } else {
              this.bossThrowBoulder(e.mesh.position, _dir);
            }
          }
        } else if (e.bossId === 'supreme_sovereign') {
          if (distToPlayer > 6.0) {
            e.mesh.position.addScaledVector(_dir, e.speed * dt);
          }
          if (e.attackTimer >= e.attackCooldown) {
            e.attackTimer = 0;
            const r = Math.random();
            if (r < 0.35) {
              this.supremeSovereignBeams(e.mesh.position, _dir);
            } else if (r < 0.7) {
              this.lastKingLeapSmash(e, playerPos);
            } else {
              this.lastKingWhirlwind(e);
            }
          }
        } else {
          // --- Wave 3 Boss: The Great Gouda Golem (Colossus) ---
          if (distToPlayer > e.attackRange) {
            e.mesh.position.addScaledVector(_dir, e.speed * dt);
          }

          if (e.attackTimer >= e.attackCooldown) {
            e.attackTimer = 0;
            const attackChoice = Math.random();
            if (attackChoice < 0.5) {
              this.bossGroundSlam(e.mesh.position);
            } else {
              this.bossThrowBoulder(e.mesh.position, _dir);
            }
          }
        }
      } else {
        // Melee minion (wisp / rat)
        if (distToPlayer > e.attackRange) {
          e.mesh.position.addScaledVector(_dir, e.speed * dt);
        } else {
          e.attackTimer += dt;
          if (e.attackTimer >= e.attackCooldown) {
            e.attackTimer = 0;
            this.damagePlayer(e.attackDamage);
          }
        }
      }

      // Visual animations per enemy type
      if (e.type === 'wisp') {
        const t = Date.now() * 0.006;
        e.mesh.position.y = 0.4 + Math.sin(t) * 0.2;
        const orb = e.mesh.userData.orbiterGroup as THREE.Group | undefined;
        if (orb) orb.rotation.y += dt * 3.5;
      }
    }
  }

  // --- Gouda Golem Attacks ---
  private bossGroundSlam(bossPos: THREE.Vector3) {
    sound.playBossRoar();
    this.addCameraTrauma(0.6);

    const shockPos = bossPos.clone();
    shockPos.y = 0.04;

    const ringGeo = new THREE.RingGeometry(0.5, 4.5, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff3b00,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const shockMesh = new THREE.Mesh(ringGeo, ringMat);
    shockMesh.rotation.x = -Math.PI / 2;
    shockMesh.position.copy(shockPos);
    this.scene.add(shockMesh);

    this.aoeZones.push({
      id: this.nextEntityId++,
      mesh: shockMesh,
      position: shockPos,
      radius: 4.5,
      duration: 1.2,
      maxDuration: 1.2,
      type: 'boss_shockwave',
      tickTimer: 0,
    });

    this.particles.emit(shockPos, 40, { colorHex: 0xff4500, speed: 6, size: 0.5 });
    this.spawnFloatingText('FONDUE SHOCKWAVE!', bossPos.x, bossPos.z, '#ef4444');

    if (this.playerGroup.position.distanceTo(bossPos) <= 4.5) {
      this.damagePlayer(28);
    }
  }

  private bossThrowBoulder(bossPos: THREE.Vector3, dir: THREE.Vector3) {
    const mesh = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.8, 1),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 })
    );
    const startPos = bossPos.clone().add(new THREE.Vector3(0, 2.5, 0)).addScaledVector(dir, 1.5);
    mesh.position.copy(startPos);
    this.scene.add(mesh);

    this.projectiles.push({
      id: this.nextEntityId++,
      mesh,
      position: startPos,
      velocity: dir.clone().multiplyScalar(13),
      damage: 24,
      radius: 0.85,
      life: 2.5,
      maxLife: 2.5,
      type: 'boss_boulder',
    });

    sound.playExplosion(0.8);
  }

  // --- Dark of King (Fighting Style: Arrow) Attacks ---
  private darkKingArrowVolley(bossPos: THREE.Vector3, dir: THREE.Vector3) {
    sound.playGoudaCast();
    this.spawnFloatingText('SHADOW ARROW VOLLEY!', bossPos.x, bossPos.z, '#a855f7');

    const angles = [-0.25, 0, 0.25];
    angles.forEach((angle) => {
      const arrowDir = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angle).normalize();
      const mesh = createDarkArrowMesh();
      const startPos = bossPos.clone().add(new THREE.Vector3(0, 1.8, 0)).addScaledVector(arrowDir, 1.2);
      mesh.position.copy(startPos);
      mesh.rotation.y = Math.atan2(arrowDir.x, arrowDir.z);
      this.scene.add(mesh);

      this.projectiles.push({
        id: this.nextEntityId++,
        mesh,
        position: startPos,
        velocity: arrowDir.clone().multiplyScalar(17),
        damage: 18,
        radius: 0.45,
        life: 2.4,
        maxLife: 2.4,
        type: 'dark_arrow',
      });
    });

    this.particles.emit(bossPos, 16, { colorHex: 0xa855f7, speed: 4, size: 0.35 });
  }

  private darkKingSnipeArrow(bossPos: THREE.Vector3, dir: THREE.Vector3) {
    sound.playGoudaCast();
    this.addCameraTrauma(0.3);
    this.spawnFloatingText('SNIPE ARROW!', bossPos.x, bossPos.z, '#c084fc');

    const mesh = createDarkArrowMesh();
    mesh.scale.set(1.4, 1.4, 1.4);
    const startPos = bossPos.clone().add(new THREE.Vector3(0, 1.8, 0)).addScaledVector(dir, 1.2);
    mesh.position.copy(startPos);
    mesh.rotation.y = Math.atan2(dir.x, dir.z);
    this.scene.add(mesh);

    this.projectiles.push({
      id: this.nextEntityId++,
      mesh,
      position: startPos,
      velocity: dir.clone().multiplyScalar(24),
      damage: 30,
      radius: 0.6,
      life: 2.0,
      maxLife: 2.0,
      type: 'dark_arrow',
    });

    this.particles.emit(startPos, 20, { colorHex: 0xd946ef, speed: 6, size: 0.45 });
  }

  private darkKingArrowRain(targetPos: THREE.Vector3) {
    sound.playToxicCloud();
    const rainPos = targetPos.clone();
    rainPos.y = 0.04;

    const ringGeo = new THREE.RingGeometry(0.5, 4.2, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x9333ea,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.copy(rainPos);
    this.scene.add(ringMesh);

    this.aoeZones.push({
      id: this.nextEntityId++,
      mesh: ringMesh,
      position: rainPos,
      radius: 4.2,
      duration: 3.5,
      maxDuration: 3.5,
      type: 'arrow_rain_zone',
      tickTimer: 0,
    });

    this.particles.emit(rainPos, 35, { colorHex: 0xa855f7, speed: 5, size: 0.4 });
    this.spawnFloatingText('DARK ARROW RAIN!', rainPos.x, rainPos.z, '#a855f7');
  }

  // --- Last of King (Fighting Style: Fighter) Attacks ---
  private lastKingLeapSmash(boss: Enemy, targetPos: THREE.Vector3) {
    sound.playBossRoar();
    this.addCameraTrauma(0.7);
    this.spawnFloatingText('LEAPING CLEAVER SMASH!', boss.mesh.position.x, boss.mesh.position.z, '#ef4444');

    _dir.subVectors(targetPos, boss.mesh.position).normalize();
    boss.mesh.position.copy(targetPos).addScaledVector(_dir, -1.5);
    boss.mesh.position.y = 0;

    const shockPos = boss.mesh.position.clone();
    shockPos.y = 0.04;

    const ringGeo = new THREE.RingGeometry(0.5, 5.0, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff3b00,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const shockMesh = new THREE.Mesh(ringGeo, ringMat);
    shockMesh.rotation.x = -Math.PI / 2;
    shockMesh.position.copy(shockPos);
    this.scene.add(shockMesh);

    this.aoeZones.push({
      id: this.nextEntityId++,
      mesh: shockMesh,
      position: shockPos,
      radius: 5.0,
      duration: 1.2,
      maxDuration: 1.2,
      type: 'boss_shockwave',
      tickTimer: 0,
    });

    this.particles.emit(shockPos, 50, { colorHex: 0xff4500, speed: 7, size: 0.55 });

    if (this.playerGroup.position.distanceTo(shockPos) <= 5.0) {
      this.damagePlayer(34);
    }
  }

  private lastKingSlashWaves(bossPos: THREE.Vector3, dir: THREE.Vector3) {
    sound.playExplosion(0.8);
    this.addCameraTrauma(0.4);
    this.spawnFloatingText('DUAL CLEAVER SLASH!', bossPos.x, bossPos.z, '#f97316');

    [-0.2, 0.2].forEach((angle) => {
      const slashDir = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angle).normalize();
      const mesh = createFighterSlashMesh();
      const startPos = bossPos.clone().add(new THREE.Vector3(0, 1.4, 0)).addScaledVector(slashDir, 1.2);
      mesh.position.copy(startPos);
      mesh.rotation.y = Math.atan2(slashDir.x, slashDir.z);
      this.scene.add(mesh);

      this.projectiles.push({
        id: this.nextEntityId++,
        mesh,
        position: startPos,
        velocity: slashDir.multiplyScalar(14),
        damage: 28,
        radius: 1.1,
        life: 2.2,
        maxLife: 2.2,
        type: 'fighter_slash',
      });
    });

    this.particles.emit(bossPos, 30, { colorHex: 0xff3b00, speed: 6, size: 0.45 });
  }

  private lastKingWhirlwind(boss: Enemy) {
    sound.playWheelDestiny();
    this.addCameraTrauma(0.5);
    this.spawnFloatingText('BLADE TEMPEST!', boss.mesh.position.x, boss.mesh.position.z, '#ef4444');

    const ringGeo = new THREE.RingGeometry(0.5, 4.0, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff5500,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.copy(boss.mesh.position);
    ringMesh.position.y = 0.05;
    this.scene.add(ringMesh);

    this.aoeZones.push({
      id: this.nextEntityId++,
      mesh: ringMesh,
      position: boss.mesh.position,
      radius: 4.0,
      duration: 3.0,
      maxDuration: 3.0,
      type: 'whirlwind_zone',
      tickTimer: 0,
    });

    this.particles.emit(boss.mesh.position, 40, { colorHex: 0xffaa00, speed: 5, size: 0.5 });
  }

  // --- Phantom King (Spectral Mage) Attacks ---
  private phantomKingSpiritOrbs(pos: THREE.Vector3, dir: THREE.Vector3) {
    sound.playDarkArrow();
    this.spawnFloatingText('SPIRIT ORBS!', pos.x, pos.z, '#38bdf8');
    [-0.3, 0, 0.3].forEach((angle) => {
      const orbDir = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angle).normalize();
      const mesh = createPhantomOrbMesh();
      const startPos = pos.clone().add(new THREE.Vector3(0, 1.5, 0)).addScaledVector(orbDir, 1.2);
      mesh.position.copy(startPos);
      this.scene.add(mesh);
      this.projectiles.push({
        id: this.nextEntityId++,
        mesh,
        position: startPos,
        velocity: orbDir.multiplyScalar(13),
        damage: 28,
        radius: 0.8,
        life: 2.5,
        maxLife: 2.5,
        type: 'phantom_orb',
      });
    });
  }

  // --- Iron Cheddar King (Juggernaut) Attacks ---
  private ironKingGroundStomp(pos: THREE.Vector3) {
    sound.playExplosion(1.0);
    this.addCameraTrauma(0.6);
    this.spawnFloatingText('IRON SHOCKWAVE!', pos.x, pos.z, '#94a3b8');
    const shockPos = pos.clone();
    shockPos.y = 0.04;
    const ringGeo = new THREE.RingGeometry(0.5, 4.5, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(shockPos);
    this.scene.add(ring);
    this.aoeZones.push({
      id: this.nextEntityId++,
      mesh: ring,
      position: shockPos,
      radius: 4.5,
      duration: 1.0,
      maxDuration: 1.0,
      type: 'boss_shockwave',
      tickTimer: 0,
    });
    if (this.playerGroup.position.distanceTo(shockPos) <= 4.5) {
      this.damagePlayer(32);
    }
  }

  // --- Emperor Roquefort (Plague Spore) Attacks ---
  private roquefortSporeNova(pos: THREE.Vector3) {
    sound.playExplosion(0.8);
    this.spawnFloatingText('PLAGUE SPORE NOVA!', pos.x, pos.z, '#06b6d4');
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      const spDir = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
      this.fireEnemySpore(pos, spDir, 26);
    }
  }

  // --- Supreme Sovereign King Attacks ---
  private supremeSovereignBeams(pos: THREE.Vector3, dir: THREE.Vector3) {
    sound.playWheelDestiny();
    this.addCameraTrauma(0.7);
    this.spawnFloatingText('SOVEREIGN CELESTIAL BEAM!', pos.x, pos.z, '#facc15');
    [-0.25, 0, 0.25].forEach((angle) => {
      const bDir = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angle).normalize();
      const mesh = createSovereignBeamMesh();
      const startPos = pos.clone().add(new THREE.Vector3(0, 1.8, 0)).addScaledVector(bDir, 1.5);
      mesh.position.copy(startPos);
      this.scene.add(mesh);
      this.projectiles.push({
        id: this.nextEntityId++,
        mesh,
        position: startPos,
        velocity: bDir.multiplyScalar(15),
        damage: 38,
        radius: 1.0,
        life: 2.8,
        maxLife: 2.8,
        type: 'sovereign_beam',
      });
    });
  }

  // --- Multiplayer Online Teammate Management ---
  public addTeammate(id: string, name: string, characterId: CharacterId, color: string, isBot = false) {
    if (this.teammates.has(id)) return;
    let mesh: THREE.Group;
    if (characterId === 'baldan') mesh = createBaldanHero();
    else if (characterId === 'nomio') mesh = createNomioHero();
    else mesh = createCheddalfWizard();

    const offsetAngle = Math.random() * Math.PI * 2;
    mesh.position.set(Math.cos(offsetAngle) * 3.5, 0, Math.sin(offsetAngle) * 3.5);
    this.scene.add(mesh);

    this.teammates.set(id, {
      id,
      name,
      characterId,
      color,
      mesh,
      hp: 120,
      maxHp: 120,
      targetPos: mesh.position.clone(),
      targetRot: 0,
      isBot,
      botAttackTimer: Math.random() * 2,
    });

    this.spawnFloatingText(`PARTY: ${name.toUpperCase()} READY!`, mesh.position.x, mesh.position.z, color);
    this.particles.emit(mesh.position, 25, {
      colorHex: parseInt(color.replace('#', '0x')) || 0x22c55e,
      speed: 4,
      size: 0.45,
    });
  }

  public removeTeammate(id: string) {
    const tm = this.teammates.get(id);
    if (tm) {
      this.scene.remove(tm.mesh);
      this.teammates.delete(id);
    }
  }

  public updateTeammatePosition(id: string, pos: { x: number; y: number; z: number }, rot: number, hp?: number, maxHp?: number) {
    const tm = this.teammates.get(id);
    if (tm) {
      tm.targetPos.set(pos.x, pos.y, pos.z);
      tm.targetRot = rot;
      if (hp !== undefined) tm.hp = hp;
      if (maxHp !== undefined) tm.maxHp = maxHp;
    }
  }

  public castTeammateSpell(id: string, spellId: string, pos: { x: number; y: number; z: number }, dir: { x: number; y: number; z: number }) {
    const tm = this.teammates.get(id);
    if (!tm) return;
    const origin = new THREE.Vector3(pos.x, pos.y, pos.z);
    const targetDir = new THREE.Vector3(dir.x, dir.y, dir.z).normalize();
    this.particles.emit(origin, 15, { colorHex: 0x38bdf8, speed: 4, size: 0.4 });

    if (tm.characterId === 'baldan') {
      const mesh = createBaldanArrowMesh();
      const startPos = origin.clone().add(new THREE.Vector3(0, 0.9, 0)).addScaledVector(targetDir, 0.6);
      mesh.position.copy(startPos);
      mesh.rotation.y = Math.atan2(targetDir.x, targetDir.z);
      this.scene.add(mesh);
      this.projectiles.push({
        id: this.nextEntityId++,
        mesh,
        position: startPos,
        velocity: targetDir.clone().multiplyScalar(26),
        damage: 40,
        radius: 0.4,
        life: 2.2,
        maxLife: 2.2,
        type: 'baldan_arrow',
      });
      sound.playGoudaCast();
    } else if (tm.characterId === 'nomio') {
      const mesh = createNomioPunchWaveMesh();
      const startPos = origin.clone().add(new THREE.Vector3(0, 0.9, 0)).addScaledVector(targetDir, 0.8);
      mesh.position.copy(startPos);
      mesh.rotation.y = Math.atan2(targetDir.x, targetDir.z);
      this.scene.add(mesh);
      this.projectiles.push({
        id: this.nextEntityId++,
        mesh,
        position: startPos,
        velocity: targetDir.clone().multiplyScalar(22),
        damage: 45,
        radius: 0.7,
        life: 1.5,
        maxLife: 1.5,
        type: 'nomio_punch_wave',
      });
      sound.playExplosion(0.5);
    } else {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 10, 10),
        new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          emissive: 0xd97706,
          emissiveIntensity: 1.2,
          roughness: 0.3,
        })
      );
      const startPos = origin.clone().add(new THREE.Vector3(0, 1.2, 0)).addScaledVector(targetDir, 0.6);
      mesh.position.copy(startPos);
      this.scene.add(mesh);
      this.projectiles.push({
        id: this.nextEntityId++,
        mesh,
        position: startPos,
        velocity: targetDir.clone().multiplyScalar(22),
        damage: 38,
        radius: 0.4,
        life: 2.2,
        maxLife: 2.2,
        type: 'player_gouda',
      });
      sound.playGoudaCast();
    }
  }

  private updateTeammates(dt: number) {
    this.teammates.forEach((tm) => {
      // Smooth movement towards target position
      tm.mesh.position.lerp(tm.targetPos, 0.15);
      tm.mesh.rotation.y = tm.targetRot;

      // Companion AI Bot logic
      if (tm.isBot) {
        tm.botAttackTimer = (tm.botAttackTimer || 0) - dt;

        // Find closest enemy or boss
        let closestDist = Infinity;
        let closestEnemy: Enemy | null = null;
        for (const e of this.enemies) {
          const d = tm.mesh.position.distanceTo(e.mesh.position);
          if (d < closestDist) {
            closestDist = d;
            closestEnemy = e;
          }
        }

        if (closestEnemy && closestDist < 16) {
          // Move towards enemy but keep combat spacing
          const toEnemy = new THREE.Vector3().subVectors(closestEnemy.mesh.position, tm.mesh.position);
          toEnemy.y = 0;
          const targetDist = tm.characterId === 'nomio' ? 2.5 : 8.0;

          if (closestDist > targetDist + 1) {
            toEnemy.normalize();
            tm.targetPos.addScaledVector(toEnemy, 5.5 * dt);
          } else if (closestDist < targetDist - 1) {
            toEnemy.normalize();
            tm.targetPos.addScaledVector(toEnemy, -5.5 * dt);
          }

          tm.targetRot = Math.atan2(toEnemy.x, toEnemy.z);

          // Attack when timer expires
          if (tm.botAttackTimer <= 0) {
            tm.botAttackTimer = 1.2 + Math.random() * 0.8;
            const shootDir = new THREE.Vector3().subVectors(closestEnemy.mesh.position, tm.mesh.position).normalize();
            this.castTeammateSpell(tm.id, 'auto', tm.mesh.position, shootDir);
          }
        } else {
          // Idle follow player
          const distToPlayer = tm.mesh.position.distanceTo(this.playerGroup.position);
          if (distToPlayer > 5.5) {
            const toPlayer = new THREE.Vector3().subVectors(this.playerGroup.position, tm.mesh.position).normalize();
            tm.targetPos.addScaledVector(toPlayer, 6.0 * dt);
            tm.targetRot = Math.atan2(toPlayer.x, toPlayer.z);
          }
        }
      }
    });
  }

  private fireEnemySpore(pos: THREE.Vector3, dir: THREE.Vector3, dmg: number) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x10b981 })
    );
    const startPos = pos.clone().add(new THREE.Vector3(0, 0.7, 0)).addScaledVector(dir, 0.5);
    mesh.position.copy(startPos);
    this.scene.add(mesh);

    this.projectiles.push({
      id: this.nextEntityId++,
      mesh,
      position: startPos,
      velocity: dir.clone().multiplyScalar(11),
      damage: dmg,
      radius: 0.35,
      life: 2.5,
      maxLife: 2.5,
      type: 'enemy_spore',
    });
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      p.position.addScaledVector(p.velocity, dt);
      p.mesh.position.copy(p.position);

      // Rotate wheel of destiny
      if (p.type === 'player_wheel') {
        p.mesh.rotation.x += dt * 14;
        this.particles.emit(p.position, 2, { colorHex: 0xffaa00, speed: 2, size: 0.3 });
      }

      // Projectile collision with enemies
      if (
        p.type === 'player_gouda' ||
        p.type === 'player_wheel' ||
        p.type === 'baldan_arrow' ||
        p.type === 'baldan_big_arrow' ||
        p.type === 'baldan_fire_arrow' ||
        p.type === 'nomio_punch_wave'
      ) {
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const e = this.enemies[j];
          if (e.isDead) continue;
          const hitDist = p.position.distanceTo(e.mesh.position);
          if (hitDist <= p.radius + e.radius) {
            const isCrit = this.playerStats.isInvisible;
            const finalDmg = p.damage * (isCrit ? 1.5 : 1);
            this.damageEnemy(
              e,
              finalDmg,
              p.type === 'baldan_arrow' || p.type === 'baldan_big_arrow'
                ? '#4ade80'
                : p.type === 'baldan_fire_arrow'
                ? '#f97316'
                : '#ef4444',
              true
            );

            this.particles.emit(p.position, 16, {
              colorHex:
                p.type === 'baldan_arrow'
                  ? 0x22c55e
                  : p.type === 'baldan_fire_arrow'
                  ? 0xff4500
                  : p.type === 'baldan_big_arrow'
                  ? 0x86efac
                  : 0xf59e0b,
              speed: 5,
              size: 0.4,
            });

            if (p.type === 'player_gouda') {
              sound.playExplosion(0.6);
              this.scene.remove(p.mesh);
              this.projectiles.splice(i, 1);
              break;
            } else if (p.type === 'baldan_arrow') {
              this.scene.remove(p.mesh);
              this.projectiles.splice(i, 1);
              break;
            } else if (p.type === 'baldan_fire_arrow') {
              sound.playExplosion(0.7);
              // Spawn fiery burning ground zone
              const firePos = p.position.clone();
              firePos.y = 0.04;
              const fireGeo = new THREE.RingGeometry(0.5, 3.5, 20);
              const fireMat = new THREE.MeshBasicMaterial({
                color: 0xff4500,
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide,
                depthWrite: false,
              });
              const fireMesh = new THREE.Mesh(fireGeo, fireMat);
              fireMesh.rotation.x = -Math.PI / 2;
              fireMesh.position.copy(firePos);
              this.scene.add(fireMesh);

              this.aoeZones.push({
                id: this.nextEntityId++,
                mesh: fireMesh,
                position: firePos,
                radius: 3.5,
                duration: 4.0,
                maxDuration: 4.0,
                type: 'baldan_fire_zone',
                tickTimer: 0,
              });

              this.scene.remove(p.mesh);
              this.projectiles.splice(i, 1);
              break;
            } else if (p.type === 'baldan_big_arrow') {
              // Titanic arrow pierces multiple enemies!
              this.addCameraTrauma(0.25);
              p.bounces = (p.bounces || 0) + 1;
              if (p.bounces > 6) {
                this.scene.remove(p.mesh);
                this.projectiles.splice(i, 1);
                break;
              }
            } else if (p.type === 'nomio_punch_wave') {
              // Knockback enemy along wave direction
              _dir.copy(p.velocity).normalize();
              e.mesh.position.addScaledVector(_dir, 1.8);
              this.scene.remove(p.mesh);
              this.projectiles.splice(i, 1);
              break;
            } else if (p.type === 'player_wheel') {
              this.addCameraTrauma(0.25);
            }
          }
        }
      } else if (p.type === 'enemy_spore' || p.type === 'boss_boulder' || p.type === 'dark_arrow' || p.type === 'fighter_slash') {
        // Projectile collision with player
        const hitDist = p.position.distanceTo(this.playerGroup.position);
        if (hitDist <= p.radius + 0.6) {
          this.damagePlayer(p.damage);
          this.particles.emit(p.position, 14, {
            colorHex: p.type === 'dark_arrow' ? 0xa855f7 : p.type === 'fighter_slash' ? 0xff4500 : 0xef4444,
            speed: 4.5,
            size: 0.4,
          });
          this.scene.remove(p.mesh);
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      if (p.life <= 0 && i < this.projectiles.length) {
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }
  }

  private updateAoEZones(dt: number) {
    for (let i = this.aoeZones.length - 1; i >= 0; i--) {
      const zone = this.aoeZones[i];
      zone.duration -= dt;
      zone.tickTimer += dt;

      // Pulse or rotate mesh
      zone.mesh.rotation.z += dt * 0.4;

      if (zone.type === 'mozzarella_web') {
        // Snare enemies inside
        this.enemies.forEach(e => {
          if (!e.isDead && e.mesh.position.distanceTo(zone.position) <= zone.radius) {
            e.slowTimer = 1.0;
            if (zone.tickTimer >= 0.5) {
              this.damageEnemy(e, 6 * this.playerStats.spellPower, '#fef08a', false);
            }
          }
        });
      } else if (zone.type === 'blue_miasma') {
        // Inflict corrosive poison
        this.enemies.forEach(e => {
          if (!e.isDead && e.mesh.position.distanceTo(zone.position) <= zone.radius) {
            e.poisonTimer = 3.0;
          }
        });
      } else if (zone.type === 'swiss_rift') {
        // Heavy slow + cheese haste aura
        this.enemies.forEach(e => {
          if (!e.isDead && e.mesh.position.distanceTo(zone.position) <= zone.radius) {
            e.slowTimer = 1.5;
          }
        });
      } else if (zone.type === 'arrow_rain_zone') {
        // Dark of King's rain of dark arrows
        if (this.playerGroup.position.distanceTo(zone.position) <= zone.radius) {
          if (zone.tickTimer >= 0.45) {
            this.damagePlayer(14);
            this.particles.emit(this.playerGroup.position, 6, { colorHex: 0xa855f7, speed: 3.5, size: 0.35 });
          }
        }
      } else if (zone.type === 'whirlwind_zone') {
        // Last of King's blade whirlwind
        if (this.playerGroup.position.distanceTo(zone.position) <= zone.radius) {
          if (zone.tickTimer >= 0.35) {
            this.damagePlayer(18);
            this.particles.emit(this.playerGroup.position, 8, { colorHex: 0xff3b00, speed: 4, size: 0.4 });
          }
        }
      } else if (zone.type === 'baldan_fire_zone') {
        // Baldan's burning fire zone
        this.enemies.forEach(e => {
          if (!e.isDead && e.mesh.position.distanceTo(zone.position) <= zone.radius) {
            if (zone.tickTimer >= 0.35) {
              this.damageEnemy(e, 22 * this.playerStats.spellPower, '#f97316', false);
              this.particles.emit(e.mesh.position, 4, { colorHex: 0xff3b00, speed: 2.5, size: 0.3 });
            }
          }
        });
      } else if (zone.type === 'nomio_shockwave_zone') {
        // Nomio's Big Punch ground pound shockwave
        this.enemies.forEach(e => {
          if (!e.isDead && e.mesh.position.distanceTo(zone.position) <= zone.radius) {
            if (zone.tickTimer >= 0.15) {
              this.damageEnemy(e, 90 * this.playerStats.spellPower, '#ef4444', true);
              const knockDir = e.mesh.position.clone().sub(zone.position).normalize();
              e.mesh.position.addScaledVector(knockDir, 3.2);
            }
          }
        });
      }

      if (zone.tickTimer >= 0.5) zone.tickTimer = 0;

      if (zone.duration <= 0) {
        this.scene.remove(zone.mesh);
        this.aoeZones.splice(i, 1);
      }
    }
  }

  private updateCheeseDrops(dt: number) {
    const playerPos = this.playerGroup.position;

    for (let i = this.cheeseDrops.length - 1; i >= 0; i--) {
      const drop = this.cheeseDrops[i];
      drop.life -= dt;
      drop.floatOffset += dt * 2.5;

      // Gentle floating bob and spin
      drop.mesh.position.y = 0.35 + Math.sin(drop.floatOffset) * 0.15;
      drop.mesh.rotation.y += dt * 2.0;

      const dist = drop.position.distanceTo(playerPos);

      // Magnetize towards Cheddalf when within magnet range
      if (dist < this.playerStats.magnetRadius) {
        _dir.subVectors(playerPos, drop.position).normalize();
        const pullSpeed = 9.0 + (this.playerStats.magnetRadius - dist) * 2;
        drop.position.addScaledVector(_dir, pullSpeed * dt);
        drop.mesh.position.x = drop.position.x;
        drop.mesh.position.z = drop.position.z;
      }

      // Collection
      if (dist < 1.1) {
        sound.playCheeseCatch();
        this.particles.emit(drop.position, 18, { colorHex: 0xfbbf24, speed: 4.5, size: 0.45 });

        // Base points towards 10,000 collector goal
        let basePoints = 25;
        if (drop.type === 'mana_curd') basePoints = 20;
        else if (drop.type === 'brie_heart') basePoints = 35;
        else if (drop.type === 'golden_parmesan') basePoints = 85;
        else if (drop.type === 'mega_wheel') basePoints = 300;
        else if (drop.type === 'rainbow_star') basePoints = 1000;

        // Combo counter (collecting fast raises multiplier up to x5)
        this.comboTimer = 2.8;
        this.playerStats.combo++;
        this.playerStats.comboMultiplier = Math.min(5.0, 1.0 + Math.floor(this.playerStats.combo / 3) * 0.5);

        const gainedCollector = Math.round(basePoints * this.playerStats.comboMultiplier);
        this.playerStats.collectorCheese = Math.min(
          this.playerStats.collectorGoal,
          this.playerStats.collectorCheese + gainedCollector
        );

        if (drop.type === 'mana_curd') {
          this.playerStats.mana = Math.min(this.playerStats.maxMana, this.playerStats.mana + 35);
          this.playerStats.ultimateCharge = Math.min(100, this.playerStats.ultimateCharge + 15);
          this.spawnFloatingText(`+${gainedCollector} [x${this.playerStats.comboMultiplier.toFixed(1)}]`, drop.position.x, drop.position.z, '#38bdf8');
        } else if (drop.type === 'brie_heart') {
          this.playerStats.hp = Math.min(this.playerStats.maxHp, this.playerStats.hp + 40);
          this.spawnFloatingText(`+${gainedCollector} [x${this.playerStats.comboMultiplier.toFixed(1)}]`, drop.position.x, drop.position.z, '#f43f5e');
        } else if (drop.type === 'golden_parmesan') {
          this.playerStats.shards += 12;
          this.playerStats.ultimateCharge = Math.min(100, this.playerStats.ultimateCharge + 25);
          this.gainXP(50);
          this.spawnFloatingText(`+${gainedCollector} [x${this.playerStats.comboMultiplier.toFixed(1)}]`, drop.position.x, drop.position.z, '#facc15');
        } else if (drop.type === 'mega_wheel') {
          this.playerStats.ultimateCharge = 100;
          this.playerStats.shards += 50;
          this.gainXP(150);
          this.addCameraTrauma(0.3);
          this.spawnFloatingText(`MEGA WHEEL! +${gainedCollector}`, drop.position.x, drop.position.z, '#f97316');
        } else if (drop.type === 'rainbow_star') {
          this.playerStats.ultimateCharge = 100;
          this.playerStats.hp = this.playerStats.maxHp;
          this.playerStats.mana = this.playerStats.maxMana;
          this.playerStats.shards += 150;
          this.gainXP(400);
          this.addCameraTrauma(0.5);
          sound.playLevelUp();
          this.spawnFloatingText(`10,000 COLOR STAR! +${gainedCollector}`, drop.position.x, drop.position.z, '#ec4899');
        }

        // Check 10,000 Collector Milestones
        const cur = this.playerStats.collectorCheese;
        if (cur >= 1000 && !this.milestonesPassed.has(1000)) {
          this.milestonesPassed.add(1000);
          this.spawnFloatingText('🧀 1,000 Milestone: Fromage Apprentice!', 0, 0, '#facc15');
        }
        if (cur >= 2500 && !this.milestonesPassed.has(2500)) {
          this.milestonesPassed.add(2500);
          this.spawnFloatingText('🧀 2,500 Milestone: Brie Adept!', 0, 0, '#38bdf8');
        }
        if (cur >= 5000 && !this.milestonesPassed.has(5000)) {
          this.milestonesPassed.add(5000);
          this.spawnFloatingText('👑 5,000 Milestone: Gouda Grandmaster!', 0, 0, '#f59e0b');
          sound.playLevelUp();
        }
        if (cur >= 7500 && !this.milestonesPassed.has(7500)) {
          this.milestonesPassed.add(7500);
          this.spawnFloatingText('✨ 7,500 Milestone: Celestial Fromage!', 0, 0, '#ec4899');
        }
        if (cur >= 10000 && !this.milestonesPassed.has(10000)) {
          this.milestonesPassed.add(10000);
          sound.playLevelUp();
          this.addCameraTrauma(0.8);
          this.setPhase('collector_victory');
          this.spawnFloatingText('🏆 10,000 CHEESE ASCENSION COMPLETE!', 0, 0, '#fbbf24');
        }

        this.scene.remove(drop.mesh);
        this.cheeseDrops.splice(i, 1);
        continue;
      }

      if (drop.life <= 0) {
        this.scene.remove(drop.mesh);
        this.cheeseDrops.splice(i, 1);
      }
    }
  }

  // --- Combat Resolution ---

  public damageEnemy(enemy: Enemy, damage: number, color: string = '#f59e0b', triggerHitstop: boolean = true) {
    if (enemy.isDead) return;
    enemy.hp -= damage;
    this.spawnFloatingText(Math.round(damage).toString(), enemy.mesh.position.x, enemy.mesh.position.z, color);

    // Hit reaction: Flash red / yellow
    const bodyMesh = enemy.mesh.userData.body as THREE.Mesh | undefined;
    if (bodyMesh && bodyMesh.material) {
      const origColor = (bodyMesh.material as THREE.MeshStandardMaterial).color.getHex();
      (bodyMesh.material as THREE.MeshStandardMaterial).color.setHex(0xffffff);
      setTimeout(() => {
        if (bodyMesh && bodyMesh.material) {
          (bodyMesh.material as THREE.MeshStandardMaterial).color.setHex(origColor);
        }
      }, 70);
    }

    if (triggerHitstop) {
      this.hitstopDuration = 0.045; // 45ms simulation hitstop
      this.addCameraTrauma(0.18);
    }

    if (enemy.type === 'boss' && this.onBossHpUpdate) {
      const style = enemy.bossId === 'dark_of_king' ? 'Arrow Style' : enemy.bossId === 'last_of_king' ? 'Fighter Style' : 'Colossus';
      this.onBossHpUpdate(Math.max(0, enemy.hp), enemy.maxHp, true, enemy.bossName, style);
    }

    if (enemy.hp <= 0) {
      this.killEnemy(enemy);
    }
  }

  private killEnemy(enemy: Enemy) {
    enemy.isDead = true;
    this.playerStats.kills++;
    sound.playExplosion(enemy.type === 'boss' ? 1.4 : 0.7);

    // Particle burst
    this.particles.emit(enemy.mesh.position, enemy.type === 'boss' ? 80 : 25, {
      colorHex: enemy.type === 'boss' ? 0xffaa00 : 0x10b981,
      speed: 6,
      size: 0.5,
    });

    // 10,000x COOLER OVERDRIVE: Extra prismatic death firework bursts!
    if (this.customColors.tenThousandCooler) {
      const rainbowColors = [0xff0055, 0xff7700, 0xffea00, 0x00ff66, 0x00ccff, 0xaa00ff];
      rainbowColors.forEach((hex, i) => {
        setTimeout(() => {
          this.particles.emit(enemy.mesh.position, 14, { colorHex: hex, speed: 6.5, size: 0.45 });
        }, i * 20);
      });
      this.spawnFloatingText('✨ 10,000x COOL! ✨', enemy.mesh.position.x, enemy.mesh.position.z, '#facc15');
    }

    // Spawn cheese drops
    const dropCount = enemy.type === 'boss' ? 8 : Math.random() < 0.6 ? 1 : 2;
    for (let k = 0; k < dropCount; k++) {
      const r = Math.random();
      let dropType: 'mana_curd' | 'brie_heart' | 'golden_parmesan' | 'mega_wheel' | 'rainbow_star' = 'mana_curd';
      if (r < 0.45) dropType = 'mana_curd';
      else if (r < 0.72) dropType = 'brie_heart';
      else if (r < 0.92) dropType = 'golden_parmesan';
      else if (r < 0.98) dropType = 'mega_wheel';
      else dropType = 'rainbow_star';
      this.spawnCheeseDrop(enemy.mesh.position, dropType);
    }

    // Boss special mega loot
    if (enemy.type === 'boss') {
      this.spawnCheeseDrop(enemy.mesh.position, 'rainbow_star');
      this.spawnCheeseDrop(enemy.mesh.position, 'mega_wheel');
      this.spawnCheeseDrop(enemy.mesh.position, 'mega_wheel');
    }

    this.gainXP(enemy.scoreValue);

    if (enemy.type === 'boss') {
      if (enemy.bossId === 'gouda_golem') {
        if (this.onBossHpUpdate) {
          this.onBossHpUpdate(0, enemy.maxHp, false, 'The Great Gouda Golem', 'Colossus');
        }
        this.spawnFloatingText('GOLEM SHATTERED! Wave 4 Unlocked!', 0, 0, '#f59e0b');
        sound.playLevelUp();
        this.wave = 4;
        this.waveTotalSpawned = 0;
        this.waveSpawnTimer = 0;
        this.waveMaxToSpawn = 22;
      } else if (enemy.bossId === 'dark_of_king') {
        if (this.onBossHpUpdate) {
          this.onBossHpUpdate(0, enemy.maxHp, false, 'Dark of King', 'Arrow Style');
        }
        this.spawnFloatingText('[DARK OF KING] BANISHED! Wave 6 Unlocked!', 0, 0, '#a855f7');
        sound.playLevelUp();
        this.wave = 6;
        this.waveTotalSpawned = 0;
        this.waveSpawnTimer = 0;
        this.waveMaxToSpawn = 26;
      } else if (enemy.bossId === 'last_of_king') {
        if (this.onBossHpUpdate) {
          this.onBossHpUpdate(0, enemy.maxHp, false, 'Last of King', 'Fighter Style');
        }
        this.spawnFloatingText('[LAST OF KING] TOPPLED! Wave 8 Unlocked!', 0, 0, '#ef4444');
        sound.playLevelUp();
        this.wave = 8;
        this.waveTotalSpawned = 0;
        this.waveSpawnTimer = 0;
        this.waveMaxToSpawn = 28;
      } else if (enemy.bossId === 'phantom_king') {
        if (this.onBossHpUpdate) {
          this.onBossHpUpdate(0, enemy.maxHp, false, 'Phantom King of Brie', 'Spectral Mage');
        }
        this.spawnFloatingText('[PHANTOM KING] PURIFIED! Wave 10 Unlocked!', 0, 0, '#38bdf8');
        sound.playLevelUp();
        this.wave = 10;
        this.waveTotalSpawned = 0;
        this.waveSpawnTimer = 0;
        this.waveMaxToSpawn = 30;
      } else if (enemy.bossId === 'iron_king') {
        if (this.onBossHpUpdate) {
          this.onBossHpUpdate(0, enemy.maxHp, false, 'Iron Cheddar King', 'Juggernaut');
        }
        this.spawnFloatingText('[IRON KING] BREACHED! Wave 12 Unlocked!', 0, 0, '#94a3b8');
        sound.playLevelUp();
        this.wave = 12;
        this.waveTotalSpawned = 0;
        this.waveSpawnTimer = 0;
        this.waveMaxToSpawn = 32;
      } else if (enemy.bossId === 'shadow_gorgonzola') {
        if (this.onBossHpUpdate) {
          this.onBossHpUpdate(0, enemy.maxHp, false, 'Shadow Gorgonzola King', 'Shadow Assassin');
        }
        this.spawnFloatingText('[SHADOW GORGONZOLA] VAPORIZED! Wave 14 Unlocked!', 0, 0, '#10b981');
        sound.playLevelUp();
        this.wave = 14;
        this.waveTotalSpawned = 0;
        this.waveSpawnTimer = 0;
        this.waveMaxToSpawn = 34;
      } else if (enemy.bossId === 'roquefort_emperor') {
        if (this.onBossHpUpdate) {
          this.onBossHpUpdate(0, enemy.maxHp, false, 'Emperor Roquefort', 'Plague Spore');
        }
        this.spawnFloatingText('[EMPEROR ROQUEFORT] DETHRONED! Wave 16 Unlocked!', 0, 0, '#06b6d4');
        sound.playLevelUp();
        this.wave = 16;
        this.waveTotalSpawned = 0;
        this.waveSpawnTimer = 0;
        this.waveMaxToSpawn = 36;
      } else if (enemy.bossId === 'parmesan_warlord') {
        if (this.onBossHpUpdate) {
          this.onBossHpUpdate(0, enemy.maxHp, false, 'Parmesan Warlord King', 'Seismic Titan');
        }
        this.spawnFloatingText('[PARMESAN WARLORD] CRUMBLED! Wave 18 Unlocked!', 0, 0, '#f97316');
        sound.playLevelUp();
        this.wave = 18;
        this.waveTotalSpawned = 0;
        this.waveSpawnTimer = 0;
        this.waveMaxToSpawn = 38;
      } else if (enemy.bossId === 'supreme_sovereign') {
        this.bossDefeated = true;
        if (this.onBossHpUpdate) {
          this.onBossHpUpdate(0, enemy.maxHp, false, 'Supreme Sovereign of All Kings', 'Omni King');
        }
        this.spawnFloatingText('ALL 20 WAVES CONQUERED! SUPREME OVERLORD VANQUISHED!', 0, 0, '#facc15');
        setTimeout(() => {
          this.setPhase('victory');
          sound.playLevelUp();
        }, 1200);
      } else {
        this.bossDefeated = true;
        if (this.onBossHpUpdate) this.onBossHpUpdate(0, enemy.maxHp, false);
        setTimeout(() => {
          this.setPhase('victory');
          sound.playLevelUp();
        }, 1200);
      }
    }

    // Remove mesh from scene
    this.scene.remove(enemy.mesh);
    const idx = this.enemies.indexOf(enemy);
    if (idx !== -1) this.enemies.splice(idx, 1);
  }

  public spawnCheeseDrop(pos: THREE.Vector3, type: 'mana_curd' | 'brie_heart' | 'golden_parmesan' | 'mega_wheel' | 'rainbow_star') {
    const mesh = createCheeseDropMesh(type);
    const dropPos = pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 1.5, 0, (Math.random() - 0.5) * 1.5));
    dropPos.y = 0;
    mesh.position.copy(dropPos);
    this.scene.add(mesh);

    this.cheeseDrops.push({
      id: this.nextEntityId++,
      mesh,
      position: dropPos,
      type,
      value: 1,
      floatOffset: Math.random() * 5,
      life: 25.0,
    });
  }

  /** Triggers a Cheese Rain / Storm for intense 10,000 collection */
  public spawnCheeseRain(count: number = 6) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 2 + Math.random() * 12;
      const pos = this.playerGroup.position.clone().add(
        new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius)
      );
      const r = Math.random();
      const type = r < 0.5 ? 'mana_curd' : r < 0.8 ? 'golden_parmesan' : r < 0.95 ? 'mega_wheel' : 'rainbow_star';
      this.spawnCheeseDrop(pos, type);
      this.particles.emit(pos, 10, { colorHex: 0xfbbf24, speed: 3, size: 0.35 });
    }
  }

  /** Set custom hero colors (10,000 Color Atelier) */
  public setCustomColors(colors: CustomColors) {
    const wasOverdrive = this.customColors.tenThousandCooler;
    this.customColors = colors;
    if (!colors.rainbowMode) {
      updateHeroColors(
        this.playerGroup,
        this.playerStats.characterId,
        colors.robeColor,
        colors.hatColor,
        colors.staffGlowColor
      );
    }
    if (colors.tenThousandCooler && !wasOverdrive) {
      sound.playLevelUp();
      this.spawnFloatingText('✨ 10,000x COOLER OVERDRIVE ACTIVATED! ✨', this.playerGroup.position.x, this.playerGroup.position.z, '#facc15');
      this.particles.emit(this.playerGroup.position, 60, { colorHex: 0xfacc15, speed: 7, size: 0.6 });
      this.addCameraTrauma(0.5);
    }
  }

  public damagePlayer(damage: number) {
    if (this.phase !== 'playing') return;
    this.playerStats.hp -= damage;
    sound.playPlayerHit();
    this.addCameraTrauma(0.45);
    this.hitstopDuration = 0.05;

    this.spawnFloatingText(`-${Math.round(damage)}`, this.playerGroup.position.x, this.playerGroup.position.z, '#ef4444');
    this.particles.emit(this.playerGroup.position, 14, { colorHex: 0xef4444, speed: 4, size: 0.35 });

    if (this.playerStats.hp <= 0) {
      this.playerStats.hp = 0;
      this.setPhase('game_over');
    }
  }

  public gainXP(amount: number) {
    this.playerStats.xp += amount;
    if (this.playerStats.xp >= this.playerStats.nextLevelXp) {
      this.playerStats.level++;
      this.playerStats.xp -= this.playerStats.nextLevelXp;
      this.playerStats.nextLevelXp = Math.floor(this.playerStats.nextLevelXp * 1.4);
      this.playerStats.hp = this.playerStats.maxHp;
      this.playerStats.mana = this.playerStats.maxMana;

      sound.playLevelUp();
      this.spawnFloatingText(`LEVEL UP! Lv.${this.playerStats.level}`, this.playerGroup.position.x, this.playerGroup.position.z, '#fbbf24');
      this.particles.emit(this.playerGroup.position, 40, { colorHex: 0xfbbf24, speed: 6, size: 0.5 });

      if (this.onLevelUpTrigger) {
        this.onLevelUpTrigger();
      }
    }
  }

  public spawnFloatingText(text: string, x: number, z: number, color: string = '#f59e0b') {
    this.floatingTexts.push({
      id: this.nextEntityId++,
      text,
      x,
      y: z, // Using world coordinates
      color,
      life: 1.2,
      maxLife: 1.2,
    });
  }

  private addCameraTrauma(amount: number) {
    this.cameraTrauma = Math.min(1.0, this.cameraTrauma + amount);
  }

  // --- Main 60fps Animation Loop ---

  private loop() {
    if (this.isDestroyed) return;
    this.animFrameId = requestAnimationFrame(this.loop);

    const rawDt = this.clock.getDelta();
    const dt = Math.min(rawDt, 0.05); // Frame clamping

    // Simulation Hitstop
    if (this.hitstopDuration > 0) {
      this.hitstopDuration -= dt;
      this.renderer.render(this.scene, this.camera);
      return;
    }

    if (this.phase === 'playing') {
      this.updatePlayer(dt);
      this.updateEnemies(dt);
      this.updateProjectiles(dt);
      this.updateAoEZones(dt);
      this.updateCheeseDrops(dt);
      this.updateSpawns(dt);
      this.updateTeammates(dt);

      // Online Multiplayer Sync
      this.mpSyncTimer += dt;
      if (this.mpSyncTimer >= 0.08) {
        this.mpSyncTimer = 0;
        mpClient.syncPlayerPosition(
          { x: this.playerGroup.position.x, y: this.playerGroup.position.y, z: this.playerGroup.position.z },
          this.playerGroup.rotation.y,
          true,
          this.playerStats.hp,
          this.playerStats.maxHp,
          this.playerStats.kills
        );
      }

      // Update combo timer
      if (this.comboTimer > 0) {
        this.comboTimer -= dt;
        if (this.comboTimer <= 0) {
          this.playerStats.combo = 0;
          this.playerStats.comboMultiplier = 1.0;
        }
      }

      // Periodic Cheese Storm for 10,000 collector rush
      this.cheeseStormTimer += dt;
      if (this.cheeseStormTimer >= 14.0) {
        this.cheeseStormTimer = 0;
        this.spawnCheeseRain(4);
        this.spawnFloatingText('🧀 CHEESE STORM!', this.playerGroup.position.x, this.playerGroup.position.z, '#facc15');
      }
    } else if (this.phase === 'title') {
      // Cinematic camera orbit around Cheddalf on Title Screen
      const time = Date.now() * 0.0006;
      this.camera.position.x = Math.cos(time) * 11;
      this.camera.position.z = Math.sin(time) * 11;
      this.camera.position.y = 8;
      this.camera.lookAt(0, 1.2, 0);

      // Idle wizard animation
      this.playerGroup.rotation.y = time * 0.5;
    }

    // 10,000 Colors Atelier: Realtime rainbow hue cycling across color spectrum
    if (this.customColors.rainbowMode || this.customColors.tenThousandCooler) {
      const cycleSpeed = this.customColors.tenThousandCooler ? 0.0009 : 0.00035;
      const hue = (Date.now() * cycleSpeed) % 1;
      const c1 = new THREE.Color().setHSL(hue, 0.95, 0.52);
      const c2 = new THREE.Color().setHSL((hue + 0.18) % 1, 1.0, 0.46);
      const c3 = new THREE.Color().setHSL((hue + 0.5) % 1, 1.0, 0.6);
      updateHeroColors(
        this.playerGroup,
        this.playerStats.characterId,
        '#' + c1.getHexString(),
        '#' + c2.getHexString(),
        '#' + c3.getHexString()
      );
    }

    // 10,000x COOLER OVERDRIVE: Prismatic particles & rainbow trails
    if (this.customColors.tenThousandCooler && this.phase === 'playing') {
      const rainbowHue = (Date.now() * 0.002) % 1;
      const trailColor = new THREE.Color().setHSL(rainbowHue, 1.0, 0.55).getHex();
      this.particles.emit(this.playerGroup.position.clone().add(new THREE.Vector3(0, 0.25, 0)), 2, {
        colorHex: trailColor,
        speed: 1.6,
        size: 0.35,
      });
    }

    // Camera follow player with smooth damping & screen shake
    if (this.phase === 'playing' || this.phase === 'paused' || this.phase === 'level_up') {
      this.cameraTarget.x = THREE.MathUtils.damp(this.cameraTarget.x, this.playerGroup.position.x, 8, dt);
      this.cameraTarget.z = THREE.MathUtils.damp(this.cameraTarget.z, this.playerGroup.position.z, 8, dt);
      this.cameraTarget.y = 0;

      let shakeX = 0;
      let shakeZ = 0;
      if (this.cameraTrauma > 0) {
        const shake = this.cameraTrauma * this.cameraTrauma; // trauma squared
        shakeX = (Math.random() * 2 - 1) * shake * 0.9;
        shakeZ = (Math.random() * 2 - 1) * shake * 0.9;
        this.cameraTrauma = Math.max(0, this.cameraTrauma - dt * 1.8);
      }

      this.camera.position.x = this.cameraTarget.x + this.cameraOffset.x + shakeX;
      this.camera.position.y = this.cameraOffset.y;
      this.camera.position.z = this.cameraTarget.z + this.cameraOffset.z + shakeZ;
      this.camera.lookAt(this.cameraTarget.x, 0.8, this.cameraTarget.z);
    }

    // Update particles
    this.particles.update(dt);

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Render Scene
    this.renderer.render(this.scene, this.camera);

    // Notify React UI
    if (this.onUIUpdate) {
      this.onUIUpdate(this.playerStats, this.spells, this.floatingTexts, this.phase);
    }
  }

  public dispose() {
    this.isDestroyed = true;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    sound.stopMusic();
    this.particles.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
