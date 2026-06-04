import type { Vec2 } from "../core/math/Vec2";

export class PointerInput {
  private _position: Vec2 = { x: 0, y: 0 };
  private _isLeftDown = false;
  private _leftJustPressed = false;
  private _leftJustReleased = false;

  private handlePointerMove: (e: PointerEvent) => void;
  private handlePointerDown: (e: PointerEvent) => void;
  private handlePointerUp: (e: PointerEvent) => void;
  private handleBlur: () => void;

  constructor(target: HTMLElement) {
    this.handlePointerMove = (e: PointerEvent) => {
      const rect = target.getBoundingClientRect();
      this._position.x = e.clientX - rect.left;
      this._position.y = e.clientY - rect.top;
    };

    this.handlePointerDown = (e: PointerEvent) => {
      if (e.button === 0) {
        this._isLeftDown = true;
        this._leftJustPressed = true;
      }
    };

    this.handlePointerUp = (e: PointerEvent) => {
      if (e.button === 0) {
        this._isLeftDown = false;
        this._leftJustReleased = true;
      }
    };

    this.handleBlur = () => {
      this._isLeftDown = false;
      this._leftJustPressed = false;
      this._leftJustReleased = false;
    };

    target.addEventListener("pointermove", this.handlePointerMove);
    target.addEventListener("pointerdown", this.handlePointerDown);
    target.addEventListener("pointerup", this.handlePointerUp);
    window.addEventListener("blur", this.handleBlur);
  }

  get position(): Vec2 {
    return this._position;
  }

  get isLeftDown(): boolean {
    return this._isLeftDown;
  }

  get leftJustPressed(): boolean {
    return this._leftJustPressed;
  }

  get leftJustReleased(): boolean {
    return this._leftJustReleased;
  }

  endFrame(): void {
    this._leftJustPressed = false;
    this._leftJustReleased = false;
  }

  destroy(target: HTMLElement): void {
    target.removeEventListener("pointermove", this.handlePointerMove);
    target.removeEventListener("pointerdown", this.handlePointerDown);
    target.removeEventListener("pointerup", this.handlePointerUp);
    window.removeEventListener("blur", this.handleBlur);
  }
}
