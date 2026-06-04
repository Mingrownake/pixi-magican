export type BaseSkillConfig = {
  skillId: string;
  unlockLevel: number;
  manaCost: number;
  cooldownSeconds: number;
};

export type DashSkillConfig = BaseSkillConfig & {
  distance: number;
  durationSeconds: number;
  damage: number;
  hitRadius: number;
};

export type TeleportSkillConfig = BaseSkillConfig & {
  maxRadius: number;
  targetingDuration: number;
  timeScaleDuringTargeting: number;
  fadeAlpha: number;
};

export type ExplosionSkillConfig = BaseSkillConfig & {
  radius: number;
  damage: number;
  visualDuration: number;
};

export const dashSkillConfig: DashSkillConfig = {
  skillId: "dash",
  unlockLevel: 1,
  manaCost: 15,
  cooldownSeconds: 1.2,
  distance: 180,
  durationSeconds: 0.14,
  damage: 30,
  hitRadius: 22,
};

export const teleportSkillConfig: TeleportSkillConfig = {
  skillId: "teleport",
  unlockLevel: 5,
  manaCost: 25,
  cooldownSeconds: 4,
  maxRadius: 250,
  targetingDuration: 2,
  timeScaleDuringTargeting: 0.2,
  fadeAlpha: 0.3,
};

export const explosionSkillConfig: ExplosionSkillConfig = {
  skillId: "explosion",
  unlockLevel: 8,
  manaCost: 35,
  cooldownSeconds: 5,
  radius: 120,
  damage: 50,
  visualDuration: 0.4,
};
