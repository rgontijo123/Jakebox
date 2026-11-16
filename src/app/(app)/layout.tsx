import type { Metadata } from "next";
import { PlayerProvider } from "@/contexts/PlayerContext";
import { PlayerBar } from "@/components/PlayerBar";

// Logged-in app pages: nothing for search engines here.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PlayerProvider>
      <div className="flex-1 flex flex-col">{children}</div>
      <PlayerBar />
    </PlayerProvider>
  );
}
