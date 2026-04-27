"use client";

import { useState, useCallback } from "react";
import { Mic, MicOff } from "lucide-react";

// Voice input button using Web Speech API
// Captures speech and returns the transcript
interface VoiceButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
}

export function VoiceButton({ onTranscript, className = "" }: VoiceButtonProps) {
  const [listening, setListening] = useState(false);

  const toggleListening = useCallback(() => {
    // Web Speech API: available in most modern browsers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SpeechRecognitionCtor = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      alert("Voice input not supported in this browser");
      return;
    }

    if (listening) {
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
    };

    recognition.onerror = () => setListening(false);

    recognition.start();
  }, [listening, onTranscript]);

  return (
    <button
      onClick={toggleListening}
      title={listening ? "Stop listening" : "Voice input"}
      className={`flex items-center justify-center rounded p-2 transition-colors
                  ${listening ? "bg-active text-bg" : "text-text-muted hover:bg-hover hover:text-text"}
                  ${className}`}
    >
      {listening ? (
        <MicOff size={16} strokeWidth={1.5} />
      ) : (
        <Mic size={16} strokeWidth={1.5} />
      )}
    </button>
  );
}
