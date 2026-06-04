import type { Container } from "pixi.js";
import type { Vec2 } from "../../core/math/Vec2";
import { vec2Subtract, vec2Normalize, vec2Scale, vec2Add } from "../../core/math/Vec2";
import { clamp } from "../../core/math/MathUtils";
import { Enemy } from "../enemies/Enemy";
import type { BaseBossConfig } from "../../game/config/BossConfig";
import type { ArenaBounds } from "../player/Player";

export const BossEvents = {
  SLAM_WARNING: "boss:slam_warning",
  SLAM_DAMAGE: "boss:slam_damage",
} as const;

export interface SlamWarningData {
  position: Vec2;
  radius: number;
  windupDuration: number;
  damage: number;
}

export interface SlamDamageData {
  position: Vec2;
  radius: number;
  damage: number;
}

export class Boss extends Enemy {
  readonly bossConfig: BaseBossConfig;
  protected slamTimer: number;
  protected slamCooldown: number;
  protected slamRadius: number;
  protected slamDamage: number;

  constructor(
    config: BaseBossConfig,
    parentContainer: Container,
    id: number,
    slamCooldown: number,
    slamRadius: number,
    slamDamage: number,
  ) {
    super(config as any, parentContainer, id);
    this.bossConfig = config;
    this.slamCooldown = slamCooldown;
    this.slamRadius = slamRadius;
    this.slamDamage = slamDamage;
    this.slamTimer = slamCooldown * 0.6;
  }

  override update(dt: number, playerPos: Vec2, arenaBounds: ArenaBounds): void {
    if (!this.state.alive) return;
    this.contactDamageTimer = Math.max(0, this.contactDamageTimer - dt);
    this.slamTimer = Math.max(0, this.slamTimer - dt);

    this.moveToward(dt, playerPos);
    this.clampToArena(arenaBounds);
    this.visual.updatePosition(this.state.position);
    this.visual.update(dt);

    if (this.slamTimer <= 0 && this.slamCooldown > 0) {
      this.performSlam(playerPos);
      this.slamTimer = this.slamCooldown;
    }
  }

  protected performSlam(playerPos: Vec2): void {
    this.events.emit<SlamWarningData>(BossEvents.SLAM_WARNING, {
      position: { x: playerPos.x, y: playerPos.y },
      radius: this.slamRadius,
      windupDuration: 1.0,
      damage: this.slamDamage,
    });
  }

  protected override moveToward(dt: number, playerPos: Vec2): void {
    const dir = vec2Subtract(playerPos, this.state.position);
    const normalized = vec2Normalize(dir);
    const displacement = vec2Scale(normalized, this.bossConfig.speed * dt);
    this.state.position = vec2Add(this.state.position, displacement);
  }

  protected override clampToArena(bounds: ArenaBounds): void {
    const r = this.bossConfig.collisionRadius;
    this.state.position.x = clamp(
      this.state.position.x,
      bounds.x + r,
      bounds.x + bounds.width - r,
    );
    this.state.position.y = clamp(
      this.state.position.y,
      bounds.y + r,
      bounds.y + bounds.height - r,
    );
  }
}
