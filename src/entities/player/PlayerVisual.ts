import { Container, Graphics } from "pixi.js";
import type { Vec2 } from "../../core/math/Vec2";

export class PlayerVisual {
  readonly container: Container;
  private body: Graphics;
  private directionLine: Graphics;
  private radius: number;

  constructor(radius: number) {
    this.radius = radius;
    this.container = new Container();

    this.body = new Graphics();
    this.body.circle(0, 0, radius);
    this.body.fill({ color: "#6644cc" });
    this.body.stroke({ color: "#9977ff", width: 2 });
    this.container.addChild(this.body);

    this.directionLine = new Graphics();
    this.redrawDirection({ x: 1, y: 0 });
    this.container.addChild(this.directionLine);
  }

  updatePosition(pos: Vec2): void {
    this.container.position.set(pos.x, pos.y);
  }

  updateDirection(dir: Vec2): void {
    this.redrawDirection(dir);
  }

  private redrawDirection(dir: Vec2): void {
    this.directionLine.clear();
    const len = this.radius + 8;
    this.directionLine.moveTo(0, 0);
    this.directionLine.lineTo(dir.x * len, dir.y * len);
    this.directionLine.stroke({ color: "#ffcc44", width: 2 });
  }

  setAlpha(alpha: number): void {
    this.container.alpha = alpha;
  }

  destroy(): void {
    this.body.destroy();
    this.directionLine.destroy();
    this.container.destroy();
  }
}
