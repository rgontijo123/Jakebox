import Link from "next/link";
import Image from "next/image";
import { auth, signOut } from "@/auth";

export async function Header() {
  const session = await auth();

  return (
    <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
        <Image src="/branding/jake-logo.svg" alt="" width={28} height={28} />
        Jakebox
      </Link>

      <nav className="flex items-center gap-5 text-sm text-zinc-400">
        {session?.user ? (
          <>
            <Link href="/create" className="hover:text-zinc-100">
              Create
            </Link>
            <Link href="/library" className="hover:text-zinc-100">
              Library
            </Link>
            <Link href="/billing" className="hover:text-zinc-100">
              Billing
            </Link>
            {session.user.role === "owner" && (
              <Link href="/admin" className="hover:text-zinc-100">
                Admin
              </Link>
            )}
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button type="submit" className="hover:text-zinc-100">
                Log out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="hover:text-zinc-100">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-white text-black px-4 py-1.5 font-medium hover:bg-zinc-200"
            >
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
