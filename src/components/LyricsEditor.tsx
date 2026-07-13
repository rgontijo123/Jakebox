"use client";

export type LyricSection = {
  type: "verse" | "chorus" | "bridge" | "intro" | "outro" | "pre_chorus";
  text: string;
};

const SECTION_TYPES: LyricSection["type"][] = [
  "intro",
  "verse",
  "pre_chorus",
  "chorus",
  "bridge",
  "outro",
];

const SECTION_LABELS: Record<LyricSection["type"], string> = {
  intro: "Intro",
  verse: "Verse",
  pre_chorus: "Pre-Chorus",
  chorus: "Chorus",
  bridge: "Bridge",
  outro: "Outro",
};

export function LyricsEditor({
  sections,
  onChange,
}: {
  sections: LyricSection[];
  onChange: (sections: LyricSection[]) => void;
}) {
  function updateSection(index: number, patch: Partial<LyricSection>) {
    onChange(sections.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function removeSection(index: number) {
    onChange(sections.filter((_, i) => i !== index));
  }

  function addSection() {
    onChange([...sections, { type: "verse", text: "" }]);
  }

  return (
    <div className="flex flex-col gap-3">
      {sections.map((section, i) => (
        <div key={i} className="rounded-md border border-zinc-700 p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <select
              value={section.type}
              onChange={(e) => updateSection(i, { type: e.target.value as LyricSection["type"] })}
              className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm"
            >
              {SECTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {SECTION_LABELS[t]}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => removeSection(i)}
              className="text-sm text-zinc-500 hover:text-red-400"
            >
              Remove
            </button>
          </div>
          <textarea
            value={section.text}
            onChange={(e) => updateSection(i, { text: e.target.value })}
            placeholder={`${SECTION_LABELS[section.type]} lyrics...`}
            rows={3}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm resize-y"
          />
        </div>
      ))}

      <button
        type="button"
        onClick={addSection}
        className="self-start rounded-full border border-zinc-700 px-4 py-2 text-sm hover:border-zinc-500"
      >
        + Add section
      </button>
    </div>
  );
}
