/** Temporary public hosting for a single audio file, so MusicAPI's Sonic
 * endpoint (create-voice, upload-cover) can fetch it by URL -- those APIs
 * only accept a public audio_url/url, not a direct multipart upload.
 *
 * Uses the same Cloudflare R2 bucket already set up for the Musicas project
 * (see C:\Projects\Musicas\VideoSubtitles\scripts\public_host.py, which
 * solves the identical problem for Instagram publishing) rather than a
 * tunnel -- keeps this local dev server's port closed to the internet, and
 * avoids ngrok's commercial-use restriction on its free tier. Server-only:
 * never import from a client component. */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_BUCKET = process.env.R2_BUCKET;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_PUBLIC_BASE_URL = process.env.R2_PUBLIC_BASE_URL;

export class PublicHostUnavailableError extends Error {}

function client(): S3Client {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    throw new PublicHostUnavailableError("R2 credentials are not configured (R2_ACCOUNT_ID/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY)");
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  });
}

/** Uploads `buffer` to the bucket under a timestamp-prefixed key (never
 * collides across repeated calls) and returns (publicUrl, objectKey). The
 * caller is responsible for calling cleanupTempPublicUrl once the external
 * API has consumed it. */
export async function publishTempPublicUrl(
  buffer: Buffer,
  filename: string,
  contentType: string,
): Promise<{ publicUrl: string; objectKey: string }> {
  if (!R2_BUCKET || !R2_PUBLIC_BASE_URL) {
    throw new PublicHostUnavailableError("R2 bucket/public base URL is not configured (R2_BUCKET/R2_PUBLIC_BASE_URL)");
  }
  const objectKey = `jakebox-tmp/${Date.now()}-${filename}`;
  await client().send(
    new PutObjectCommand({ Bucket: R2_BUCKET, Key: objectKey, Body: buffer, ContentType: contentType }),
  );
  return { publicUrl: `${R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${objectKey}`, objectKey };
}

/** Best-effort delete -- a cleanup failure shouldn't fail the caller's
 * overall operation; an orphaned object just costs a few KB of free quota. */
export async function cleanupTempPublicUrl(objectKey: string): Promise<void> {
  try {
    await client().send(new DeleteObjectCommand({ Bucket: R2_BUCKET!, Key: objectKey }));
  } catch (err) {
    console.error("publicHost: cleanup failed for", objectKey, err);
  }
}
