import { Container, Graphics } from "pixi.js";
import type { Vec2 } from "../../core/math/Vec2";
import { clamp } from "../../core/math/MathUtils";
import { randomRange } from "../../core/math/MathUtils";
import { MageEnemy } from "./MageEnemy";
import type { TeleportMageConfig } from "../../game/config/EnemyConfig";
import type { ArenaBounds } from "../player/Player";

export class TeleportMageEnemy extends MageEnemy {
  private teleportConfig: TeleportMageConfig;
  private teleporting = false;
  private teleportTimer = 0;
  private teleportTarget: Vec2 = { x: 0, y: 0 };
  private indicator: Graphics | null = null;
  private visualContainer: Container;

  constructor(
    config: TeleportMageConfig,
    parentContainer: Container,
    visualContainer: Container,
    id: number,
  ) {
    super(config, parentContainer, id, config.teleportCooldown, config.preferredDistance);
    this.teleportConfig = config;
    this.visualContainer = visualContainer;
  }

  protected performAbility(
    playerPos: Vec2,
    arenaBounds: ArenaBounds,
  ): void {
    if (this.teleporting) return;

    const angle = randomRange(0, Math.PI * 2);
    const dist = randomRange(
      this.teleportConfig.teleportRange * 0.5,
      this.teleportConfig.teleportRange,
    );
    let tx = playerPos.x + Math.cos(angle) * dist;
    let ty = playerPos.y + Math.sin(angle) * dist;

    tx = clamp(tx, arenaBounds.x + 20, arenaBounds.x + arenaBounds.width - 20);
    ty = clamp(ty, arenaBounds.y + 20, arenaBounds.y + arenaBounds.height - 20);

    this.teleportTarget = { x: tx, y: ty };
    this.teleporting = true;
    this.teleportTimer = this.teleportConfig.warningDuration;

    this.indicator = new Graphics();
    this.visualContainer.addChild(this.indicator);
  }

  override update(dt: number, playerPos: Vec2, arenaBounds: ArenaBounds): void {
    if (!this.state.alive) return;

    if (this.teleporting) {
      this.teleportTimer -= dt;
      this.updateIndicator();

      if (this.teleportTimer <= 0) {
        this.state.position = {
          x: this.teleportTarget.x,
          y: this.teleportTarget.y,
        };
        this.visual.updatePosition(this.state.position);
        this.teleporting = false;
        if (this.indicator) {
          this.indicator.destroy();
          this.indicator = null;
        }
      }
      return;
    }

    super.update(dt, playerPos, arenaBounds);
  }

  private updateIndicator(): void {
    if (!this.indicator) return;
    const progress = clamp(
      this.teleportTimer / this.teleportConfig.warningDuration,
      0,
      1,
    );
    const innerRadius = 20 * progress;

    this.indicator.clear();
    this.indicator.circle(0, 0, 20);
    this.indicator.stroke({ color: "#4488ff", width: 2, alpha: 0.7 });
    this.indicator.circle(0, 0, innerRadius);
    this.indicator.fill({ color: "#4488ff", alpha: 0.3 });
    this.indicator.position.set(
      this.teleportTarget.x,
      this.teleportTarget.y,
    );
  }

  override destroy(): void {
    if (this.indicator) {
      this.indicator.destroy();
      this.indicator = null;
    }
    super.destroy();
  }
}
