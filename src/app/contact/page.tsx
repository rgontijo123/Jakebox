export const metadata = {
  title: "Contact Us — Jakebox",
};

export default function ContactPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Contact Jakebox</h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Have a question, found a bug, or need help with your account? Reach out and we&apos;ll get back to
            you as soon as we can.
          </p>
        </div>

        <a
          href="mailto:contact@jakeboxmusic.com"
          className="self-start rounded-full bg-[#F5B900] text-black px-6 py-2.5 text-sm font-medium hover:bg-[#ffcc33] transition-colors"
        >
          contact@jakeboxmusic.com
        </a>
      </div>
    </main>
  );
}
