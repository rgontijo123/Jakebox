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
