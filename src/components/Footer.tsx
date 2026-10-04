import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 py-8 px-6 flex items-center justify-center gap-3 text-sm text-zinc-500">
      <span>&copy; {new Date().getFullYear()} Jakebox</span>
      <span className="text-zinc-700">&middot;</span>
      <Link href="/terms" className="hover:text-zinc-300">
        Terms of Use
      </Link>
    </footer>
  );
}
