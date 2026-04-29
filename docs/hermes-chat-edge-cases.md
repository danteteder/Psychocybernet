# Hermes Chat Feature - Edge Case Analysis

## Executive Summary

The current Hermes integration is a **command/task paradigm** (not conversational chat). The `hermes.ts` library exposes endpoints: `/command`, `/task/:id`, `/voice`, and `/health`. Building a **chat feature** requires transforming this into a conversational interface with proper message persistence, streaming, and real-time updates.

---

## 1. Authentication Scenarios

### Current State
- **API Key**: Optional, stored in localStorage
- **No token refresh** mechanism
- **No server-side auth** - all client-side

### Edge Cases & Recommendations

#### 1.1 API Key Missing/Invalid
```typescript
// Edge case: User hasn't configured API key but Hermes requires it
// Current: Silently sends without key, Hermes rejects

// Recommendation: Add auth validation layer
async function hermesFetch(path: string, options: RequestInit = {}) {
  const { baseUrl, apiKey } = getSettings();
  
  // Check if endpoint requires auth
  const requiresAuth = ['/command', '/voice', '/task'].some(p => path.startsWith(p));
  if (requiresAuth && !apiKey) {
    throw new HermesAuthError('API key required but not configured');
  }
  
  // ...existing fetch logic
}

// Custom error type for better handling
class HermesAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HermesAuthError';
  }
}
```

#### 1.2 API Key Expiration
```typescript
// Edge case: API key expires during active session
// Current: No detection, requests fail silently

// Recommendation: Detect 401/403 and trigger re-auth flow
async function sendCommand(command: string) {
  try {
    const res = await hermesFetch('/command', { method: 'POST', ... });
    
    if (res.status === 401 || res.status === 403) {
      // Clear invalid key
      saveSettings({ baseUrl: getSettings().baseUrl, apiKey: undefined });
      // Trigger UI notification
      dispatchAuthError('Hermes API key expired. Please reconfigure in Settings.');
      throw new HermesAuthError('Invalid API key');
    }
  } catch (err) {
    // Handle as above
  }
}
```

#### 1.3 Multiple Users / Shared Device
```typescript
// Edge case: localStorage shared across users on same device
// Current: No user isolation

// Recommendation: Namespace storage by user ID if auth is added
const STORAGE_PREFIX = `psycho_user_${userId}_`;
function getStorageKey(key: string) {
  return `${STORAGE_PREFIX}${key}`;
}
```

---

## 2. Connection Error Handling

### Current State
- 30-second default timeout
- 3 retries with exponential backoff (1s, 2s, 4s delays)
- Offline queue for failed commands

### Edge Cases & Recommendations

#### 2.1 Network Transition (WiFi → Mobile → Offline)
```typescript
// Edge case: Network changes mid-request
// Current: Retry may continue on dead network

// Recommendation: Use Network Information API + abort on disconnect
export function useNetworkStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return online;
}

// Abort retries if network goes down
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3) {
  for (let i = 0; i <= maxRetries; i++) {
    if (!navigator.onLine) {
      throw new Error('Network offline - command queued');
    }
    try {
      return await fn();
    } catch (err) {
      if (i < maxRetries) {
        // Check network before waiting
        if (!navigator.onLine) {
          throw new Error('Network offline');
        }
        await new Promise(r => setTimeout(r, 1000 * 2 ** i));
      }
    }
  }
}
```

#### 2.2 CORS Errors
```typescript
// Edge case: Hermes deployed to different domain without CORS headers
// Current: No CORS handling

// Recommendation: Server-side proxy for production
// Client-side: Better error messaging
async function hermesFetch(path: string, options: RequestInit = {}) {
  try {
    const res = await fetch(/*...*/);
    return res;
  } catch (err) {
    if (err instanceof TypeError && err.message.includes('CORS')) {
      throw new HermesError(
        'CORS error - Hermes server may not allow requests from this domain. ' +
        'Check Hermes CORS configuration or use a proxy.',
        { cause: err }
      );
    }
    throw err;
  }
}
```

