import type { Container } from "pixi.js";
import type { Vec2 } from "../../core/math/Vec2";
import { vec2FromAngle } from "../../core/math/Vec2";
import { MageEnemy } from "./MageEnemy";
import type { SummonerMageConfig, EnemyType } from "../../game/config/EnemyConfig";
import type { ArenaBounds } from "../player/Player";

export const SummonerEvents = {
  WARRIORS_SUMMONED: "summoner:warriors_summoned",
} as const;

export interface SummonedWarriorData {
  positions: Vec2[];
  type: EnemyType;
}

export class SummonerMageEnemy extends MageEnemy {
  private summonerConfig: SummonerMageConfig;

  constructor(
    config: SummonerMageConfig,
    parentContainer: Container,
    id: number,
  ) {
    super(config, parentContainer, id, config.summonInterval, config.preferredDistance);
    this.summonerConfig = config;
  }

  protected performAbility(
    _playerPos: Vec2,
    _arenaBounds: ArenaBounds,
  ): void {
    const positions: Vec2[] = [];
    for (let i = 0; i < this.summonerConfig.summonCount; i++) {
      const angle = (Math.PI * 2 * i) / this.summonerConfig.summonCount;
      const offset = vec2FromAngle(angle, this.summonerConfig.summonRadius);
      positions.push({
        x: this.state.position.x + offset.x,
        y: this.state.position.y + offset.y,
      });
    }

    this.events.emit<SummonedWarriorData>(
      SummonerEvents.WARRIORS_SUMMONED,
      { positions, type: this.summonerConfig.summonType },
    );
  }
}
