export class KeyboardInput {
  private pressedKeys = new Set<string>();
  private justPressedKeys = new Set<string>();
  private justReleasedKeys = new Set<string>();

  private handleKeyDown: (e: KeyboardEvent) => void;
  private handleKeyUp: (e: KeyboardEvent) => void;
  private handleBlur: () => void;

  constructor() {
    this.handleKeyDown = (e: KeyboardEvent) => {
      const key = e.code;
      if (!this.pressedKeys.has(key)) {
        this.justPressedKeys.add(key);
      }
      this.pressedKeys.add(key);
    };

    this.handleKeyUp = (e: KeyboardEvent) => {
      const key = e.code;
      this.pressedKeys.delete(key);
      this.justReleasedKeys.add(key);
    };

    this.handleBlur = () => {
      this.pressedKeys.clear();
      this.justPressedKeys.clear();
      this.justReleasedKeys.clear();
    };

    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("blur", this.handleBlur);
  }

  isKeyDown(key: string): boolean {
    return this.pressedKeys.has(key);
  }

  isKeyJustPressed(key: string): boolean {
    return this.justPressedKeys.has(key);
  }

  isKeyJustReleased(key: string): boolean {
    return this.justReleasedKeys.has(key);
  }

  endFrame(): void {
    this.justPressedKeys.clear();
    this.justReleasedKeys.clear();
  }

  destroy(): void {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("blur", this.handleBlur);
    this.pressedKeys.clear();
    this.justPressedKeys.clear();
    this.justReleasedKeys.clear();
  }
}
