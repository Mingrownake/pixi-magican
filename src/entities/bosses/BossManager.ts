import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { GameEventEmitter } from "../../core/events/GameEventEmitter";
import type { Vec2 } from "../../core/math/Vec2";
import { vec2FromAngle } from "../../core/math/Vec2";
import type { ArenaBounds } from "../player/Player";
import type { EnemyManager } from "../enemies/EnemyManager";
import type {
  BaseBossConfig,
  BossType,
  AreaAttackBossConfig,
  TankBossConfig,
  HordeBossConfig,
  MeteorSummonerBossConfig,
} from "../../game/config/BossConfig";
import {
  areaAttackBossConfig,
  tankBossConfig,
  hordeBossConfig,
  meteorSummonerBossConfig,
} from "../../game/config/BossConfig";
import { Enemy } from "../enemies/Enemy";
import { EnemyEvents } from "../enemies/Enemy";
import type { EnemyDiedData } from "../enemies/Enemy";
import { AreaAttackBoss, AreaAttackBossEvents } from "./AreaAttackBoss";
import type { AreaDamageData } from "./AreaAttackBoss";
import { TankBoss } from "./TankBoss";
import { HordeBoss, HordeBossEvents } from "./HordeBoss";
import type { HordeWaveData } from "./HordeBoss";
import { MeteorSummonerBoss, MeteorBossEvents } from "./MeteorSummonerBoss";
import type { MeteorSummonedData } from "./MeteorSummonerBoss";
import { BossEvents } from "./Boss";
import type { SlamWarningData } from "./Boss";

export const BossManagerEvents = {
  BOSS_SPAWNED: "boss_manager:spawned",
  BOSS_DEFEATED: "boss_manager:defeated",
  PLAYER_DAMAGED: "boss_manager:player_damaged",
} as const;

export interface BossSpawnedData {
  name: string;
}

export interface BossDefeatedData {
  rewardXp: number;
}

export interface BossPlayerDamagedData {
  amount: number;
}

interface MeteorWarning {
  position: Vec2;
  timer: number;
  maxTimer: number;
  radius: number;
  damage: number;
  summonCount: number;
  summonType: "warrior" | "fast_warrior";
  graphics: Graphics;
  impacted: boolean;
}

interface SlamWarning {
  position: Vec2;
  timer: number;
  maxTimer: number;
  radius: number;
  damage: number;
  graphics: Graphics;
  impacted: boolean;
}

interface ImpactVisual {
  graphics: Graphics;
  timer: number;
  maxTimer: number;
  radius: number;
}

export class BossManager {
  private enemyManager: EnemyManager;
  private enemyContainer: Container;
  private effectContainer: Container;
  private uiContainer: Container;
  private arenaBounds: ArenaBounds;

  private activeBoss: Enemy | null = null;
  private gameTime = 0;
  private bossSpawned = false;
  private bossActive = false;
  private nextBossId = 10000;

  private hpBarBg: Graphics | null = null;
  private hpBarFill: Graphics | null = null;
  private hpBarBorder: Graphics | null = null;
  private nameLabel: Text | null = null;
  private warningLabel: Text | null = null;
  private warningTimer = 0;

  private meteorWarnings: MeteorWarning[] = [];
  private slamWarnings: SlamWarning[] = [];
  private impactVisuals: ImpactVisual[] = [];

  readonly events: GameEventEmitter;

  static readonly BOSS_SPAWN_TIME = 240;
  private static readonly HP_BAR_WIDTH = 400;
  private static readonly HP_BAR_HEIGHT = 20;
  private static readonly HP_BAR_Y = 50;

  private static readonly bossConfigs: Record<BossType, BaseBossConfig> = {
    area_attack_boss: areaAttackBossConfig,
    tank_boss: tankBossConfig,
    horde_boss: hordeBossConfig,
    meteor_summoner_boss: meteorSummonerBossConfig,
  };

