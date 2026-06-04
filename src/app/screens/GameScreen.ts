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

export class GameScreen extends Screen {
  private app: Application;
  private input: InputManager;
  private gameLoop: GameLoop;
  private gameState: GameStateManager;
  private timeScale: TimeScale;
  private player: Player | null = null;

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

    this.createArenaVisual(margin, w, h);

    this.player = new Player(this.container, undefined, {
      x: margin,
      y: margin,
      width: w - margin * 2,
      height: h - margin * 2,
    });

    this.createLabels(w);
    this.createHud(w, h);
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
        "WASD - Move | LMB - Dash | Q - Teleport | E - Explosion",
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

  private createHud(_w: number, h: number): void {
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

    const fixedUpdate = (dt: number) => {
      if (this.gameState.isCombatFlowBlocked()) return;
      this.fixedTick(dt);
    };

    const variableUpdate = (dt: number) => {
      this.handleInput();
      this.updateLabels(dt);
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

  private fixedTick(dt: number): void {
    if (!this.player) return;
    const inputBlocked = this.gameState.isInputBlocked();
    this.player.update(dt, this.input, inputBlocked);
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
    this.player?.reset();
    this.gameLoop.reset();
    this.gameState.setState(GameState.Playing);
    this.updateHud();
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
  }
}
