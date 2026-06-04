import { Text, TextStyle } from "pixi.js";
import { Screen } from "./Screen";

export class BootScreen extends Screen {
  private onReady: () => void;
  private label: Text | null = null;

  constructor(onReady: () => void) {
    super();
    this.onReady = onReady;
  }

  init(): void {
    this.label = new Text({
      text: "Loading...",
      style: new TextStyle({
        fontFamily: "Arial",
        fontSize: 32,
        fill: "#ffffff",
      }),
    });
    this.label.anchor.set(0.5);
    this.label.position.set(window.innerWidth / 2, window.innerHeight / 2);
    this.container.addChild(this.label);

    setTimeout(() => this.onReady(), 100);
  }

  update(): void {}

  destroy(): void {
    this.label?.destroy();
    this.label = null;
  }
}
