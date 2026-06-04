type EventCallback<T = void> = T extends void ? () => void : (data: T) => void;

interface EventEntry<T = unknown> {
  callback: EventCallback<T>;
  once: boolean;
}

export class GameEventEmitter {
  private listeners = new Map<string, EventEntry[]>();

  on<T = void>(event: string, callback: EventCallback<T>): void {
    this.addListener(event, callback as EventCallback, false);
  }

  once<T = void>(event: string, callback: EventCallback<T>): void {
    this.addListener(event, callback as EventCallback, true);
  }

  off<T = void>(event: string, callback: EventCallback<T>): void {
    const entries = this.listeners.get(event);
    if (!entries) return;
    const index = entries.findIndex((e) => e.callback === callback);
    if (index !== -1) entries.splice(index, 1);
    if (entries.length === 0) this.listeners.delete(event);
  }

  emit<T = void>(event: string, ...args: T extends void ? [] : [T]): void {
    const entries = this.listeners.get(event);
    if (!entries || entries.length === 0) return;
    const data = args[0] as T;
    const snapshot = [...entries];
    for (const entry of snapshot) {
      if (entry.once) {
        const idx = entries.indexOf(entry);
        if (idx !== -1) entries.splice(idx, 1);
      }
      if (data !== undefined) {
        (entry.callback as (d: T) => void)(data);
      } else {
        (entry.callback as () => void)();
      }
    }
    if (entries.length === 0) this.listeners.delete(event);
  }

  removeAll(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  hasListeners(event: string): boolean {
    const entries = this.listeners.get(event);
    return entries !== undefined && entries.length > 0;
  }

  private addListener(
    event: string,
    callback: EventCallback,
    once: boolean,
  ): void {
    let entries = this.listeners.get(event);
    if (!entries) {
      entries = [];
      this.listeners.set(event, entries);
    }
    entries.push({ callback, once });
  }
}
