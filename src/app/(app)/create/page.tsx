import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CreditBadge } from "@/components/CreditBadge";
import { CreateWorkspace } from "@/components/CreateWorkspace";

export default async function CreatePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-10 gap-6">
      <div className="w-full max-w-6xl flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Create</h1>
        <CreditBadge userId={session.user.id} />
      </div>
      <CreateWorkspace />
    </main>
  );
}
