import type { Container } from "pixi.js";
import type { Vec2 } from "../../core/math/Vec2";
import { RangedEnemy } from "./RangedEnemy";
import type { GrenadeThrowerConfig } from "../../game/config/EnemyConfig";

export const GrenadeEvents = {
  GRENADE_THROWN: "grenade:thrown",
} as const;

export class GrenadeThrowerEnemy extends RangedEnemy {
  private grenadeConfig: GrenadeThrowerConfig;

  constructor(
    config: GrenadeThrowerConfig,
    parentContainer: Container,
    id: number,
  ) {
    super(config, parentContainer, id);
    this.grenadeConfig = config;
  }

  protected performAttack(playerPos: Vec2): void {
    this.events.emit(GrenadeEvents.GRENADE_THROWN, {
      targetPosition: { x: playerPos.x, y: playerPos.y },
      radius: this.grenadeConfig.grenadeRadius,
      damage: this.grenadeConfig.grenadeDamage,
      fuseDuration: this.grenadeConfig.fuseDuration,
    });
  }
}