#### 2.3 SSL/TLS Certificate Issues
```typescript
// Edge case: Self-signed cert on dev/staging Hermes
// Current: fetch() will reject

// Recommendation: Document cert requirements, add bypass for dev only
// For dev: User must manually trust certificate in browser
// For prod: Enforce HTTPS + valid certs via health check
export async function checkStatus(): Promise<HermesStatus> {
  try {
    const url = `${getSettings().baseUrl}/health`;
    
    // Warn if HTTP in production environment
    if (url.startsWith('http://') && process.env.NODE_ENV === 'production') {
      console.warn('Hermes URL uses HTTP - use HTTPS in production');
    }
    
    const res = await hermesFetch('/health', { method: 'GET' }, 5000);
    // ...existing logic
  } catch (err) {
    if (err instanceof TypeError && err.message.includes('certificate')) {
      throw new HermesError(
        'SSL certificate error - Hermes may have invalid/self-signed certificate',
        { cause: err }
      );
    }
    throw err;
  }
}
```

---

## 3. Rate Limiting

### Current State
- **No rate limiting logic** in hermes.ts
- Hermes may have server-side limits (unknown)

### Edge Cases & Recommendations

#### 3.1 429 Too Many Requests
```typescript
// Edge case: User sends commands rapidly (chat typing)
// Current: All requests sent immediately, may hit limits

// Recommendation: Implement client-side rate limiting + queue
class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastRequestTime = 0;
  private minDelay = 100; // 100ms between requests
  
  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        const now = Date.now();
        const waitTime = Math.max(0, this.minDelay - (now - this.lastRequestTime));
        if (waitTime > 0) {
          await new Promise(r => setTimeout(r, waitTime));
        }
        this.lastRequestTime = Date.now();
        try {
          const result = await fn();
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
      this.processQueue();
    });
  }
  
  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;
    
    while (this.queue.length > 0) {
      const fn = this.queue.shift();
      if (fn) await fn();
    }
    
    this.processing = false;
  }
}

// Use in hermes.ts
const rateLimiter = new RateLimiter();

async function sendCommand(command: string) {
  return rateLimiter.add(() => innerSendCommand(command));
}
```

#### 3.2 Retry-After Header
```typescript
// Edge case: Hermes sends 429 with Retry-After header
// Current: Ignores retry-after, uses fixed exponential backoff

// Recommendation: Respect server's retry-after
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3) {
  let lastError: Error;
  let delay = 1000;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;
      
      // Check if it's a 429 with retry-after
      if ((err as any).status === 429 && (err as any).retryAfter) {
        const serverDelay = (err as any).retryAfter * 1000;
        delay = Math.max(delay, serverDelay); // Use longer of client/server delay
      }
      
      if (i < maxRetries) {
        await new Promise(r => setTimeout(r, delay * 2 ** i));
      }
    }
  }
  throw lastError;
}
```

#### 3.3 Burst Protection for Chat
```typescript
// Edge case: User rapidly sends chat messages (spam)
// Current: No debouncing

// Recommendation: Debounce user input for chat
import { useDebouncedCallback } from 'use-debounce';

function ChatInput() {
  const [message, setMessage] = useState('');
  
  // Only allow one message per 500ms
  const debouncedSend = useDebouncedCallback(async (msg: string) => {
    await sendCommand(msg);
  }, 500);
  
  const handleSend = () => {
    debouncedSend(message);
    setMessage('');
  };
}
```

---

## 4. Multi-Environment Support

### Current State
- **Hardcoded Tailscale IP**: `100.108.28.43:8080`
- **No environment variables** for client
- Settings page allows URL override (stored in localStorage)

### Edge Cases & Recommendations

#### 4.1 Environment-Specific Defaults

```typescript
// Current: const DEFAULT_HERMES_URL = "http://100.108.28.43:8080";

// Recommendation: Use environment-specific defaults
const DEFAULT_HERMES_URL = 
  process.env.NEXT_PUBLIC_HERMES_URL ||
  (process.env.NODE_ENV === 'development' 
    ? 'http://localhost:8080' 
    : 'http://100.108.28.43:8080');

// .env.example should include:
// NEXT_PUBLIC_HERMES_URL=http://localhost:8080
// NEXT_PUBLIC_HERMES_WS_URL=ws://localhost:8080/ws
```

#### 4.2 Environment Detection & Validation

