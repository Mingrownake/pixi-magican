import { TimeScale } from "../../core/time/TimeScale";

export type FixedUpdateCallback = (fixedDeltaSeconds: number) => void;
export type VariableUpdateCallback = (deltaSeconds: number) => void;

export class GameLoop {
  private fixedDeltaTime: number;
  private accumulator = 0;
  private fixedUpdateCallbacks: FixedUpdateCallback[] = [];
  private variableUpdateCallbacks: VariableUpdateCallback[] = [];
  readonly timeScale: TimeScale;

  constructor(fixedHz = 60, timeScale?: TimeScale) {
    this.fixedDeltaTime = 1 / fixedHz;
    this.timeScale = timeScale ?? new TimeScale();
  }

  onFixedUpdate(callback: FixedUpdateCallback): void {
    this.fixedUpdateCallbacks.push(callback);
  }

  onVariableUpdate(callback: VariableUpdateCallback): void {
    this.variableUpdateCallbacks.push(callback);
  }

  tick(rawDeltaSeconds: number): void {
    const scaledDelta = this.timeScale.getScaledDelta(rawDeltaSeconds);
    const unscaledDelta = rawDeltaSeconds;

    this.accumulator += scaledDelta;

    const maxAccumulator = this.fixedDeltaTime * 5;
    if (this.accumulator > maxAccumulator) {
      this.accumulator = maxAccumulator;
    }

    while (this.accumulator >= this.fixedDeltaTime) {
      for (const cb of this.fixedUpdateCallbacks) {
        cb(this.fixedDeltaTime);
      }
      this.accumulator -= this.fixedDeltaTime;
    }

    for (const cb of this.variableUpdateCallbacks) {
      cb(unscaledDelta);
    }
  }

  reset(): void {
    this.accumulator = 0;
  }

  removeFixedUpdate(callback: FixedUpdateCallback): void {
    const index = this.fixedUpdateCallbacks.indexOf(callback);
    if (index !== -1) this.fixedUpdateCallbacks.splice(index, 1);
  }

  removeVariableUpdate(callback: VariableUpdateCallback): void {
    const index = this.variableUpdateCallbacks.indexOf(callback);
    if (index !== -1) this.variableUpdateCallbacks.splice(index, 1);
  }
}
