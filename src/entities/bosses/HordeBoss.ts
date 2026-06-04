import type { Container } from "pixi.js";
import type { Vec2 } from "../../core/math/Vec2";
import { vec2FromAngle } from "../../core/math/Vec2";
import { Boss } from "./Boss";
import type { HordeBossConfig } from "../../game/config/BossConfig";
import type { ArenaBounds } from "../player/Player";
import type { EnemyType } from "../../game/config/EnemyConfig";

export const HordeBossEvents = {
  HORDE_WAVE: "horde_boss:wave",
} as const;

export interface HordeWaveData {
  positions: Vec2[];
  type: EnemyType;
}

export class HordeBoss extends Boss {
  private hordeConfig: HordeBossConfig;
  private waveTimer: number;
  private wavesSpawned = 0;

  constructor(
    config: HordeBossConfig,
    parentContainer: Container,
    id: number,
  ) {
    super(config, parentContainer, id, 0, 0, 0);
    this.hordeConfig = config;
    this.waveTimer = config.waveInterval * 0.3;
  }

  override update(dt: number, playerPos: Vec2, arenaBounds: ArenaBounds): void {
    if (!this.state.alive) return;
    this.contactDamageTimer = Math.max(0, this.contactDamageTimer - dt);
    this.waveTimer = Math.max(0, this.waveTimer - dt);

    this.moveToward(dt, playerPos);
    this.clampToArena(arenaBounds);
    this.visual.updatePosition(this.state.position);
    this.visual.update(dt);

    if (this.waveTimer <= 0 && this.wavesSpawned < this.hordeConfig.totalWaves) {
      this.spawnHordeWave();
      this.wavesSpawned++;
      this.waveTimer = this.hordeConfig.waveInterval;
    }
  }

  private spawnHordeWave(): void {
    const positions: Vec2[] = [];
    for (let i = 0; i < this.hordeConfig.waveSize; i++) {
      const angle = (Math.PI * 2 * i) / this.hordeConfig.waveSize;
      const offset = vec2FromAngle(angle, this.hordeConfig.spawnRadius);
      positions.push({
        x: this.state.position.x + offset.x,
        y: this.state.position.y + offset.y,
      });
    }

    this.events.emit<HordeWaveData>(HordeBossEvents.HORDE_WAVE, {
      positions,
      type: this.hordeConfig.hordeEnemyType,
    });
  }
}
