export function SongPlayer({ songId, title }: { songId: string; title: string }) {
  return (
    <div className="flex flex-col gap-3 w-full">
      <p className="text-sm text-zinc-400">{title}</p>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio controls src={`/api/songs/${songId}/audio`} className="w-full" />
      <a
        href={`/api/songs/${songId}/audio?download=1`}
        className="self-start rounded-full border border-zinc-700 px-4 py-2 text-sm hover:border-zinc-500"
      >
        Download
      </a>
    </div>
  );
}
