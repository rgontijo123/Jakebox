import type { DictionaryKey } from "./translations";

type T = (key: DictionaryKey, vars?: Record<string, string | number>) => string;

// API routes answer with plain English `error` strings. The UI shows them to
// the user, so known messages are mapped to dictionary keys here and shown
// in the visitor's language; anything unknown is still shown as-is.
const EXACT: Record<string, DictionaryKey> = {
  "Not signed in": "err_not_signed_in",
  Unauthorized: "err_not_signed_in",
  Forbidden: "err_forbidden",
  "Not allowed": "err_forbidden",
  "Not found": "err_not_found",
  "Invalid form data": "err_invalid_form",
  "Expected multipart form data": "err_invalid_form",
  // generations
  "Style prompt is required": "gen_err_style",
  "Add some lyrics, or mark as instrumental": "gen_err_lyrics",
  "Use a reference song or a voice, not both": "err_ref_and_voice",
  "Reference song not found": "err_ref_not_found",
  "Voice not found": "err_voice_not_found",
  "This voice isn't ready yet": "err_voice_not_ready",
  "Insufficient credits": "err_insufficient_credits",
  "Daily generation limit reached, try again tomorrow": "err_daily_limit",
  "This request was rejected by our content policy.": "err_content_policy",
  // audio upload
  "Audio file is required": "upload_err_file",
  "Title is required": "upload_err_title",
  "The uploaded file is empty": "err_upload_empty",
  "File is too large (max 30MB)": "err_upload_too_large",
  "Couldn't read that audio file -- is it a valid audio format?": "err_upload_unreadable",
  // voice recording
  "Audio recording is required": "err_voice_required",
  "Give this voice a name": "voice_err_name",
  "The recording is empty": "err_voice_empty",
  "Recording is too large (max 20MB)": "err_voice_too_large",
  "Couldn't read that recording -- try recording again": "err_voice_unreadable",
  // signup / password reset
  "Invalid email": "err_invalid_email",
  "You must accept the Acceptable Use Policy": "err_accept_terms",
  "An account with this email already exists": "err_email_taken",
  "Signup failed": "signup_generic_error",
  "Missing reset token": "err_reset_missing_token",
  "This reset link is invalid or has expired": "err_reset_invalid",
  // billing
  "Could not start checkout": "pack_checkout_error",
  "Unknown credit pack": "pack_checkout_error",
  "Unknown plan": "pack_checkout_error",
  "You already have an active plan": "err_plan_exists",
  "No active plan": "err_no_plan",
  // clip video / video studio
  "songId is required": "err_song_not_found",
  "Song not found": "err_song_not_found",
  "Couldn't read the song's audio file": "err_song_audio_unreadable",
  "Job isn't ready yet": "studio_job_not_ready",
  // admin
  "Email could not be sent": "err_email_not_sent",
  "Can't ban the owner": "err_cant_ban_owner",
  "Only the owner can delete users": "err_owner_only_delete",
  "Owner/admin accounts can't be deleted here": "err_staff_not_deletable",
  "This user has an active plan -- cancel it in Stripe first so they aren't billed again": "admin_delete_has_plan",
  "songQuota must be a whole number from 0 to 1000": "err_quota_invalid",
  "creditDelta must be a whole number": "err_credit_delta_invalid",
};

const PATTERNS: [RegExp, DictionaryKey, (m: RegExpMatchArray) => Record<string, string>][] = [
  [/^Password requirements:/, "err_password_rules", () => ({})],
  [/^Upload (\d+)-(\d+) clips$/, "err_clip_count", (m) => ({ min: m[1], max: m[2] })],
  [/^(.+) is too large \(max (\d+)MB per clip\)$/, "err_clip_too_large", (m) => ({ name: m[1], max: m[2] })],
];

/** The API's `error` field in the visitor's language: a known message is
 * translated, an unknown one is returned unchanged, a missing one falls back
 * to `fallback`. */
export function translateApiError(error: unknown, t: T, fallback: DictionaryKey): string {
  if (typeof error !== "string" || !error) return t(fallback);
  const key = EXACT[error];
  if (key) return t(key);
  for (const [re, patternKey, vars] of PATTERNS) {
    const m = error.match(re);
    if (m) return t(patternKey, vars(m));
  }
  return error;
}

/** Why a generation failed, as stored on the Generation row: known messages
 * are translated; anything else is a raw provider/technical message (always
 * English, often cryptic), so the visitor gets a generic explanation instead. */
export function translateFailureReason(reason: string | null | undefined, t: T): string {
  if (!reason) return t("result_unknown_error");
  if (reason === "Insufficient credits") return t("err_failure_no_credits");
  if (reason === "Interrupted") return t("err_failure_interrupted");
  const translated = translateApiError(reason, t, "result_unknown_error");
  return translated === reason ? t("err_failure_provider") : translated;
}
