import type { Container } from "pixi.js";
import type { Screen } from "./Screen";

export class ScreenManager {
  private currentScreen: Screen | null = null;
  private readonly parent: Container;

  constructor(parentContainer: Container) {
    this.parent = parentContainer;
  }

  async switchScreen(screen: Screen): Promise<void> {
    if (this.currentScreen) {
      this.parent.removeChild(this.currentScreen.container);
      this.currentScreen.destroy();
    }

    this.currentScreen = screen;
    this.parent.addChild(screen.container);
    await screen.init();
  }

  update(deltaSeconds: number): void {
    this.currentScreen?.update(deltaSeconds);
  }

  get active(): Screen | null {
    return this.currentScreen;
  }

  destroy(): void {
    if (this.currentScreen) {
      this.parent.removeChild(this.currentScreen.container);
      this.currentScreen.destroy();
      this.currentScreen = null;
    }
  }
}
