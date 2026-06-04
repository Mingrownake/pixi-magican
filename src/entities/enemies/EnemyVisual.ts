import { Container, Graphics } from "pixi.js";
import type { Vec2 } from "../../core/math/Vec2";
import type { EnemyType } from "../../game/config/EnemyConfig";

export class EnemyVisual {
  readonly container: Container;
  private body: Graphics;
  private hpBarBg: Graphics;
  private hpBarFill: Graphics;
  private hpBarVisible = false;
  private hpBarFadeTimer = 0;
  private flashTimer = 0;
  private radius: number;
  private enemyType: EnemyType;

  private static readonly HP_BAR_SHOW_DURATION = 2;
  private static readonly HP_BAR_WIDTH = 24;
  private static readonly HP_BAR_HEIGHT = 3;
  private static readonly FLASH_DURATION = 0.1;

  constructor(radius: number, type: EnemyType) {
    this.radius = radius;
    this.enemyType = type;
    this.container = new Container();

    this.body = new Graphics();
    this.drawBody();
    this.container.addChild(this.body);

    this.hpBarBg = new Graphics();
    this.hpBarFill = new Graphics();
    this.hpBarBg.visible = false;
    this.hpBarFill.visible = false;
    this.container.addChild(this.hpBarBg);
    this.container.addChild(this.hpBarFill);
  }

  private drawBody(): void {
    this.body.clear();
    switch (this.enemyType) {
      case "warrior":
        this.body.circle(0, 0, this.radius);
        this.body.fill({ color: "#cc3333" });
        this.body.stroke({ color: "#ff5555", width: 2 });
        break;
      case "fast_warrior":
        this.body.circle(0, 0, this.radius);
        this.body.fill({ color: "#ff6633" });
        this.body.stroke({ color: "#ff8855", width: 2 });
        break;
      case "shooter":
        this.body.circle(0, 0, this.radius);
        this.body.fill({ color: "#33cc33" });
        this.body.stroke({ color: "#55ff55", width: 2 });
        this.body.moveTo(this.radius, 0);
        this.body.lineTo(this.radius + 6, 0);
        this.body.stroke({ color: "#88ff88", width: 2 });
        break;
      case "grenade_thrower":
        this.body.circle(0, 0, this.radius);
        this.body.fill({ color: "#cc8833" });
        this.body.stroke({ color: "#ffaa55", width: 2 });
        break;
      case "molotov_thrower":
        this.body.circle(0, 0, this.radius);
        this.body.fill({ color: "#884422" });
        this.body.stroke({ color: "#aa6644", width: 2 });
        break;
      case "summoner_mage":
        this.body.circle(0, 0, this.radius);
        this.body.fill({ color: "#9933cc" });
        this.body.stroke({ color: "#bb55ff", width: 2 });
        break;
      case "healer_mage":
        this.body.circle(0, 0, this.radius);
        this.body.fill({ color: "#33cc66" });
        this.body.stroke({ color: "#55ff88", width: 2 });
        break;
      case "teleport_mage":
        this.body.circle(0, 0, this.radius);
        this.body.fill({ color: "#3366cc" });
        this.body.stroke({ color: "#5588ff", width: 2 });
        break;
    }
  }

  updatePosition(pos: Vec2): void {
    this.container.position.set(pos.x, pos.y);
  }

  showDamageFlash(): void {
    this.flashTimer = EnemyVisual.FLASH_DURATION;
    this.body.alpha = 0.5;
  }

  showHpBar(): void {
    this.hpBarVisible = true;
    this.hpBarFadeTimer = EnemyVisual.HP_BAR_SHOW_DURATION;
    this.hpBarBg.visible = true;
    this.hpBarFill.visible = true;
  }

  updateHpBar(hpFraction: number): void {
    if (!this.hpBarVisible) return;

    const barWidth = EnemyVisual.HP_BAR_WIDTH;
    const barHeight = EnemyVisual.HP_BAR_HEIGHT;
    const barY = -this.radius - 8;

    this.hpBarBg.clear();
    this.hpBarBg.rect(-barWidth / 2, barY, barWidth, barHeight);
    this.hpBarBg.fill({ color: "#331111" });
    this.hpBarBg.stroke({ color: "#553333", width: 0.5 });

    this.hpBarFill.clear();
    const fillW = barWidth * hpFraction;
    this.hpBarFill.rect(-barWidth / 2, barY, fillW, barHeight);
    this.hpBarFill.fill({ color: "#cc3333" });
  }

  update(dt: number): void {
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      if (this.flashTimer <= 0) {
        this.body.alpha = 1;
      }
    }

    if (this.hpBarVisible) {
      this.hpBarFadeTimer -= dt;
      if (this.hpBarFadeTimer <= 0) {
        this.hpBarVisible = false;
        this.hpBarBg.visible = false;
        this.hpBarFill.visible = false;
      }
    }
  }

  destroy(): void {
    this.body.destroy();
    this.hpBarBg.destroy();
    this.hpBarFill.destroy();
    this.container.destroy();
  }
}
