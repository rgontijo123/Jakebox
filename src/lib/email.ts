import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
// resend.dev's sandbox sender works with zero setup but only delivers to
// the Resend account's own verified address -- fine for initial testing,
// swap EMAIL_FROM to a verified domain address once this goes to real users.
const FROM = process.env.EMAIL_FROM ?? "Jakebox <onboarding@resend.dev>";

const APP_URL = process.env.APP_URL ?? "https://jakeboxmusic.com";

type EmailLocale = "en" | "pt";

/** Shared look for account emails: dark header, one paragraph block, an
 * optional gold button, small footer. Inline styles only (email clients). */
function layout(bodyHtml: string, button?: { label: string; url: string }) {
  const cta = button
    ? `<p style="margin:28px 0"><a href="${button.url}" style="background:#F5B900;color:#000;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:999px;display:inline-block">${button.label}</a></p>`
    : "";
  return `<!doctype html><html><head><meta charset="utf-8"></head>
<body style="margin:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#18181b">
  <div style="max-width:520px;margin:0 auto;padding:24px">
    <div style="background:#09090b;color:#fff;padding:18px 24px;border-radius:12px 12px 0 0;font-size:20px;font-weight:700">Jakebox</div>
    <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;font-size:15px;line-height:1.6">
      ${bodyHtml}${cta}
    </div>
    <p style="font-size:12px;color:#71717a;text-align:center;margin-top:16px">
      Jakebox · <a href="${APP_URL}" style="color:#71717a">jakeboxmusic.com</a> · contact@jakeboxmusic.com
    </p>
  </div>
</body></html>`;
}

async function send(to: string, subject: string, html: string, what: string) {
  if (!resend) {
    console.warn(`RESEND_API_KEY not set -- skipping "${what}" email to ${to}`);
    return false;
  }
  const { error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) {
    console.error(`"${what}" email failed`, error);
    return false;
  }
  return true;
}

export async function sendPasswordResetEmail(to: string, resetUrl: string, locale: EmailLocale = "en") {
  if (!resend) console.warn(`reset link for ${to}: ${resetUrl}`);
  const pt = locale === "pt";
  return send(
    to,
    pt ? "Redefina sua senha do Jakebox" : "Reset your Jakebox password",
    layout(
      pt
        ? `<p>Recebemos um pedido para redefinir a senha da sua conta no Jakebox.</p>
           <p>O link vale por 1 hora. Se não foi você, pode ignorar este e-mail: sua senha continua a mesma.</p>`
        : `<p>Someone requested a password reset for this Jakebox account.</p>
           <p>The link expires in 1 hour. If you didn't request this, you can safely ignore this email -- your password hasn't changed.</p>`,
      { label: pt ? "Escolher nova senha" : "Choose a new password", url: resetUrl },
    ),
    "password reset",
  );
}

export async function sendPasswordChangedEmail(to: string, locale: EmailLocale = "en") {
  const pt = locale === "pt";
  return send(
    to,
    pt ? "Sua senha do Jakebox foi alterada" : "Your Jakebox password was changed",
    layout(
      pt
        ? `<p>A senha da sua conta no Jakebox acabou de ser alterada.</p>
           <p>Se foi você, está tudo certo. Se não foi, responda este e-mail ou escreva para contact@jakeboxmusic.com imediatamente.</p>`
        : `<p>The password for your Jakebox account was just changed.</p>
           <p>If this was you, you're all set. If not, reply to this email or write to contact@jakeboxmusic.com right away.</p>`,
      { label: pt ? "Entrar no Jakebox" : "Log in to Jakebox", url: `${APP_URL}/login` },
    ),
    "password changed",
  );
}

