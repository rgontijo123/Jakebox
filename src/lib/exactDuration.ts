import { spawn } from "node:child_process";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ffmpegPath: string = require("ffmpeg-static");

/** Exact playback length in ms by fully decoding the audio (ffmpeg's last
 * reported time). Header-based estimates can be off by seconds for some
 * MP3s, which would desync the radio loop. Single-threaded, ~1s per song. */
export function exactDurationMs(audio: Buffer): Promise<number> {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, ["-hide_banner", "-threads", "1", "-i", "pipe:0", "-vn", "-f", "null", "-"]);
    let log = "";
    proc.stderr.on("data", (c) => {
      log = (log + c.toString()).slice(-4000);
    });
    proc.stdout.resume();
    proc.on("error", reject);
    proc.on("close", () => {
      const times = [...log.matchAll(/time=(\d+):(\d+):(\d+(?:\.\d+)?)/g)];
      const last = times.at(-1);
      if (!last) return reject(new Error("Couldn't measure audio duration"));
      resolve(Math.round((Number(last[1]) * 3600 + Number(last[2]) * 60 + Number(last[3])) * 1000));
    });
    proc.stdin.on("error", () => {});
    proc.stdin.end(audio);
  });
}
