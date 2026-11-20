import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { auth } from "@/auth";
import { userIdFromFeedbackToken } from "@/lib/feedbackRequest";
import { FeedbackForm } from "@/components/FeedbackForm";

export const metadata = { title: "Feedback · Jakebox", robots: { index: false } };

export default async function FeedbackPage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await getT();
  const { t: token } = await searchParams;
  const allowed = !!userIdFromFeedbackToken(token) || !!(await auth())?.user?.id;
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16">
      <div className="w-full max-w-xl flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-semibold mb-2">{t("feedback_title")}</h1>
          <p className="text-sm text-zinc-400 leading-relaxed">{t("feedback_body")}</p>
        </div>
        {allowed ? (
          <FeedbackForm token={token ?? null} />
        ) : (
          <p className="text-sm text-zinc-400">
            {t("feedback_login_needed")}{" "}
            <Link href="/login?callbackUrl=/feedback" className="text-[#F5B900] underline">
              {t("nav_login")}
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
