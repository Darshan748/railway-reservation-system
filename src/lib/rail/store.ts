import { useSyncExternalStore } from "react";
import { createSeed } from "./seed";
import type { Result } from "./service";
import type { RailState } from "./types";

const KEY = "railyatra-demo-state-v1";
let state: RailState | null = null;
let serverSnapshot: RailState | null = null;
const listeners = new Set<() => void>();

function load(): RailState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as RailState;
      if (Array.isArray(parsed.trains) && Array.isArray(parsed.reservations) && Array.isArray(parsed.waitlist)) {
        return parsed;
      }
    }
  } catch {
    /* fall through to seed */
  }
  return createSeed();
}

export function getState(): RailState {
  if (!state) state = load();
  return state;
}

function getServerSnapshot(): RailState {
  if (!serverSnapshot) serverSnapshot = createSeed();
  return serverSnapshot;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      state = load();
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function setState(next: RailState) {
  state = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full or unavailable */
  }
  listeners.forEach((l) => l());
}

/** Runs a service operation against the current state and commits it on success. */
export function commit<T>(op: (s: RailState) => Result<T>): Result<T> {
  const result = op(getState());
  if (result.ok) setState(result.state);
  return result;
}

export function resetData() {
  setState(createSeed());
}

export function useRail(): RailState {
  return useSyncExternalStore(subscribe, getState, getServerSnapshot);
}
