import { PlayerProvider } from "@/contexts/PlayerContext";
import { PlayerBar } from "@/components/PlayerBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PlayerProvider>
      <div className="flex-1 flex flex-col">{children}</div>
      <PlayerBar />
    </PlayerProvider>
  );
}
