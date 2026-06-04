export type EnemyType =
  | "warrior"
  | "fast_warrior"
  | "shooter"
  | "grenade_thrower"
  | "molotov_thrower"
  | "summoner_mage"
  | "healer_mage"
  | "teleport_mage";

export type BaseEnemyConfig = {
  type: EnemyType;
  maxHp: number;
  speed: number;
  damage: number;
  collisionRadius: number;
  rewardXp: number;
};

export type WarriorEnemyConfig = BaseEnemyConfig & {
  behavior: "chase";
};

export type RangedEnemyConfig = BaseEnemyConfig & {
  behavior: "ranged";
  preferredDistance: number;
  attackRange: number;
  attackCooldown: number;
  projectileSpeed: number;
  projectileDamage: number;
};

export type GrenadeThrowerConfig = BaseEnemyConfig & {
  behavior: "grenade";
  preferredDistance: number;
  attackRange: number;
  attackCooldown: number;
  grenadeDamage: number;
  grenadeRadius: number;
  fuseDuration: number;
};

export type MolotovThrowerConfig = BaseEnemyConfig & {
  behavior: "molotov";
  preferredDistance: number;
  attackRange: number;
  attackCooldown: number;
  molotovDamage: number;
  fireRadius: number;
  fuseDuration: number;
  fireDuration: number;
  fireDps: number;
};

export type SummonerMageConfig = BaseEnemyConfig & {
  behavior: "summoner";
  preferredDistance: number;
  summonInterval: number;
  summonCount: number;
  summonRadius: number;
  summonType: EnemyType;
};

export type HealerMageConfig = BaseEnemyConfig & {
  behavior: "healer";
  preferredDistance: number;
  healRadius: number;
  healAmount: number;
  healCooldown: number;
};

export type TeleportMageConfig = BaseEnemyConfig & {
  behavior: "teleport";
  preferredDistance: number;
  teleportRange: number;
  teleportCooldown: number;
  warningDuration: number;
};

export type EnemyConfig =
  | WarriorEnemyConfig
  | RangedEnemyConfig
  | GrenadeThrowerConfig
  | MolotovThrowerConfig
  | SummonerMageConfig
  | HealerMageConfig
  | TeleportMageConfig;

export type ProjectileConfig = {
  speed: number;
  damage: number;
  radius: number;
  maxLifetime: number;
};

export const warriorConfig: WarriorEnemyConfig = {
  type: "warrior",
  behavior: "chase",
  maxHp: 30,
  speed: 100,
  damage: 10,
  collisionRadius: 14,
  rewardXp: 5,
};

export const fastWarriorConfig: WarriorEnemyConfig = {
  type: "fast_warrior",
  behavior: "chase",
  maxHp: 15,
  speed: 180,
  damage: 8,
  collisionRadius: 10,
  rewardXp: 3,
};

export const shooterConfig: RangedEnemyConfig = {
  type: "shooter",
  behavior: "ranged",
  maxHp: 20,
  speed: 80,
  damage: 5,
  collisionRadius: 12,
  rewardXp: 8,
  preferredDistance: 250,
  attackRange: 300,
  attackCooldown: 1.5,
  projectileSpeed: 280,
  projectileDamage: 8,
};

export const grenadeThrowerConfig: GrenadeThrowerConfig = {
  type: "grenade_thrower",
  behavior: "grenade",
  maxHp: 25,
  speed: 70,
  damage: 5,
  collisionRadius: 14,
  rewardXp: 10,
  preferredDistance: 220,
  attackRange: 280,
  attackCooldown: 3,
  grenadeDamage: 20,
  grenadeRadius: 60,
  fuseDuration: 1.5,
};

export const molotovThrowerConfig: MolotovThrowerConfig = {
  type: "molotov_thrower",
  behavior: "molotov",
  maxHp: 25,
  speed: 70,
  damage: 5,
  collisionRadius: 14,
  rewardXp: 10,
  preferredDistance: 220,
  attackRange: 280,
  attackCooldown: 4,
  molotovDamage: 5,
  fireRadius: 50,
  fuseDuration: 1.2,
  fireDuration: 3,
  fireDps: 8,
};

export const summonerMageConfig: SummonerMageConfig = {
  type: "summoner_mage",
  behavior: "summoner",
  maxHp: 40,
  speed: 60,
  damage: 5,
  collisionRadius: 16,
  rewardXp: 15,
  preferredDistance: 280,
  summonInterval: 5,
  summonCount: 2,
  summonRadius: 40,
  summonType: "fast_warrior",
};

export const healerMageConfig: HealerMageConfig = {
  type: "healer_mage",
  behavior: "healer",
  maxHp: 35,
  speed: 65,
  damage: 5,
  collisionRadius: 14,
  rewardXp: 12,
  preferredDistance: 260,
  healRadius: 150,
  healAmount: 10,
  healCooldown: 4,
};

export const teleportMageConfig: TeleportMageConfig = {
  type: "teleport_mage",
  behavior: "teleport",
  maxHp: 30,
  speed: 75,
  damage: 8,
  collisionRadius: 14,
  rewardXp: 12,
  preferredDistance: 240,
  teleportRange: 200,
  teleportCooldown: 6,
  warningDuration: 1.5,
};

export const projectileConfig: ProjectileConfig = {
  speed: 280,
  damage: 8,
  radius: 5,
  maxLifetime: 3,
};
