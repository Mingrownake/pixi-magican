export class TimeScale {
  private _scale = 1;

  get scale(): number {
    return this._scale;
  }

  set scale(value: number) {
    this._scale = Math.max(0, value);
  }

  getScaledDelta(deltaSeconds: number): number {
    return deltaSeconds * this._scale;
  }

  getUnscaledDelta(deltaSeconds: number): number {
    return deltaSeconds;
  }

  reset(): void {
    this._scale = 1;
  }

  isSlowed(): boolean {
    return this._scale < 1;
  }
}
