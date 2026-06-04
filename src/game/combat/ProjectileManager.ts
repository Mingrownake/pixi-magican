import { Container, Graphics } from "pixi.js";
import type { Vec2 } from "../../core/math/Vec2";
import { vec2Scale, vec2Add, vec2DistanceSquared } from "../../core/math/Vec2";

interface Projectile {
  position: Vec2;
  direction: Vec2;
  speed: number;
  damage: number;
  radius: number;
  lifetime: number;
}

export class ProjectileManager {
  private projectiles: Projectile[] = [];
  private graphics: Graphics[] = [];
  private container: Container;

  constructor(container: Container) {
    this.container = container;
  }

  spawn(position: Vec2, direction: Vec2, speed: number, damage: number, radius: number, maxLifetime: number): void {
    this.projectiles.push({
      position: { x: position.x, y: position.y },
      direction: { x: direction.x, y: direction.y },
      speed,
      damage,
      radius,
      lifetime: maxLifetime,
    });
  }

  update(dt: number): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.lifetime -= dt;
      const velocity = vec2Scale(p.direction, p.speed * dt);
      p.position = vec2Add(p.position, velocity);
      if (p.lifetime <= 0) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  checkCollisionWithPlayer(playerPos: Vec2, playerRadius: number): number {
    let damage = 0;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const combinedRadius = p.radius + playerRadius;
      if (vec2DistanceSquared(p.position, playerPos) <= combinedRadius * combinedRadius) {
        damage += p.damage;
        this.projectiles.splice(i, 1);
      }
    }
    return damage;
  }

  render(): void {
    for (const g of this.graphics) {
      g.destroy();
    }
    this.graphics = [];

    for (const p of this.projectiles) {
      const g = new Graphics();
      g.circle(0, 0, p.radius);
      g.fill({ color: "#ffff44" });
      g.stroke({ color: "#ffcc00", width: 1 });
      g.position.set(p.position.x, p.position.y);
      this.container.addChild(g);
      this.graphics.push(g);
    }
  }

  reset(): void {
    this.projectiles = [];
    this.clearGraphics();
  }

  private clearGraphics(): void {
    for (const g of this.graphics) {
      g.destroy();
    }
    this.graphics = [];
  }

  destroy(): void {
    this.clearGraphics();
  }
}
