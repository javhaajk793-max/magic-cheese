import * as THREE from 'three';

export type GamePhase = 'title' | 'character_select' | 'playing' | 'level_up' | 'paused' | 'game_over' | 'victory' | 'collector_victory';

export type CharacterId = 'baldan' | 'nomio' | 'cheddalf';

export type SpellId =
  // Cheddalf (Mage)
  | 'gouda_flare'
  | 'swiss_rift'
  | 'mozzarella_trap'
  | 'blue_spore'
  | 'wheel_destiny'
  // Baldan (Arrow)
  | 'baldan_shot'
  | 'arrow_trio'
  | 'fire_burn'
  | 'stealth_invis'
  | 'big_big_arrow'
  // Nomio (Fighter)
  | 'nomio_jab'
  | 'one_punch'
  | 'double_jab'
  | 'punch_spray'
  | 'big_punch';

export interface SpellInfo {
  id: SpellId;
  name: string;
  cheeseType: string;
  description: string;
  manaCost: number;
  cooldown: number; // in seconds
  currentCooldown: number;
  icon: string;
  color: string;
  keyHint: string;
  damageValue?: number;
}

export interface CharacterConfig {
  id: CharacterId;
  name: string;
  fightingStyle: 'Arrow' | 'Fighter' | 'Mage';
  styleTitle: string;
  avatarEmoji: string;
  description: string;
  accentColor: string;
  borderColor: string;
  glowColor: string;
  baseHp: number;
  baseMana: number;
  baseSpeed: number;
  skills: {
    primary: SpellId;
    q: SpellId;
    e: SpellId;
    shift: SpellId;
    r: SpellId;
  };
}

export interface PlayerStats {
  characterId: CharacterId;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  manaRegen: number;
  moveSpeed: number;
  spellPower: number;
  shards: number;
  level: number;
  xp: number;
  nextLevelXp: number;
  ultimateCharge: number; // 0 to 100
  kills: number;
  collectorCheese: number; // Collected towards 10,000 goal
  collectorGoal: number; // 10000
  magnetRadius: number; // Vacuum range for cheese
  combo: number; // Collection combo streak
  comboMultiplier: number;
  isInvisible: boolean;
  invisibleTimer: number;
}

export interface CustomColors {
  robeColor: string;
  hatColor: string;
  staffGlowColor: string;
  rainbowMode: boolean;
  tenThousandCooler: boolean; // 10,000x COOLER OVERDRIVE!
}

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  life: number;
  maxLife: number;
}

export type BossId =
  | 'gouda_golem'
  | 'dark_of_king'
  | 'last_of_king'
  | 'phantom_king'
  | 'iron_king'
  | 'shadow_gorgonzola'
  | 'roquefort_emperor'
  | 'parmesan_warlord'
  | 'supreme_sovereign';

export interface Enemy {
  id: number;
  type: 'wisp' | 'rat' | 'spitter' | 'boss';
  bossId?: BossId;
  bossName?: string;
  mesh: THREE.Group;
  hp: number;
  maxHp: number;
  speed: number;
  baseSpeed: number;
  attackDamage: number;
  attackRange: number;
  attackCooldown: number;
  attackTimer: number;
  windupTimer: number;
  isWindingUp: boolean;
  telegraphMesh?: THREE.Mesh;
  slowTimer: number;
  poisonTimer: number;
  poisonTickTimer: number;
  radius: number;
  isDead: boolean;
  scoreValue: number;
  phaseStep?: number;
  dashTimer?: number;
}

export interface Projectile {
  id: number;
  mesh: THREE.Object3D;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  damage: number;
  radius: number;
  life: number;
  maxLife: number;
  type:
    | 'player_gouda'
    | 'player_wheel'
    | 'player_trap'
    | 'enemy_spore'
    | 'boss_boulder'
    | 'dark_arrow'
    | 'fighter_slash'
    | 'phantom_orb'
    | 'iron_shockwave'
    | 'spore_nova'
    | 'seismic_shock'
    | 'sovereign_beam'
    | 'baldan_arrow'
    | 'baldan_big_arrow'
    | 'baldan_fire_arrow'
    | 'nomio_punch_wave';
  bounces?: number;
  onHitEffect?: string;
}

export interface CheeseDrop {
  id: number;
  mesh: THREE.Group;
  position: THREE.Vector3;
  type: 'mana_curd' | 'brie_heart' | 'golden_parmesan' | 'mega_wheel' | 'rainbow_star';
  value: number; // Value added to 10,000 collector score
  floatOffset: number;
  life: number;
}

export interface AoEZone {
  id: number;
  mesh: THREE.Object3D;
  position: THREE.Vector3;
  radius: number;
  duration: number;
  maxDuration: number;
  type:
    | 'mozzarella_web'
    | 'blue_miasma'
    | 'swiss_rift'
    | 'boss_shockwave'
    | 'arrow_rain_zone'
    | 'whirlwind_zone'
    | 'baldan_fire_zone'
    | 'nomio_shockwave_zone';
  tickTimer: number;
}

export interface UpgradeOption {
  id: string;
  name: string;
  cheeseName: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'legendary';
  apply: (stats: PlayerStats) => void;
}
