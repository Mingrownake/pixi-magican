import type { Container } from "pixi.js";
import type { Vec2 } from "../../core/math/Vec2";
import { vec2Subtract, vec2Normalize } from "../../core/math/Vec2";
import { RangedEnemy } from "./RangedEnemy";
import type { RangedEnemyConfig } from "../../game/config/EnemyConfig";

export const ShooterEvents = {
  PROJECTILE_FIRED: "shooter:projectile_fired",
} as const;

export class ShooterEnemy extends RangedEnemy {
  private shooterConfig: RangedEnemyConfig;

  constructor(
    config: RangedEnemyConfig,
    parentContainer: Container,
    id: number,
  ) {
    super(config, parentContainer, id);
    this.shooterConfig = config;
  }

  protected performAttack(playerPos: Vec2): void {
    const dir = vec2Normalize(
      vec2Subtract(playerPos, this.state.position),
    );
    this.events.emit(ShooterEvents.PROJECTILE_FIRED, {
      position: { x: this.state.position.x, y: this.state.position.y },
      direction: dir,
      speed: this.shooterConfig.projectileSpeed,
      damage: this.shooterConfig.projectileDamage,
    });
  }
}
