import { NextResponse } from "next/server";

/** Serves a Buffer with HTTP Range support (206 Partial Content when the
 * client asks for a byte range, 200 with Accept-Ranges otherwise) -- without
 * this, <audio>/<video> elements can't seek: the browser has no way to jump
 * to a new position in an already-fully-buffered, non-range response, so
 * `currentTime = t` either does nothing or snaps back to 0 depending on the
 * browser. Used by the song audio/video routes. */
export function rangeResponse(
  req: Request,
  buffer: Buffer,
  contentType: string,
  extraHeaders: Record<string, string> = {},
): NextResponse {
  const total = buffer.byteLength;
  const range = req.headers.get("range");

  if (!range) {
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(total),
        "Accept-Ranges": "bytes",
        ...extraHeaders,
      },
    });
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match) {
    return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${total}` } });
  }

  const start = match[1] ? parseInt(match[1], 10) : 0;
  const end = match[2] ? Math.min(parseInt(match[2], 10), total - 1) : total - 1;
  if (start >= total || start > end) {
    return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${total}` } });
  }

  const chunk = buffer.subarray(start, end + 1);
  return new NextResponse(new Uint8Array(chunk), {
    status: 206,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(chunk.byteLength),
      "Content-Range": `bytes ${start}-${end}/${total}`,
      "Accept-Ranges": "bytes",
      ...extraHeaders,
    },
  });
}
