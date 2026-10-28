export type Locale = "en" | "pt";

export const LOCALES: Locale[] = ["en", "pt"];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  pt: "Português",
};

// Flat key -> { en, pt } dictionary. Deliberately simple (no nested
// namespaces, no ICU plural rules) -- this is a small product, not worth
// pulling in a full i18n framework for. Keys are grouped by the
// component/page they belong to, purely for readability here.
export const DICTIONARY = {
  // Header / Nav
  nav_create: { en: "Create", pt: "Criar" },
  nav_video: { en: "Video", pt: "Vídeo" },
  nav_studio: { en: "Studio", pt: "Estúdio" },
  nav_library: { en: "Library", pt: "Biblioteca" },
  nav_billing: { en: "Billing", pt: "Cobrança" },
  nav_admin: { en: "Admin", pt: "Admin" },
  nav_logout: { en: "Log out", pt: "Sair" },
  nav_login: { en: "Log in", pt: "Entrar" },
  nav_signup: { en: "Sign up", pt: "Cadastrar" },

  // Footer
  footer_terms: { en: "Terms of Use", pt: "Termos de Uso" },
  footer_privacy: { en: "Privacy Policy", pt: "Política de Privacidade" },
  footer_contact: { en: "Contact Us", pt: "Fale Conosco" },

  // Home page
  home_subtitle: {
    en: "Write your lyrics, describe the sound, and Jakebox turns it into an original song in minutes.",
    pt: "Escreva sua letra, descreva o som, e o Jakebox transforma isso em uma música original em minutos.",
  },
  home_get_started: { en: "Get started", pt: "Começar" },
  home_pricing: { en: "Pricing", pt: "Preços" },

  // Auth
  login_title: { en: "Log in", pt: "Entrar" },
  login_email: { en: "Email", pt: "Email" },
  login_password: { en: "Password", pt: "Senha" },
  login_submit: { en: "Log in", pt: "Entrar" },
  login_submitting: { en: "Logging in...", pt: "Entrando..." },
  login_forgot: { en: "Forgot password?", pt: "Esqueceu a senha?" },
  login_no_account: { en: "No account yet?", pt: "Ainda não tem conta?" },
  login_invalid: { en: "Invalid email or password", pt: "Email ou senha inválidos" },
  login_locked: {
    en: "Too many failed attempts. Try again after {time}, or reset your password below.",
    pt: "Muitas tentativas sem sucesso. Tente novamente depois de {time}, ou redefina sua senha abaixo.",
  },
  signup_title: { en: "Create your account", pt: "Crie sua conta" },
  signup_submit: { en: "Sign up", pt: "Cadastrar" },
  signup_submitting: { en: "Creating account...", pt: "Criando conta..." },
  signup_have_account: { en: "Already have an account?", pt: "Já tem uma conta?" },
  signup_tos_agree: { en: "I agree to the", pt: "Concordo com os" },
  signup_generic_error: { en: "Something went wrong", pt: "Algo deu errado" },
  signup_signin_failed: {
    en: "Account created, but sign-in failed. Try logging in.",
    pt: "Conta criada, mas o login falhou. Tente entrar novamente.",
  },

  // Create page / GenerationForm highlights
  create_style_label: { en: "Style / genre", pt: "Estilo / gênero" },
  create_lyrics_label: { en: "Lyrics", pt: "Letra" },
  create_instrumental: { en: "Instrumental (no vocals)", pt: "Instrumental (sem vocais)" },
  create_duration: { en: "Target duration", pt: "Duração prevista" },
  create_versions: { en: "Versions:", pt: "Versões:" },
  create_generate: { en: "Generate song", pt: "Gerar música" },
  create_submitting: { en: "Submitting...", pt: "Enviando..." },
  create_rights_confirm: {
    en: "I confirm I have the rights to generate this content and it doesn't imitate a real artist or infringe on copyright.",
    pt: "Confirmo que possuo os direitos para gerar este conteúdo e que ele não imita a obra de um artista original nem infringe direitos autorais.",
  },
  create_get_more_credits: { en: "Get more credits", pt: "Obter mais créditos" },

  // Billing
  billing_title: { en: "Billing", pt: "Cobrança" },
  billing_price_explainer: {
    en: "100 credits = one song up to 60s (audio + video clip), +25 credits per extra 30s.",
    pt: "100 créditos = uma música de até 60 segundos (áudio + videoclipe), +25 créditos por cada 30 segundos adicionais.",
  },
  billing_credits_left: { en: "credits left", pt: "créditos à esquerda" },
  billing_unlimited: { en: "Unlimited", pt: "Ilimitado" },
  billing_history: { en: "History", pt: "Histórico" },
  billing_no_activity: { en: "No activity yet.", pt: "Ainda sem atividade." },
  billing_tx_purchase: { en: "Purchase", pt: "Compra" },
  billing_tx_signup_bonus: { en: "Signup bonus", pt: "Bônus de cadastro" },
  billing_tx_generation: { en: "Generation", pt: "Geração" },
  billing_tx_refund: { en: "Refund", pt: "Reembolso" },
  billing_tx_adjustment: { en: "Adjustment", pt: "Ajuste" },

  // Credit packs
  pack_tagline_starter: { en: "Try it out", pt: "Experimente" },
  pack_tagline_standard: { en: "Most popular", pt: "Mais popular" },
  pack_tagline_pro: { en: "For power users", pt: "Para usuários avançados" },
  pack_most_popular_badge: { en: "MOST POPULAR", pt: "MAIS POPULAR" },
  pack_one_time: { en: "one-time", pt: "pagamento único" },
  pack_credits: { en: "credits", pt: "créditos" },
  pack_songs_approx: {
    en: "songs at 60s (longer songs cost more)",
    pt: "músicas de 60 segundos (músicas mais longas custam mais)",
  },
  pack_feature_1: {
    en: "Full song generation: audio + an auto-made vertical video clip",
    pt: "Geração completa da música: áudio + um videoclipe vertical criado automaticamente",
  },
  pack_feature_2: {
    en: "Works with voice cloning and reference-song remixing too",
    pt: "Funciona também com clonagem de voz e remixagem de músicas de referência",
  },
  pack_feature_3: {
    en: "Failed generations are refunded automatically",
    pt: "As gerações com falha são reembolsadas automaticamente",
  },
  pack_feature_4: { en: "Credits never expire", pt: "Os créditos nunca expiram" },
  pack_buy: { en: "Buy", pt: "Comprar" },
  pack_redirecting: { en: "Redirecting...", pt: "Redirecionando..." },
  pack_checkout_error: { en: "Could not start checkout", pt: "Não foi possível iniciar a compra" },
  pack_checkout_unexpected: {
    en: "Something went wrong starting checkout. Please try again.",
    pt: "Algo deu errado ao iniciar a compra. Tente novamente.",
  },
} as const;

export type DictionaryKey = keyof typeof DICTIONARY;