```typescript
// Edge case: Dev URL used in production build

// Recommendation: Validate URL based on environment
function validateHermesUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    
    // Production must use HTTPS or trusted Tailscale IPs
    if (process.env.NODE_ENV === 'production') {
      const isTailscale = /^100\.[6-9][0-9]{2}\.\d{1,3}\.\d{1,3}$/.test(parsed.hostname);
      const isHTTPS = parsed.protocol === 'https:';
      const isTrusted = process.env.NEXT_PUBLIC_TRUSTED_HOSTS?.includes(parsed.hostname);
      
      if (!isHTTPS && !isTailscale && !isTrusted) {
        return 'Production Hermes URL must use HTTPS or be a Tailscale IP';
      }
    }
    
    return null; // Valid
  } catch {
    return 'Invalid URL format';
  }
}

// Use in Settings UI
function IntegrationsForm() {
  const [error, setError] = useState<string | null>(null);
  
  function handleChange(key: string, value: string) {
    if (key === 'hermesUrl') {
      const validationError = validateHermesUrl(value);
      setError(validationError);
    }
    // ...rest of logic
  }
}
```

#### 4.3 Hot-Switching Environments

```typescript
// Edge case: User switches Hermes URL during active session
// Current: Settings change requires page reload to fully take effect

// Recommendation: Invalidate caches on URL change
export function saveSettings(settings: HermesSettings) {
  const oldSettings = getSettings();
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  
  // If URL changed, clear task history and queue to avoid stale references
  if (oldSettings.baseUrl !== settings.baseUrl) {
    // Optional: Clear or migrate existing data
    // localStorage.removeItem(HISTORY_KEY);
    // localStorage.removeItem(QUEUE_KEY);
    
    // Trigger reconnection
    window.dispatchEvent(new CustomEvent('hermes-url-change', { detail: settings }));
  }
}
```

---

## 5. Message Persistence

### Current State
- **Task history** stored in localStorage (last 100 tasks)
- **Offline queue** stored in localStorage
- **No chat history** (only commands)

### Edge Cases & Recommendations

#### 5.1 localStorage Quota Exceeded

```typescript
// Edge case: localStorage 5MB limit reached (100 tasks × large results)
// Current: May throw QUOTA_EXCEEDED_ERR

// Recommendation: Implement automatic rotation + compression
function saveTaskHistory(tasks: HermesTask[]): void {
  const MAX_TASKS = 100;
  const MAX_PAYLOAD_SIZE = 4 * 1024 * 1024; // 4MB safety margin
  
  // Trim oldest first
  const trimmed = tasks.slice(-MAX_TASKS);
  const payload = JSON.stringify(trimmed);
  
  if (payload.length > MAX_PAYLOAD_SIZE) {
    // Aggressive trimming: remove results from old tasks
    const compressed = trimmed.map((t, i) => {
      if (i < trimmed.length - 20) { // Keep last 20 with full data
        return { ...t, result: null };
      }
      return t;
    });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(compressed));
  } else {
    localStorage.setItem(HISTORY_KEY, payload);
  }
}
```

#### 5.2 Cross-Device Sync

```typescript
// Edge case: User accesses from multiple devices
// Current: Each device has isolated history

// Recommendation: Optional backend sync via Supabase
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  taskId?: string; // Link to Hermes task
  createdAt: string;
  metadata?: Record<string, unknown>;
}

const DB_TABLE = 'hermes_chat_history';

export async function syncChatHistory(messages: ChatMessage[]) {
  // Only sync if user is authenticated
  const user = await supabase.auth.getUser();
  if (!user.data.user) return; // No auth, use localStorage only
  
  const { error } = await supabase
    .from(DB_TABLE)
    .upsert(messages.map(m => ({
      ...m,
      user_id: user.data.user!.id,
    })));
  
  if (error) {
    // Fall back to localStorage
    localStorage.setItem(HISTORY_KEY, JSON.stringify(messages));
  }
}
```

#### 5.3 Data Migration on Schema Change

```typescript
// Edge case: HermesTask schema changes, old data incompatible
// Current: No versioning, may crash on parse

// Recommendation: Version storage, add migration
const STORAGE_VERSION_KEY = 'psycho_storage_version';
const CURRENT_VERSION = 2;

export function getTaskHistory(): HermesTask[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const version = localStorage.getItem(STORAGE_VERSION_KEY);
    
    if (!raw) return [];
    
    let data = JSON.parse(raw);
    
    // Migrate from v1 to v2
    if (version !== CURRENT_VERSION) {
      data = migrateData(data, version, CURRENT_VERSION);
      localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION.toString());
    }
    
    return data;
  } catch {
    return [];
  }
}

function migrateData(data: any[], fromVersion: string | null, toVersion: number) {
  if (!fromVersion || parseInt(fromVersion) < 2) {
    // Add missing fields
    return data.map(t => ({
      ...t,
      metadata: t.metadata || {},
    }));
  }
  return data;
}
```

