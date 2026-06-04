import type { Container } from "pixi.js";
import type { Vec2 } from "../../core/math/Vec2";
import { Boss } from "./Boss";
import type { TankBossConfig } from "../../game/config/BossConfig";
import type { ArenaBounds } from "../player/Player";

export class TankBoss extends Boss {
  private tankConfig: TankBossConfig;
  private enraged = false;

  constructor(
    config: TankBossConfig,
    parentContainer: Container,
    id: number,
  ) {
    super(config, parentContainer, id, config.slamCooldown, config.slamRadius, config.slamDamage);
    this.tankConfig = config;
  }

  override update(dt: number, playerPos: Vec2, arenaBounds: ArenaBounds): void {
    if (!this.state.alive) return;

    if (!this.enraged && this.state.hpFraction <= this.tankConfig.enrageThreshold) {
      this.enraged = true;
      this.tankConfig = {
        ...this.tankConfig,
        speed: this.tankConfig.speed * this.tankConfig.enrageSpeedMultiplier,
      };
      this.visual.showEnrageEffect();
    }

    super.update(dt, playerPos, arenaBounds);
  }
}
