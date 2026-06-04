export type PlayerConfig = {
  maxHp: number;
  maxMp: number;
  hpRegenPerSecond: number;
  mpRegenPerSecond: number;
  moveSpeed: number;
  collisionRadius: number;
};

export const playerConfig: PlayerConfig = {
  maxHp: 100,
  maxMp: 100,
  hpRegenPerSecond: 0.5,
  mpRegenPerSecond: 3,
  moveSpeed: 260,
  collisionRadius: 16,
};
