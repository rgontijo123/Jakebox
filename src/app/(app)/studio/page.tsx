import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { StudioPanel } from "@/components/StudioPanel";

// Internal tool on top of the local VideoSubtitles Flask service -- see
// videoStudio.ts. Restricted to owner/admin, same as /admin.
export default async function StudioPage() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id) redirect("/login");
  if (role !== "owner" && role !== "admin") redirect("/");

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 gap-8">
      <div className="w-full max-w-3xl flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Studio</h1>
        <a href="/video" className="text-sm underline text-zinc-400 hover:text-zinc-100">
          + Generate a video
        </a>
      </div>
      <p className="w-full max-w-3xl text-sm text-zinc-500 -mt-4">
        Cut short clips, copy promo hashtags, and save the channel&apos;s Spotify/YouTube links for
        videos rendered in Video Studio.
      </p>
      <div className="w-full max-w-3xl">
        <StudioPanel />
      </div>
    </main>
  );
}
