import { Application } from "pixi.js";
import { ScreenManager } from "./screens/ScreenManager";
import { BootScreen } from "./screens/BootScreen";
import { GameScreen } from "./screens/GameScreen";

export async function bootstrap(): Promise<void> {
  const app = new Application();

  await app.init({
    background: "#0a0a1a",
    resizeTo: window,
    antialias: true,
  });

  const container = document.getElementById("pixi-container");
  if (!container) {
    throw new Error("Could not find #pixi-container element");
  }
  container.appendChild(app.canvas);

  const screenManager = new ScreenManager(app.stage);

  const bootScreen = new BootScreen(() => {
    screenManager.switchScreen(new GameScreen(app));
  });

  await screenManager.switchScreen(bootScreen);

  app.ticker.add((ticker) => {
    const deltaSeconds = ticker.elapsedMS / 1000;
    screenManager.update(deltaSeconds);
  });
}
