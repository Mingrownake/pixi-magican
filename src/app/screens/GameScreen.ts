import { Application, Graphics, Text, TextStyle } from "pixi.js";
import { Screen } from "./Screen";
import { InputManager } from "../../input/InputManager";
import { GameLoop } from "../loop/GameLoop";
import { GameState, GameStateManager } from "../../game/state/GameState";
import { TimeScale } from "../../core/time/TimeScale";
import {
  Player,
  type PlayerDamagedData,
  type PlayerLevelChangedData,
} from "../../entities/player/Player";
import { xpRequiredForLevel, xpConfig } from "../../game/config/XpConfig";
import { playerConfig } from "../../game/config/PlayerConfig";
import { SkillController } from "../../skills/SkillController";
import { SkillStatus } from "../../skills/Skill";
import { EnemyManager, EnemyManagerEvents } from "../../entities/enemies/EnemyManager";
import type { EnemyKilledData, PlayerDamagedByEnemyData } from "../../entities/enemies/EnemyManager";
import { WaveSpawner } from "../../game/combat/WaveSpawner";
import { BossManager, BossManagerEvents } from "../../entities/bosses/BossManager";
import type { BossSpawnedData, BossDefeatedData, BossPlayerDamagedData } from "../../entities/bosses/BossManager";
import { vec2DistanceSquared, type Vec2 } from "../../core/math/Vec2";

export class GameScreen extends Screen {
  private app: Application;
  private input: InputManager;
  private gameLoop: GameLoop;
  private gameState: GameStateManager;
  private timeScale: TimeScale;
  private player: Player | null = null;
  private skillController: SkillController | null = null;
  private enemyManager: EnemyManager | null = null;
  private waveSpawner: WaveSpawner | null = null;
  private bossManager: BossManager | null = null;

  private stateLabel: Text | null = null;
  private fpsLabel: Text | null = null;
  private controlsLabel: Text | null = null;
  private titleLabel: Text | null = null;
  private arenaBorder: Graphics | null = null;

  private hpLabel: Text | null = null;
  private mpLabel: Text | null = null;
  private levelLabel: Text | null = null;
  private xpBarBg: Graphics | null = null;
  private xpBarFill: Graphics | null = null;
  private xpLabel: Text | null = null;
  private hpBarBg: Graphics | null = null;
  private hpBarFill: Graphics | null = null;
  private mpBarBg: Graphics | null = null;
  private mpBarFill: Graphics | null = null;

  private dashSkillLabel: Text | null = null;
  private teleportSkillLabel: Text | null = null;
  private explosionSkillLabel: Text | null = null;

  private enemyCountLabel: Text | null = null;
  private killCountLabel: Text | null = null;
  private bossCountLabel: Text | null = null;

  private levelUpTimer: ReturnType<typeof setTimeout> | null = null;

  private tickerUpdate:
    | ((ticker: { deltaTime: number; elapsedMS: number }) => void)
    | null = null;
  private canvas: HTMLElement;

  constructor(app: Application) {
    super();
    this.app = app;
    this.canvas = app.canvas;
    this.timeScale = new TimeScale();
    this.gameLoop = new GameLoop(60, this.timeScale);
    this.gameState = new GameStateManager();
    this.input = new InputManager(this.canvas);
  }

  init(): void {
    const margin = 40;
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    const arenaBounds = {
      x: margin,
      y: margin,
      width: w - margin * 2,
      height: h - margin * 2,
    };

    this.createArenaVisual(margin, w, h);

    this.player = new Player(this.container, undefined, arenaBounds);

    this.skillController = new SkillController(
      this.container,
      this.timeScale,
      this.gameState,
      arenaBounds,
      (pos) => this.player?.teleportTo(pos),
    );
    this.player.setSkillController(this.skillController);

    this.enemyManager = new EnemyManager(
      this.container,
      this.container,
      arenaBounds,
    );
    this.enemyManager.wireExplosions(this.skillController);

    this.waveSpawner = new WaveSpawner(
      this.enemyManager,
      arenaBounds,
    );

    this.bossManager = new BossManager(
      this.enemyManager,
      this.container,
      this.container,
      this.container,
      arenaBounds,
    );
    this.wireBossEvents();

    this.createLabels(w);
    this.createHud(h);
    this.createSkillHud(h);
    this.createCombatHud(w);
    this.wireSystems();
    this.updateHud();
    this.gameState.setState(GameState.Playing);
  }