---

## 6. Real-Time Updates

### Current State
- **Polling only** via `sync.ts` (30-second interval)
- **No WebSockets or SSE** for instant updates
- Manual polling for task status

### Edge Cases & Recommendations

#### 6.1 Streaming Responses (Chat UX)

```typescript
// Edge case: Long-running commands make chat feel unresponsive
// Current: User waits entire command duration for response

// Recommendation: Implement SSE for streaming responses
// Server-side (Hermes needs to support this):
// GET /command/stream?command=...

// Client-side:
export async function sendCommandWithStreaming(
  command: string,
  onToken: (text: string) => void
): Promise<HermesTask> {
  const { baseUrl, apiKey } = getSettings();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
  };
  
  const res = await fetch(`${baseUrl}/command/stream`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ command }),
  });
  
  if (!res.body) throw new Error('No response body');
  
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      fullText += chunk;
      onToken(chunk); // Update UI incrementally
    }
  } finally {
    reader.releaseLock();
  }
  
  // Create task with full response
  return {
    id: crypto.randomUUID(),
    command,
    status: 'completed',
    result: fullText,
    createdAt: new Date().toISOString(),
  };
}
```

#### 6.2 Task Status Updates

```typescript
// Edge case: User doesn't know when task completes
// Current: Must manually refresh or wait 30s for sync

// Recommendation: WebSocket for real-time status
export function useTaskStatusWebSocket(taskId: string) {
  const [status, setStatus] = useState<HermesTaskStatus | null>(null);
  const [result, setResult] = useState<unknown>(null);
  
  useEffect(() => {
    const { baseUrl } = getSettings();
    const wsUrl = baseUrl.replace('http', 'ws') + `/ws/task/${taskId}`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'status') {
        setStatus(data.status);
      } else if (data.type === 'result') {
        setResult(data.result);
        setStatus('completed');
      } else if (data.type === 'error') {
        setStatus('failed');
      }
    };
    
    ws.onerror = () => {
      // Fall back to polling
      console.warn('WebSocket failed, falling back to polling');
    };
    
    return () => ws.close();
  }, [taskId]);
  
  return { status, result };
}
```

#### 6.3 Connection Recovery

```typescript
// Edge case: WebSocket disconnects mid-stream
// Current: No recovery

// Recommendation: Auto-reconnect with exponential backoff
function useWebSocketWithReconnect(url: string) {
  const [connected, setConnected] = useState(false);
  const [messageQueue, setMessageQueue] = useState<any[]>([]);
  
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectDelay = 1000;
    const maxDelay = 30000;
    
    function connect() {
      ws = new WebSocket(url);
      
      ws.onopen = () => {
        setConnected(true);
        reconnectDelay = 1000; // Reset on success
        
        // Flush queued messages
        messageQueue.forEach(msg => ws?.send(JSON.stringify(msg)));
        setMessageQueue([]);
      };
      
      ws.onclose = () => {
        setConnected(false);
        // Reconnect after delay
        setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, maxDelay);
      };
      
      ws.onerror = () => {
        ws?.close();
      };
    }
    
    connect();
    
    return () => ws?.close();
  }, [url]);
  
  return { connected, send: (msg: any) => { /* ... */ } };
}
```

---

## 7. Error States and User Feedback

### Current State
- Basic status dot (green/red)
- Inline error messages in task queue
- No toast notifications

### Edge Cases & Recommendations

#### 7.1 User-Friendly Error Messages

```typescript
// Edge case: Generic errors confuse users
// Current: "Hermes returned 500" or silent failures

// Recommendation: Map HTTP errors to user-friendly messages
function getHermesErrorMessage(status: number, error?: string): string {
  switch (status) {
    case 401:
      return 'Authentication failed. Please check your API key in Settings.';
    case 403:
      return 'Access denied. Your API key may not have permission for this action.';
    case 404:
      return 'Hermes endpoint not found. Check your Hermes URL in Settings.';
    case 408:
      return 'Request timed out. Hermes may be busy or unreachable.';
    case 429:
      return 'Too many requests. Please wait a moment before trying again.';
    case 500:
      return 'Hermes server error. Please try again in a few moments.';
    case 502:
      return 'Hermes gateway unavailable. Check if Hermes is running.';
    case 503:
      return 'Hermes is temporarily unavailable. Retry in a few moments.';
    case 504:
      return 'Gateway timeout. Hermes is taking too long to respond.';
    default:
      return error || `Hermes error (${status}). Check Settings if this persists.`;
  }
}
```

