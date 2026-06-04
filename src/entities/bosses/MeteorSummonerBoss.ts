import type { Container } from "pixi.js";
import type { Vec2 } from "../../core/math/Vec2";
import { vec2Subtract, vec2Normalize, vec2Scale, vec2Add, vec2Distance } from "../../core/math/Vec2";
import { Enemy } from "../enemies/Enemy";
import type { MeteorSummonerBossConfig } from "../../game/config/BossConfig";
import type { ArenaBounds } from "../player/Player";
import type { EnemyType } from "../../game/config/EnemyConfig";

export const MeteorBossEvents = {
  METEOR_SUMMONED: "meteor_boss:meteor_summoned",
  METEOR_IMPACT: "meteor_boss:meteor_impact",
  WARRIORS_SUMMONED: "meteor_boss:warriors_summoned",
} as const;

export interface MeteorSummonedData {
  position: Vec2;
  warningDuration: number;
  impactRadius: number;
  impactDamage: number;
  summonCount: number;
  summonType: EnemyType;
}

export interface MeteorImpactData {
  position: Vec2;
  radius: number;
  damage: number;
  summonCount: number;
  summonType: EnemyType;
}

export interface MeteorWarriorsData {
  positions: Vec2[];
  type: EnemyType;
}

export class MeteorSummonerBoss extends Enemy {
  private meteorConfig: MeteorSummonerBossConfig;
  private castTimer: number;
  private preferredDistance: number;

  constructor(
    config: MeteorSummonerBossConfig,
    parentContainer: Container,
    _visualContainer: Container,
    id: number,
  ) {
    super(config as any, parentContainer, id);
    this.meteorConfig = config;
    this.castTimer = config.castCooldown * 0.5;
    this.preferredDistance = config.preferredDistance;
  }

  override update(dt: number, playerPos: Vec2, arenaBounds: ArenaBounds): void {
    if (!this.state.alive) return;
    this.contactDamageTimer = Math.max(0, this.contactDamageTimer - dt);
    this.castTimer = Math.max(0, this.castTimer - dt);

    this.moveKeepingDistance(dt, playerPos);
    this.clampToArena(arenaBounds);
    this.visual.updatePosition(this.state.position);
    this.visual.update(dt);

    if (this.castTimer <= 0) {
      this.summonMeteors(playerPos);
      this.castTimer = this.meteorConfig.castCooldown;
    }
  }

  private moveKeepingDistance(dt: number, playerPos: Vec2): void {
    const dist = vec2Distance(this.state.position, playerPos);
    const dir = vec2Subtract(playerPos, this.state.position);
    const normalized = vec2Normalize(dir);

    if (dist > this.preferredDistance + 40) {
      const displacement = vec2Scale(normalized, this.config.speed * dt);
      this.state.position = vec2Add(this.state.position, displacement);
    } else if (dist < this.preferredDistance - 40) {
      const displacement = vec2Scale(normalized, -this.config.speed * dt);
      this.state.position = vec2Add(this.state.position, displacement);
    }
  }

  private summonMeteors(playerPos: Vec2): void {
    for (let i = 0; i < this.meteorConfig.meteorCount; i++) {
      const offsetX = (Math.random() - 0.5) * 200;
      const offsetY = (Math.random() - 0.5) * 200;
      const targetPos = {
        x: playerPos.x + offsetX,
        y: playerPos.y + offsetY,
      };

      this.events.emit<MeteorSummonedData>(MeteorBossEvents.METEOR_SUMMONED, {
        position: targetPos,
        warningDuration: this.meteorConfig.warningDuration,
        impactRadius: this.meteorConfig.impactRadius,
        impactDamage: this.meteorConfig.impactDamage,
        summonCount: this.meteorConfig.summonCount,
        summonType: "warrior",
      });
    }
  }
}
