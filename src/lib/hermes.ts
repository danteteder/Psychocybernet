"use client";

// Hermes AI Gateway client
// Runs client-side — YOUR BROWSER calls Hermes (not Vercel).
//
// Reliability (Tailscale + backup):
// - Put your laptop Tailscale URL in Settings (e.g. http://100.108.28.43:8080).
// - Optional MagicDNS: http://your-machine-name:8080 (same tailnet).
// - Set NEXT_PUBLIC_HERMES_FALLBACK_URL or NEXT_PUBLIC_HERMES_URL_CANDIDATES (comma-separated)
//   in Vercel for ngrok / backup when Tailscale glitches.
// - On each session we ping /health on each candidate in order and cache the first that works.
//
// Webhooks (port 8644) are separate — HERMES_WEBHOOK_* env on the server.

/** Default Hermes base URL when nothing is saved in localStorage.
 *  Priority: NEXT_PUBLIC_HERMES_PUBLIC_URL → NEXT_PUBLIC_HERMES_URL → Tailscale IP. */
export function getDefaultHermesBaseUrl(): string {
  const pub =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_HERMES_PUBLIC_URL) ||
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_HERMES_URL);
  if (pub) return pub.replace(/\/$/, "");
  return "http://100.108.28.43:8080";
}

const RESOLVED_BASE_SESSION_KEY = "psycho_hermes_working_base";

/** Extra URLs to try if the primary fails (from Vercel env). Comma-separated, order matters after Settings URL. */
function hermesUrlCandidatesFromEnv(): string[] {
  const raw =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_HERMES_URL_CANDIDATES) || "";
  const single =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_HERMES_FALLBACK_URL
      ? process.env.NEXT_PUBLIC_HERMES_FALLBACK_URL
      : "";
  const parts = [
    ...raw.split(",").map((s) => s.trim()).filter(Boolean),
    ...(single ? [single.trim()] : []),
  ];
  return parts.map((u) => u.replace(/\/$/, ""));
}

/** Ordered list: Settings first, then env candidates, then bundled default (deduped). */
export function getHermesBaseCandidates(): string[] {
  const saved = typeof window !== "undefined" ? getSettings().baseUrl : getDefaultHermesBaseUrl();
  const defaultB = getDefaultHermesBaseUrl();
  const list = [
    saved.replace(/\/$/, ""),
    ...hermesUrlCandidatesFromEnv(),
    defaultB,
  ];
  return [...new Set(list.filter(Boolean))];
}

async function pingHealth(base: string, timeoutMs: number): Promise<boolean> {
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), timeoutMs);
    const r = await fetch(`${base}/health`, { method: "GET", signal: c.signal });
    clearTimeout(t);
    return r.ok;
  } catch {
    return false;
  }
}

/** In-memory cache for the working base URL this tab session. */
let memoryResolvedBase: string | null = null;

/** Forget cached Hermes URL (e.g. after changing Settings or when stuck). */
export function clearHermesBaseCache(): void {
  memoryResolvedBase = null;
  try {
    sessionStorage.removeItem(RESOLVED_BASE_SESSION_KEY);
  } catch {
    /* private mode */
  }
}

/**
 * Pick a base URL that responds to GET /health.
 * Order: last known good (session) → Settings + env candidates.
 */
export async function getEffectiveHermesBaseUrl(): Promise<string> {
  if (typeof window === "undefined") return getDefaultHermesBaseUrl();

  const candidates = getHermesBaseCandidates();

  if (memoryResolvedBase && (await pingHealth(memoryResolvedBase, 2500))) {
    return memoryResolvedBase;
  }

  try {
    const sess = sessionStorage.getItem(RESOLVED_BASE_SESSION_KEY);
    if (sess && (await pingHealth(sess, 2500))) {
      memoryResolvedBase = sess;
      return sess;
    }
  } catch {
    /* ignore */
  }

  for (const base of candidates) {
    if (await pingHealth(base, 4000)) {
      memoryResolvedBase = base;
      try {
        sessionStorage.setItem(RESOLVED_BASE_SESSION_KEY, base);
      } catch {
        /* ignore */
      }
      return base;
    }
  }

  memoryResolvedBase = null;
  // Nothing answered; still return primary so error messages / queue behave predictably
  return getSettings().baseUrl.replace(/\/$/, "");
}

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
  const fallback = getDefaultHermesBaseUrl();
  if (typeof window === "undefined") return { baseUrl: fallback };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : { baseUrl: fallback };
  } catch {
    return { baseUrl: fallback };
  }
}

export function saveSettings(settings: HermesSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  clearHermesBaseCache();
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
  const baseUrl = await getEffectiveHermesBaseUrl();
  const { apiKey } = getSettings();
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

/** Check if Hermes gateway is reachable (tries failover chain). */
export async function checkStatus(): Promise<HermesStatus> {
  try {
    await getEffectiveHermesBaseUrl();
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
    const baseUrl = await getEffectiveHermesBaseUrl();
    const { apiKey } = getSettings();
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
