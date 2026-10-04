"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";

const MIN_SECONDS = 10; // MusicAPI's create-voice requires >10s of audio

export function VoiceRecorderModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function startRecording() {
    setError(null);
    setBlob(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser doesn't support microphone recording (or the page isn't on https/localhost).");
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      const reason =
        name === "NotAllowedError"
          ? "Microphone access was blocked -- allow it for this site in the browser's address-bar permissions and try again."
          : name === "NotFoundError"
            ? "No microphone was found on this device."
            : name === "NotReadableError"
              ? "Another app is already using the microphone."
              : `Couldn't access the microphone${name ? ` (${name})` : ""}.`;
      setError(reason);
      return;
    }

    try {
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        setBlob(new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" }));
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (err) {
      stream.getTracks().forEach((t) => t.stop());
      setError(`Couldn't start recording: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  async function handleSave() {
    if (!blob) return;
    if (!name.trim()) {
      setError("Give this voice a name");
      return;
    }
    if (seconds < MIN_SECONDS) {
      setError(`Recording needs to be at least ${MIN_SECONDS}s long`);
      return;
    }

    setSaving(true);
    setError(null);
    const form = new FormData();
    form.set("audio", blob, "recording.webm");
    form.set("name", name.trim());

    const res = await fetch("/api/voice-personas", { method: "POST", body: form });
    const data = await res.json().catch(() => null);
    setSaving(false);

    if (!res.ok) {
      setError(data?.error ?? "Voice creation failed");
      return;
    }
    onCreated();
    onClose();
  }

  function handleClose() {
    if (recording) stopRecording();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={handleClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-5"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Record a voice</h3>
          <button type="button" onClick={handleClose} className="text-zinc-500 hover:text-zinc-100" aria-label="Close">
            ✕
          </button>
        </div>

        <p className="text-xs text-zinc-500">
          Read something out loud for at least {MIN_SECONDS} seconds, alone and clearly -- this becomes the singer
          voice for future generations.
        </p>

        <label className="flex flex-col gap-1 text-sm">
          Voice name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. My voice"
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
          />
        </label>

        <div className="flex flex-col items-center gap-3 rounded-lg border border-zinc-800 bg-black/40 p-5">
          {recording && (
            <div className="flex items-center gap-2 text-xs font-medium text-red-400">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Recording…
            </div>
          )}
          <div className={`text-2xl font-mono ${recording ? "text-red-400" : "text-zinc-300"}`}>
            {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}
          </div>

          {!recording ? (
            <button
              type="button"
              onClick={startRecording}
              className="flex items-center gap-2 rounded-full bg-red-500 text-white px-5 py-2 text-sm font-medium hover:bg-red-400 transition-colors"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-white" />
              {blob ? "Record again" : "Start recording"}
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-2 rounded-full bg-zinc-100 text-black px-5 py-2 text-sm font-medium hover:bg-white transition-colors"
            >
              <span className="h-2.5 w-2.5 bg-red-500" />
              Stop
            </button>
          )}

          {blob && !recording && <audio controls src={URL.createObjectURL(blob)} className="w-full mt-1" />}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="button"
          onClick={handleSave}
          disabled={!blob || saving}
          className="self-start rounded-full bg-[#F5B900] text-black px-6 py-2.5 text-sm font-medium hover:bg-[#ffcc33] transition-colors disabled:opacity-50"
        >
          {saving ? "Creating voice..." : "Save voice"}
        </button>
      </div>
    </div>,
    document.body,
  );
}