export async function sendWelcomeEmail(to: string, freeSongs: number, locale: EmailLocale = "en") {
  const pt = locale === "pt";
  return send(
    to,
    pt ? "Bem-vindo ao Jakebox! Suas músicas grátis estão esperando" : "Welcome to Jakebox! Your free songs are waiting",
    layout(
      pt
        ? `<p>Sua conta no Jakebox está pronta. 🎶</p>
           <p>Você ganhou <b>${freeSongs} músicas grátis</b> para experimentar: escolha um gênero, escreva a letra e o Jakebox cria uma música original com videoclipe em poucos minutos.</p>
           <p>Quando quiser continuar criando, é só escolher um plano mensal ou um pacote de créditos.</p>`
        : `<p>Your Jakebox account is ready. 🎶</p>
           <p>You've got <b>${freeSongs} free songs</b> to try it out: pick a genre, write your lyrics and Jakebox turns it into an original song with a video clip in minutes.</p>
           <p>When you want to keep creating, pick a monthly plan or a credit pack.</p>`,
      { label: pt ? "Criar minha primeira música" : "Create my first song", url: `${APP_URL}/create` },
    ),
    "welcome",
  );
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

/** "How are you liking Jakebox?" -- sent once per account a day after
 * signup (src/lib/feedbackRequest.ts). A plain reply also reaches us
 * (replyTo), for people who'd rather not open the form. locale null =
 * account older than the locale field: send both languages. */
export async function sendFeedbackRequestEmail(
  to: string,
  opts: { locale: EmailLocale | null; name: string | null; songs: number; formUrl: string },
) {
  if (!resend) {
    console.warn(`RESEND_API_KEY not set -- skipping feedback request to ${to} (${opts.formUrl})`);
    return false;
  }
  const first = opts.name?.trim().split(/\s+/)[0];
  const pt = () => {
    const hi = first ? `Oi, ${escapeHtml(first)}!` : "Oi!";
    const used =
      opts.songs > 0
        ? `Vi que você já criou ${opts.songs === 1 ? "sua primeira música" : `${opts.songs} músicas`} no Jakebox. 🎶`
        : "Vi que você criou sua conta no Jakebox, mas ainda não gerou nenhuma música. Travou em alguma parte?";
    return `<p>${hi}</p>
      <p>Aqui é o Ricardo, criador do Jakebox. ${used}</p>
      <p>O Jakebox é novo e eu quero muito saber a sua opinião: o que você achou, o que gostou, o que te incomodou e o que você gostaria que ele fizesse. Leva menos de 1 minuto.</p>
      <p>Se preferir, é só <b>responder este e-mail</b>: eu leio todas as respostas.</p>`;
  };
  const en = () => {
    const hi = first ? `Hi ${escapeHtml(first)}!` : "Hi!";
    const used =
      opts.songs > 0
        ? `I saw you've already created ${opts.songs === 1 ? "your first song" : `${opts.songs} songs`} on Jakebox. 🎶`
        : "I saw you signed up for Jakebox but haven't made a song yet. Did you get stuck somewhere?";
    return `<p>${hi}</p>
      <p>This is Ricardo, the creator of Jakebox. ${used}</p>
      <p>Jakebox is brand new and I'd really love to hear what you think: what you liked, what bugged you, and what you'd like it to do. It takes less than a minute.</p>
      <p>Or just <b>reply to this email</b>: I read every answer.</p>`;
  };
  const both = opts.locale === null;
  const usePt = opts.locale === "pt";
  const subject = both
    ? "O que você achou do Jakebox? / What do you think of Jakebox?"
    : usePt
      ? "O que você achou do Jakebox?"
      : "What do you think of Jakebox?";
  const body = both
    ? `${pt()}<hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0">${en()}`
    : usePt
      ? pt()
      : en();
  const label = both ? "Dar minha opinião / Give feedback" : usePt ? "Dar minha opinião" : "Give feedback";
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    replyTo: CONTACT_TO,
    subject,
    html: layout(body, { label, url: opts.formUrl }),
  });
  if (error) {
    console.error("feedback request email failed", error);
    return false;
  }
  return true;
}

export type FeedbackAnswer = { email: string; name: string | null; songs: number; rating: number | null; liked: string; improve: string };

/** A submitted /feedback form, to the owner's inbox (reply goes to the user). */
export async function sendFeedbackToOwner(f: FeedbackAnswer) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set -- feedback not emailed", f);
    return false;
  }
  const stars = f.rating ? "★".repeat(f.rating) + "☆".repeat(5 - f.rating) : "(sem nota)";
  const { error } = await resend.emails.send({
    from: FROM,
    to: CONTACT_TO,
    replyTo: f.email,
    subject: `Feedback Jakebox ${f.rating ? `${f.rating}/5 ` : ""}de ${f.name || f.email}`,
    html: `
      <p><b>${escapeHtml(f.name || "")}</b> &lt;${escapeHtml(f.email)}&gt; · ${f.songs} música(s) criada(s)</p>
      <p style="font-size:22px;color:#F5B900;margin:8px 0">${stars}</p>
      <p><b>O que gostou:</b></p><p style="white-space:pre-wrap">${escapeHtml(f.liked || "-")}</p>
      <p><b>O que melhorar / sugestões:</b></p><p style="white-space:pre-wrap">${escapeHtml(f.improve || "-")}</p>
    `,
  });
  if (error) {
    console.error("feedback email to owner failed", error);
    return false;
  }
  return true;
}
