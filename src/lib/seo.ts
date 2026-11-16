import type { Metadata } from "next";
import { headers } from "next/headers";
import { LANG_HEADER } from "@/lib/i18n/langHeader";
import type { Locale } from "@/lib/i18n/translations";

export const SITE_URL = "https://jakeboxmusic.com";

type Copy = { title: string; description: string };
type PageKey = "home" | "radio" | "explore" | "pricing" | "contact" | "terms" | "privacy" | "login" | "signup";

const COPY: Record<PageKey, Record<Locale, Copy>> = {
  home: {
    en: {
      title: "Jakebox — AI Music Generator: turn your lyrics into a song",
      description:
        "Create original songs with AI from your own lyrics. Pick a genre — reggae, rock, pop, funk, sertanejo, MPB — and Jakebox makes the song plus a vertical music video in minutes. 2 free songs.",
    },
    pt: {
      title: "Jakebox — Crie músicas com inteligência artificial a partir da sua letra",
      description:
        "Gerador de música com IA: escreva ou cole sua letra, escolha o estilo (sertanejo, funk, pagode, MPB, gospel, rock, reggae) e receba uma música original com videoclipe em minutos. 2 músicas grátis.",
    },
  },
  radio: {
    en: {
      title: "Jakebox Radio — live AI music, 24/7",
      description:
        "Listen live to Jakebox Radio: original songs created with AI by Jakebox, playing 24 hours a day. Make your own song and hear it on the air.",
    },
    pt: {
      title: "Rádio Jakebox — músicas feitas com IA, ao vivo 24h",
      description:
        "Ouça ao vivo a Rádio Jakebox: músicas originais criadas com inteligência artificial no Jakebox, tocando 24 horas por dia. Crie a sua e ouça na rádio.",
    },
  },
  explore: {
    en: {
      title: "Community songs — listen and vote",
      description: "Discover songs made with AI by the Jakebox community. Listen, vote for your favourites and help pick what plays on Jakebox Radio.",
    },
    pt: {
      title: "Músicas da comunidade — ouça e vote",
      description: "Descubra músicas criadas com inteligência artificial pela comunidade Jakebox. Ouça, vote nas favoritas e ajude a escolher o que toca na Rádio Jakebox.",
    },
  },
  pricing: {
    en: {
      title: "Pricing — AI songs from $7.99/month",
      description:
        "Jakebox pricing: start with 2 free AI songs, then pick a monthly plan or a one-time credit pack. Every song comes with a vertical music video.",
    },
    pt: {
      title: "Preços — músicas com IA a partir de R$ 39,90/mês",
      description:
        "Preços do Jakebox: comece com 2 músicas grátis e depois escolha um plano mensal ou um pacote de créditos avulso. Toda música vem com videoclipe vertical.",
    },
  },
  contact: {
    en: { title: "Contact", description: "Questions, feedback or partnerships? Get in touch with the Jakebox team." },
    pt: { title: "Fale Conosco", description: "Dúvidas, sugestões ou parcerias? Fale com a equipe do Jakebox." },
  },
  terms: {
    en: { title: "Terms of Use", description: "Terms of use for Jakebox, the AI music generator." },
    pt: { title: "Termos de Uso", description: "Termos de uso do Jakebox, o gerador de músicas com IA." },
  },
  privacy: {
    en: { title: "Privacy Policy", description: "How Jakebox collects, uses and protects your data." },
    pt: { title: "Política de Privacidade", description: "Como o Jakebox coleta, usa e protege seus dados." },
  },
  login: {
    en: { title: "Log in", description: "Log in to Jakebox to create AI songs and music videos." },
    pt: { title: "Entrar", description: "Entre no Jakebox para criar músicas e videoclipes com IA." },
  },
  signup: {
    en: { title: "Create your free account", description: "Sign up for Jakebox and make your first 2 AI songs for free." },
    pt: { title: "Crie sua conta grátis", description: "Cadastre-se no Jakebox e crie suas 2 primeiras músicas com IA de graça." },
  },
};

export const KEYWORDS: Record<Locale, string[]> = {
  pt: [
    "criar música com inteligência artificial",
    "gerador de música IA",
    "fazer música com IA",
    "música com IA grátis",
    "transformar letra em música",
    "criar música a partir da letra",
    "música personalizada",
    "música para presente",
    "videoclipe com IA",
    "compor música online",
    "sertanejo com IA",
    "funk com IA",
    "pagode",
    "MPB",
    "gospel",
    "Jakebox",
  ],
  en: [
    "AI music generator",
    "AI song generator",
    "make a song with AI",
    "lyrics to song",
    "turn lyrics into a song",
    "create music online",
    "custom song",
    "personalized song gift",
    "AI music video",
    "free AI song",
    "Jakebox",
  ],
};

async function requestLang(): Promise<Locale | null> {
  const v = (await headers()).get(LANG_HEADER);
  return v === "pt" || v === "en" ? v : null;
}

/** Per-page metadata in the visitor's language, with hreflang alternates
 * (`?lang=pt` / `?lang=en`) so both languages can be indexed. */
export async function pageMetadata(page: PageKey, path: string, locale: Locale): Promise<Metadata> {
  const { title, description } = COPY[page][locale];
  const pinned = await requestLang();
  const canonical = pinned ? `${path}?lang=${pinned}` : path;
  const shareTitle = page === "home" ? title : `${title} | Jakebox`;
  const image = locale === "pt" ? "/og-image.jpg" : "/og-image-en.jpg";
  const images = [{ url: image, width: 1200, height: 630, alt: COPY.home[locale].title }];
  return {
    title: page === "home" ? { absolute: title } : title,
    description,
    keywords: KEYWORDS[locale],
    alternates: {
      canonical,
      languages: { "pt-BR": `${path}?lang=pt`, en: `${path}?lang=en`, "x-default": path },
    },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: "Jakebox",
      title: shareTitle,
      images,
      description,
      locale: locale === "pt" ? "pt_BR" : "en_US",
      alternateLocale: locale === "pt" ? ["en_US"] : ["pt_BR"],
    },
    twitter: { card: "summary_large_image", title: shareTitle, description, images: [image] },
  };
}
