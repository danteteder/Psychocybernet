"use client";

// Hermes Chat Component: Conversational interface for interacting with Hermes
// Transforms command/task paradigm into chat messages with streaming support

import { useCallback, useEffect, useRef, useState } from "react";
import { 
  Send, 
  Mic, 
  MicOff, 
  Loader2, 
  Check, 
  X, 
  AlertCircle,
  Wifi,
  WifiOff,
  Bot,
  User
} from "lucide-react";
import { 
  sendCommand, 
  sendVoiceCommand, 
  checkStatus,
  getTaskResult,
  type HermesTask,
  type HermesStatus,
  getSettings,
  saveSettings
} from "@/lib/hermes";
import { startRecording, stopRecording, isRecording, isVoiceSupported } from "@/lib/voice";

// ── Types ──

export type MessageType = "user" | "assistant" | "system" | "error";

export interface ChatMessage {
  id: string;
  type: MessageType;
  content: string;
  timestamp: string;
  taskId?: string;
  status?: HermesTask["status"];
}

interface ChatState {
  messages: ChatMessage[];
  isTyping: boolean;
  isRecording: boolean;
  hermesStatus: HermesStatus;
  networkOnline: boolean;
}

// ── Constants ──

const CHAT_HISTORY_KEY = "psycho_hermes_chat_history";
const MAX_CHAT_MESSAGES = 50;
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 20;
const HERMES_STATUS_CHECK_INTERVAL_MS = 30000;

function loadChatHistory(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CHAT_HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return parsed.slice(-MAX_CHAT_MESSAGES);
  } catch {
    return [];
  }
}

function saveChatHistory(messages: ChatMessage[]): void {
  try {
    const toSave = messages.slice(-MAX_CHAT_MESSAGES);
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(toSave));
  } catch (error) {
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      // Trim to half and retry
      const trimmed = messages.slice(-Math.max(1, Math.floor(MAX_CHAT_MESSAGES / 2)));
      localStorage.removeItem(CHAT_HISTORY_KEY);
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(trimmed));
    }
  }
}

// ── Network Status Hook ──

function useNetworkStatus() {
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return online;
}

// ── Main Component ──

interface HermesChatProps {
  onSettingsChange?: (settings: { baseUrl: string; apiKey?: string }) => void;
}