  private static readonly bossNames: Record<BossType, string> = {
    area_attack_boss: "Inferno Warden",
    tank_boss: "Iron Colossus",
    horde_boss: "Swarm Commander",
    meteor_summoner_boss: "Astral Devastator",
  };

  constructor(
    enemyManager: EnemyManager,
    enemyContainer: Container,
    effectContainer: Container,
    uiContainer: Container,
    arenaBounds: ArenaBounds,
  ) {
    this.enemyManager = enemyManager;
    this.enemyContainer = enemyContainer;
    this.effectContainer = effectContainer;
    this.uiContainer = uiContainer;
    this.arenaBounds = arenaBounds;
    this.events = new GameEventEmitter();

    this.createBossHud();
  }

  private createBossHud(): void {
    const centerX = this.arenaBounds.x + this.arenaBounds.width / 2;
    const barW = BossManager.HP_BAR_WIDTH;
    const barH = BossManager.HP_BAR_HEIGHT;
    const barX = centerX - barW / 2;
    const barY = BossManager.HP_BAR_Y;

    this.hpBarBorder = new Graphics();
    this.hpBarBorder.rect(barX - 2, barY - 2, barW + 4, barH + 4);
    this.hpBarBorder.stroke({ color: "#ffaa00", width: 2 });
    this.hpBarBorder.visible = false;
    this.uiContainer.addChild(this.hpBarBorder);

    this.hpBarBg = new Graphics();
    this.hpBarBg.rect(barX, barY, barW, barH);
    this.hpBarBg.fill({ color: "#221111" });
    this.hpBarBg.visible = false;
    this.uiContainer.addChild(this.hpBarBg);

    this.hpBarFill = new Graphics();
    this.hpBarFill.visible = false;
    this.uiContainer.addChild(this.hpBarFill);

    this.nameLabel = new Text({
      text: "",
      style: new TextStyle({
        fontFamily: "Arial",
        fontSize: 16,
        fill: "#ffcc44",
        fontWeight: "bold",
      }),
    });
    this.nameLabel.anchor.set(0.5, 1);
    this.nameLabel.position.set(centerX, barY - 4);
    this.nameLabel.visible = false;
    this.uiContainer.addChild(this.nameLabel);

    this.warningLabel = new Text({
      text: "",
      style: new TextStyle({
        fontFamily: "Arial",
        fontSize: 22,
        fill: "#ff4444",
        fontWeight: "bold",
      }),
    });
    this.warningLabel.anchor.set(0.5, 0.5);
    this.warningLabel.position.set(centerX, this.arenaBounds.height / 2);
    this.warningLabel.visible = false;
    this.uiContainer.addChild(this.warningLabel);
  }

  update(dt: number): void {
    this.gameTime += dt;

    if (!this.bossSpawned && this.gameTime >= BossManager.BOSS_SPAWN_TIME) {
      this.spawnBossPhase();
    }

    if (this.warningTimer > 0) {
      this.warningTimer -= dt;
      if (this.warningLabel) {
        this.warningLabel.alpha = Math.floor(this.warningTimer * 3) % 2 === 0 ? 1 : 0.4;
      }
      if (this.warningTimer <= 0 && this.warningLabel) {
        this.warningLabel.visible = false;
      }
    }

    if (this.bossActive && this.activeBoss) {
      this.updateBossHud();
    }

    this.updateMeteorWarnings(dt);
    this.updateSlamWarnings(dt);
    this.updateImpactVisuals(dt);
  }

  private spawnBossPhase(): void {
    this.bossSpawned = true;

    if (this.warningLabel) {
      this.warningLabel.text = "BOSS APPROACHING!";
      this.warningLabel.visible = true;
      this.warningTimer = 3;
    }

    const types: BossType[] = [
      "area_attack_boss",
      "tank_boss",
      "horde_boss",
      "meteor_summoner_boss",
    ];
    const type = types[Math.floor(Math.random() * types.length)];
    const config = BossManager.bossConfigs[type];
    const name = BossManager.bossNames[type];

    const boss = this.createBoss(config, type);
    const spawnPos = this.getBossSpawnPosition();
    boss.setPosition(spawnPos);

    this.activeBoss = boss;
    this.bossActive = true;

    this.wireBossEvents(boss, type);
    this.enemyManager.registerExternalEnemy(boss);

    if (this.nameLabel) {
      this.nameLabel.text = name;
      this.nameLabel.visible = true;
    }
    if (this.hpBarBg) this.hpBarBg.visible = true;
    if (this.hpBarFill) this.hpBarFill.visible = true;
    if (this.hpBarBorder) this.hpBarBorder.visible = true;

    this.events.emit<BossSpawnedData>(BossManagerEvents.BOSS_SPAWNED, { name });
  }

