import Image from "next/image";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center gap-6">
      <Image src="/branding/jake-logo.svg" alt="Jake, the Jakebox mascot" width={96} height={96} />
      <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
        Jakebox
      </h1>
      <p className="max-w-md text-lg text-zinc-400">
        Write your lyrics, describe the sound, and Jakebox turns it into an
        original song in minutes.
      </p>
      <div className="flex gap-3 mt-2">
        <a
          href="/signup"
          className="rounded-full bg-white text-black px-6 py-3 text-sm font-medium hover:bg-zinc-200 transition-colors"
        >
          Get started
        </a>
        <a
          href="/pricing"
          className="rounded-full border border-zinc-700 px-6 py-3 text-sm font-medium hover:border-zinc-500 transition-colors"
        >
          Pricing
        </a>
      </div>
    </main>
  );
}