  private createArenaVisual(margin: number, w: number, h: number): void {
    this.arenaBorder = new Graphics();
    this.arenaBorder.rect(margin, margin, w - margin * 2, h - margin * 2);
    this.arenaBorder.stroke({ color: "#334455", width: 2 });
    this.container.addChild(this.arenaBorder);
  }

  private createLabels(w: number): void {
    this.titleLabel = new Text({
      text: "Mage Arena",
      style: new TextStyle({
        fontFamily: "Arial",
        fontSize: 28,
        fill: "#aaccff",
        fontWeight: "bold",
      }),
    });
    this.titleLabel.anchor.set(0.5, 0);
    this.titleLabel.position.set(w / 2, 8);
    this.container.addChild(this.titleLabel);

    this.stateLabel = new Text({
      text: "State: Playing",
      style: new TextStyle({
        fontFamily: "Arial",
        fontSize: 16,
        fill: "#88ff88",
      }),
    });
    this.stateLabel.anchor.set(1, 0);
    this.stateLabel.position.set(w - 20, 10);
    this.container.addChild(this.stateLabel);

    this.fpsLabel = new Text({
      text: "FPS: 0",
      style: new TextStyle({
        fontFamily: "Arial",
        fontSize: 14,
        fill: "#ffff88",
      }),
    });
    this.fpsLabel.anchor.set(1, 0);
    this.fpsLabel.position.set(w - 20, 32);
    this.container.addChild(this.fpsLabel);

    this.controlsLabel = new Text({
      text: [
        "WASD - Move | LMB - Dash | Q - Teleport (Lv5) | E - Explosion (Lv8)",
        "Esc - Pause | R - Restart | T - Test XP (+10)",
      ].join("\n"),
      style: new TextStyle({
        fontFamily: "Arial",
        fontSize: 13,
        fill: "#666666",
        lineHeight: 18,
      }),
    });
    this.controlsLabel.anchor.set(0.5, 1);
    this.controlsLabel.position.set(
      this.app.screen.width / 2,
      this.app.screen.height - 10,
    );
    this.container.addChild(this.controlsLabel);
  }