  private getBossSpawnPosition(): Vec2 {
    const b = this.arenaBounds;
    const side = Math.floor(Math.random() * 4);
    const offset = 40;

    switch (side) {
      case 0:
        return { x: b.x + b.width / 2, y: b.y + offset };
      case 1:
        return { x: b.x + b.width / 2, y: b.y + b.height - offset };
      case 2:
        return { x: b.x + offset, y: b.y + b.height / 2 };
      default:
        return { x: b.x + b.width - offset, y: b.y + b.height / 2 };
    }
  }

  private createBoss(config: BaseBossConfig, type: BossType): Enemy {
    const id = this.nextBossId++;

    switch (type) {
      case "area_attack_boss":
        return new AreaAttackBoss(
          config as AreaAttackBossConfig,
          this.enemyContainer,
          this.effectContainer,
          id,
        );
      case "tank_boss":
        return new TankBoss(
          config as TankBossConfig,
          this.enemyContainer,
          id,
        );
      case "horde_boss":
        return new HordeBoss(
          config as HordeBossConfig,
          this.enemyContainer,
          id,
        );
      case "meteor_summoner_boss":
        return new MeteorSummonerBoss(
          config as MeteorSummonerBossConfig,
          this.enemyContainer,
          this.effectContainer,
          id,
        );
      default:
        return new Enemy(config as any, this.enemyContainer, id);
    }
  }

  private wireBossEvents(boss: Enemy, type: BossType): void {
    boss.events.on<EnemyDiedData>(EnemyEvents.DIED, () => {
      this.onBossDefeated(boss);
    });

    switch (type) {
      case "area_attack_boss":
        this.wireAreaAttackBoss(boss as AreaAttackBoss);
        break;
      case "tank_boss":
        this.wireTankBoss(boss as TankBoss);
        break;
      case "horde_boss":
        this.wireHordeBoss(boss as HordeBoss);
        break;
      case "meteor_summoner_boss":
        this.wireMeteorBoss(boss as MeteorSummonerBoss);
        break;
    }
  }

  private wireAreaAttackBoss(boss: AreaAttackBoss): void {
    boss.events.on<AreaDamageData>(AreaAttackBossEvents.AREA_DAMAGE, (data) => {
      this.spawnImpactVisual(data.position, data.radius);
      this.events.emit<BossPlayerDamagedData>(BossManagerEvents.PLAYER_DAMAGED, {
        amount: data.damage,
      });
    });
  }

  private wireTankBoss(boss: TankBoss): void {
    boss.events.on<SlamWarningData>(BossEvents.SLAM_WARNING, (data) => {
      this.spawnSlamWarning(data.position, data.radius, data.windupDuration, data.damage);
    });
  }

  private wireHordeBoss(boss: HordeBoss): void {
    boss.events.on<HordeWaveData>(HordeBossEvents.HORDE_WAVE, (data) => {
      for (const pos of data.positions) {
        this.enemyManager.spawnEnemy(data.type, pos);
      }
    });
  }

  private wireMeteorBoss(boss: MeteorSummonerBoss): void {
    boss.events.on<MeteorSummonedData>(MeteorBossEvents.METEOR_SUMMONED, (data) => {
      this.spawnMeteorWarning(
        data.position,
        data.warningDuration,
        data.impactRadius,
        data.impactDamage,
        data.summonCount,
        data.summonType as "warrior" | "fast_warrior",
      );
    });
  }

