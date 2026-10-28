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
} as const;

export type DictionaryKey = keyof typeof DICTIONARY;
