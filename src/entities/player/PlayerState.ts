import type { Vec2 } from "../../core/math/Vec2";
import { vec2Zero, vec2Clone } from "../../core/math/Vec2";
import type { PlayerConfig } from "../../game/config/PlayerConfig";

export class PlayerState {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  xp: number;
  level: number;
  position: Vec2;
  velocity: Vec2;
  alive: boolean;

  constructor(config: PlayerConfig, startLevel: number) {
    this.maxHp = config.maxHp;
    this.hp = config.maxHp;
    this.maxMp = config.maxMp;
    this.mp = config.maxMp;
    this.xp = 0;
    this.level = startLevel;
    this.position = vec2Zero();
    this.velocity = vec2Zero();
    this.alive = true;
  }

  get hpFraction(): number {
    return this.maxHp > 0 ? this.hp / this.maxHp : 0;
  }

  get mpFraction(): number {
    return this.maxMp > 0 ? this.mp / this.maxMp : 0;
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

  spendMana(amount: number): boolean {
    if (!this.alive || amount <= 0 || this.mp < amount) return false;
    this.mp -= amount;
    return true;
  }

  addMana(amount: number): number {
    if (!this.alive || amount <= 0) return 0;
    const actual = Math.min(amount, this.maxMp - this.mp);
    this.mp += actual;
    return actual;
  }

  addXp(amount: number): void {
    if (!this.alive || amount <= 0) return;
    this.xp += amount;
  }

  reset(config: PlayerConfig, startLevel: number, spawnPosition: Vec2): void {
    this.maxHp = config.maxHp;
    this.hp = config.maxHp;
    this.maxMp = config.maxMp;
    this.mp = config.maxMp;
    this.xp = 0;
    this.level = startLevel;
    this.position = vec2Clone(spawnPosition);
    this.velocity = vec2Zero();
    this.alive = true;
  }
}
