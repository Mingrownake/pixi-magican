import { Container, Graphics } from "pixi.js";
import type { Vec2 } from "../../core/math/Vec2";
import { MageEnemy } from "./MageEnemy";
import type { HealerMageConfig } from "../../game/config/EnemyConfig";
import type { ArenaBounds } from "../player/Player";
import type { Enemy } from "./Enemy";

export const HealerEvents = {
  HEAL_PULSE: "healer:heal_pulse",
} as const;

export interface HealPulseData {
  position: Vec2;
  radius: number;
  amount: number;
}

export class HealerMageEnemy extends MageEnemy {
  private healerConfig: HealerMageConfig;
  private visualContainer: Container;
  private pulseVisuals: {
    graphics: Graphics;
    timer: number;
    maxTimer: number;
  }[] = [];

  constructor(
    config: HealerMageConfig,
    parentContainer: Container,
    visualContainer: Container,
    id: number,
  ) {
    super(config, parentContainer, id, config.healCooldown, config.preferredDistance);
    this.healerConfig = config;
    this.visualContainer = visualContainer;
  }

  protected performAbility(
    _playerPos: Vec2,
    _arenaBounds: ArenaBounds,
  ): void {
    this.events.emit<HealPulseData>(HealerEvents.HEAL_PULSE, {
      position: { x: this.state.position.x, y: this.state.position.y },
      radius: this.healerConfig.healRadius,
      amount: this.healerConfig.healAmount,
    });
    this.spawnHealPulseVisual();
  }

  healNearbyEnemies(enemies: Enemy[]): void {
    for (const enemy of enemies) {
      if (enemy === this || !enemy.state.alive) continue;
      const dx = enemy.state.position.x - this.state.position.x;
      const dy = enemy.state.position.y - this.state.position.y;
      const distSq = dx * dx + dy * dy;
      if (distSq <= this.healerConfig.healRadius * this.healerConfig.healRadius) {
        enemy.heal(this.healerConfig.healAmount);
      }
    }
  }

  private spawnHealPulseVisual(): void {
    const g = new Graphics();
    g.position.set(this.state.position.x, this.state.position.y);
    this.visualContainer.addChild(g);
    this.pulseVisuals.push({
      graphics: g,
      timer: 0.5,
      maxTimer: 0.5,
    });
  }

  override update(dt: number, playerPos: Vec2, arenaBounds: ArenaBounds): void {
    super.update(dt, playerPos, arenaBounds);
    this.updatePulseVisuals(dt);
  }

  private updatePulseVisuals(dt: number): void {
    for (let i = this.pulseVisuals.length - 1; i >= 0; i--) {
      const v = this.pulseVisuals[i];
      v.timer -= dt;
      const progress = 1 - v.timer / v.maxTimer;
      const alpha = 1 - progress;
      const radius = this.healerConfig.healRadius * progress;

      v.graphics.clear();
      v.graphics.circle(0, 0, radius);
      v.graphics.stroke({ color: "#33ff66", width: 2, alpha });

      if (v.timer <= 0) {
        v.graphics.destroy();
        this.pulseVisuals.splice(i, 1);
      }
    }
  }

  override destroy(): void {
    for (const v of this.pulseVisuals) {
      v.graphics.destroy();
    }
    this.pulseVisuals = [];
    super.destroy();
  }
}
