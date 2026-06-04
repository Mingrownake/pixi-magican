import type { PlayerState } from "../entities/player/PlayerState";
import type { BaseSkillConfig } from "./config/SkillConfig";

export enum SkillStatus {
  Locked = "Locked",
  Ready = "Ready",
  CoolingDown = "CoolingDown",
  InsufficientMana = "InsufficientMana",
  Active = "Active",
}

export abstract class Skill {
  readonly config: BaseSkillConfig;
  protected cooldownTimer = 0;

  constructor(config: BaseSkillConfig) {
    this.config = config;
  }

  get isOnCooldown(): boolean {
    return this.cooldownTimer > 0;
  }

  get cooldownRemaining(): number {
    return Math.max(0, this.cooldownTimer);
  }

  isUnlocked(playerLevel: number): boolean {
    return playerLevel >= this.config.unlockLevel;
  }

  canActivate(playerState: PlayerState, playerLevel: number): boolean {
    return (
      this.isUnlocked(playerLevel) &&
      !this.isOnCooldown &&
      playerState.mp >= this.config.manaCost &&
      playerState.alive
    );
  }

  startCooldown(): void {
    this.cooldownTimer = this.config.cooldownSeconds;
  }

  updateCooldown(dt: number): void {
    if (this.cooldownTimer > 0) {
      this.cooldownTimer = Math.max(0, this.cooldownTimer - dt);
    }
  }

  getStatus(playerState: PlayerState, playerLevel: number): SkillStatus {
    if (!this.isUnlocked(playerLevel)) return SkillStatus.Locked;
    if (this.isOnCooldown) return SkillStatus.CoolingDown;
    if (playerState.mp < this.config.manaCost)
      return SkillStatus.InsufficientMana;
    return SkillStatus.Ready;
  }

  reset(): void {
    this.cooldownTimer = 0;
  }
}
