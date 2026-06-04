import { Container } from "pixi.js";
import type { Vec2 } from "../core/math/Vec2";
import { DashSkill } from "./DashSkill";
import { TeleportSkill } from "./TeleportSkill";
import { ExplosionSkill } from "./ExplosionSkill";
import {
  dashSkillConfig,
  teleportSkillConfig,
  explosionSkillConfig,
} from "./config/SkillConfig";
import type { PlayerState } from "../entities/player/PlayerState";
import type { InputManager } from "../input/InputManager";
import type { GameStateManager } from "../game/state/GameState";
import type { TimeScale } from "../core/time/TimeScale";
import type { ArenaBounds } from "../entities/player/Player";

export class SkillController {
  readonly dash: DashSkill;
  readonly teleport: TeleportSkill;
  readonly explosion: ExplosionSkill;
  readonly visualContainer: Container;

  private onTeleport: (pos: Vec2) => void;
  private playerVisualAlpha: { value: number } = { value: 1 };
  private arenaBounds: ArenaBounds;

  constructor(
    parentContainer: Container,
    timeScale: TimeScale,
    gameState: GameStateManager,
    arenaBounds: ArenaBounds,
    onTeleport: (pos: Vec2) => void,
  ) {
    this.visualContainer = new Container();
    parentContainer.addChild(this.visualContainer);

    this.onTeleport = onTeleport;
    this.arenaBounds = arenaBounds;

    this.dash = new DashSkill(dashSkillConfig, this.visualContainer);
    this.teleport = new TeleportSkill(
      teleportSkillConfig,
      this.visualContainer,
      timeScale,
      gameState,
    );
    this.explosion = new ExplosionSkill(
      explosionSkillConfig,
      this.visualContainer,
    );
  }

  update(
    dt: number,
    input: InputManager,
    playerState: PlayerState,
    playerPos: Vec2,
    inputBlocked: boolean,
  ): void {
    if (!inputBlocked && !this.teleport.isTargeting) {
      this.dash.tryActivate(input, playerState, playerPos);
      this.explosion.tryActivate(input, playerState, playerPos);
    }

    this.dash.update(dt, playerPos);
    this.explosion.update(dt);

    if (!inputBlocked || this.teleport.isTargeting) {
      this.teleport.tryActivate(input, playerState, playerPos);
    }

    if (this.teleport.isTargeting) {
      this.teleport.update(
        dt,
        input,
        playerState,
        this.playerVisualAlpha,
        this.onTeleport,
        this.arenaBounds,
      );
    }
  }

  getDashVelocity(): Vec2 | null {
    return this.dash.getVelocity();
  }

  isDashing(): boolean {
    return this.dash.isActive;
  }

  isTeleporting(): boolean {
    return this.teleport.isTargeting;
  }

  getPlayerVisualAlpha(): number {
    return this.playerVisualAlpha.value;
  }

  setArenaBounds(bounds: ArenaBounds): void {
    this.arenaBounds = bounds;
  }

  reset(): void {
    this.dash.reset();
    this.teleport.reset();
    this.explosion.reset();
    this.playerVisualAlpha.value = 1;
  }

  destroy(): void {
    this.dash.destroy();
    this.teleport.destroy();
    this.explosion.destroy();
    this.visualContainer.destroy();
  }
}
