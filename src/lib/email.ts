import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
// resend.dev's sandbox sender works with zero setup but only delivers to
// the Resend account's own verified address -- fine for initial testing,
// swap EMAIL_FROM to a verified domain address once this goes to real users.
const FROM = process.env.EMAIL_FROM ?? "Jakebox <onboarding@resend.dev>";

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  if (!resend) {
    console.warn(`RESEND_API_KEY not set -- skipping email, reset link for ${to}: ${resetUrl}`);
    return;
  }
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Reset your Jakebox password",
    html: `
      <p>Someone requested a password reset for this Jakebox account.</p>
      <p><a href="${resetUrl}">Click here to choose a new password</a> (expires in 1 hour).</p>
      <p>If you didn't request this, you can safely ignore this email -- your password hasn't changed.</p>
    `,
  });
}

// Where the /contact form lands -- override with CONTACT_EMAIL on Render.
const CONTACT_TO = process.env.CONTACT_EMAIL ?? "contact@jakeboxmusic.com";

export type ContactMessage = {
  name: string;
  email: string;
  phone: string;
  city?: string;
  country?: string;
  message: string;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Returns false when email isn't configured, so the caller can tell the
 * visitor to use the address directly instead of silently dropping it. */
export async function sendContactEmail(msg: ContactMessage): Promise<boolean> {
  if (!resend) {
    console.warn("RESEND_API_KEY not set -- contact message not sent", msg);
    return false;
  }
  const rows: [string, string | undefined][] = [
    ["Nome", msg.name],
    ["E-mail", msg.email],
    ["Telefone", msg.phone],
    ["Cidade", msg.city],
    ["País", msg.country],
  ];
  const { error } = await resend.emails.send({
    from: FROM,
    to: CONTACT_TO,
    // answering the email goes straight to the visitor
    replyTo: msg.email,
    subject: `Contato pelo site: ${msg.name}`,
    html: `
      <table cellpadding="4">
        ${rows
          .filter(([, v]) => v)
          .map(([k, v]) => `<tr><td><b>${k}</b></td><td>${escapeHtml(v!)}</td></tr>`)
          .join("")}
      </table>
      <p style="white-space:pre-wrap">${escapeHtml(msg.message)}</p>
    `,
  });
  if (error) {
    console.error("Contact email failed", error);
    return false;
  }
  return true;
}
