import { Container } from "pixi.js";

export abstract class Screen {
  readonly container: Container;

  constructor() {
    this.container = new Container();
  }

  abstract init(): void | Promise<void>;

  abstract update(deltaSeconds: number): void;

  abstract destroy(): void;
}
