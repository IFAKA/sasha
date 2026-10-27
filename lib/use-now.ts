"use client";

import { useSyncExternalStore } from "react";

// Current time as an external store: null while rendering on the server, so
// time-dependent UI (open now, earliest pickup) never mismatches on hydration.
let snapshot = 0;

function subscribe(onChange: () => void) {
  const id = setInterval(() => {
    snapshot = Date.now();
    onChange();
  }, 60_000);
  return () => clearInterval(id);
}

function getSnapshot() {
  if (!snapshot) snapshot = Date.now();
  return snapshot;
}

const getServerSnapshot = () => null;

export function useNow(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