  private createHud(h: number): void {
    const hudX = 20;
    const hudY = h - 80;
    const barWidth = 200;
    const barHeight = 16;

    this.hpBarBg = new Graphics();
    this.hpBarBg.rect(hudX, hudY, barWidth, barHeight);
    this.hpBarBg.fill({ color: "#331111" });
    this.hpBarBg.stroke({ color: "#553333", width: 1 });
    this.container.addChild(this.hpBarBg);

    this.hpBarFill = new Graphics();
    this.container.addChild(this.hpBarFill);

    this.hpLabel = new Text({
      text: "HP: 100/100",
      style: new TextStyle({
        fontFamily: "Arial",
        fontSize: 12,
        fill: "#ff6666",
      }),
    });
    this.hpLabel.anchor.set(0, 1);
    this.hpLabel.position.set(hudX, hudY - 2);
    this.container.addChild(this.hpLabel);

    const mpY = hudY + barHeight + 6;
    this.mpBarBg = new Graphics();
    this.mpBarBg.rect(hudX, mpY, barWidth, barHeight);
    this.mpBarBg.fill({ color: "#111133" });
    this.mpBarBg.stroke({ color: "#333355", width: 1 });
    this.container.addChild(this.mpBarBg);

    this.mpBarFill = new Graphics();
    this.container.addChild(this.mpBarFill);

    this.mpLabel = new Text({
      text: "MP: 100/100",
      style: new TextStyle({
        fontFamily: "Arial",
        fontSize: 12,
        fill: "#6666ff",
      }),
    });
    this.mpLabel.anchor.set(0, 1);
    this.mpLabel.position.set(hudX, mpY - 2);
    this.container.addChild(this.mpLabel);

    const xpY = mpY + barHeight + 6;
    this.xpBarBg = new Graphics();
    this.xpBarBg.rect(hudX, xpY, barWidth, 10);
    this.xpBarBg.fill({ color: "#112211" });
    this.xpBarBg.stroke({ color: "#335533", width: 1 });
    this.container.addChild(this.xpBarBg);

    this.xpBarFill = new Graphics();
    this.container.addChild(this.xpBarFill);

    this.xpLabel = new Text({
      text: "XP: 0/20",
      style: new TextStyle({
        fontFamily: "Arial",
        fontSize: 11,
        fill: "#66cc66",
      }),
    });
    this.xpLabel.anchor.set(0, 1);
    this.xpLabel.position.set(hudX, xpY - 2);
    this.container.addChild(this.xpLabel);

    this.levelLabel = new Text({
      text: "Lv 1",
      style: new TextStyle({
        fontFamily: "Arial",
        fontSize: 18,
        fill: "#ffcc44",
        fontWeight: "bold",
      }),
    });
    this.levelLabel.anchor.set(0, 0.5);
    this.levelLabel.position.set(
      hudX + barWidth + 16,
      hudY + (xpY + 10 - hudY) / 2,
    );
    this.container.addChild(this.levelLabel);
  }

  private createSkillHud(h: number): void {
    const skillY = h - 130;
    const skillStyle = new TextStyle({
      fontFamily: "Arial",
      fontSize: 13,
      fill: "#cccccc",
    });

    this.dashSkillLabel = new Text({
      text: "[Dash] Ready",
      style: skillStyle,
    });
    this.dashSkillLabel.anchor.set(0, 0);
    this.dashSkillLabel.position.set(20, skillY);
    this.container.addChild(this.dashSkillLabel);

    this.teleportSkillLabel = new Text({
      text: "[Teleport] Lv5",
      style: skillStyle,
    });
    this.teleportSkillLabel.anchor.set(0, 0);
    this.teleportSkillLabel.position.set(140, skillY);
    this.container.addChild(this.teleportSkillLabel);

    this.explosionSkillLabel = new Text({
      text: "[Explosion] Lv8",
      style: skillStyle,
    });
    this.explosionSkillLabel.anchor.set(0, 0);
    this.explosionSkillLabel.position.set(280, skillY);
    this.container.addChild(this.explosionSkillLabel);
  }

  private createCombatHud(w: number): void {
    const combatStyle = new TextStyle({
      fontFamily: "Arial",
      fontSize: 14,
      fill: "#cccccc",
    });

    this.enemyCountLabel = new Text({
      text: "Enemies: 0",
      style: combatStyle,
    });
    this.enemyCountLabel.anchor.set(1, 0);
    this.enemyCountLabel.position.set(w - 20, 56);
    this.container.addChild(this.enemyCountLabel);

    this.killCountLabel = new Text({
      text: "Kills: 0",
      style: { ...combatStyle, fill: "#ff8888" },
    });
    this.killCountLabel.anchor.set(1, 0);
    this.killCountLabel.position.set(w - 20, 76);
    this.container.addChild(this.killCountLabel);
  }

