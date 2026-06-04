import { Application, Graphics, Text, TextStyle } from "pixi.js";
import { Screen } from "./Screen";
import { InputManager } from "../../input/InputManager";
import { GameLoop } from "../loop/GameLoop";
import { GameState, GameStateManager } from "../../game/state/GameState";
import { TimeScale } from "../../core/time/TimeScale";

export class GameScreen extends Screen {
  private app: Application;
  private input: InputManager;
  private gameLoop: GameLoop;
  private gameState: GameStateManager;
  private timeScale: TimeScale;

  private stateLabel: Text | null = null;
  private fpsLabel: Text | null = null;
  private controlsLabel: Text | null = null;
  private titleLabel: Text | null = null;
  private arenaBorder: Graphics | null = null;

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
    this.createArenaVisual();
    this.createLabels();
    this.wireSystems();
    this.gameState.setState(GameState.Playing);
  }

  private createArenaVisual(): void {
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    const margin = 40;

    this.arenaBorder = new Graphics();
    this.arenaBorder.rect(margin, margin, w - margin * 2, h - margin * 2);
    this.arenaBorder.stroke({ color: "#334455", width: 2 });
    this.container.addChild(this.arenaBorder);
  }

  private createLabels(): void {
    const w = this.app.screen.width;

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
    this.titleLabel.position.set(w / 2, 50);
    this.container.addChild(this.titleLabel);

    this.stateLabel = new Text({
      text: "State: Playing",
      style: new TextStyle({
        fontFamily: "Arial",
        fontSize: 18,
        fill: "#88ff88",
      }),
    });
    this.stateLabel.anchor.set(0, 0);
    this.stateLabel.position.set(50, 100);
    this.container.addChild(this.stateLabel);

    this.fpsLabel = new Text({
      text: "FPS: 0",
      style: new TextStyle({
        fontFamily: "Arial",
        fontSize: 16,
        fill: "#ffff88",
      }),
    });
    this.fpsLabel.anchor.set(0, 0);
    this.fpsLabel.position.set(50, 130);
    this.container.addChild(this.fpsLabel);

    this.controlsLabel = new Text({
      text: [
        "Controls:",
        "WASD / Arrows - Move",
        "Left Click - Dash",
        "Q - Teleport (Lv5)",
        "E - Explosion (Lv8)",
        "Esc / P - Pause",
        "R - Restart",
      ].join("\n"),
      style: new TextStyle({
        fontFamily: "Arial",
        fontSize: 14,
        fill: "#999999",
        lineHeight: 20,
      }),
    });
    this.controlsLabel.anchor.set(0, 0);
    this.controlsLabel.position.set(50, 170);
    this.container.addChild(this.controlsLabel);
  }

  private wireSystems(): void {
    this.gameState.events.on("state:changed", () => {
      this.updateStateLabel();
    });

    const fixedUpdate = () => {
      if (this.gameState.isCombatFlowBlocked()) return;
      this.fixedTick();
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

  private fixedTick(): void {}

  private handleInput(): void {
    if (this.input.isActionJustPressed("pause")) {
      this.gameState.togglePause();
    }

    if (this.input.isActionJustPressed("restart")) {
      this.gameState.setState(GameState.Playing);
      this.gameLoop.reset();
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
    if (this.tickerUpdate) {
      this.app.ticker.remove(this.tickerUpdate);
      this.tickerUpdate = null;
    }

    this.input.destroy(this.canvas);
    this.gameLoop.reset();
    this.gameState.events.removeAll();

    this.stateLabel?.destroy();
    this.fpsLabel?.destroy();
    this.controlsLabel?.destroy();
    this.titleLabel?.destroy();
    this.arenaBorder?.destroy();

    this.stateLabel = null;
    this.fpsLabel = null;
    this.controlsLabel = null;
    this.titleLabel = null;
    this.arenaBorder = null;
  }
}
