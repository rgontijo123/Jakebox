import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { GenerationForm } from "@/components/GenerationForm";
import { CreditBadge } from "@/components/CreditBadge";

export default async function CreatePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 gap-8">
      <div className="w-full max-w-2xl flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Create a song</h1>
        <CreditBadge userId={session.user.id} />
      </div>
      <GenerationForm />
    </main>
  );
}