  private wireSystems(): void {
    this.gameState.events.on("state:changed", () => {
      this.updateStateLabel();
    });

    if (this.player) {
      this.player.events.on<PlayerDamagedData>("player:damaged", () => {
        this.updateHud();
      });

      this.player.events.on("player:hp_changed", () => {
        this.updateHud();
      });

      this.player.events.on("player:mp_changed", () => {
        this.updateHud();
      });

      this.player.events.on("player:xp_changed", () => {
        this.updateHud();
      });

      this.player.events.on<PlayerLevelChangedData>(
        "player:level_changed",
        (data) => {
          this.updateHud();
          this.onLevelUp(data.newLevel);
        },
      );

      this.player.events.on("player:died", () => {
        this.gameState.setState(GameState.Defeat);
      });
    }

    if (this.enemyManager && this.player) {
      const playerRef = this.player;
      this.enemyManager.events.on<EnemyKilledData>(
        EnemyManagerEvents.ENEMY_KILLED,
        (data) => {
          playerRef.addXp(data.rewardXp);
          this.updateCombatHud();
        },
      );

      this.enemyManager.events.on<PlayerDamagedByEnemyData>(
        EnemyManagerEvents.PLAYER_DAMAGED,
        (data) => {
          playerRef.takeDamage(data.amount);
        },
      );
    }

    const fixedUpdate = (dt: number) => {
      if (this.gameState.isCombatFlowBlocked()) return;
      this.fixedTick(dt);
    };

    const variableUpdate = (dt: number) => {
      this.handleInput();
      this.updateLabels(dt);
      this.updateSkillHud();
      this.updateCombatHud();
    };

    this.gameLoop.onFixedUpdate(fixedUpdate);
    this.gameLoop.onVariableUpdate(variableUpdate);

    this.tickerUpdate = (ticker) => {
      const deltaSeconds = ticker.elapsedMS / 1000;
      this.gameLoop.tick(deltaSeconds);
      this.input.endFrame();
    };

    this.app.ticker.add(this.tickerUpdate);
  }

  private wireBossEvents(): void {
    if (!this.bossManager || !this.player) return;
    const playerRef = this.player;

    this.bossManager.events.on<BossSpawnedData>(
      BossManagerEvents.BOSS_SPAWNED,
      () => {
        this.waveSpawner?.setBossActive(true);
      },
    );

    this.bossManager.events.on<BossDefeatedData>(
      BossManagerEvents.BOSS_DEFEATED,
      (data) => {
        this.waveSpawner?.setBossActive(false);
        playerRef.addXp(data.rewardXp);
      },
    );

    this.bossManager.events.on<BossPlayerDamagedData>(
      BossManagerEvents.PLAYER_DAMAGED,
      (data) => {
        playerRef.takeDamage(data.amount);
      },
    );
  }

  private fixedTick(dt: number): void {
    if (!this.player) return;
    const inputBlocked = this.gameState.isInputBlocked();
    this.player.update(dt, this.input, inputBlocked);

    if (this.waveSpawner) {
      this.waveSpawner.update(dt);
    }

    if (this.bossManager) {
      this.bossManager.update(dt);
    }

    if (this.enemyManager) {
      const playerPos = this.player.state.position;
      const playerRadius = playerConfig.collisionRadius;

      this.enemyManager.update(dt, playerPos, playerRadius, (amount) => {
        this.player?.takeDamage(amount);
      });

      if (this.skillController?.isDashing()) {
        this.checkDashDamage(playerPos);
      }
    }
  }

  private checkDashDamage(playerPos: Vec2): void {
    if (!this.skillController || !this.enemyManager) return;
    const dashConfig = this.skillController.dash.dashConfig;
    const enemies = this.enemyManager.getEnemies();
    for (const enemy of enemies) {
      if (!enemy.state.alive) continue;
      const combined = dashConfig.hitRadius + enemy.config.collisionRadius;
      if (vec2DistanceSquared(playerPos, enemy.state.position) <= combined * combined) {
        enemy.takeDamage(dashConfig.damage);
      }
    }
  }

  private handleInput(): void {
    if (this.input.isActionJustPressed("pause")) {
      this.gameState.togglePause();
    }

    if (this.input.isActionJustPressed("restart")) {
      this.restart();
    }

    if (this.input.keyboard.isKeyJustPressed("KeyT")) {
      this.player?.addXp(10);
    }
  }

