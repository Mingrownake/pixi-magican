export type BossType =
  | "area_attack_boss"
  | "tank_boss"
  | "horde_boss"
  | "meteor_summoner_boss";

export type BaseBossConfig = {
  type: BossType;
  maxHp: number;
  speed: number;
  damage: number;
  collisionRadius: number;
  rewardXp: number;
};

export type AreaAttackBossConfig = BaseBossConfig & {
  behavior: "area_attack";
  attackRadius: number;
  windupDuration: number;
  attackCooldown: number;
  attackDamage: number;
};

export type TankBossConfig = BaseBossConfig & {
  behavior: "tank";
  slamCooldown: number;
  slamRadius: number;
  slamDamage: number;
  enrageThreshold: number;
  enrageSpeedMultiplier: number;
};

export type HordeBossConfig = BaseBossConfig & {
  behavior: "horde";
  waveInterval: number;
  waveSize: number;
  totalWaves: number;
  spawnRadius: number;
  hordeEnemyType: "warrior" | "fast_warrior";
};

export type MeteorSummonerBossConfig = BaseBossConfig & {
  behavior: "meteor_summoner";
  preferredDistance: number;
  meteorCount: number;
  warningDuration: number;
  impactRadius: number;
  impactDamage: number;
  summonCount: number;
  castCooldown: number;
};

export type BossConfig =
  | AreaAttackBossConfig
  | TankBossConfig
  | HordeBossConfig
  | MeteorSummonerBossConfig;

export const areaAttackBossConfig: AreaAttackBossConfig = {
  type: "area_attack_boss",
  behavior: "area_attack",
  maxHp: 500,
  speed: 70,
  damage: 10,
  collisionRadius: 28,
  rewardXp: 100,
  attackRadius: 100,
  windupDuration: 1.5,
  attackCooldown: 4,
  attackDamage: 35,
};

export const tankBossConfig: TankBossConfig = {
  type: "tank_boss",
  behavior: "tank",
  maxHp: 800,
  speed: 90,
  damage: 20,
  collisionRadius: 32,
  rewardXp: 120,
  slamCooldown: 5,
  slamRadius: 80,
  slamDamage: 30,
  enrageThreshold: 0.3,
  enrageSpeedMultiplier: 1.5,
};

export const hordeBossConfig: HordeBossConfig = {
  type: "horde_boss",
  behavior: "horde",
  maxHp: 400,
  speed: 50,
  damage: 8,
  collisionRadius: 24,
  rewardXp: 80,
  waveInterval: 3,
  waveSize: 6,
  totalWaves: 5,
  spawnRadius: 60,
  hordeEnemyType: "warrior",
};

export const meteorSummonerBossConfig: MeteorSummonerBossConfig = {
  type: "meteor_summoner_boss",
  behavior: "meteor_summoner",
  maxHp: 600,
  speed: 45,
  damage: 8,
  collisionRadius: 26,
  rewardXp: 150,
  preferredDistance: 250,
  meteorCount: 3,
  warningDuration: 1.5,
  impactRadius: 60,
  impactDamage: 40,
  summonCount: 2,
  castCooldown: 6,
};