  private spawnMeteorWarning(
    position: Vec2,
    warningDuration: number,
    radius: number,
    damage: number,
    summonCount: number,
    summonType: "warrior" | "fast_warrior",
  ): void {
    const g = new Graphics();
    g.position.set(position.x, position.y);
    this.effectContainer.addChild(g);

    this.meteorWarnings.push({
      position: { x: position.x, y: position.y },
      timer: warningDuration,
      maxTimer: warningDuration,
      radius,
      damage,
      summonCount,
      summonType,
      graphics: g,
      impacted: false,
    });
  }

  private spawnSlamWarning(
    position: Vec2,
    radius: number,
    windupDuration: number,
    damage: number,
  ): void {
    const g = new Graphics();
    g.position.set(position.x, position.y);
    this.effectContainer.addChild(g);

    this.slamWarnings.push({
      position: { x: position.x, y: position.y },
      timer: windupDuration,
      maxTimer: windupDuration,
      radius,
      damage,
      graphics: g,
      impacted: false,
    });
  }

  private updateMeteorWarnings(dt: number): void {
    for (let i = this.meteorWarnings.length - 1; i >= 0; i--) {
      const mw = this.meteorWarnings[i];
      mw.timer -= dt;
      const progress = 1 - mw.timer / mw.maxTimer;

      mw.graphics.clear();
      mw.graphics.circle(0, 0, mw.radius);
      mw.graphics.stroke({ color: "#ff6600", width: 3, alpha: 0.3 + progress * 0.5 });
      mw.graphics.circle(0, 0, mw.radius * (1 - progress * 0.5));
      mw.graphics.fill({ color: "#ff4400", alpha: 0.1 + progress * 0.15 });

      const crossSize = 8;
      mw.graphics.moveTo(-crossSize, 0);
      mw.graphics.lineTo(crossSize, 0);
      mw.graphics.moveTo(0, -crossSize);
      mw.graphics.lineTo(0, crossSize);
      mw.graphics.stroke({ color: "#ff8844", width: 2, alpha: progress });

      if (mw.timer <= 0) {
        if (!mw.impacted) {
          mw.impacted = true;
          this.events.emit<BossPlayerDamagedData>(BossManagerEvents.PLAYER_DAMAGED, {
            amount: mw.damage,
          });

          this.spawnImpactVisual(mw.position, mw.radius);

          for (let j = 0; j < mw.summonCount; j++) {
            const angle = (Math.PI * 2 * j) / mw.summonCount;
            const offset = vec2FromAngle(angle, 30);
            this.enemyManager.spawnEnemy(mw.summonType, {
              x: mw.position.x + offset.x,
              y: mw.position.y + offset.y,
            });
          }
        }
        mw.graphics.destroy();
        this.meteorWarnings.splice(i, 1);
      }
    }
  }

  private updateSlamWarnings(dt: number): void {
    for (let i = this.slamWarnings.length - 1; i >= 0; i--) {
      const sw = this.slamWarnings[i];
      sw.timer -= dt;
      const progress = 1 - sw.timer / sw.maxTimer;

      sw.graphics.clear();
      sw.graphics.circle(0, 0, sw.radius);
      sw.graphics.stroke({ color: "#ffaa00", width: 3, alpha: 0.3 + progress * 0.5 });
      sw.graphics.circle(0, 0, sw.radius * progress);
      sw.graphics.fill({ color: "#ffcc44", alpha: 0.1 + progress * 0.2 });

      if (sw.timer <= 0) {
        if (!sw.impacted) {
          sw.impacted = true;
          this.events.emit<BossPlayerDamagedData>(BossManagerEvents.PLAYER_DAMAGED, {
            amount: sw.damage,
          });
          this.spawnImpactVisual(sw.position, sw.radius);
        }
        sw.graphics.destroy();
        this.slamWarnings.splice(i, 1);
      }
    }
  }

