export const metadata = {
  title: "Privacy Policy — Jakebox",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
      <div className="text-sm text-zinc-400 leading-relaxed flex flex-col gap-2">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Privacy Policy</h1>
          <p className="text-sm text-zinc-500">Last updated: {new Date().toISOString().slice(0, 10)}</p>
        </div>

        <Section title="1. What we collect">
          <p>
            <strong className="text-zinc-300">Account information:</strong> your email address and, if you sign
            up with a password, a securely hashed version of it (we never store your password in readable
            form). If you sign in with Google or Facebook instead, we receive your name and email address
            from that provider.
          </p>
          <p>
            <strong className="text-zinc-300">Content you submit:</strong> the lyrics, style prompts, and any
            audio you upload or record (including for voice cloning or as a reference song) when using the
            service.
          </p>
          <p>
            <strong className="text-zinc-300">Payment information:</strong> if you purchase credits, payment is
            processed by Stripe. Jakebox never sees or stores your card number — Stripe shares with us only
            what&apos;s needed to credit your account (e.g. that a payment succeeded).
          </p>
        </Section>

        <Section title="2. How we use it">
          <p>
            Your lyrics, style prompt, and any reference audio are sent to third-party AI music generation
            providers (such as MusicAPI, Treblo, Mureka, and ElevenLabs) to produce your song. Generation
            requests are also screened by OpenAI&apos;s content moderation API before being sent to those
            providers, to block requests that violate our Acceptable Use Policy.
          </p>
          <p>
            If you record or upload audio for voice cloning, that audio is briefly hosted at a temporary public
            URL (via Cloudflare R2) solely so the generation provider can fetch it, then removed.
          </p>
          <p>We do not sell your data, and we do not use it to train our own AI models.</p>
        </Section>

        <Section title="3. Cookies">
          <p>
            Jakebox uses a single session cookie to keep you signed in. We don&apos;t use advertising or
            cross-site tracking cookies.
          </p>
        </Section>

        <Section title="4. Data retention">
          <p>
            Songs, videos, and voice recordings you generate or upload are kept until you delete them from
            your library. Account information is kept until you ask us to delete your account.
          </p>
        </Section>

        <Section title="5. Your rights">
          <p>
            You can delete individual songs or voice recordings directly from your library at any time. To
            request deletion of your entire account and associated data, contact the support address listed
            in your account.
          </p>
        </Section>

        <Section title="6. Children">
          <p>Jakebox is not directed at children under 13, and we don&apos;t knowingly collect their data.</p>
        </Section>

        <Section title="7. Changes to this policy">
          <p>
            We may update this Privacy Policy from time to time. Continuing to use Jakebox after an update
            constitutes acceptance of the revised policy.
          </p>
        </Section>

        <Section title="8. Contact">
          <p>Questions about this policy can be sent to the support contact listed in your account.</p>
        </Section>
      </div>
    </main>
  );
}
