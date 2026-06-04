import { Container, Graphics } from "pixi.js";
import type { Vec2 } from "../../core/math/Vec2";
import { Boss } from "./Boss";
import type { AreaAttackBossConfig } from "../../game/config/BossConfig";
import type { ArenaBounds } from "../player/Player";

export const AreaAttackBossEvents = {
  AREA_WARNING: "area_boss:area_warning",
  AREA_DAMAGE: "area_boss:area_damage",
} as const;

export interface AreaWarningData {
  position: Vec2;
  radius: number;
  windupDuration: number;
  damage: number;
}

export interface AreaDamageData {
  position: Vec2;
  radius: number;
  damage: number;
}

interface WindupVisual {
  graphics: Graphics;
  timer: number;
  maxTimer: number;
  radius: number;
  position: Vec2;
  damage: number;
  damaged: boolean;
}

export class AreaAttackBoss extends Boss {
  private areaConfig: AreaAttackBossConfig;
  private attackTimer: number;
  private visualContainer: Container;
  private windupVisuals: WindupVisual[] = [];

  constructor(
    config: AreaAttackBossConfig,
    parentContainer: Container,
    visualContainer: Container,
    id: number,
  ) {
    super(config, parentContainer, id, 0, 0, 0);
    this.areaConfig = config;
    this.attackTimer = config.attackCooldown * 0.4;
    this.visualContainer = visualContainer;
  }

  override update(dt: number, playerPos: Vec2, arenaBounds: ArenaBounds): void {
    if (!this.state.alive) return;
    this.contactDamageTimer = Math.max(0, this.contactDamageTimer - dt);
    this.attackTimer = Math.max(0, this.attackTimer - dt);

    this.moveToward(dt, playerPos);
    this.clampToArena(arenaBounds);
    this.visual.updatePosition(this.state.position);
    this.visual.update(dt);

    if (this.attackTimer <= 0) {
      this.performAreaAttack(playerPos);
      this.attackTimer = this.areaConfig.attackCooldown;
    }

    this.updateWindupVisuals(dt);
  }

  private performAreaAttack(playerPos: Vec2): void {
    const targetPos = { x: playerPos.x, y: playerPos.y };

    this.events.emit<AreaWarningData>(AreaAttackBossEvents.AREA_WARNING, {
      position: targetPos,
      radius: this.areaConfig.attackRadius,
      windupDuration: this.areaConfig.windupDuration,
      damage: this.areaConfig.attackDamage,
    });

    this.spawnWindupVisual(
      targetPos,
      this.areaConfig.attackRadius,
      this.areaConfig.windupDuration,
      this.areaConfig.attackDamage,
    );
  }

  private spawnWindupVisual(
    position: Vec2,
    radius: number,
    windupDuration: number,
    damage: number,
  ): void {
    const g = new Graphics();
    g.position.set(position.x, position.y);
    this.visualContainer.addChild(g);
    this.windupVisuals.push({
      graphics: g,
      timer: windupDuration,
      maxTimer: windupDuration,
      radius,
      position: { x: position.x, y: position.y },
      damage,
      damaged: false,
    });
  }

  private updateWindupVisuals(dt: number): void {
    for (let i = this.windupVisuals.length - 1; i >= 0; i--) {
      const wv = this.windupVisuals[i];
      wv.timer -= dt;
      const progress = 1 - wv.timer / wv.maxTimer;

      wv.graphics.clear();
      wv.graphics.circle(0, 0, wv.radius);
      wv.graphics.stroke({ color: "#ff2222", width: 3, alpha: 0.3 + progress * 0.5 });
      wv.graphics.circle(0, 0, wv.radius * progress);
      wv.graphics.fill({ color: "#ff4444", alpha: 0.15 + progress * 0.2 });

      if (wv.timer <= 0) {
        if (!wv.damaged) {
          this.events.emit<AreaDamageData>(AreaAttackBossEvents.AREA_DAMAGE, {
            position: wv.position,
            radius: wv.radius,
            damage: wv.damage,
          });
          wv.damaged = true;
        }
        wv.graphics.destroy();
        this.windupVisuals.splice(i, 1);
      }
    }
  }

  override destroy(): void {
    for (const wv of this.windupVisuals) {
      wv.graphics.destroy();
    }
    this.windupVisuals = [];
    super.destroy();
  }
}
