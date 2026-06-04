import type { Container } from "pixi.js";
import type { Vec2 } from "../../core/math/Vec2";
import {
  vec2Subtract,
  vec2Normalize,
  vec2Scale,
  vec2Add,
  vec2Distance,
} from "../../core/math/Vec2";
import { clamp } from "../../core/math/MathUtils";
import { GameEventEmitter } from "../../core/events/GameEventEmitter";
import { EnemyState } from "./EnemyState";
import { EnemyVisual } from "./EnemyVisual";
import type { BaseEnemyConfig } from "../../game/config/EnemyConfig";
import type { ArenaBounds } from "../player/Player";

export const EnemyEvents = {
  DAMAGED: "enemy:damaged",
  DIED: "enemy:died",
  CONTACT_DAMAGE: "enemy:contact_damage",
} as const;

export interface EnemyDamagedData {
  amount: number;
  enemyId: number;
}

export interface EnemyDiedData {
  position: Vec2;
  rewardXp: number;
}

export interface EnemyContactDamageData {
  damage: number;
}

export class Enemy {
  readonly state: EnemyState;
  readonly visual: EnemyVisual;
  readonly events: GameEventEmitter;
  readonly config: BaseEnemyConfig;
  readonly id: number;

  protected contactDamageTimer = 0;
  protected static readonly CONTACT_DAMAGE_INTERVAL = 1;

  constructor(config: BaseEnemyConfig, parentContainer: Container, id: number) {
    this.config = config;
    this.id = id;
    this.events = new GameEventEmitter();
    this.state = new EnemyState(config);
    this.visual = new EnemyVisual(config.collisionRadius, config.type);
    parentContainer.addChild(this.visual.container);
  }

  update(dt: number, playerPos: Vec2, arenaBounds: ArenaBounds): void {
    if (!this.state.alive) return;
    this.contactDamageTimer = Math.max(0, this.contactDamageTimer - dt);
    this.moveToward(dt, playerPos);
    this.clampToArena(arenaBounds);
    this.visual.updatePosition(this.state.position);
    this.visual.update(dt);
  }

  protected moveToward(dt: number, playerPos: Vec2): void {
    const dir = vec2Subtract(playerPos, this.state.position);
    const normalized = vec2Normalize(dir);
    const displacement = vec2Scale(normalized, this.config.speed * dt);
    this.state.position = vec2Add(this.state.position, displacement);
  }

  protected clampToArena(bounds: ArenaBounds): void {
    const r = this.config.collisionRadius;
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

  checkContactDamage(playerPos: Vec2, playerRadius: number): void {
    if (!this.state.alive || this.contactDamageTimer > 0) return;
    const dist = vec2Distance(this.state.position, playerPos);
    if (dist < this.config.collisionRadius + playerRadius) {
      this.contactDamageTimer = Enemy.CONTACT_DAMAGE_INTERVAL;
      this.events.emit<EnemyContactDamageData>(EnemyEvents.CONTACT_DAMAGE, {
        damage: this.config.damage,
      });
    }
  }

  takeDamage(amount: number): void {
    if (!this.state.alive) return;
    const actual = this.state.takeDamage(amount);
    if (actual > 0) {
      this.visual.showDamageFlash();
      this.visual.showHpBar();
      this.visual.updateHpBar(this.state.hpFraction);
      this.events.emit<EnemyDamagedData>(EnemyEvents.DAMAGED, {
        amount: actual,
        enemyId: this.id,
      });
    }
    if (!this.state.alive) {
      this.events.emit<EnemyDiedData>(EnemyEvents.DIED, {
        position: { x: this.state.position.x, y: this.state.position.y },
        rewardXp: this.config.rewardXp,
      });
    }
  }

  heal(amount: number): void {
    if (!this.state.alive) return;
    this.state.heal(amount);
    if (this.visual) {
      this.visual.updateHpBar(this.state.hpFraction);
    }
  }

  setPosition(pos: Vec2): void {
    this.state.position = { x: pos.x, y: pos.y };
    this.visual.updatePosition(this.state.position);
  }

  destroy(): void {
    this.events.removeAll();
    this.visual.destroy();
  }
}
