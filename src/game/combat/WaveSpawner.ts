import type { Vec2 } from "../../core/math/Vec2";
import { randomRange } from "../../core/math/MathUtils";
import type { EnemyType } from "../../game/config/EnemyConfig";
import type { EnemyManager } from "../../entities/enemies/EnemyManager";
import type { ArenaBounds } from "../../entities/player/Player";

export interface SpawnWaveConfig {
  enemyTypes: EnemyType[];
  baseCount: number;
  spawnInterval: number;
}

const defaultWave: SpawnWaveConfig = {
  enemyTypes: ["warrior", "fast_warrior"],
  baseCount: 3,
  spawnInterval: 2.5,
};

export class WaveSpawner {
  private enemyManager: EnemyManager;
  private arenaBounds: ArenaBounds;
  private spawnTimer: number;
  private gameTime = 0;
  private config: SpawnWaveConfig;
  private bossActive = false;

  constructor(
    enemyManager: EnemyManager,
    arenaBounds: ArenaBounds,
    config?: SpawnWaveConfig,
  ) {
    this.enemyManager = enemyManager;
    this.arenaBounds = arenaBounds;
    this.config = config ?? defaultWave;
    this.spawnTimer = 1;
  }

  setBossActive(active: boolean): void {
    this.bossActive = active;
  }

  update(dt: number): void {
    this.gameTime += dt;

    if (this.bossActive) return;

    this.spawnTimer -= dt;

    if (this.spawnTimer <= 0) {
      this.spawnWave();
      this.spawnTimer = this.currentInterval;
    }
  }

  private get currentInterval(): number {
    const speedUp = Math.min(this.gameTime / 120, 0.6);
    return Math.max(0.8, this.config.spawnInterval * (1 - speedUp));
  }

  private get currentCount(): number {
    const ramp = Math.floor(this.gameTime / 30);
    return this.config.baseCount + ramp;
  }

  private spawnWave(): void {
    const count = this.currentCount;
    for (let i = 0; i < count; i++) {
      const type = this.pickEnemyType();
      const pos = this.randomSpawnPosition();
      this.enemyManager.spawnEnemy(type, pos);
    }
  }

  private pickEnemyType(): EnemyType {
    const types = [...this.config.enemyTypes];

    if (this.gameTime > 30) {
      types.push("shooter");
    }
    if (this.gameTime > 60) {
      types.push("grenade_thrower");
      types.push("molotov_thrower");
    }
    if (this.gameTime > 90) {
      types.push("summoner_mage", "healer_mage", "teleport_mage");
    }

    return types[Math.floor(Math.random() * types.length)];
  }

  private randomSpawnPosition(): Vec2 {
    const b = this.arenaBounds;
    const side = Math.floor(Math.random() * 4);
    const offset = 30;

    switch (side) {
      case 0:
        return {
          x: randomRange(b.x + offset, b.x + b.width - offset),
          y: b.y + offset,
        };
      case 1:
        return {
          x: randomRange(b.x + offset, b.x + b.width - offset),
          y: b.y + b.height - offset,
        };
      case 2:
        return {
          x: b.x + offset,
          y: randomRange(b.y + offset, b.y + b.height - offset),
        };
      default:
        return {
          x: b.x + b.width - offset,
          y: randomRange(b.y + offset, b.y + b.height - offset),
        };
    }
  }

  reset(): void {
    this.spawnTimer = 1;
    this.gameTime = 0;
  }
}
