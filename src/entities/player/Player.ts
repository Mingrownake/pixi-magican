import type { Container } from "pixi.js";
import {
  vec2Scale,
  vec2Add,
  vec2Normalize,
  vec2Subtract,
} from "../../core/math/Vec2";
import { clamp } from "../../core/math/MathUtils";
import { GameEventEmitter } from "../../core/events/GameEventEmitter";
import { PlayerState } from "./PlayerState";
import { PlayerVisual } from "./PlayerVisual";
import {
  playerConfig,
  type PlayerConfig,
} from "../../game/config/PlayerConfig";
import { xpConfig, xpRequiredForLevel } from "../../game/config/XpConfig";
import type { InputManager } from "../../input/InputManager";

export const PlayerEvents = {
  DAMAGED: "player:damaged",
  DIED: "player:died",
  HP_CHANGED: "player:hp_changed",
  MP_CHANGED: "player:mp_changed",
  LEVEL_CHANGED: "player:level_changed",
  XP_CHANGED: "player:xp_changed",
} as const;

export interface PlayerDamagedData {
  amount: number;
  remainingHp: number;
}

export interface PlayerLevelChangedData {
  previousLevel: number;
  newLevel: number;
}

export interface ArenaBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class Player {
  readonly state: PlayerState;
  readonly visual: PlayerVisual;
  readonly events: GameEventEmitter;
  readonly config: PlayerConfig;

  private arenaBounds: ArenaBounds;

  constructor(
    parentContainer: Container,
    config?: PlayerConfig,
    arenaBounds?: ArenaBounds,
  ) {
    this.config = config ?? playerConfig;
    this.events = new GameEventEmitter();
    this.state = new PlayerState(this.config, xpConfig.startingLevel);
    this.visual = new PlayerVisual(this.config.collisionRadius);
    this.arenaBounds = arenaBounds ?? {
      x: 40,
      y: 40,
      width: window.innerWidth - 80,
      height: window.innerHeight - 80,
    };

    parentContainer.addChild(this.visual.container);

    this.spawnAtCenter();
  }

  private spawnAtCenter(): void {
    const cx = this.arenaBounds.x + this.arenaBounds.width / 2;
    const cy = this.arenaBounds.y + this.arenaBounds.height / 2;
    this.state.position = { x: cx, y: cy };
    this.visual.updatePosition(this.state.position);
  }

  update(dt: number, input: InputManager, inputBlocked: boolean): void {
    if (!this.state.alive) return;

    if (!inputBlocked) {
      this.applyMovement(dt, input);
    } else {
      this.state.velocity = { x: 0, y: 0 };
    }

    this.applyRegen(dt);
    this.updateFacingDirection(input);
  }

  private applyMovement(dt: number, input: InputManager): void {
    const moveDir = input.getMovementVector();
    const speed = this.config.moveSpeed;

    this.state.velocity = vec2Scale(moveDir, speed);
    const displacement = vec2Scale(this.state.velocity, dt);
    this.state.position = vec2Add(this.state.position, displacement);
    this.clampToArena();
    this.visual.updatePosition(this.state.position);
  }

  private updateFacingDirection(input: InputManager): void {
    const pointerPos = input.getPointerPosition();
    const diff = vec2Subtract(pointerPos, this.state.position);
    const len = Math.sqrt(diff.x * diff.x + diff.y * diff.y);
    if (len > 0.1) {
      this.visual.updateDirection(vec2Normalize(diff));
    }
  }

  private applyRegen(dt: number): void {
    if (this.state.hp < this.state.maxHp) {
      const prevHp = this.state.hp;
      const regenAmount = this.config.hpRegenPerSecond * dt;
      this.state.heal(regenAmount);
      if (this.state.hp !== prevHp) {
        this.events.emit(PlayerEvents.HP_CHANGED, {
          hp: this.state.hp,
          maxHp: this.state.maxHp,
        });
      }
    }

    if (this.state.mp < this.state.maxMp) {
      const prevMp = this.state.mp;
      const regenAmount = this.config.mpRegenPerSecond * dt;
      this.state.addMana(regenAmount);
      if (this.state.mp !== prevMp) {
        this.events.emit(PlayerEvents.MP_CHANGED, {
          mp: this.state.mp,
          maxMp: this.state.maxMp,
        });
      }
    }
  }

  private clampToArena(): void {
    const r = this.config.collisionRadius;
    const b = this.arenaBounds;
    this.state.position.x = clamp(
      this.state.position.x,
      b.x + r,
      b.x + b.width - r,
    );
    this.state.position.y = clamp(
      this.state.position.y,
      b.y + r,
      b.y + b.height - r,
    );
  }

  takeDamage(amount: number): void {
    if (!this.state.alive) return;
    const actual = this.state.takeDamage(amount);
    if (actual <= 0) return;

    this.events.emit(PlayerEvents.HP_CHANGED, {
      hp: this.state.hp,
      maxHp: this.state.maxHp,
    });

    this.events.emit<PlayerDamagedData>(PlayerEvents.DAMAGED, {
      amount: actual,
      remainingHp: this.state.hp,
    });

    if (!this.state.alive) {
      this.events.emit(PlayerEvents.DIED);
    }
  }

  addXp(amount: number): void {
    if (!this.state.alive || amount <= 0) return;

    if (this.state.level >= xpConfig.maxLevel) return;

    this.state.addXp(amount);
    this.events.emit(PlayerEvents.XP_CHANGED, {
      xp: this.state.xp,
      xpRequired: xpRequiredForLevel(this.state.level, xpConfig),
      level: this.state.level,
    });

    this.checkLevelUp();
  }

  private checkLevelUp(): void {
    const required = xpRequiredForLevel(this.state.level, xpConfig);
    if (this.state.xp >= required && this.state.level < xpConfig.maxLevel) {
      const previousLevel = this.state.level;
      this.state.xp -= required;
      this.state.level += 1;

      this.events.emit<PlayerLevelChangedData>(PlayerEvents.LEVEL_CHANGED, {
        previousLevel,
        newLevel: this.state.level,
      });

      this.checkLevelUp();
    }
  }

  setArenaBounds(bounds: ArenaBounds): void {
    this.arenaBounds = bounds;
  }

  reset(): void {
    this.state.reset(this.config, xpConfig.startingLevel, { x: 0, y: 0 });
    this.spawnAtCenter();
    this.visual.setAlpha(1);
  }

  destroy(): void {
    this.events.removeAll();
    this.visual.destroy();
  }
}
