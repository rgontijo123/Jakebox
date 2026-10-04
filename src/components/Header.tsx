import Link from "next/link";
import Image from "next/image";
import { auth, signOut } from "@/auth";
import { NavMenu } from "@/components/NavMenu";

export async function Header() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <header className="sticky top-0 z-30 bg-black/80 backdrop-blur border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-3 font-semibold text-xl tracking-wide">
        <Image src="/branding/jake-logo.svg" alt="" width={44} height={44} />
        Jakebox
      </Link>

      <NavMenu
        isAuthed={!!session?.user}
        isStaff={role === "owner" || role === "admin"}
        userLabel={session?.user?.name ?? session?.user?.email ?? undefined}
        onLogout={logout}
      />
    </header>
  );
}
