import { pageMetadata } from "@/lib/seo";
import { getLocale } from "@/lib/i18n/server";
import { LegalDoc, type LegalDocContent } from "@/components/LegalDoc";

export async function generateMetadata() {
  return pageMetadata("terms", "/terms", await getLocale());
}

const DOC: Record<"en" | "pt", LegalDocContent> = {
  en: {
    title: "Terms of Use",
    updated: "Last updated",
    sections: [
      {
        title: "1. The service",
        body: [
          "Jakebox is an AI-assisted music generation platform: you provide a style prompt and, optionally, lyrics, and Jakebox turns that into an original song using third-party AI music generation providers.",
        ],
      },
      {
        title: "2. Ownership of generated content",
        body: [
          "Output generated through Jakebox is assigned to the user who created it. Subject to these Terms and to the terms of the underlying AI providers Jakebox relies on, you own the songs, lyrics, and videos you generate.",
        ],
      },
      {
        title: "3. Your responsibility for content",
        body: [
          "Jakebox is not responsible for the originality, accuracy, or legality of the prompts, lyrics, or generated output submitted or produced by its users. You retain sole responsibility for ensuring you hold the necessary rights to any prompt or lyrics you submit, and that the content you generate does not infringe on any third party's rights (including copyright, trademark, or rights of publicity/likeness) or imitate a real artist without authorization.",
        ],
      },
      {
        title: "4. Public songs, votes and Jakebox Radio",
        body: [
          "If you make a song public, its title, cover and audio become visible to anyone on the Explore page, where signed-in users can vote for it. Jakebox may choose public songs to play on Jakebox Radio. You can make a song private again at any time; it then leaves the Explore page and the radio.",
        ],
      },
      {
        title: "5. Credits and billing",
        body: [
          "Generating a song consumes credits from your account balance, as shown at the time of generation. Credits are non-refundable except where a generation fails outright, in which case any credits charged for that specific generation are automatically refunded to your balance.",
        ],
      },
      {
        title: "6. Prohibited use",
        body: [
          "You may not use Jakebox to generate content that is illegal, defamatory, harassing, or that infringes on someone else's intellectual property or likeness. Jakebox reserves the right to reject a generation request or suspend an account that violates this policy.",
        ],
      },
      {
        title: "7. Account termination",
        body: [
          "You may stop using Jakebox at any time. Jakebox may suspend or terminate an account that violates these Terms, engages in abuse of the service, or attempts to circumvent its credit/billing system.",
        ],
      },
      {
        title: "8. Disclaimer & limitation of liability",
        body: [
          'Jakebox is provided "as is," without warranties of any kind. Jakebox is not liable for any indirect, incidental, or consequential damages arising from your use of the service or of content generated through it.',
        ],
      },
      {
        title: "9. Changes to these terms",
        body: [
          "Jakebox may update these Terms from time to time. Continuing to use the service after an update constitutes acceptance of the revised Terms.",
        ],
      },
      { title: "10. Contact", body: ["Questions about these Terms can be sent to the support contact listed in your account."] },
    ],
  },
  pt: {
    title: "Termos de Uso",
    updated: "Última atualização",
    sections: [
      {
        title: "1. O serviço",
        body: [
          "O Jakebox é uma plataforma de criação de músicas com inteligência artificial: você descreve o estilo e, se quiser, envia a letra, e o Jakebox transforma isso em uma música original usando provedores terceirizados de geração de música por IA.",
        ],
      },
      {
        title: "2. Propriedade do conteúdo gerado",
        body: [
          "O conteúdo gerado no Jakebox pertence ao usuário que o criou. Observados estes Termos e os termos dos provedores de IA utilizados pelo Jakebox, você é dono das músicas, letras e vídeos que gerar.",
        ],
      },
      {
        title: "3. Sua responsabilidade pelo conteúdo",
        body: [
          "O Jakebox não se responsabiliza pela originalidade, exatidão ou legalidade dos textos, letras ou resultados enviados ou gerados pelos usuários. Cabe exclusivamente a você garantir que possui os direitos necessários sobre tudo o que enviar e que o conteúdo gerado não viola direitos de terceiros (incluindo direitos autorais, marcas e direitos de imagem e voz) nem imita um artista real sem autorização.",
        ],
      },
      {
        title: "4. Músicas públicas, votos e Rádio Jakebox",
        body: [
          "Se você deixar uma música pública, o título, a capa e o áudio ficam visíveis para qualquer pessoa na página Explorar, onde usuários com conta podem votar nela. O Jakebox pode escolher músicas públicas para tocar na Rádio Jakebox. Você pode deixar a música privada de novo a qualquer momento; ela então sai da página Explorar e da rádio.",
        ],
      },
      {
        title: "5. Créditos e cobrança",
        body: [
          "Cada música gerada consome créditos do saldo da sua conta, conforme indicado no momento da geração. Os créditos não são reembolsáveis, exceto quando a geração falha por completo; nesse caso, os créditos cobrados por aquela geração são devolvidos automaticamente ao seu saldo.",
        ],
      },
      {
        title: "6. Uso proibido",
        body: [
          "Não é permitido usar o Jakebox para gerar conteúdo ilegal, difamatório, de assédio ou que viole a propriedade intelectual ou a imagem de outra pessoa. O Jakebox pode recusar uma solicitação de geração ou suspender uma conta que descumpra esta regra.",
        ],
      },
      {
        title: "7. Encerramento da conta",
        body: [
          "Você pode deixar de usar o Jakebox quando quiser. O Jakebox pode suspender ou encerrar uma conta que viole estes Termos, abuse do serviço ou tente burlar o sistema de créditos e cobrança.",
        ],
      },
      {
        title: "8. Isenção de garantias e limitação de responsabilidade",
        body: [
          "O Jakebox é oferecido “no estado em que se encontra”, sem garantias de qualquer tipo. O Jakebox não se responsabiliza por danos indiretos, incidentais ou consequentes decorrentes do uso do serviço ou do conteúdo gerado por meio dele.",
        ],
      },
      {
        title: "9. Alterações destes termos",
        body: [
          "O Jakebox pode atualizar estes Termos periodicamente. Continuar usando o serviço após uma atualização significa aceitar os Termos revisados.",
        ],
      },
      { title: "10. Contato", body: ["Dúvidas sobre estes Termos podem ser enviadas ao contato de suporte indicado na sua conta."] },
    ],
  },
};

export default async function TermsPage() {
  return <LegalDoc doc={DOC[(await getLocale()) === "pt" ? "pt" : "en"]} />;
}