#### 7.2 Toast Notifications

```typescript
// Edge case: Errors silently fail without user awareness
// Current: Task shows "failed" but user may not notice

// Recommendation: Implement toast system for critical errors
import { toast } from 'sonner'; // or react-hot-toast

async function sendCommand(command: string) {
  try {
    const task = await innerSendCommand(command);
    return task;
  } catch (err) {
    const error = err as HermesError;
    
    // Always show auth errors
    if (error.name === 'HermesAuthError') {
      toast.error(error.message, {
        duration: 8000,
        action: {
          label: 'Go to Settings',
          onClick: () => router.push('/settings'),
        },
      });
    }
    
    // Show other errors only if persistent (after retries)
    if (error.retriesExhausted) {
      toast.error(error.message, { duration: 5000 });
    }
    
    throw error;
  }
}
```

#### 7.3 Loading States

```typescript
// Edge case: User doesn't know if request is processing
// Current: Simple "sending" state on button

// Recommendation: Detailed loading states with progress
type RequestState = 'idle' | 'connecting' | 'sending' | 'processing' | 'streaming' | 'completed' | 'failed';

function ChatInput() {
  const [state, setState] = useState<RequestState>('idle');
  const [progress, setProgress] = useState(0);
  
  async function handleSend() {
    setState('connecting');
    setProgress(10);
    
    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 10, 80));
      }, 200);
      
      await sendCommand(message);
      
      clearInterval(progressInterval);
      setProgress(100);
      setState('completed');
      
      setTimeout(() => {
        setState('idle');
        setProgress(0);
      }, 1000);
    } catch (err) {
      setState('failed');
    }
  }
  
  return (
    <div>
      {state === 'connecting' && <p>Connecting to Hermes...</p>}
      {state === 'sending' && <ProgressBar value={progress} />}
      {state === 'streaming' && <TypingIndicator />}
    </div>
  );
}
```

---

## 8. Security Concerns

### Current State
- API key in localStorage (accessible via XSS)
- No input sanitization
- Direct fetch to Hermes (no proxy)

### Edge Cases & Recommendations

#### 8.1 XSS via Command Injection

```typescript
// Edge case: User pastes malicious command containing <script>
// Current: Command stored and displayed without sanitization

// Recommendation: Sanitize all user input
import DOMPurify from 'dompurify';

function TaskRow({ task }: { task: HermesTask }) {
  // Sanitize before rendering
  const safeCommand = DOMPurify.sanitize(task.command);
  
  return (
    <div>
      <span>{safeCommand}</span>
      {task.result && (
        <pre>{DOMPurify.sanitize(String(task.result))}</pre>
      )}
    </div>
  );
}

// For HTML content from Hermes
function HermesResponse({ content }: { content: string }) {
  const sanitized = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'code', 'pre', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
  });
  
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
```

#### 8.2 API Key Exposure

```typescript
// Edge case: API key exposed via XSS, network inspection
// Current: Plain text in localStorage

// Recommendation:
// 1. Use httpOnly cookies via Next.js API route proxy (ideal)
// 2. Or encrypt key in localStorage (better than nothing)
// 3. Minimize key scope (read-only if possible)

// Option 2: Encrypted localStorage
import { AES, enc } from 'crypto-js';

const ENCRYPTION_KEY = 'psycho-encryption-key'; // Use env var in real app

export function saveSettings(settings: HermesSettings) {
  const encrypted = AES.encrypt(JSON.stringify(settings), ENCRYPTION_KEY).toString();
  localStorage.setItem(SETTINGS_KEY, encrypted);
}

export function getSettings(): HermesSettings {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return { baseUrl: DEFAULT_HERMES_URL };
  
  try {
    const decrypted = AES.decrypt(raw, ENCRYPTION_KEY).toString(enc.Utf8);
    return JSON.parse(decrypted);
  } catch {
    return { baseUrl: DEFAULT_HERMES_URL };
  }
}

// Better: API route proxy (recommended)
// Client calls: POST /api/hermes/command
// API route adds apiKey from server-side env var
// Key never touches client
```

#### 8.3 CSRF Protection

