import type { Vec2 } from "../core/math/Vec2";
import { KeyboardInput } from "./KeyboardInput";
import { PointerInput } from "./PointerInput";

export type InputAction =
  | "moveUp"
  | "moveDown"
  | "moveLeft"
  | "moveRight"
  | "dash"
  | "teleport"
  | "explosion"
  | "pause"
  | "restart";

export class InputManager {
  readonly keyboard: KeyboardInput;
  readonly pointer: PointerInput;

  constructor(canvasElement: HTMLElement) {
    this.keyboard = new KeyboardInput();
    this.pointer = new PointerInput(canvasElement);
  }

  isActionHeld(action: InputAction): boolean {
    switch (action) {
      case "moveUp":
        return (
          this.keyboard.isKeyDown("KeyW") || this.keyboard.isKeyDown("ArrowUp")
        );
      case "moveDown":
        return (
          this.keyboard.isKeyDown("KeyS") ||
          this.keyboard.isKeyDown("ArrowDown")
        );
      case "moveLeft":
        return (
          this.keyboard.isKeyDown("KeyA") ||
          this.keyboard.isKeyDown("ArrowLeft")
        );
      case "moveRight":
        return (
          this.keyboard.isKeyDown("KeyD") ||
          this.keyboard.isKeyDown("ArrowRight")
        );
      case "dash":
        return this.pointer.isLeftDown;
      case "teleport":
        return this.keyboard.isKeyDown("KeyQ");
      case "explosion":
        return this.keyboard.isKeyDown("KeyE");
      case "pause":
        return false;
      case "restart":
        return false;
    }
  }

  isActionJustPressed(action: InputAction): boolean {
    switch (action) {
      case "dash":
        return this.pointer.leftJustPressed;
      case "teleport":
        return this.keyboard.isKeyJustPressed("KeyQ");
      case "explosion":
        return this.keyboard.isKeyJustPressed("KeyE");
      case "pause":
        return (
          this.keyboard.isKeyJustPressed("Escape") ||
          this.keyboard.isKeyJustPressed("KeyP")
        );
      case "restart":
        return this.keyboard.isKeyJustPressed("KeyR");
      default:
        return false;
    }
  }

  getMovementVector(): Vec2 {
    let x = 0;
    let y = 0;
    if (this.isActionHeld("moveLeft")) x -= 1;
    if (this.isActionHeld("moveRight")) x += 1;
    if (this.isActionHeld("moveUp")) y -= 1;
    if (this.isActionHeld("moveDown")) y += 1;
    if (x !== 0 && y !== 0) {
      const inv = 1 / Math.SQRT2;
      x *= inv;
      y *= inv;
    }
    return { x, y };
  }

  getPointerPosition(): Vec2 {
    return this.pointer.position;
  }

  endFrame(): void {
    this.keyboard.endFrame();
    this.pointer.endFrame();
  }

  destroy(canvasElement: HTMLElement): void {
    this.keyboard.destroy();
    this.pointer.destroy(canvasElement);
  }
}
