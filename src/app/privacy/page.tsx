import { pageMetadata } from "@/lib/seo";
import { getLocale } from "@/lib/i18n/server";
import { LegalDoc, type LegalDocContent } from "@/components/LegalDoc";

export async function generateMetadata() {
  return pageMetadata("privacy", "/privacy", await getLocale());
}

const DOC: Record<"en" | "pt", LegalDocContent> = {
  en: {
    title: "Privacy Policy",
    updated: "Last updated",
    sections: [
      {
        title: "1. What we collect",
        body: [
          {
            lead: "Account information:",
            text: "your email address and, if you sign up with a password, a securely hashed version of it (we never store your password in readable form). If you sign in with Google or Facebook instead, we receive your name and email address from that provider.",
          },
          {
            lead: "Content you submit:",
            text: "the lyrics, style prompts, and any audio or cover images you upload or record (including for voice cloning or as a reference song) when using the service.",
          },
          {
            lead: "Votes:",
            text: "if you vote for a public song on the Explore page, we store that your account voted for it.",
          },
          {
            lead: "Payment information:",
            text: "if you purchase credits or a plan, payment is processed by Stripe. Jakebox never sees or stores your card number — Stripe shares with us only what's needed to credit your account (e.g. that a payment succeeded).",
          },
        ],
      },
      {
        title: "2. How we use it",
        body: [
          "Your lyrics, style prompt, and any reference audio are sent to third-party AI music generation providers (such as MusicAPI, Treblo, Mureka, and ElevenLabs) to produce your song. Generation requests are also screened by OpenAI's content moderation API before being sent to those providers, to block requests that violate our Terms of Use.",
          "If you record or upload audio for voice cloning, that audio is briefly hosted at a temporary public URL (via Cloudflare R2) solely so the generation provider can fetch it, then removed.",
          "Songs are private by default. Only songs you choose to make public are shown to other people (title, cover and audio on the Explore page, and possibly on Jakebox Radio).",
          "We do not sell your data, and we do not use it to train our own AI models.",
        ],
      },
      {
        title: "3. Cookies",
        body: [
          "Jakebox uses a session cookie to keep you signed in, and remembers your language choice. We don't use advertising or cross-site tracking cookies.",
          "If you accept in the cookie banner, we also use Google Analytics cookies to measure how the site is used (pages visited, sign-ups, songs generated, checkouts), so we can improve Jakebox. If you decline, no analytics cookies are set and Google only receives anonymous, cookieless signals. Your choice is stored in your browser; clear the site's data to change it.",
        ],
      },
      {
        title: "4. Data retention",
        body: [
          "Songs, videos, and voice recordings you generate or upload are kept until you delete them from your library. Account information is kept until you ask us to delete your account.",
        ],
      },
      {
        title: "5. Your rights",
        body: [
          "You can delete individual songs or voice recordings, or make a public song private, directly from your library at any time. To request deletion of your entire account and associated data, contact the support address listed in your account.",
        ],
      },
      { title: "6. Children", body: ["Jakebox is not directed at children under 13, and we don't knowingly collect their data."] },
      {
        title: "7. Changes to this policy",
        body: [
          "We may update this Privacy Policy from time to time. Continuing to use Jakebox after an update constitutes acceptance of the revised policy.",
        ],
      },
      { title: "8. Contact", body: ["Questions about this policy can be sent to the support contact listed in your account."] },
    ],
  },
  pt: {
    title: "Política de Privacidade",
    updated: "Última atualização",
    sections: [
      {
        title: "1. O que coletamos",
        body: [
          {
            lead: "Dados da conta:",
            text: "seu e-mail e, se você se cadastrar com senha, uma versão criptografada dela (nunca guardamos sua senha de forma legível). Se você entrar com Google ou Facebook, recebemos seu nome e e-mail desse serviço.",
          },
          {
            lead: "Conteúdo que você envia:",
            text: "as letras, as descrições de estilo e os áudios ou imagens de capa que você enviar ou gravar (inclusive para clonagem de voz ou como música de referência) ao usar o serviço.",
          },
          {
            lead: "Votos:",
            text: "se você votar em uma música pública na página Explorar, registramos que a sua conta votou nela.",
          },
          {
            lead: "Dados de pagamento:",
            text: "se você comprar créditos ou um plano, o pagamento é processado pelo Stripe. O Jakebox nunca vê nem guarda o número do seu cartão — o Stripe nos informa apenas o necessário para creditar sua conta (por exemplo, que o pagamento foi aprovado).",
          },
        ],
      },
      {
        title: "2. Como usamos esses dados",
        body: [
          "Sua letra, a descrição de estilo e qualquer áudio de referência são enviados a provedores terceirizados de geração de música por IA (como MusicAPI, Treblo, Mureka e ElevenLabs) para criar sua música. Antes disso, as solicitações passam pela moderação de conteúdo da OpenAI, para bloquear pedidos que violem nossos Termos de Uso.",
          "Se você gravar ou enviar áudio para clonagem de voz, esse áudio fica disponível por pouco tempo em um endereço público temporário (via Cloudflare R2), apenas para que o provedor de geração possa acessá-lo, e depois é removido.",
          "As músicas são privadas por padrão. Só aparecem para outras pessoas as músicas que você decidir tornar públicas (título, capa e áudio na página Explorar e, possivelmente, na Rádio Jakebox).",
          "Não vendemos seus dados e não os usamos para treinar modelos de IA próprios.",
        ],
      },
      {
        title: "3. Cookies",
        body: [
          "O Jakebox usa um cookie de sessão para manter você conectado e guarda o idioma escolhido. Não usamos cookies de publicidade nem de rastreamento entre sites.",
          "Se você aceitar no aviso de cookies, também usamos cookies do Google Analytics para entender como o site é usado (páginas visitadas, cadastros, músicas geradas, pagamentos iniciados) e melhorar o Jakebox. Se você recusar, nenhum cookie de análise é gravado e o Google recebe apenas sinais anônimos, sem cookies. Sua escolha fica salva no navegador; para mudá-la, apague os dados do site.",
        ],
      },
      {
        title: "4. Por quanto tempo guardamos",
        body: [
          "Músicas, vídeos e gravações de voz que você gerar ou enviar ficam guardados até você excluí-los da sua biblioteca. Os dados da conta ficam guardados até você pedir a exclusão da conta.",
        ],
      },
      {
        title: "5. Seus direitos",
        body: [
          "Você pode excluir músicas ou gravações de voz, ou deixar privada uma música pública, a qualquer momento na sua biblioteca. Para pedir a exclusão da conta inteira e dos dados associados, fale com o contato de suporte indicado na sua conta.",
        ],
      },
      { title: "6. Crianças", body: ["O Jakebox não é destinado a menores de 13 anos, e não coletamos intencionalmente dados deles."] },
      {
        title: "7. Alterações desta política",
        body: [
          "Podemos atualizar esta Política de Privacidade periodicamente. Continuar usando o Jakebox após uma atualização significa aceitar a política revisada.",
        ],
      },
      { title: "8. Contato", body: ["Dúvidas sobre esta política podem ser enviadas ao contato de suporte indicado na sua conta."] },
    ],
  },
};

export default async function PrivacyPage() {
  return <LegalDoc doc={DOC[(await getLocale()) === "pt" ? "pt" : "en"]} />;
}
