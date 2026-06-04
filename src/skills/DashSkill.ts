import { Container, Graphics } from "pixi.js";
import type { Vec2 } from "../core/math/Vec2";
import {
  vec2Normalize,
  vec2Subtract,
  vec2Scale,
  vec2Length,
} from "../core/math/Vec2";
import { Skill, SkillStatus } from "./Skill";
import type { DashSkillConfig } from "./config/SkillConfig";
import type { PlayerState } from "../entities/player/PlayerState";
import type { InputManager } from "../input/InputManager";

interface TrailParticle {
  graphics: Graphics;
  alpha: number;
}

export class DashSkill extends Skill {
  readonly dashConfig: DashSkillConfig;
  private _isActive = false;
  private dashDirection: Vec2 = { x: 0, y: 0 };
  private dashTimer = 0;
  private dashSpeed: number;
  private trailParticles: TrailParticle[] = [];
  private trailSpawnTimer = 0;
  private visualContainer: Container;

  constructor(config: DashSkillConfig, visualContainer: Container) {
    super(config);
    this.dashConfig = config;
    this.dashSpeed = config.distance / config.durationSeconds;
    this.visualContainer = visualContainer;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  tryActivate(
    input: InputManager,
    playerState: PlayerState,
    playerPos: Vec2,
  ): boolean {
    if (this._isActive) return false;
    if (!input.isActionJustPressed("dash")) return false;
    if (!this.canActivate(playerState, playerState.level)) return false;

    const pointerPos = input.getPointerPosition();
    const diff = vec2Subtract(pointerPos, playerPos);
    const len = vec2Length(diff);
    if (len < 1) return false;

    this.dashDirection = vec2Normalize(diff);
    this.dashTimer = this.dashConfig.durationSeconds;
    this._isActive = true;
    this.trailSpawnTimer = 0;

    playerState.spendMana(this.config.manaCost);
    this.startCooldown();
    return true;
  }

  update(dt: number, playerPos: Vec2): void {
    this.updateCooldown(dt);
    this.updateTrail(dt);

    if (!this._isActive) return;

    this.dashTimer -= dt;

    this.trailSpawnTimer -= dt;
    if (this.trailSpawnTimer <= 0) {
      this.spawnTrailParticle(playerPos);
      this.trailSpawnTimer = 0.02;
    }

    if (this.dashTimer <= 0) {
      this._isActive = false;
    }
  }

  getVelocity(): Vec2 | null {
    if (!this._isActive) return null;
    return vec2Scale(this.dashDirection, this.dashSpeed);
  }

  private spawnTrailParticle(pos: Vec2): void {
    const g = new Graphics();
    g.circle(0, 0, this.dashConfig.hitRadius * 0.7);
    g.fill({ color: "#8866ee", alpha: 0.5 });
    g.position.set(pos.x, pos.y);
    this.visualContainer.addChild(g);
    this.trailParticles.push({ graphics: g, alpha: 0.5 });
  }

  private updateTrail(dt: number): void {
    const fadeSpeed = 3;
    for (let i = this.trailParticles.length - 1; i >= 0; i--) {
      const p = this.trailParticles[i];
      p.alpha -= fadeSpeed * dt;
      if (p.alpha <= 0) {
        p.graphics.destroy();
        this.trailParticles.splice(i, 1);
      } else {
        p.graphics.alpha = p.alpha;
      }
    }
  }

  override getStatus(
    playerState: PlayerState,
    playerLevel: number,
  ): SkillStatus {
    if (this._isActive) return SkillStatus.Active;
    return super.getStatus(playerState, playerLevel);
  }

  override reset(): void {
    super.reset();
    this._isActive = false;
    this.dashTimer = 0;
    this.clearTrail();
  }

  private clearTrail(): void {
    for (const p of this.trailParticles) {
      p.graphics.destroy();
    }
    this.trailParticles = [];
  }

  destroy(): void {
    this.clearTrail();
  }
}