  private spawnImpactVisual(position: Vec2, radius: number): void {
    const g = new Graphics();
    g.position.set(position.x, position.y);
    this.effectContainer.addChild(g);

    this.impactVisuals.push({
      graphics: g,
      timer: 0.4,
      maxTimer: 0.4,
      radius,
    });
  }

  private updateImpactVisuals(dt: number): void {
    for (let i = this.impactVisuals.length - 1; i >= 0; i--) {
      const iv = this.impactVisuals[i];
      iv.timer -= dt;
      const progress = 1 - iv.timer / iv.maxTimer;
      const alpha = 1 - progress;
      const r = iv.radius * progress;

      iv.graphics.clear();
      iv.graphics.circle(0, 0, r);
      iv.graphics.fill({ color: "#ff8844", alpha: alpha * 0.4 });
      iv.graphics.stroke({ color: "#ffaa66", width: 2, alpha });

      if (iv.timer <= 0) {
        iv.graphics.destroy();
        this.impactVisuals.splice(i, 1);
      }
    }
  }

  private onBossDefeated(boss: Enemy): void {
    this.bossActive = false;
    this.activeBoss = null;

    if (this.hpBarBg) this.hpBarBg.visible = false;
    if (this.hpBarFill) this.hpBarFill.visible = false;
    if (this.hpBarBorder) this.hpBarBorder.visible = false;
    if (this.nameLabel) this.nameLabel.visible = false;

    if (this.warningLabel) {
      this.warningLabel.text = "BOSS DEFEATED!";
      this.warningLabel.visible = true;
      this.warningTimer = 2;
    }

    this.events.emit<BossDefeatedData>(BossManagerEvents.BOSS_DEFEATED, {
      rewardXp: boss.config.rewardXp,
    });
  }

  private updateBossHud(): void {
    if (!this.activeBoss || !this.hpBarFill) return;

    const centerX = this.arenaBounds.x + this.arenaBounds.width / 2;
    const barW = BossManager.HP_BAR_WIDTH;
    const barH = BossManager.HP_BAR_HEIGHT;
    const barX = centerX - barW / 2;
    const barY = BossManager.HP_BAR_Y;

    const fraction = this.activeBoss.state.hpFraction;
    const fillW = barW * fraction;

    this.hpBarFill.clear();
    this.hpBarFill.rect(barX, barY, fillW, barH);
    const color = fraction > 0.5 ? "#cc8800" : fraction > 0.25 ? "#cc4400" : "#cc0000";
    this.hpBarFill.fill({ color });
  }

  get isBossActive(): boolean {
    return this.bossActive;
  }

  get hasBossSpawned(): boolean {
    return this.bossSpawned;
  }

  setArenaBounds(bounds: ArenaBounds): void {
    this.arenaBounds = bounds;
  }

  reset(): void {
    this.gameTime = 0;
    this.bossSpawned = false;
    this.bossActive = false;
    this.activeBoss = null;
    this.warningTimer = 0;

    for (const mw of this.meteorWarnings) mw.graphics.destroy();
    for (const sw of this.slamWarnings) sw.graphics.destroy();
    for (const iv of this.impactVisuals) iv.graphics.destroy();
    this.meteorWarnings = [];
    this.slamWarnings = [];
    this.impactVisuals = [];

    if (this.hpBarBg) this.hpBarBg.visible = false;
    if (this.hpBarFill) {
      this.hpBarFill.visible = false;
      this.hpBarFill.clear();
    }
    if (this.hpBarBorder) this.hpBarBorder.visible = false;
    if (this.nameLabel) this.nameLabel.visible = false;
    if (this.warningLabel) this.warningLabel.visible = false;
  }

  destroy(): void {
    this.reset();
    this.hpBarBg?.destroy();
    this.hpBarFill?.destroy();
    this.hpBarBorder?.destroy();
    this.nameLabel?.destroy();
    this.warningLabel?.destroy();
    this.hpBarBg = null;
    this.hpBarFill = null;
    this.hpBarBorder = null;
    this.nameLabel = null;
    this.warningLabel = null;
    this.events.removeAll();
  }
}