  private onLevelUp(newLevel: number): void {
    if (newLevel > xpConfig.maxLevel) return;

    this.gameState.setState(GameState.LevelUpSelection);

    if (this.levelUpTimer !== null) {
      clearTimeout(this.levelUpTimer);
    }
    this.levelUpTimer = setTimeout(() => {
      if (this.gameState.state === GameState.LevelUpSelection) {
        this.gameState.setState(GameState.Playing);
      }
      this.levelUpTimer = null;
    }, 500);
  }

  private restart(): void {
    if (this.levelUpTimer !== null) {
      clearTimeout(this.levelUpTimer);
      this.levelUpTimer = null;
    }
    this.timeScale.reset();
    this.player?.reset();
    this.gameLoop.reset();
    this.enemyManager?.reset();
    this.waveSpawner?.reset();
    this.waveSpawner?.setBossActive(false);
    this.bossManager?.reset();
    this.gameState.setState(GameState.Playing);
    this.updateHud();
    this.updateCombatHud();
  }

  private formatSkillStatus(
    status: SkillStatus,
    cooldownRemaining: number,
  ): string {
    switch (status) {
      case SkillStatus.Locked:
        return "Locked";
      case SkillStatus.Ready:
        return "Ready";
      case SkillStatus.Active:
        return "Active";
      case SkillStatus.CoolingDown:
        return `${cooldownRemaining.toFixed(1)}s`;
      case SkillStatus.InsufficientMana:
        return "No MP";
    }
  }

  private updateSkillHud(): void {
    if (!this.player || !this.skillController) return;
    const ps = this.player.state;
    const lvl = ps.level;

    const dashStatus = this.skillController.dash.getStatus(ps, lvl);
    const dashText = this.formatSkillStatus(
      dashStatus,
      this.skillController.dash.cooldownRemaining,
    );
    if (this.dashSkillLabel) {
      this.dashSkillLabel.text = `[Dash] ${dashText}`;
      this.dashSkillLabel.style.fill =
        dashStatus === SkillStatus.Ready ? "#88ff88" : "#999999";
    }

    const tpStatus = this.skillController.teleport.getStatus(ps, lvl);
    const tpText = this.formatSkillStatus(
      tpStatus,
      this.skillController.teleport.cooldownRemaining,
    );
    if (this.teleportSkillLabel) {
      this.teleportSkillLabel.text = `[Q Teleport] ${tpText}`;
      this.teleportSkillLabel.style.fill =
        tpStatus === SkillStatus.Locked
          ? "#666666"
          : tpStatus === SkillStatus.Ready
            ? "#88ff88"
            : "#999999";
    }

    const exStatus = this.skillController.explosion.getStatus(ps, lvl);
    const exText = this.formatSkillStatus(
      exStatus,
      this.skillController.explosion.cooldownRemaining,
    );
    if (this.explosionSkillLabel) {
      this.explosionSkillLabel.text = `[E Explosion] ${exText}`;
      this.explosionSkillLabel.style.fill =
        exStatus === SkillStatus.Locked
          ? "#666666"
          : exStatus === SkillStatus.Ready
            ? "#88ff88"
            : "#999999";
    }
  }

  private updateCombatHud(): void {
    if (!this.enemyManager) return;
    if (this.enemyCountLabel) {
      this.enemyCountLabel.text = `Enemies: ${this.enemyManager.enemyCount}`;
    }
    if (this.killCountLabel) {
      this.killCountLabel.text = `Kills: ${this.enemyManager.killCount}`;
    }
  }

