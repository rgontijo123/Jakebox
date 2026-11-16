"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { translateApiError } from "@/lib/i18n/apiErrors";

const MIN_SECONDS = 10; // MusicAPI's create-voice requires >10s of audio

export function VoiceRecorderModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const { t } = useLocale();
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
      setError(t("voice_err_unsupported"));
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      const reason =
        name === "NotAllowedError"
          ? t("voice_err_blocked")
          : name === "NotFoundError"
            ? t("voice_err_no_mic")
            : name === "NotReadableError"
              ? t("voice_err_busy")
              : t("voice_err_access", { detail: name ? ` (${name})` : "" });
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
      // Recompute from a wall-clock timestamp rather than trusting the
      // interval to fire once a second -- mobile browsers throttle (or
      // fully suspend) setInterval when the tab/screen goes to the
      // background, which is exactly what happens here if you're reading
      // something aloud without looking at the phone. A naive counter
      // just freezes; this self-corrects whenever the tick does fire.
      const startedAt = Date.now();
      timerRef.current = setInterval(() => setSeconds(Math.floor((Date.now() - startedAt) / 1000)), 500);
    } catch (err) {
      stream.getTracks().forEach((t) => t.stop());
      setError(t("voice_err_start", { detail: err instanceof Error ? err.message : String(err) }));
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
      setError(t("voice_err_name"));
      return;
    }
    if (seconds < MIN_SECONDS) {
      setError(t("voice_err_short", { s: MIN_SECONDS }));
      return;
    }

    setSaving(true);
    setError(null);
    const form = new FormData();
    form.set("audio", blob, "recording.webm");
    form.set("name", name.trim());

    try {
      const res = await fetch("/api/voice-personas", { method: "POST", body: form });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(translateApiError(data?.error, t, "voice_err_failed"));
        return;
      }
    } catch {
      setError(t("voice_err_failed"));
      return;
    } finally {
      setSaving(false);
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
          <h3 className="text-sm font-medium">{t("voice_title")}</h3>
          <button type="button" onClick={handleClose} className="text-zinc-500 hover:text-zinc-100" aria-label={t("common_close")}>
            ✕
          </button>
        </div>

        <p className="text-xs text-zinc-500">
          {t("voice_intro", { s: MIN_SECONDS })}
        </p>

        <label className="flex flex-col gap-1 text-sm">
          {t("voice_name")}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("voice_name_placeholder")}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
          />
        </label>

        <div className="flex flex-col items-center gap-3 rounded-lg border border-zinc-800 bg-black/40 p-5">
          {recording && (
            <div className="flex items-center gap-2 text-xs font-medium text-red-400">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              {t("voice_recording")}
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
              {blob ? t("voice_record_again") : t("voice_start")}
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-2 rounded-full bg-zinc-100 text-black px-5 py-2 text-sm font-medium hover:bg-white transition-colors"
            >
              <span className="h-2.5 w-2.5 bg-red-500" />
              {t("voice_stop")}
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
          {saving ? t("voice_creating") : t("voice_save")}
        </button>
      </div>
    </div>,
    document.body,
  );
}
