export type LegalPara = string | { lead: string; text: string };
export type LegalDocContent = {
  title: string;
  updated: string;
  sections: { title: string; body: LegalPara[] }[];
};

/** Renders the Terms / Privacy pages from per-language content. */
export function LegalDoc({ doc }: { doc: LegalDocContent }) {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-semibold mb-2">{doc.title}</h1>
          <p className="text-sm text-zinc-500">
            {doc.updated}: {new Date().toISOString().slice(0, 10)}
          </p>
        </div>
        {doc.sections.map((s) => (
          <section key={s.title} className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-zinc-100">{s.title}</h2>
            <div className="text-sm text-zinc-400 leading-relaxed flex flex-col gap-2">
              {s.body.map((p, i) =>
                typeof p === "string" ? (
                  <p key={i}>{p}</p>
                ) : (
                  <p key={i}>
                    <strong className="text-zinc-300">{p.lead}</strong> {p.text}
                  </p>
                ),
              )}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