export function HermesChat({ onSettingsChange }: HermesChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hermesStatus, setHermesStatus] = useState<HermesStatus>({ online: false });
  const [showSettings, setShowSettings] = useState(false);
  const [editedUrl, setEditedUrl] = useState("");
  
  const networkOnline = useNetworkStatus();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load history on mount
  useEffect(() => {
    const history = loadChatHistory();
    setMessages(history);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Check Hermes status periodically
  useEffect(() => {
    checkHermesStatus();
    const interval = setInterval(checkHermesStatus, HERMES_STATUS_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Update status when network changes
  useEffect(() => {
    if (!networkOnline) {
      setHermesStatus({ online: false });
    } else {
      checkHermesStatus();
    }
  }, [networkOnline]);

  async function checkHermesStatus() {
    const status = await checkStatus();
    setHermesStatus(status);
  }

function addMessage(message: ChatMessage) {
  setMessages((prev) => {
    const updated = [...prev, message];
    return updated;
  });
}

// Persist to localStorage after render
useEffect(() => {
  if (messages.length > 0) {
    saveChatHistory(messages);
  }
}, [messages]);

  async function handleSendCommand(command: string) {
    if (!command.trim() || !networkOnline) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      type: "user",
      content: command.trim(),
      timestamp: new Date().toISOString(),
    };
    addMessage(userMessage);
    setInputText("");
    setIsTyping(true);

    try {
      // Send to Hermes
      const task = await sendCommand(command.trim());
      
      // Add assistant acknowledgment
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        type: "assistant",
        content: `Task started. Checking status...`,
        timestamp: new Date().toISOString(),
        taskId: task.id,
        status: task.status,
      };
      addMessage(assistantMessage);

      // Poll for result
      // Note: In production, would use AbortController for cleanup
      pollTaskResult(task.id).catch((err) => {
        console.error("Polling failed:", err);
      });
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        type: "error",
        content: error instanceof Error && error.name === "HermesAuthError"
          ? "Authentication failed. Please check your API key in Settings."
          : "Failed to send command. Please try again.",
        timestamp: new Date().toISOString(),
      };
      addMessage(errorMessage);
    } finally {
      setIsTyping(false);
    }
  }

  async function pollTaskResult(taskId: string, maxAttempts = MAX_POLL_ATTEMPTS) {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

      const task = await getTaskResult(taskId);

      if (!task) continue;

      if (task.status === "completed") {
        const resultMessage: ChatMessage = {
          id: crypto.randomUUID(),
          type: "assistant",
          content: typeof task.result === "string" 
            ? task.result 
            : JSON.stringify(task.result, null, 2),
          timestamp: new Date().toISOString(),
          taskId: task.id,
          status: task.status,
        };
        addMessage(resultMessage);
        break;
      } else if (task.status === "failed") {
        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          type: "error",
          content: task.error || "Task failed",
          timestamp: new Date().toISOString(),
          taskId: task.id,
          status: task.status,
        };
        addMessage(errorMessage);
        break;
      }

      // Still running - show timeout message at end
      if (i === maxAttempts - 1) {
        const timeoutMessage: ChatMessage = {
          id: crypto.randomUUID(),
          type: "system",
          content: "Task is taking longer than expected. Check the task queue for updates.",
          timestamp: new Date().toISOString(),
          taskId: task.id,
        };
        addMessage(timeoutMessage);
      }
    }
  }

  async function handleVoiceCommand() {
    if (isRecording) {
      // Stop and send
      setIsRecording(false);
      setIsTyping(true);
      try {
        const blob = await stopRecording();
        
        // Validate blob before sending
        if (blob.size === 0) {
          throw new Error("Empty audio recording");
        }
        
        const voiceMessage: ChatMessage = {
          id: crypto.randomUUID(),
          type: "user",
          content: "🎤 Voice message",
          timestamp: new Date().toISOString(),
        };
        addMessage(voiceMessage);

        const task = await sendVoiceCommand(blob);
        
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          type: "assistant",
          content: `Voice command received. Processing...`,
          timestamp: new Date().toISOString(),
          taskId: task.id,
          status: task.status,
        };
        addMessage(assistantMessage);

        pollTaskResult(task.id).catch((err) => {
          console.error("Voice command polling failed:", err);
        });
      } catch (error) {
        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          type: "error",
          content: error instanceof Error && error.name === "HermesAuthError"
            ? "Authentication failed. Please check your API key in Settings."
            : "Voice command failed. Please try again.",
          timestamp: new Date().toISOString(),
        };
        addMessage(errorMessage);
      } finally {
        setIsTyping(false);
      }
    } else {
      // Start recording
      try {
        await startRecording();
        setIsRecording(true);
      } catch (err) {
        console.error("Mic access denied:", err);
        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          type: "error",
          content: "Microphone access denied. Please enable mic permissions.",
          timestamp: new Date().toISOString(),
        };
        addMessage(errorMessage);
      }
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendCommand(inputText);
    }
  }

  function clearChat() {
    setMessages([]);
    localStorage.removeItem(CHAT_HISTORY_KEY);
  }

  function handleSaveSettings() {
    const { apiKey } = getSettings();
    saveSettings({ baseUrl: editedUrl, apiKey });
    onSettingsChange?.({ baseUrl: editedUrl, apiKey });
    setShowSettings(false);
    checkHermesStatus();
  }

  function openSettingsEditor() {
    const { baseUrl } = getSettings();
    setEditedUrl(baseUrl);
    setShowSettings(true);
  }

  const voiceOk = isVoiceSupported();

  return (
    <div className="flex flex-col h-full bg-bg-subtle">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-bg" role="banner">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Bot size={16} className="text-text-muted" aria-hidden="true" />
            <span className="text-xs font-medium text-text">Hermes Chat</span>
          </div>
          
          {/* Status indicator */}
          <div className="flex items-center gap-1.5" role="status" aria-live="polite">
            {networkOnline ? (
              hermesStatus.online ? (
                <div className="flex items-center gap-1 text-xs text-green-500">
                  <Wifi size={10} aria-hidden="true" />
                  <span>Online</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-text-muted/50">
                  <WifiOff size={10} aria-hidden="true" />
                  <span>Offline</span>
                </div>
              )
            ) : (
              <div className="flex items-center gap-1 text-xs text-red-400">
                <WifiOff size={10} aria-hidden="true" />
                <span>No Network</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const { baseUrl } = getSettings();
              window.open(baseUrl, "_blank", "noopener,noreferrer");
            }}
            className="text-[10px] text-text-muted/50 hover:text-text transition-colors"
            title="Open Hermes gateway in browser"
          >
            Open UI
          </button>
          <button
            onClick={openSettingsEditor}
            className="text-[10px] text-text-muted/50 hover:text-text transition-colors"
            title="Configure Hermes URL"
            aria-label="Open settings"
          >
            Settings
          </button>
          <button
            onClick={clearChat}
            className="text-[10px] text-text-muted/50 hover:text-red-400 transition-colors"
            title="Clear chat history"
            aria-label="Clear chat history"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div 
          className="absolute inset-0 bg-black/50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-title"
        >
          <div className="bg-bg rounded-lg p-4 w-80 shadow-xl border border-border">
            <h3 id="settings-title" className="text-sm font-medium mb-3">Hermes Configuration</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-text-muted/70 uppercase tracking-wider mb-1 block">
                  Base URL
                </label>
                <input
                  type="text"
                  value={editedUrl}
                  onChange={(e) => setEditedUrl(e.target.value)}
                  className="w-full text-xs bg-bg-subtle border border-border rounded px-2 py-1.5 focus:outline-none focus:border-text-muted/40"
                  placeholder="http://100.108.28.43:8080"
                />
                <p className="text-[9px] text-text-muted/40 mt-1">
                  Set NEXT_PUBLIC_HERMES_URL in .env.local to override default
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 text-xs bg-bg-subtle hover:bg-hover border border-border rounded px-3 py-1.5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="flex-1 text-xs bg-text text-bg hover:opacity-90 rounded px-3 py-1.5 transition-opacity"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3" 
        role="log" 
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <div className="space-y-2">
              <Bot size={32} className="mx-auto text-text-muted/30" />
              <p className="text-xs text-text-muted/40">
                Start a conversation with Hermes
              </p>
              <p className="text-[10px] text-text-muted/30">
                Type a command or use voice input
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))
        )}
        
        {isTyping && (
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-full bg-text/10 flex items-center justify-center flex-shrink-0">
              <Bot size={14} className="text-text/70" />
            </div>
            <div className="bg-bg border border-border/60 rounded-lg rounded-tl-none px-3 py-2 max-w-[80%]">
              <Loader2 size={12} className="animate-spin text-text-muted" />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border/60 p-3 bg-bg">
        <div className="flex items-center gap-2">
          {/* Voice button */}
          {voiceOk && (
            <button
              onClick={handleVoiceCommand}
              disabled={!networkOnline || isTyping}
              className={`p-2 rounded-lg transition-colors ${
                isRecording
                  ? "bg-red-400/10 text-red-400 animate-pulse"
                  : "bg-bg-subtle text-text-muted hover:text-text"
              } disabled:opacity-30`}
              title={isRecording ? "Stop recording" : "Record voice command"}
              aria-label={isRecording ? "Stop recording" : "Record voice command"}
              aria-pressed={isRecording}
            >
              {isRecording ? <MicOff size={16} aria-hidden="true" /> : <Mic size={16} aria-hidden="true" />}
            </button>
          )}

          {/* Text input */}
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              !networkOnline
                ? "No network connection"
                : isRecording
                ? "Recording..."
                : "Type a command..."
            }
            disabled={!networkOnline || isRecording || isTyping}
            className="flex-1 bg-bg-subtle border border-border rounded-lg px-3 py-2 text-xs
                       placeholder:text-text-muted/30 focus:outline-none focus:border-text-muted/40
                       disabled:opacity-50"
            aria-label="Type a command"
          />

          {/* Send button */}
          <button
            onClick={() => handleSendCommand(inputText)}
            disabled={!inputText.trim() || !networkOnline || isTyping}
            className="p-2 rounded-lg bg-text text-bg hover:opacity-90 transition-opacity
                       disabled:opacity-30 disabled:cursor-not-allowed"
            title="Send command"
            aria-label="Send command"
          >
            <Send size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Helper text */}
        <p className="text-[9px] text-text-muted/30 mt-2 text-center">
          Press Enter to send • Voice commands supported
        </p>
      </div>
    </div>
  );
}

