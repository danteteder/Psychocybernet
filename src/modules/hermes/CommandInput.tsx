"use client";

// Text + voice command input for Hermes
// Type a command or hold the mic button to record voice

import { useState, type KeyboardEvent } from "react";
import { Mic, MicOff, Send } from "lucide-react";
import { sendCommand, sendVoiceCommand, type HermesTask } from "@/lib/hermes";
import { startRecording, stopRecording, isRecording, isVoiceSupported } from "@/lib/voice";

interface CommandInputProps {
  onTaskCreated: (task: HermesTask) => void;
}

export function CommandInput({ onTaskCreated }: CommandInputProps) {
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!text.trim() || sending) return;
    setSending(true);
    const task = await sendCommand(text.trim());
    onTaskCreated(task);
    setText("");
    setSending(false);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function toggleRecording() {
    if (recording) {
      // Stop and send
      setRecording(false);
      setSending(true);
      try {
        const blob = await stopRecording();
        const task = await sendVoiceCommand(blob);
        onTaskCreated(task);
      } finally {
        setSending(false);
      }
    } else {
      // Start recording
      try {
        await startRecording();
        setRecording(true);
      } catch (err) {
        console.error("Mic access denied:", err);
      }
    }
  }

  const voiceOk = isVoiceSupported();

  return (
    <div className="flex items-center gap-2 border border-border rounded-lg px-3 py-2
                    bg-bg-subtle focus-within:border-text-muted/40 transition-colors">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={recording ? "Recording..." : "Send a command to Hermes..."}
        disabled={recording || sending}
        className="flex-1 bg-transparent text-sm placeholder:text-text-muted/30
                   focus:outline-none disabled:opacity-50"
      />

      {/* Voice button */}
      {voiceOk && (
        <button
          onClick={toggleRecording}
          disabled={sending}
          className={`p-1.5 rounded transition-colors ${
            recording
              ? "text-red-400 bg-red-400/10 animate-pulse"
              : "text-text-muted hover:text-text"
          }`}
          title={recording ? "Stop recording" : "Record voice command"}
        >
          {recording ? <MicOff size={16} /> : <Mic size={16} />}
        </button>
      )}

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={!text.trim() || sending}
        className="p-1.5 rounded text-text-muted hover:text-text
                   disabled:opacity-20 transition-colors"
        title="Send command"
      >
        <Send size={16} />
      </button>
    </div>
  );
}
