import type { Container } from "pixi.js";
import { Enemy } from "./Enemy";
import type { WarriorEnemyConfig } from "../../game/config/EnemyConfig";

export class WarriorEnemy extends Enemy {
  constructor(
    config: WarriorEnemyConfig,
    parentContainer: Container,
    id: number,
  ) {
    super(config, parentContainer, id);
  }
}
