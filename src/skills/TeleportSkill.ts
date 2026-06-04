import { Container, Graphics } from "pixi.js";
import type { Vec2 } from "../core/math/Vec2";
import { vec2Subtract, vec2Length } from "../core/math/Vec2";
import { clamp } from "../core/math/MathUtils";
import { Skill, SkillStatus } from "./Skill";
import type { TeleportSkillConfig } from "./config/SkillConfig";
import type { PlayerState } from "../entities/player/PlayerState";
import type { InputManager } from "../input/InputManager";
import type { GameStateManager } from "../game/state/GameState";
import { GameState } from "../game/state/GameState";
import type { TimeScale } from "../core/time/TimeScale";
import type { ArenaBounds } from "../entities/player/Player";

export class TeleportSkill extends Skill {
  readonly teleportConfig: TeleportSkillConfig;
  private _isTargeting = false;
  private targetingTimer = 0;
  private originalPosition: Vec2 = { x: 0, y: 0 };
  private lastValidPointerPos: Vec2 = { x: 0, y: 0 };
  private visualContainer: Container;

  private radiusIndicator: Graphics | null = null;
  private cursorIndicator: Graphics | null = null;

  private timeScale: TimeScale;
  private gameState: GameStateManager;
  private savedTimeScale = 1;

  constructor(
    config: TeleportSkillConfig,
    visualContainer: Container,
    timeScale: TimeScale,
    gameState: GameStateManager,
  ) {
    super(config);
    this.teleportConfig = config;
    this.visualContainer = visualContainer;
    this.timeScale = timeScale;
    this.gameState = gameState;
  }

  get isTargeting(): boolean {
    return this._isTargeting;
  }

  tryActivate(
    input: InputManager,
    playerState: PlayerState,
    playerPos: Vec2,
  ): boolean {
    if (this._isTargeting) return false;
    if (!input.isActionJustPressed("teleport")) return false;
    if (!this.canActivate(playerState, playerState.level)) return false;

    this.originalPosition = { x: playerPos.x, y: playerPos.y };
    this.lastValidPointerPos = { x: playerPos.x, y: playerPos.y };
    this.targetingTimer = this.teleportConfig.targetingDuration;
    this._isTargeting = true;

    this.savedTimeScale = this.timeScale.scale;
    this.timeScale.scale = this.teleportConfig.timeScaleDuringTargeting;
    this.gameState.setState(GameState.TeleportTargeting);

    this.createIndicators();
    return true;
  }

  update(
    dt: number,
    input: InputManager,
    playerState: PlayerState,
    playerVisualAlpha: { value: number },
    onTeleport: (pos: Vec2) => void,
    arenaBounds: ArenaBounds,
  ): void {
    this.updateCooldown(dt);

    if (!this._isTargeting) return;

    this.targetingTimer -= dt;

    const pointerPos = input.getPointerPosition();
    this.lastValidPointerPos = this.clampToRadius(pointerPos);
    this.updateIndicators();

    playerVisualAlpha.value = this.teleportConfig.fadeAlpha;

    const clicked = input.pointer.leftJustPressed;
    const expired = this.targetingTimer <= 0;

    if (clicked || expired) {
      const target = this.clampToArena(this.lastValidPointerPos, arenaBounds);
      playerState.spendMana(this.config.manaCost);
      this.startCooldown();
      onTeleport(target);
      this.exitTargeting(playerVisualAlpha);
    }
  }

  cancelTargeting(playerVisualAlpha: { value: number }): void {
    if (!this._isTargeting) return;
    this.exitTargeting(playerVisualAlpha);
  }

  private exitTargeting(playerVisualAlpha: { value: number }): void {
    this._isTargeting = false;
    this.timeScale.scale = this.savedTimeScale;
    playerVisualAlpha.value = 1;
    this.gameState.setState(GameState.Playing);
    this.destroyIndicators();
  }

  private clampToRadius(pointerPos: Vec2): Vec2 {
    const diff = vec2Subtract(pointerPos, this.originalPosition);
    const dist = vec2Length(diff);
    if (dist <= this.teleportConfig.maxRadius) {
      return { x: pointerPos.x, y: pointerPos.y };
    }
    const scale = this.teleportConfig.maxRadius / dist;
    return {
      x: this.originalPosition.x + diff.x * scale,
      y: this.originalPosition.y + diff.y * scale,
    };
  }

  private clampToArena(pos: Vec2, bounds: ArenaBounds): Vec2 {
    return {
      x: clamp(pos.x, bounds.x + 16, bounds.x + bounds.width - 16),
      y: clamp(pos.y, bounds.y + 16, bounds.y + bounds.height - 16),
    };
  }

  private createIndicators(): void {
    this.radiusIndicator = new Graphics();
    this.radiusIndicator.circle(0, 0, this.teleportConfig.maxRadius);
    this.radiusIndicator.stroke({ color: "#44aaff", width: 2, alpha: 0.5 });
    this.radiusIndicator.position.set(
      this.originalPosition.x,
      this.originalPosition.y,
    );
    this.visualContainer.addChild(this.radiusIndicator);

    this.cursorIndicator = new Graphics();
    this.visualContainer.addChild(this.cursorIndicator);
  }

  private updateIndicators(): void {
    if (!this.cursorIndicator) return;

    const progress = clamp(
      this.targetingTimer / this.teleportConfig.targetingDuration,
      0,
      1,
    );
    const cursorRadius = 20 * progress + 4;

    this.cursorIndicator.clear();
    this.cursorIndicator.circle(0, 0, cursorRadius);
    this.cursorIndicator.stroke({ color: "#66ccff", width: 2 });
    this.cursorIndicator.circle(0, 0, 3);
    this.cursorIndicator.fill({ color: "#66ccff" });
    this.cursorIndicator.position.set(
      this.lastValidPointerPos.x,
      this.lastValidPointerPos.y,
    );
  }

  private destroyIndicators(): void {
    this.radiusIndicator?.destroy();
    this.cursorIndicator?.destroy();
    this.radiusIndicator = null;
    this.cursorIndicator = null;
  }

  override getStatus(
    playerState: PlayerState,
    playerLevel: number,
  ): SkillStatus {
    if (this._isTargeting) return SkillStatus.Active;
    return super.getStatus(playerState, playerLevel);
  }

  override reset(): void {
    super.reset();
    this._isTargeting = false;
    this.targetingTimer = 0;
    this.destroyIndicators();
  }

  destroy(): void {
    this.destroyIndicators();
  }
}
