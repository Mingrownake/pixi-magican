import { GameEventEmitter } from "../../core/events/GameEventEmitter";

export enum GameState {
  Boot = "Boot",
  Playing = "Playing",
  LevelUpSelection = "LevelUpSelection",
  TeleportTargeting = "TeleportTargeting",
  Paused = "Paused",
  Victory = "Victory",
  Defeat = "Defeat",
}

export const GameStateEvents = {
  CHANGED: "state:changed",
} as const;

export interface GameStateChangedData {
  previous: GameState;
  current: GameState;
}

export class GameStateManager {
  readonly events = new GameEventEmitter();
  private _state: GameState = GameState.Boot;

  get state(): GameState {
    return this._state;
  }

  setState(newState: GameState): void {
    if (this._state === newState) return;
    const previous = this._state;
    this._state = newState;
    this.events.emit<GameStateChangedData>(GameStateEvents.CHANGED, {
      previous,
      current: newState,
    });
  }

  isPlaying(): boolean {
    return this._state === GameState.Playing;
  }

  isPaused(): boolean {
    return this._state === GameState.Paused;
  }

  isGameOver(): boolean {
    return (
      this._state === GameState.Victory || this._state === GameState.Defeat
    );
  }

  isCombatFlowBlocked(): boolean {
    return (
      this._state === GameState.Paused ||
      this._state === GameState.Victory ||
      this._state === GameState.Defeat ||
      this._state === GameState.LevelUpSelection
    );
  }

  togglePause(): void {
    if (this._state === GameState.Playing) {
      this.setState(GameState.Paused);
    } else if (this._state === GameState.Paused) {
      this.setState(GameState.Playing);
    }
  }
}