  private updateHud(): void {
    if (!this.player) return;
    const s = this.player.state;
    const hudX = 20;
    const h = this.app.screen.height;
    const barWidth = 200;
    const barHeight = 16;
    const hudY = h - 80;
    const mpY = hudY + barHeight + 6;
    const xpY = mpY + barHeight + 6;

    if (this.hpLabel) {
      this.hpLabel.text = `HP: ${Math.ceil(s.hp)}/${s.maxHp}`;
    }
    if (this.hpBarFill) {
      this.hpBarFill.clear();
      const fillW = barWidth * s.hpFraction;
      this.hpBarFill.rect(hudX, hudY, fillW, barHeight);
      this.hpBarFill.fill({ color: "#cc3333" });
    }

    if (this.mpLabel) {
      this.mpLabel.text = `MP: ${Math.ceil(s.mp)}/${s.maxMp}`;
    }
    if (this.mpBarFill) {
      this.mpBarFill.clear();
      const fillW = barWidth * s.mpFraction;
      this.mpBarFill.rect(hudX, mpY, fillW, barHeight);
      this.mpBarFill.fill({ color: "#3333cc" });
    }

    const xpRequired = xpRequiredForLevel(s.level, xpConfig);
    const xpFraction = xpRequired > 0 ? s.xp / xpRequired : 0;
    if (this.xpLabel) {
      this.xpLabel.text = `XP: ${Math.floor(s.xp)}/${xpRequired}`;
    }
    if (this.xpBarFill) {
      this.xpBarFill.clear();
      const fillW = 200 * Math.min(xpFraction, 1);
      this.xpBarFill.rect(hudX, xpY, fillW, 10);
      this.xpBarFill.fill({ color: "#33cc33" });
    }

    if (this.levelLabel) {
      this.levelLabel.text = `Lv ${s.level}`;
    }
  }

  private updateLabels(dt: number): void {
    if (this.fpsLabel) {
      const fps = dt > 0 ? Math.round(1 / dt) : 0;
      this.fpsLabel.text = `FPS: ${fps}`;
    }
  }

  private updateStateLabel(): void {
    if (this.stateLabel) {
      this.stateLabel.text = `State: ${this.gameState.state}`;
    }
  }

  update(): void {}

  destroy(): void {
    if (this.levelUpTimer !== null) {
      clearTimeout(this.levelUpTimer);
      this.levelUpTimer = null;
    }

    if (this.tickerUpdate) {
      this.app.ticker.remove(this.tickerUpdate);
      this.tickerUpdate = null;
    }

    this.skillController?.destroy();
    this.skillController = null;

    this.waveSpawner = null;

    this.bossManager?.destroy();
    this.bossManager = null;

    this.enemyManager?.destroy();
    this.enemyManager = null;

    this.player?.destroy();
    this.player = null;

    this.input.destroy(this.canvas);
    this.gameLoop.reset();
    this.gameState.events.removeAll();

    this.stateLabel?.destroy();
    this.fpsLabel?.destroy();
    this.controlsLabel?.destroy();
    this.titleLabel?.destroy();
    this.arenaBorder?.destroy();
    this.hpLabel?.destroy();
    this.mpLabel?.destroy();
    this.levelLabel?.destroy();
    this.xpLabel?.destroy();
    this.hpBarBg?.destroy();
    this.hpBarFill?.destroy();
    this.mpBarBg?.destroy();
    this.mpBarFill?.destroy();
    this.xpBarBg?.destroy();
    this.xpBarFill?.destroy();
    this.dashSkillLabel?.destroy();
    this.teleportSkillLabel?.destroy();
    this.explosionSkillLabel?.destroy();
    this.enemyCountLabel?.destroy();
    this.killCountLabel?.destroy();
    this.bossCountLabel?.destroy();

    this.stateLabel = null;
    this.fpsLabel = null;
    this.controlsLabel = null;
    this.titleLabel = null;
    this.arenaBorder = null;
    this.hpLabel = null;
    this.mpLabel = null;
    this.levelLabel = null;
    this.xpLabel = null;
    this.hpBarBg = null;
    this.hpBarFill = null;
    this.mpBarBg = null;
    this.mpBarFill = null;
    this.xpBarBg = null;
    this.xpBarFill = null;
    this.dashSkillLabel = null;
    this.teleportSkillLabel = null;
    this.explosionSkillLabel = null;
    this.enemyCountLabel = null;
    this.killCountLabel = null;
    this.bossCountLabel = null;
  }
}
