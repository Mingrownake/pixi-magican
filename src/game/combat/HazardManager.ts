import { Container, Graphics } from "pixi.js";
import type { Vec2 } from "../../core/math/Vec2";
import { vec2DistanceSquared } from "../../core/math/Vec2";
import { clamp } from "../../core/math/MathUtils";

interface FireZone {
  position: Vec2;
  radius: number;
  damagePerSecond: number;
  duration: number;
  maxDuration: number;
  damageTickTimer: number;
  graphics: Graphics;
}

interface GrenadeIndicator {
  position: Vec2;
  outerRadius: number;
  fuseDuration: number;
  maxFuseDuration: number;
  damage: number;
  graphics: Graphics;
  onExplode: () => void;
}

interface ExplosionVisual {
  graphics: Graphics;
  timer: number;
  maxTimer: number;
  radius: number;
}

export class HazardManager {
  private fireZones: FireZone[] = [];
  private grenadeIndicators: GrenadeIndicator[] = [];
  private explosionVisuals: ExplosionVisual[] = [];
  private container: Container;

  constructor(container: Container) {
    this.container = container;
  }

  spawnGrenade(
    targetPos: Vec2,
    radius: number,
    damage: number,
    fuseDuration: number,
  ): void {
    const g = new Graphics();
    g.position.set(targetPos.x, targetPos.y);
    this.container.addChild(g);

    this.grenadeIndicators.push({
      position: { x: targetPos.x, y: targetPos.y },
      outerRadius: radius,
      fuseDuration,
      maxFuseDuration: fuseDuration,
      damage,
      graphics: g,
      onExplode: () => {
        this.spawnExplosionVisual(targetPos, radius);
      },
    });
  }

  spawnMolotov(
    targetPos: Vec2,
    radius: number,
    damage: number,
    fuseDuration: number,
    fireDuration: number,
    fireDps: number,
  ): void {
    const g = new Graphics();
    g.position.set(targetPos.x, targetPos.y);
    this.container.addChild(g);

    this.grenadeIndicators.push({
      position: { x: targetPos.x, y: targetPos.y },
      outerRadius: radius,
      fuseDuration,
      maxFuseDuration: fuseDuration,
      damage,
      graphics: g,
      onExplode: () => {
        this.spawnExplosionVisual(targetPos, radius);
        this.spawnFireZone(targetPos, radius, fireDps, fireDuration);
      },
    });
  }

  private spawnFireZone(
    pos: Vec2,
    radius: number,
    damagePerSecond: number,
    duration: number,
  ): void {
    const g = new Graphics();
    g.position.set(pos.x, pos.y);
    this.container.addChild(g);

    this.fireZones.push({
      position: { x: pos.x, y: pos.y },
      radius,
      damagePerSecond,
      duration,
      maxDuration: duration,
      damageTickTimer: 0,
      graphics: g,
    });
  }

  private spawnExplosionVisual(pos: Vec2, radius: number): void {
    const g = new Graphics();
    g.position.set(pos.x, pos.y);
    this.container.addChild(g);
    this.explosionVisuals.push({
      graphics: g,
      timer: 0.3,
      maxTimer: 0.3,
      radius,
    });
  }

  update(dt: number, playerPos: Vec2, playerRadius: number, onPlayerDamage: (amount: number) => void): void {
    this.updateGrenadeIndicators(dt);
    this.updateFireZones(dt, playerPos, playerRadius, onPlayerDamage);
    this.updateExplosionVisuals(dt);
  }

  private updateGrenadeIndicators(dt: number): void {
    for (let i = this.grenadeIndicators.length - 1; i >= 0; i--) {
      const gi = this.grenadeIndicators[i];
      gi.fuseDuration -= dt;

      const progress = clamp(1 - gi.fuseDuration / gi.maxFuseDuration, 0, 1);
      const innerRadius = gi.outerRadius * (1 - progress);

      gi.graphics.clear();
      gi.graphics.circle(0, 0, gi.outerRadius);
      gi.graphics.stroke({ color: "#ff4444", width: 2, alpha: 0.5 });
      gi.graphics.circle(0, 0, innerRadius);
      gi.graphics.fill({ color: "#ff4444", alpha: 0.2 });

      if (gi.fuseDuration <= 0) {
        gi.onExplode();
        gi.graphics.destroy();
        this.grenadeIndicators.splice(i, 1);
      }
    }
  }

  private updateFireZones(
    dt: number,
    playerPos: Vec2,
    playerRadius: number,
    onPlayerDamage: (amount: number) => void,
  ): void {
    for (let i = this.fireZones.length - 1; i >= 0; i--) {
      const fz = this.fireZones[i];
      fz.duration -= dt;

      if (fz.duration <= 0) {
        fz.graphics.destroy();
        this.fireZones.splice(i, 1);
        continue;
      }

      fz.damageTickTimer -= dt;
      if (fz.damageTickTimer <= 0) {
        fz.damageTickTimer = 0.5;
        const combinedRadius = fz.radius + playerRadius;
        if (
          vec2DistanceSquared(fz.position, playerPos) <=
          combinedRadius * combinedRadius
        ) {
          onPlayerDamage(fz.damagePerSecond * 0.5);
        }
      }

      const lifeFraction = fz.duration / fz.maxDuration;
      const shrinkFactor = Math.min(1, lifeFraction * 2);
      const currentRadius = fz.radius * shrinkFactor;

      fz.graphics.clear();
      fz.graphics.circle(0, 0, currentRadius);
      fz.graphics.fill({ color: "#ff6600", alpha: 0.15 * lifeFraction });
      fz.graphics.circle(0, 0, currentRadius * 0.6);
      fz.graphics.fill({ color: "#ff3300", alpha: 0.25 * lifeFraction });
      fz.graphics.stroke({ color: "#ff8844", width: 1, alpha: 0.4 * lifeFraction });
    }
  }

  private updateExplosionVisuals(dt: number): void {
    for (let i = this.explosionVisuals.length - 1; i >= 0; i--) {
      const ev = this.explosionVisuals[i];
      ev.timer -= dt;
      const progress = clamp(1 - ev.timer / ev.maxTimer, 0, 1);
      const alpha = 1 - progress;
      const r = ev.radius * progress;

      ev.graphics.clear();
      ev.graphics.circle(0, 0, r);
      ev.graphics.fill({ color: "#ff8844", alpha: alpha * 0.4 });
      ev.graphics.stroke({ color: "#ffaa66", width: 2, alpha });

      if (ev.timer <= 0) {
        ev.graphics.destroy();
        this.explosionVisuals.splice(i, 1);
      }
    }
  }

  reset(): void {
    this.clearAll();
  }

  private clearAll(): void {
    for (const gi of this.grenadeIndicators) gi.graphics.destroy();
    for (const fz of this.fireZones) fz.graphics.destroy();
    for (const ev of this.explosionVisuals) ev.graphics.destroy();
    this.grenadeIndicators = [];
    this.fireZones = [];
    this.explosionVisuals = [];
  }

  destroy(): void {
    this.clearAll();
  }
}
