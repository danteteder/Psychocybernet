"use client";

// Hermes AI Gateway client
// Runs client-side because Vercel can't reach Tailscale IPs.
// The user's browser (on Tailscale) makes direct requests to Hermes.

const DEFAULT_HERMES_URL = process.env.NEXT_PUBLIC_HERMES_URL || "http://100.108.28.43:8080";
const SETTINGS_KEY = "psycho_hermes_settings";
const QUEUE_KEY = "psycho_hermes_queue";
const HISTORY_KEY = "psycho_hermes_history";

// Error classes for better error handling
export class HermesAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HermesAuthError";
  }
}

export class HermesConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HermesConnectionError";
  }
}

// ── Types ──

export interface HermesSettings {
  baseUrl: string;
  apiKey?: string;
}

export type HermesTaskStatus = "pending" | "running" | "completed" | "failed";

export interface HermesTask {
  id: string;
  command: string;
  status: HermesTaskStatus;
  result?: unknown;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface HermesStatus {
  online: boolean;
  version?: string;
  uptime?: number;
  session?: string;
}

// ── Settings persistence (localStorage) ──

export function getSettings(): HermesSettings {
  if (typeof window === "undefined") return { baseUrl: DEFAULT_HERMES_URL };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : { baseUrl: DEFAULT_HERMES_URL };
  } catch {
    return { baseUrl: DEFAULT_HERMES_URL };
  }
}

export function saveSettings(settings: HermesSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ── Task history (localStorage) ──

export function getTaskHistory(): HermesTask[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTaskHistory(tasks: HermesTask[]): void {
  // Keep last 100 tasks
  const trimmed = tasks.slice(-100);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
}

function addToHistory(task: HermesTask): void {
  const history = getTaskHistory();
  const idx = history.findIndex((t) => t.id === task.id);
  if (idx >= 0) history[idx] = task;
  else history.push(task);
  saveTaskHistory(history);
}

// ── Offline queue (localStorage) ──

export function getQueue(): HermesTask[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: HermesTask[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

// ── Core fetch with timeout + retry ──

async function hermesFetch(
  path: string,
  options: RequestInit = {},
  timeoutMs = 30000
): Promise<Response> {
  const { baseUrl, apiKey } = getSettings();
  const url = `${baseUrl}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// Retry wrapper with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000
): Promise<T> {
  let lastError: Error | undefined;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;
      if (i < maxRetries) {
        await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** i));
      }
    }
  }
  throw lastError;
}

// ── Public API ──

/** Check if Hermes gateway is reachable */
export async function checkStatus(): Promise<HermesStatus> {
  try {
    const res = await hermesFetch("/health", { method: "GET" }, 5000);
    if (!res.ok) return { online: false };
    const data = await res.json();
    return { online: true, version: data.version, uptime: data.uptime, session: data.session };
  } catch {
    return { online: false };
  }
}

/** Send a text command to Hermes and get a task ID back */
export async function sendCommand(
  command: string,
  context?: Record<string, unknown>
): Promise<HermesTask> {
  const task: HermesTask = {
    id: crypto.randomUUID(),
    command,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  try {
    const res = await hermesFetch("/command", {
      method: "POST",
      body: JSON.stringify({ command, context }),
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new HermesAuthError("Hermes API key invalid or expired");
      }
      throw new HermesConnectionError(`Hermes returned ${res.status}`);
    }
    const data = await res.json();
    task.id = data.taskId || data.id || task.id;
    task.status = "running";
    addToHistory(task);
    return task;
  } catch (err) {
    // Queue for later if Hermes is offline
    task.status = "pending";
    const queue = getQueue();
    queue.push(task);
    saveQueue(queue);
    addToHistory(task);
    return task;
  }
}

/** Poll for a task's result */
export async function getTaskResult(taskId: string): Promise<HermesTask | null> {
  try {
    const res = await hermesFetch(`/task/${taskId}`, { method: "GET" }, 10000);
    if (!res.ok) return null;
    const data = await res.json();
    const task: HermesTask = {
      id: taskId,
      command: data.command || "",
      status: data.status || "pending",
      result: data.result,
      error: data.error,
      createdAt: data.createdAt || new Date().toISOString(),
      completedAt: data.completedAt,
    };
    addToHistory(task);
    return task;
  } catch {
    return null;
  }
}

/** Send voice audio to Hermes for STT + command execution */
export async function sendVoiceCommand(audioBlob: Blob): Promise<HermesTask> {
  const formData = new FormData();
  formData.append("audio", audioBlob, "voice.webm");

  const task: HermesTask = {
    id: crypto.randomUUID(),
    command: "(voice)",
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  try {
    const { baseUrl, apiKey } = getSettings();
    const headers: Record<string, string> = apiKey ? { Authorization: `Bearer ${apiKey}` } : {};

    const res = await fetch(`${baseUrl}/voice`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!res.ok) throw new Error(`Hermes returned ${res.status}`);
    const data = await res.json();
    task.id = data.taskId || data.id || task.id;
    task.command = data.transcription || "(voice)";
    task.status = data.status || "running";
    task.result = data.result;
    addToHistory(task);
    return task;
  } catch {
    task.status = "failed";
    task.error = "Voice command failed — Hermes may be offline";
    addToHistory(task);
    return task;
  }
}

/** Trigger a browser automation task */
export async function runBrowserTask(
  url: string,
  actions: Record<string, unknown>[]
): Promise<HermesTask> {
  return sendCommand(`browser:${url}`, { url, actions });
}

/** Flush queued commands (call when Hermes comes back online) */
export async function flushQueue(): Promise<number> {
  const queue = getQueue();
  if (queue.length === 0) return 0;

  let sent = 0;
  const remaining: HermesTask[] = [];

  for (const task of queue) {
    try {
      await sendCommand(task.command);
      sent++;
    } catch {
      remaining.push(task);
    }
  }

  saveQueue(remaining);
  return sent;
}
