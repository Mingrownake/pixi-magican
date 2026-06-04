import type { Container } from "pixi.js";
import type { Vec2 } from "../../core/math/Vec2";
import { RangedEnemy } from "./RangedEnemy";
import type { MolotovThrowerConfig } from "../../game/config/EnemyConfig";

export const MolotovEvents = {
  MOLOTOV_THROWN: "molotov:thrown",
} as const;

export class MolotovThrowerEnemy extends RangedEnemy {
  private molotovConfig: MolotovThrowerConfig;

  constructor(
    config: MolotovThrowerConfig,
    parentContainer: Container,
    id: number,
  ) {
    super(config, parentContainer, id);
    this.molotovConfig = config;
  }

  protected performAttack(playerPos: Vec2): void {
    this.events.emit(MolotovEvents.MOLOTOV_THROWN, {
      targetPosition: { x: playerPos.x, y: playerPos.y },
      radius: this.molotovConfig.fireRadius,
      damage: this.molotovConfig.molotovDamage,
      fuseDuration: this.molotovConfig.fuseDuration,
      fireDuration: this.molotovConfig.fireDuration,
      fireDps: this.molotovConfig.fireDps,
    });
  }
}
