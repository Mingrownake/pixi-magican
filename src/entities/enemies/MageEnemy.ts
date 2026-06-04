import type { Container } from "pixi.js";
import type { Vec2 } from "../../core/math/Vec2";
import { vec2Distance, vec2Subtract, vec2Normalize, vec2Scale, vec2Add } from "../../core/math/Vec2";
import { Enemy } from "./Enemy";
import type { ArenaBounds } from "../player/Player";
import type { BaseEnemyConfig } from "../../game/config/EnemyConfig";

export abstract class MageEnemy extends Enemy {
  protected abilityTimer: number;
  protected abilityCooldown: number;
  protected preferredDistance: number;

  constructor(
    config: BaseEnemyConfig,
    parentContainer: Container,
    id: number,
    abilityCooldown: number,
    preferredDistance: number,
  ) {
    super(config, parentContainer, id);
    this.abilityCooldown = abilityCooldown;
    this.abilityTimer = abilityCooldown * 0.5;
    this.preferredDistance = preferredDistance;
  }

  override update(dt: number, playerPos: Vec2, arenaBounds: ArenaBounds): void {
    if (!this.state.alive) return;
    this.contactDamageTimer = Math.max(0, this.contactDamageTimer - dt);
    this.abilityTimer = Math.max(0, this.abilityTimer - dt);

    this.moveKeepingDistance(dt, playerPos);
    this.clampToArena(arenaBounds);
    this.visual.updatePosition(this.state.position);
    this.visual.update(dt);

    if (this.abilityTimer <= 0) {
      this.performAbility(playerPos, arenaBounds);
      this.abilityTimer = this.abilityCooldown;
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

  protected abstract performAbility(
    playerPos: Vec2,
    arenaBounds: ArenaBounds,
  ): void;
}