```typescript
// Edge case: Malicious site tricks user into sending Hermes commands
// Current: No CSRF protection

// Recommendation: Add CSRF token validation
// Note: Less critical if API key is required (attacker doesn't have it)
// But still good practice

// 1. Generate CSRF token on load
const CSRF_TOKEN_KEY = 'psycho_csrf_token';

function getCsrfToken(): string {
  let token = localStorage.getItem(CSRF_TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(CSRF_TOKEN_KEY, token);
  }
  return token;
}

// 2. Include in all requests
async function hermesFetch(path: string, options: RequestInit = {}) {
  const csrfToken = getCsrfToken();
  
  const headers = {
    ...options.headers,
    'X-CSRF-Token': csrfToken,
  };
  
  // ...rest of fetch logic
}
```

#### 8.4 CORS Configuration

```typescript
// Edge case: Malicious site makes requests to your Hermes
// Current: Relies on Hermes CORS config

// Recommendation: Document required Hermes CORS settings
/**
 * Hermes should configure CORS like this:
 * 
 * Allow-Origin: https://your-production-domain.com
 * Allow-Credentials: true (if using cookies)
 * Allow-Methods: GET, POST
 * Allow-Headers: Content-Type, Authorization, X-CSRF-Token
 * 
 * For development:
 * Allow-Origin: http://localhost:3000 (exact match, not *)
 */

// Client-side: Validate response is from expected origin
async function hermesFetch(path: string) {
  const res = await fetch(/*...*/);
  
  // Verify response origin (if CORS headers are set properly)
  const responseOrigin = res.headers.get('Access-Control-Allow-Origin');
  const expectedOrigin = window.location.origin;
  
  if (responseOrigin && responseOrigin !== '*' && responseOrigin !== expectedOrigin) {
    console.warn('Unexpected CORS origin:', responseOrigin);
  }
  
  return res;
}
```

---

## 9. Accessibility and Mobile Responsiveness

### Current State
- Basic React components
- No explicit ARIA attributes
- Unknown mobile behavior

### Edge Cases & Recommendations

#### 9.1 Screen Reader Support

```typescript
// Edge case: Blind users can't navigate chat
// Current: No ARIA labels

// Recommendation: Add comprehensive ARIA support
function ChatMessage({ message, role }: { message: string; role: 'user' | 'assistant' }) {
  return (
    <div
      role="article"
      aria-label={role === 'user' ? 'Your message' : 'Hermes response'}
      className="chat-message"
    >
      <span className="sr-only">{role === 'user' ? 'You' : 'Hermes'}:</span>
      <p>{message}</p>
    </div>
  );
}

function ChatInput() {
  const inputId = 'chat-input';
  
  return (
    <div role="form" aria-label="Send a message to Hermes">
      <label htmlFor={inputId} className="sr-only">
        Type your message
      </label>
      <input
        id={inputId}
        type="text"
        aria-describedby="chat-input-help"
        placeholder="Send a command to Hermes..."
      />
      <div id="chat-input-help" className="sr-only">
        Press Enter to send, Shift+Enter for new line
      </div>
    </div>
  );
}

// Announce async updates
function useLiveRegion() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const el = document.createElement('div');
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', priority);
    el.textContent = message;
    el.className = 'sr-only';
    document.body.appendChild(el);
    
    setTimeout(() => el.remove(), 1000);
  }, []);
  
  return announce;
}
```

#### 9.2 Keyboard Navigation

```typescript
// Edge case: Users who can't use mouse
// Current: Unknown keyboard support

// Recommendation: Full keyboard navigation
function ChatInterface() {
  const messagesRef = useRef<HTMLDivElement>(null);
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Escape: Clear input
    if (e.key === 'Escape') {
      setInput('');
      inputRef.current?.focus();
    }
    
    // Arrow Up: Focus previous message
    if (e.key === 'ArrowUp' && e.altKey) {
      e.preventDefault();
      focusPreviousMessage();
    }
    
    // Arrow Down: Focus next message  
    if (e.key === 'ArrowDown' && e.altKey) {
      e.preventDefault();
      focusNextMessage();
    }
    
    // Ctrl+Enter: Send
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSend();
    }
  }, []);
  
  return (
    <div
      ref={messagesRef}
      tabIndex={0}
      role="log"
      aria-label="Chat messages"
      onKeyDown={handleKeyDown}
    />
  );
}
```

#### 9.3 Mobile Responsiveness

