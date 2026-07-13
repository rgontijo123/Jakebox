export function PoweredByElevenLabs({ className = "" }: { className?: string }) {
  return (
    <a
      href="https://elevenlabs.io"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors ${className}`}
    >
      Powered by <span className="font-semibold text-zinc-300">ElevenLabs Music</span>
    </a>
  );
}