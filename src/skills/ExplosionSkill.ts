import { Container, Graphics } from "pixi.js";
import type { Vec2 } from "../core/math/Vec2";
import { clamp } from "../core/math/MathUtils";
import { Skill, SkillStatus } from "./Skill";
import type { ExplosionSkillConfig } from "./config/SkillConfig";
import type { PlayerState } from "../entities/player/PlayerState";
import type { InputManager } from "../input/InputManager";
import { GameEventEmitter } from "../core/events/GameEventEmitter";

export const ExplosionSkillEvents = {
  ACTIVATED: "explosion:activated",
} as const;

export interface ExplosionActivatedData {
  position: Vec2;
  radius: number;
  damage: number;
}

export class ExplosionSkill extends Skill {
  readonly explosionConfig: ExplosionSkillConfig;
  readonly events = new GameEventEmitter();
  private visualContainer: Container;
  private activeVisuals: {
    graphics: Graphics;
    timer: number;
    maxTimer: number;
  }[] = [];

  constructor(config: ExplosionSkillConfig, visualContainer: Container) {
    super(config);
    this.explosionConfig = config;
    this.visualContainer = visualContainer;
  }

  tryActivate(
    input: InputManager,
    playerState: PlayerState,
    playerPos: Vec2,
  ): boolean {
    if (!input.isActionJustPressed("explosion")) return false;
    if (!this.canActivate(playerState, playerState.level)) return false;

    playerState.spendMana(this.config.manaCost);
    this.startCooldown();

    this.events.emit<ExplosionActivatedData>(ExplosionSkillEvents.ACTIVATED, {
      position: { x: playerPos.x, y: playerPos.y },
      radius: this.explosionConfig.radius,
      damage: this.explosionConfig.damage,
    });

    this.spawnExplosionVisual(playerPos);
    return true;
  }

  update(dt: number): void {
    this.updateCooldown(dt);
    this.updateVisuals(dt);
  }

  private spawnExplosionVisual(pos: Vec2): void {
    const g = new Graphics();
    g.position.set(pos.x, pos.y);
    this.visualContainer.addChild(g);
    this.activeVisuals.push({
      graphics: g,
      timer: this.explosionConfig.visualDuration,
      maxTimer: this.explosionConfig.visualDuration,
    });
  }

  private updateVisuals(dt: number): void {
    for (let i = this.activeVisuals.length - 1; i >= 0; i--) {
      const v = this.activeVisuals[i];
      v.timer -= dt;

      const progress = clamp(1 - v.timer / v.maxTimer, 0, 1);
      const currentRadius = this.explosionConfig.radius * progress;
      const alpha = 1 - progress;

      v.graphics.clear();
      v.graphics.circle(0, 0, currentRadius);
      v.graphics.fill({ color: "#ff6622", alpha: alpha * 0.3 });
      v.graphics.stroke({ color: "#ff8844", width: 3, alpha });

      if (v.timer <= 0) {
        v.graphics.destroy();
        this.activeVisuals.splice(i, 1);
      }
    }
  }

  override getStatus(
    playerState: PlayerState,
    playerLevel: number,
  ): SkillStatus {
    return super.getStatus(playerState, playerLevel);
  }

  override reset(): void {
    super.reset();
    this.clearVisuals();
  }

  private clearVisuals(): void {
    for (const v of this.activeVisuals) {
      v.graphics.destroy();
    }
    this.activeVisuals = [];
  }

  destroy(): void {
    this.clearVisuals();
    this.events.removeAll();
  }
}
