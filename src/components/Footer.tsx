import { PoweredByElevenLabs } from "./PoweredByElevenLabs";

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 py-8 px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
      <span>&copy; {new Date().getFullYear()} Jakebox</span>
      <PoweredByElevenLabs />
    </footer>
  );
}
