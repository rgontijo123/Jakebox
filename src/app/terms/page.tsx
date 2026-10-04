export const metadata = {
  title: "Terms of Use — Jakebox",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
      <div className="text-sm text-zinc-400 leading-relaxed flex flex-col gap-2">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Terms of Use</h1>
          <p className="text-sm text-zinc-500">Last updated: {new Date().toISOString().slice(0, 10)}</p>
        </div>

        <Section title="1. The service">
          <p>
            Jakebox is an AI-assisted music generation platform: you provide a style prompt and, optionally,
            lyrics, and Jakebox turns that into an original song using third-party AI music generation
            providers.
          </p>
        </Section>

        <Section title="2. Ownership of generated content">
          <p>
            Output generated through Jakebox is assigned to the user who created it. Subject to these Terms
            and to the terms of the underlying AI providers Jakebox relies on, you own the songs, lyrics, and
            videos you generate.
          </p>
        </Section>

        <Section title="3. Your responsibility for content">
          <p>
            Jakebox is not responsible for the originality, accuracy, or legality of the prompts, lyrics, or
            generated output submitted or produced by its users. You retain sole responsibility for ensuring
            you hold the necessary rights to any prompt or lyrics you submit, and that the content you
            generate does not infringe on any third party&apos;s rights (including copyright, trademark, or
            rights of publicity/likeness) or imitate a real artist without authorization.
          </p>
        </Section>

        <Section title="4. Credits and billing">
          <p>
            Generating a song consumes credits from your account balance, as shown at the time of
            generation. Credits are non-refundable except where a generation fails outright, in which case
            any credits charged for that specific generation are automatically refunded to your balance.
          </p>
        </Section>

        <Section title="5. Prohibited use">
          <p>
            You may not use Jakebox to generate content that is illegal, defamatory, harassing, or that
            infringes on someone else&apos;s intellectual property or likeness. Jakebox reserves the right to
            reject a generation request or suspend an account that violates this policy.
          </p>
        </Section>

        <Section title="6. Account termination">
          <p>
            You may stop using Jakebox at any time. Jakebox may suspend or terminate an account that violates
            these Terms, engages in abuse of the service, or attempts to circumvent its credit/billing
            system.
          </p>
        </Section>

        <Section title="7. Disclaimer & limitation of liability">
          <p>
            Jakebox is provided &quot;as is,&quot; without warranties of any kind. Jakebox is not liable for
            any indirect, incidental, or consequential damages arising from your use of the service or of
            content generated through it.
          </p>
        </Section>

        <Section title="8. Changes to these terms">
          <p>
            Jakebox may update these Terms from time to time. Continuing to use the service after an update
            constitutes acceptance of the revised Terms.
          </p>
        </Section>

        <Section title="9. Contact">
          <p>Questions about these Terms can be sent to the support contact listed in your account.</p>
        </Section>
      </div>
    </main>
  );
}