```typescript
// Edge case: Voice recording on mobile, small screens
// Current: Unknown mobile behavior

// Recommendation: Mobile-first design with touch optimization
import { useMediaQuery } from 'react-responsive';

function ChatInterface() {
  const isMobile = useMediaQuery({ maxWidth: 640 });
  const isTouchDevice = 'ontouchstart' in window;
  
  return (
    <div className={`chat-interface ${isMobile ? 'mobile' : 'desktop'}`}>
      {/* Full-screen chat on mobile */}
      {isMobile && (
        <style>{`
          .chat-interface.mobile {
            flex-direction: column;
            height: 100vh;
          }
          .chat-interface.mobile .messages {
            flex: 1;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch; /* Smooth scroll on iOS */
          }
          .chat-interface.mobile .input-area {
            padding: env(safe-area-inset-bottom, 16px); /* iPhone home indicator */
          }
        `}</style>
      )}
      
      {/* Touch-friendly voice button */}
      {isTouchDevice && (
        <button
          className="voice-button"
          style={{
            minHeight: 48, // WCAG touch target size
            minWidth: 48,
          }}
          // Long-press for voice (more natural on mobile)
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
        >
          🎤 Hold to speak
        </button>
      )}
    </div>
  );
}

// Prevent zoom on input focus (mobile UX)
// Add to CSS:
// input, textarea {
//   font-size: 16px; // Prevents iOS zoom
// }
```

#### 9.4 Reduced Motion

```typescript
// Edge case: Users with vestibular disorders
// Current: Animations everywhere (pulse, spin, fade)

// Recommendation: Respect prefers-reduced-motion
function StatusIndicator() {
  const prefersReducedMotion = useMediaQuery({ 
    query: '(prefers-reduced-motion: reduce)' 
  });
  
  return (
    <span
      className={`status-dot ${prefersReducedMotion ? 'no-animation' : 'animate-pulse'}`}
      style={{
        animation: prefersReducedMotion ? 'none' : undefined,
      }}
    />
  );
}

// CSS:
// @media (prefers-reduced-motion: reduce) {
//   .animate-pulse {
//     animation: none;
//   }
//   .animate-spin {
//     animation: none;
//     border: 2px solid currentColor;
//   }
// }
```

---

## 10. Implementation Recommendations

### 10.1 Proposed Architecture for Chat Feature

```
┌─────────────────────────────────────────────────────────────┐
│                     Chat UI (New Component)                  │
├─────────────────────────────────────────────────────────────┤
│  - Conversational message bubbles (user/assistant)          │
│  - Message input with send button                           │
│  - Streaming response display                               │
│  - Message history with infinite scroll                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  useChat Hook (Client-Side)                  │
├─────────────────────────────────────────────────────────────┤
│  - Message state management                                 │
│  - Optimistic UI updates                                    │
│  - Retry logic with exponential backoff                     │
│  - WebSocket connection management                          │
│  - Streaming SSE handler                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Enhanced hermes.ts Library                   │
├─────────────────────────────────────────────────────────────┤
│  - sendChatMessage() - conversational endpoint              │
│  - getChatHistory() - fetch conversation history            │
│  - streamResponse() - SSE client for streaming              │
│  - connectWebSocket() - real-time updates                   │
│  - Existing: sendCommand(), getTaskResult(), etc.           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Optional: Next.js API Route Proxy               │
├─────────────────────────────────────────────────────────────┤
│  - /api/hermes/chat - server-side proxy                     │
│  - Stores API key securely (not in client)                  │
│  - Adds auth headers, CSRF validation                       │
│  - Rate limiting per user/IP                                │
│  - Caching for repeated queries                             │
└─────────────────────────────────────────────────────────────┘
```

### 10.2 File Structure

```
src/
├── lib/
│   ├── hermes.ts              # Enhanced with chat methods
│   ├── hermes-chat.ts         # New: Chat-specific utilities
│   ├── hermes-websocket.ts    # New: WebSocket client
│   └── sync.ts                # Enhanced with real-time support
├── hooks/
│   └── useChat.ts             # New: Chat state management
├── components/
│   └── chat/
│       ├── ChatInterface.tsx  # Main chat UI
│       ├── ChatMessage.tsx    # Individual message bubble
│       ├── ChatInput.tsx      # Input area
│       └── StreamingText.tsx  # Typewriter effect for streaming
└── modules/
    └── hermes/
        └── ChatPage.tsx       # New: Full-page chat view
```

### 10.3 Core Implementation: useChat Hook

