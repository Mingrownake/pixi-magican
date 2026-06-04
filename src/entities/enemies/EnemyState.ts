import type { Vec2 } from "../../core/math/Vec2";
import { vec2Zero } from "../../core/math/Vec2";
import type { BaseEnemyConfig } from "../../game/config/EnemyConfig";

export class EnemyState {
  hp: number;
  maxHp: number;
  position: Vec2;
  alive: boolean;

  constructor(config: BaseEnemyConfig) {
    this.maxHp = config.maxHp;
    this.hp = config.maxHp;
    this.position = vec2Zero();
    this.alive = true;
  }

  takeDamage(amount: number): number {
    if (!this.alive || amount <= 0) return 0;
    const actual = Math.min(amount, this.hp);
    this.hp -= actual;
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
    }
    return actual;
  }

  heal(amount: number): number {
    if (!this.alive || amount <= 0) return 0;
    const actual = Math.min(amount, this.maxHp - this.hp);
    this.hp += actual;
    return actual;
  }

  get hpFraction(): number {
    return this.maxHp > 0 ? this.hp / this.maxHp : 0;
  }
}