// ── Message Bubble Component ──

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.type === "user";
  const isError = message.type === "error";
  const isSystem = message.type === "system";

  return (
    <div className={`flex items-start gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser
            ? "bg-text/10"
            : isError
            ? "bg-red-400/10"
            : isSystem
            ? "bg-text-muted/10"
            : "bg-text/10"
        }`}
      >
        {isUser ? (
          <User size={14} className="text-text/70" />
        ) : isError ? (
          <AlertCircle size={14} className="text-red-400" />
        ) : isSystem ? (
          <AlertCircle size={14} className="text-text-muted/50" />
        ) : (
          <Bot size={14} className="text-text/70" />
        )}
      </div>

      {/* Message content */}
      <div
        className={`rounded-lg rounded-tl-none px-3 py-2 max-w-[80%] ${
          isUser
            ? "bg-text text-bg rounded-tl-none"
            : isError
            ? "bg-red-400/10 border border-red-400/30 text-red-300"
            : isSystem
            ? "bg-bg-subtle border border-border/60 text-text-muted"
            : "bg-bg border border-border/60"
        }`}
      >
        <p className={`text-xs whitespace-pre-wrap ${isUser ? "" : ""}`}>
          {message.content}
        </p>
        
        {/* Metadata */}
        <div className="flex items-center gap-2 mt-1.5">
          <span className={`text-[9px] ${isUser ? "opacity-60" : "text-text-muted/40"}`}>
            {new Date(message.timestamp).toLocaleTimeString([], { 
              hour: "2-digit", 
              minute: "2-digit" 
            })}
          </span>
          
          {message.status && (
            <span className="text-[9px] text-text-muted/30">
              {message.status === "completed" && <Check size={9} className="inline" />}
              {message.status === "running" && <Loader2 size={9} className="inline animate-spin" />}
              {message.status === "failed" && <X size={9} className="inline" />}
              {message.status === "pending" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-text-muted/40" />}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
