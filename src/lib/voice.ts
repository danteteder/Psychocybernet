"use client";

// Voice recording utility using Web Audio API
// Records audio from the microphone, returns a Blob for Hermes STT

export interface VoiceRecorder {
  start: () => Promise<void>;
  stop: () => Promise<Blob>;
  isRecording: boolean;
}

let mediaRecorder: MediaRecorder | null = null;
let chunks: Blob[] = [];
let stream: MediaStream | null = null;

/** Check if browser supports audio recording */
export function isVoiceSupported(): boolean {
  return typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined";
}

/** Start recording audio from microphone */
export async function startRecording(): Promise<void> {
  if (mediaRecorder?.state === "recording") return;

  stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  chunks = [];

  // Prefer webm/opus, fallback to whatever the browser supports
  const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"
    : "audio/webm";

  mediaRecorder = new MediaRecorder(stream, { mimeType });
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  mediaRecorder.start(250); // collect data every 250ms
}

/** Stop recording and return the audio as a Blob */
export async function stopRecording(): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder || mediaRecorder.state !== "recording") {
      reject(new Error("Not recording"));
      return;
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: mediaRecorder?.mimeType || "audio/webm" });
      chunks = [];
      // Release the microphone
      stream?.getTracks().forEach((t) => t.stop());
      stream = null;
      resolve(blob);
    };

    mediaRecorder.stop();
  });
}

/** Check if currently recording */
export function isRecording(): boolean {
  return mediaRecorder?.state === "recording";
}
