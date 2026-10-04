"""Thin CLI wrapper reusing the Musicas project's proven lyric-alignment
pipeline (Whisper + demucs vocal isolation + fuzzy line matching) for
Jakebox's own auto-generated video captions -- none of Jakebox's active
music providers (musicapi/aimusicapi/treblo/mureka) return word-level
timestamps, so captions need to be derived from the actual rendered audio
after the fact, the same way VideoSubtitles already does it for its
Whisper-aligned captioned videos.

Usage: python force_align.py <audio_path> <lyrics_path> <language>
Prints a JSON array of {text, start, end} to stdout.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, "C:/Projects/Musicas/VideoSubtitles/scripts")
from align_lyrics import align_song  # noqa: E402


def main() -> None:
    if len(sys.argv) not in (3, 4):
        print("usage: force_align.py <audio_path> <lyrics_path> [language]", file=sys.stderr)
        raise SystemExit(1)

    audio_path = Path(sys.argv[1])
    lyrics_path = Path(sys.argv[2])
    language = sys.argv[3] if len(sys.argv) == 4 else "en"

    entries = align_song(audio_path, lyrics_path, language=language)
    print(json.dumps(entries))


if __name__ == "__main__":
    main()