```typescript
// src/hooks/useChat.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import {
  sendChatMessage,
  streamResponse,
  getChatHistory,
  saveChatHistory as saveHistoryLocal,
} from '@/lib/hermes-chat';
import { useWebSocket } from '@/lib/hermes-websocket';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  status?: 'sending' | 'sent' | 'error';
}

export function useChat(options: {
  enableStreaming?: boolean;
  enableWebSocket?: boolean;
  persistLocally?: boolean;
} = {}) {
  const {
    enableStreaming = true,
    enableWebSocket = true,
    persistLocally = true,
  } = options;
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Load history on mount
  useEffect(() => {
    const history = getChatHistory();
    setMessages(history);
  }, []);
  
  // WebSocket for real-time updates
  const { connected: wsConnected, lastMessage } = useWebSocket(
    enableWebSocket ? '/ws/chat' : null
  );
  
  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;
    
    const { type, data } = lastMessage;
    
    if (type === 'assistant_response') {
      setMessages(prev => {
        const updated = prev.map(m =>
          m.id === data.messageId
            ? { ...m, content: m.content + data.chunk, status: 'sent' as const }
            : m
        );
        return updated;
      });
    }
  }, [lastMessage]);
  
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;
      
      setIsLoading(true);
      setError(null);
      
      // Create user message
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: content.trim(),
        createdAt: new Date().toISOString(),
        status: 'sent',
      };
      
      // Optimistic update
      setMessages(prev => [...prev, userMessage]);
      
      // Create placeholder for assistant response
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
        status: 'sending',
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      try {
        abortControllerRef.current = new AbortController();
        
        if (enableStreaming) {
          // Streaming response
          await streamResponse(
            content.trim(),
            (chunk: string) => {
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantMessage.id
                    ? { ...m, content: m.content + chunk }
                    : m
                )
              );
            },
            abortControllerRef.current.signal
          );
          
          // Mark as complete
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantMessage.id
                ? { ...m, status: 'sent' as const }
                : m
            )
          );
        } else {
          // Non-streaming
          const response = await sendChatMessage(content.trim());
          
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantMessage.id
                ? { ...m, content: response.content, status: 'sent' as const }
                : m
            )
          );
        }
        
        // Persist to localStorage
        if (persistLocally) {
          saveHistoryLocal([...messages, userMessage, assistantMessage]);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMessage);
        
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMessage.id
              ? { ...m, content: errorMessage, status: 'error' as const }
              : m
          )
        );
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [isLoading, enableStreaming, persistLocally, messages]
  );
  
  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);
  
  const clearChat = useCallback(() => {
    setMessages([]);
    if (persistLocally) {
      localStorage.removeItem('psycho_hermes_chat_history');
    }
  }, [persistLocally]);
  
  return {
    messages,
    isLoading,
    error,
    sendMessage,
    stopGeneration,
    clearChat,
    wsConnected,
  };
}
```

### 10.4 Migration Path

**Phase 1: Core Infrastructure**
1. Add environment variables (`NEXT_PUBLIC_HERMES_URL`)
2. Enhance `hermes.ts` with better error types and validation
3. Create `hermes-chat.ts` with chat-specific methods
4. Implement localStorage persistence for chat history

**Phase 2: Chat UI**
1. Create `ChatInterface.tsx` component
2. Implement `useChat` hook with optimistic updates
3. Add streaming support (SSE)
4. Build `ChatMessage` and `ChatInput` components

**Phase 3: Real-Time**
1. Add WebSocket support in Hermes backend
2. Implement `useWebSocket` hook
3. Connect real-time task status updates
4. Add reconnection logic

**Phase 4: Polish**
1. Accessibility (ARIA, keyboard nav)
2. Mobile responsiveness
3. Toast notifications
4. Rate limiting and debouncing
5. Security hardening (XSS, CSRF)

---

## Summary Table

| Category | Key Edge Cases | Priority |
|----------|---------------|----------|
| **Authentication** | Missing API key, expired tokens, multi-user | High |
| **Connection** | Network transitions, CORS, SSL errors | High |
| **Rate Limiting** | 429 handling, burst protection, retry-after | Medium |
| **Environments** | Dev/staging/prod URLs, hot-switching, validation | High |
| **Persistence** | Storage quota, cross-device sync, migrations | Medium |
| **Real-Time** | Streaming (SSE), WebSocket, reconnection | High |
| **Error States** | User-friendly messages, toasts, loading states | High |
| **Security** | XSS sanitization, API key encryption, CSRF | High |
| **Accessibility** | Screen readers, keyboard nav, reduced motion | Medium |
| **Mobile** | Touch optimization, safe areas, prevent zoom | Medium |
