import type { Container } from "pixi.js";
import type { Vec2 } from "../../core/math/Vec2";
import { vec2Distance, vec2Subtract, vec2Normalize, vec2Scale, vec2Add } from "../../core/math/Vec2";
import { Enemy } from "./Enemy";
import type { ArenaBounds } from "../player/Player";
import type { BaseEnemyConfig } from "../../game/config/EnemyConfig";

export abstract class RangedEnemy extends Enemy {
  protected attackTimer = 0;
  protected preferredDistance: number;
  protected attackRange: number;
  protected attackCooldown: number;

  constructor(config: BaseEnemyConfig, parentContainer: Container, id: number) {
    super(config, parentContainer, id);
    const rangedConfig = config as BaseEnemyConfig & {
      preferredDistance: number;
      attackRange: number;
      attackCooldown: number;
    };
    this.preferredDistance = rangedConfig.preferredDistance;
    this.attackRange = rangedConfig.attackRange;
    this.attackCooldown = rangedConfig.attackCooldown;
  }

  override update(dt: number, playerPos: Vec2, arenaBounds: ArenaBounds): void {
    if (!this.state.alive) return;
    this.contactDamageTimer = Math.max(0, this.contactDamageTimer - dt);
    this.attackTimer = Math.max(0, this.attackTimer - dt);

    this.moveKeepingDistance(dt, playerPos);
    this.clampToArena(arenaBounds);
    this.visual.updatePosition(this.state.position);
    this.visual.update(dt);

    const dist = vec2Distance(this.state.position, playerPos);
    if (dist <= this.attackRange && this.attackTimer <= 0) {
      this.performAttack(playerPos);
      this.attackTimer = this.attackCooldown;
    }
  }

  protected moveKeepingDistance(dt: number, playerPos: Vec2): void {
    const dist = vec2Distance(this.state.position, playerPos);
    const dir = vec2Subtract(playerPos, this.state.position);
    const normalized = vec2Normalize(dir);

    if (dist > this.preferredDistance + 30) {
      const displacement = vec2Scale(normalized, this.config.speed * dt);
      this.state.position = vec2Add(this.state.position, displacement);
    } else if (dist < this.preferredDistance - 30) {
      const displacement = vec2Scale(normalized, -this.config.speed * dt);
      this.state.position = vec2Add(this.state.position, displacement);
    }
  }

  protected abstract performAttack(playerPos: Vec2): void;
}
