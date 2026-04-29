"use client";

// Background sync service: polls Hermes every 30s for status + flushes queued commands
// Uses a singleton interval to avoid duplicate polling

import { checkStatus, flushQueue, type HermesStatus } from "./hermes";

type StatusListener = (status: HermesStatus) => void;

let intervalId: ReturnType<typeof setInterval> | null = null;
let lastStatus: HermesStatus = { online: false };
const listeners = new Set<StatusListener>();

const POLL_INTERVAL = 30_000; // 30 seconds

async function poll() {
  const status = await checkStatus();

  // If Hermes just came back online, flush queued commands
  if (status.online && !lastStatus.online) {
    const flushed = await flushQueue();
    if (flushed > 0) {
      console.log(`[sync] Hermes back online — flushed ${flushed} queued commands`);
    }
  }

  lastStatus = status;
  listeners.forEach((fn) => fn(status));
}

/** Start the background sync loop (idempotent) */
export function startSync(): void {
  if (intervalId) return;
  poll(); // immediate first check
  intervalId = setInterval(poll, POLL_INTERVAL);
}

/** Stop the sync loop */
export function stopSync(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

/** Subscribe to status changes. Returns an unsubscribe function. */
export function onStatusChange(listener: StatusListener): () => void {
  listeners.add(listener);
  // Immediately fire with last known status
  listener(lastStatus);
  return () => listeners.delete(listener);
}

/** Get current cached status (no network call) */
export function getLastStatus(): HermesStatus {
  return lastStatus;
}
