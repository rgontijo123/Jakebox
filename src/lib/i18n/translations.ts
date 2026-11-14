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
  billing_credits_left: { en: "credits left", pt: "créditos restantes" },
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

  // Monthly plans
  plan_section_title: { en: "Monthly plans", pt: "Planos mensais" },
  plan_section_subtitle: {
    en: "A set number of songs every month, any length up to 5 minutes. Cancel anytime.",
    pt: "Um número fixo de músicas por mês, de qualquer duração até 5 minutos. Cancele quando quiser.",
  },
  plan_free_trial: {
    en: "Every new account gets 2 free songs to try Jakebox.",
    pt: "Toda conta nova ganha 2 músicas grátis para experimentar o Jakebox.",
  },
  plan_per_month: { en: "/month", pt: "/mês" },
  plan_songs_per_month: { en: "songs per month", pt: "músicas por mês" },
  plan_feature_1: {
    en: "Audio + an auto-made vertical video clip for every song",
    pt: "Áudio + um videoclipe vertical criado automaticamente em cada música",
  },
  plan_feature_2: {
    en: "Songs refill every month (unused songs don't carry over)",
    pt: "As músicas renovam todo mês (as não usadas não acumulam)",
  },
  plan_feature_3: {
    en: "Failed generations give the song back automatically",
    pt: "Se uma geração falhar, a música volta automaticamente",
  },
  plan_subscribe: { en: "Subscribe", pt: "Assinar" },
  plan_current: { en: "Your plan", pt: "Seu plano" },
  plan_status_active: { en: "Active — renews on", pt: "Ativo — renova em" },
  plan_status_canceling: { en: "Cancelled — ends on", pt: "Cancelado — termina em" },
  plan_status_past_due: {
    en: "Payment failed — please update your card",
    pt: "O pagamento falhou — atualize seu cartão",
  },
  plan_songs_left: { en: "songs left this month", pt: "músicas restantes este mês" },
  plan_cancel: { en: "Cancel plan", pt: "Cancelar plano" },
  plan_resume: { en: "Keep my plan", pt: "Manter meu plano" },
  plan_cancel_done: {
    en: "Your plan will end at the end of the current month. You keep your songs until then.",
    pt: "Seu plano termina no fim do mês atual. Você mantém suas músicas até lá.",
  },
  plan_or_packs: {
    en: "Or buy a one-time credit pack",
    pt: "Ou compre um pacote de créditos avulso",
  },
  plan_signup_cta: { en: "Start with 2 free songs", pt: "Comece com 2 músicas grátis" },

  // Public pricing page
  pricing_page_title: { en: "Simple pricing", pt: "Preços simples" },
  pricing_page_subtitle: {
    en: "Try 2 songs free, then pick a monthly plan or a one-time credit pack.",
    pt: "Experimente 2 músicas grátis, depois escolha um plano mensal ou um pacote de créditos avulso.",
  },
  pricing_page_cta: { en: "Sign up to buy", pt: "Cadastre-se para comprar" },

  // Create page / generation form
  create_title: {
    en: "Create",
    pt: "Criar",
  },
  create_your_songs: {
    en: "Your songs",
    pt: "Suas músicas",
  },
  badge_unlimited: {
    en: "Unlimited credits",
    pt: "Créditos ilimitados",
  },
  badge_songs: {
    en: "songs",
    pt: "músicas",
  },
  badge_credits: {
    en: "credits",
    pt: "créditos",
  },
  gen_style_label: {
    en: "Style / genre prompt",
    pt: "Estilo / gênero musical",
  },
  gen_style_placeholder: {
    en: "e.g. upbeat 80s synth-pop, female vocals, driving bassline",
    pt: "ex.: synth-pop animado anos 80, voz feminina, baixo marcante",
  },
  gen_instrumental: {
    en: "Instrumental only (no lyrics)",
    pt: "Só instrumental (sem letra)",
  },
  gen_language: {
    en: "Language",
    pt: "Idioma",
  },
  lang_en: {
    en: "English",
    pt: "Inglês",
  },
  lang_pt_br: {
    en: "Portuguese (Brazil)",
    pt: "Português (Brasil)",
  },
  lang_pt_pt: {
    en: "Portuguese (Portugal)",
    pt: "Português (Portugal)",
  },
  lang_es: {
    en: "Spanish",
    pt: "Espanhol",
  },
  lang_de: {
    en: "German",
    pt: "Alemão",
  },
  lang_ja: {
    en: "Japanese",
    pt: "Japonês",
  },
  gen_reference_song: {
    en: "Reference song",
    pt: "Música de referência",
  },
  gen_reference_hint: {
    en: "(optional -- inspires the new song's style)",
    pt: "(opcional — inspira o estilo da nova música)",
  },
  gen_none: {
    en: "None",
    pt: "Nenhuma",
  },
  gen_voice: {
    en: "Voice",
    pt: "Voz",
  },
  gen_voice_hint: {
    en: "(optional -- sings with a cloned voice instead of the default)",
    pt: "(opcional — canta com uma voz clonada em vez da padrão)",
  },
  gen_default_voice: {
    en: "Default voice",
    pt: "Voz padrão",
  },
  gen_record_voice: {
    en: "+ Record a new voice",
    pt: "+ Gravar uma nova voz",
  },
  gen_single_version_note: {
    en: "Using a reference song or voice generates a single version, not A/B.",
    pt: "Usando música de referência ou voz, é gerada uma única versão, sem A/B.",
  },
  gen_lyrics: {
    en: "Lyrics",
    pt: "Letra",
  },
  gen_lyrics_placeholder: {
    en: "[Verse]\nWalking down a sunny road today\nNothing standing in my way\n\n[Chorus]\nThis is our moment, our moment to shine\nEverything's gonna be just fine",
    pt: "[Verse]\nCaminhando numa estrada de sol\nNada vai me segurar\n\n[Chorus]\nEsse é o nosso momento de brilhar\nTudo vai dar certo, pode acreditar",
  },
  gen_lyrics_hint: {
    en: "Paste a full lyric in one go, mark sections inline with tags like",
    pt: "Cole a letra inteira de uma vez, marcando as partes com tags como",
  },
  gen_duration: {
    en: "Target duration: {s}s",
    pt: "Duração desejada: {s}s",
  },
  gen_credits_n: {
    en: "{n} credits",
    pt: "{n} créditos",
  },
  gen_rushed: {
    en: "Your lyrics ({words} words) need about {rec}s for unhurried pacing — at {dur}s the vocals will likely sound rushed.",
    pt: "Sua letra ({words} palavras) precisa de uns {rec}s para um ritmo tranquilo — com {dur}s o vocal deve ficar corrido.",
  },
  gen_bump_to: {
    en: "Bump to {s}s",
    pt: "Aumentar para {s}s",
  },
  gen_versions: {
    en: "Versions:",
    pt: "Versões:",
  },
  gen_two_versions_hint: {
    en: "2 full generations, compare and keep your favorite",
    pt: "2 gerações completas, compare e fique com a favorita",
  },
  gen_estimated_cost: {
    en: "Estimated cost:",
    pt: "Custo estimado:",
  },
  gen_two_versions: {
    en: "(2 versions)",
    pt: "(2 versões)",
  },
  gen_refund_note: {
    en: "(refunded automatically if a version fails)",
    pt: "(devolvido automaticamente se uma versão falhar)",
  },
  gen_uses_quota: {
    en: "Uses {used} of your {total} included songs",
    pt: "Usa {used} das suas {total} músicas incluídas",
  },
  gen_plus_credits: {
    en: " + {n} credits",
    pt: " + {n} créditos",
  },
  gen_no_credits_needed: {
    en: " — no credits needed",
    pt: " — sem gastar créditos",
  },
  gen_balance: {
    en: "You have {have} credits — after this you'll have {after}",
    pt: "Você tem {have} créditos — depois disso terá {after}",
  },
  gen_not_enough: {
    en: " (not enough credits for this)",
    pt: " (créditos insuficientes)",
  },
  gen_unlimited: {
    en: "You have unlimited credits (owner/admin)",
    pt: "Você tem créditos ilimitados (dono/admin)",
  },
  gen_rights: {
    en: "I confirm I have the rights to generate this content and it doesn't imitate a real artist or infringe on copyright.",
    pt: "Confirmo que tenho os direitos para gerar este conteúdo e que ele não imita um artista real nem viola direitos autorais.",
  },
  gen_see_plans: {
    en: "See plans",
    pt: "Ver planos",
  },
  gen_submitting: {
    en: "Submitting...",
    pt: "Enviando...",
  },
  gen_submit: {
    en: "Generate song",
    pt: "Gerar música",
  },
  gen_err_style: {
    en: "Describe the style/genre you want",
    pt: "Descreva o estilo/gênero que você quer",
  },
  gen_err_lyrics: {
    en: "Add some lyrics, or mark this as instrumental",
    pt: "Escreva uma letra ou marque como instrumental",
  },
  gen_err_rights: {
    en: "Please confirm you have the rights to this content",
    pt: "Confirme que você tem os direitos sobre este conteúdo",
  },
  err_generic: {
    en: "Something went wrong",
    pt: "Algo deu errado",
  },
  err_insufficient_credits: {
    en: "You've used your free songs. Pick a plan or buy credits to keep creating.",
    pt: "Suas músicas grátis acabaram. Escolha um plano ou compre créditos para continuar criando.",
  },
  err_daily_limit: {
    en: "Daily generation limit reached, try again tomorrow",
    pt: "Limite diário de gerações atingido, tente de novo amanhã",
  },
  err_content_policy: {
    en: "This request was rejected by our content policy.",
    pt: "Este pedido foi recusado pela nossa política de conteúdo.",
  },

  // Song list / create sidebar
  list_loading: {
    en: "Loading...",
    pt: "Carregando...",
  },
  list_no_match: {
    en: "No songs match your search.",
    pt: "Nenhuma música encontrada.",
  },
  list_empty: {
    en: "No songs yet — create your first one.",
    pt: "Nenhuma música ainda — crie a primeira.",
  },
  list_generating: {
    en: "Generating…",
    pt: "Gerando…",
  },
  status_pending: {
    en: "Queued...",
    pt: "Na fila...",
  },
  status_processing: {
    en: "Generating...",
    pt: "Gerando...",
  },
  status_failed: {
    en: "Failed",
    pt: "Falhou",
  },
  status_rejected: {
    en: "Rejected",
    pt: "Recusada",
  },
  list_confirm_delete: {
    en: "Remove this song from your library?",
    pt: "Remover esta música da sua biblioteca?",
  },
  list_play: {
    en: "Play",
    pt: "Tocar",
  },
  list_download: {
    en: "Download",
    pt: "Baixar",
  },
  list_remix: {
    en: "Remix",
    pt: "Remixar",
  },
  list_regen_cover: {
    en: "Generate a new AI cover",
    pt: "Gerar nova capa com IA",
  },
  list_regen_cover_busy: {
    en: "Generating cover…",
    pt: "Gerando capa…",
  },
  list_copyright: {
    en: "Authorship & copyright record",
    pt: "Registro de autoria e direitos autorais",
  },
  list_download_video: {
    en: "Download video clip",
    pt: "Baixar videoclipe",
  },
  list_make_video: {
    en: "Make video clip",
    pt: "Fazer videoclipe",
  },
  list_make_video_busy: {
    en: "Generating video…",
    pt: "Gerando vídeo…",
  },
  list_remove: {
    en: "Remove",
    pt: "Remover",
  },
  list_prev_page: {
    en: "Previous page",
    pt: "Página anterior",
  },
  list_next_page: {
    en: "Next page",
    pt: "Próxima página",
  },
  list_page_of: {
    en: "Page {page} of {total}",
    pt: "Página {page} de {total}",
  },
  side_find: {
    en: "Find",
    pt: "Buscar",
  },
  side_search: {
    en: "Search your songs...",
    pt: "Buscar nas suas músicas...",
  },
  side_write: {
    en: "Write",
    pt: "Escrever",
  },
  side_style: {
    en: "Style",
    pt: "Estilo",
  },
  side_saved_styles: {
    en: "Saved styles",
    pt: "Estilos salvos",
  },
  side_save_style: {
    en: "Save current style as a preset",
    pt: "Salvar o estilo atual",
  },
  side_no_styles: {
    en: "No saved styles yet.",
    pt: "Nenhum estilo salvo ainda.",
  },
  side_delete_named: {
    en: "Delete {name}",
    pt: "Excluir {name}",
  },
  side_library: {
    en: "Library",
    pt: "Biblioteca",
  },
  side_download_songs: {
    en: "Download songs",
    pt: "Baixar músicas",
  },
  side_upload_audio: {
    en: "Upload audio",
    pt: "Enviar áudio",
  },
  side_write_style_first: {
    en: "Write a style prompt in the form first",
    pt: "Escreva um estilo no formulário primeiro",
  },
  side_name_style: {
    en: "Name this style preset:",
    pt: "Nome para este estilo:",
  },

  // Library / result / player / password
  library_title: {
    en: "My library",
    pt: "Minha biblioteca",
  },
  library_new_song: {
    en: "+ New song",
    pt: "+ Nova música",
  },
  result_versions: {
    en: "Your versions",
    pt: "Suas versões",
  },
  result_song: {
    en: "Your song",
    pt: "Sua música",
  },
  result_load_error: {
    en: "Could not load this generation",
    pt: "Não foi possível carregar esta geração",
  },
  result_generating: {
    en: "Generating — usually 1-3 minutes...",
    pt: "Gerando — normalmente leva de 1 a 3 minutos...",
  },
  result_failed: {
    en: "Generation failed: {reason}. Your credits have been refunded.",
    pt: "A geração falhou: {reason}. O valor foi devolvido para você.",
  },
  result_unknown_error: {
    en: "unknown error",
    pt: "erro desconhecido",
  },
  result_rejected: {
    en: "This request was rejected by our content policy. No credits were charged.",
    pt: "Este pedido foi recusado pela nossa política de conteúdo. Nada foi cobrado.",
  },
  player_play: {
    en: "Play",
    pt: "Tocar",
  },
  player_playing: {
    en: "Playing",
    pt: "Tocando",
  },
  player_pause: {
    en: "Pause",
    pt: "Pausar",
  },
  pw_show: {
    en: "Show password",
    pt: "Mostrar senha",
  },
  pw_hide: {
    en: "Hide password",
    pt: "Ocultar senha",
  },
  pw_hint: {
    en: "At least 8 characters, including a number and a special character",
    pt: "No mínimo 8 caracteres, incluindo um número e um caractere especial",
  },
  forgot_title: {
    en: "Reset your password",
    pt: "Redefinir sua senha",
  },
  forgot_sent: {
    en: "If an account exists for {email}, we've sent a link to reset your password. Check your inbox (and spam folder).",
    pt: "Se existir uma conta para {email}, enviamos um link para redefinir sua senha. Confira sua caixa de entrada (e o spam).",
  },
  forgot_sending: {
    en: "Sending...",
    pt: "Enviando...",
  },
  forgot_send: {
    en: "Send reset link",
    pt: "Enviar link",
  },
  forgot_back: {
    en: "Back to log in",
    pt: "Voltar para o login",
  },
  reset_title: {
    en: "Choose a new password",
    pt: "Escolha uma nova senha",
  },
  reset_done: {
    en: "Password updated. Redirecting you to log in...",
    pt: "Senha atualizada. Indo para o login...",
  },
  reset_new: {
    en: "New password",
    pt: "Nova senha",
  },
  reset_confirm: {
    en: "Confirm new password",
    pt: "Confirme a nova senha",
  },
  reset_mismatch: {
    en: "Passwords don't match",
    pt: "As senhas não coincidem",
  },
  reset_saving: {
    en: "Saving...",
    pt: "Salvando...",
  },
  reset_save: {
    en: "Save new password",
    pt: "Salvar nova senha",
  },
  contact_title: {
    en: "Contact Jakebox",
    pt: "Fale com o Jakebox",
  },
  contact_body: {
    en: "Have a question, found a bug, or need help with your account? Reach out and we'll get back to you as soon as we can.",
    pt: "Tem alguma dúvida, achou um problema ou precisa de ajuda com sua conta? Fale com a gente e responderemos o quanto antes.",
  },

  // Upload / voice / clip video / billing
  common_close: {
    en: "Close",
    pt: "Fechar",
  },
  upload_title: {
    en: "Upload audio",
    pt: "Enviar áudio",
  },
  upload_file: {
    en: "Audio file",
    pt: "Arquivo de áudio",
  },
  upload_song_title: {
    en: "Title",
    pt: "Título",
  },
  upload_title_placeholder: {
    en: "Song title",
    pt: "Título da música",
  },
  upload_lyrics: {
    en: "Lyrics (optional)",
    pt: "Letra (opcional)",
  },
  upload_lyrics_placeholder: {
    en: "Paste the lyrics if you have them -- powers the synced lyrics player",
    pt: "Cole a letra, se tiver — ela aparece sincronizada no player",
  },
  upload_err_file: {
    en: "Choose an audio file",
    pt: "Escolha um arquivo de áudio",
  },
  upload_err_title: {
    en: "Give it a title",
    pt: "Dê um título",
  },
  upload_failed: {
    en: "Upload failed",
    pt: "O envio falhou",
  },
  upload_uploading: {
    en: "Uploading...",
    pt: "Enviando...",
  },
  upload_submit: {
    en: "Upload",
    pt: "Enviar",
  },
  voice_title: {
    en: "Record a voice",
    pt: "Gravar uma voz",
  },
  voice_intro: {
    en: "Read something out loud for at least {s} seconds, alone and clearly -- this becomes the singer voice for future generations.",
    pt: "Leia algo em voz alta por pelo menos {s} segundos, sozinho e com clareza — essa vai ser a voz do cantor nas próximas gerações.",
  },
  voice_name: {
    en: "Voice name",
    pt: "Nome da voz",
  },
  voice_name_placeholder: {
    en: "e.g. My voice",
    pt: "ex.: Minha voz",
  },
  voice_recording: {
    en: "Recording…",
    pt: "Gravando…",
  },
  voice_record_again: {
    en: "Record again",
    pt: "Gravar de novo",
  },
  voice_start: {
    en: "Start recording",
    pt: "Começar a gravar",
  },
  voice_stop: {
    en: "Stop",
    pt: "Parar",
  },
  voice_creating: {
    en: "Creating voice...",
    pt: "Criando voz...",
  },
  voice_save: {
    en: "Save voice",
    pt: "Salvar voz",
  },
  voice_err_unsupported: {
    en: "This browser doesn't support microphone recording (or the page isn't on https/localhost).",
    pt: "Este navegador não permite gravar pelo microfone.",
  },
  voice_err_blocked: {
    en: "Microphone access was blocked -- allow it for this site in the browser's address-bar permissions and try again.",
    pt: "O acesso ao microfone foi bloqueado — libere para este site nas permissões do navegador (perto da barra de endereço) e tente de novo.",
  },
  voice_err_no_mic: {
    en: "No microphone was found on this device.",
    pt: "Nenhum microfone foi encontrado neste aparelho.",
  },
  voice_err_busy: {
    en: "Another app is already using the microphone.",
    pt: "Outro app já está usando o microfone.",
  },
  voice_err_access: {
    en: "Couldn't access the microphone{detail}.",
    pt: "Não foi possível acessar o microfone{detail}.",
  },
  voice_err_start: {
    en: "Couldn't start recording: {detail}",
    pt: "Não foi possível começar a gravar: {detail}",
  },
  voice_err_name: {
    en: "Give this voice a name",
    pt: "Dê um nome para esta voz",
  },
  voice_err_short: {
    en: "Recording needs to be at least {s}s long",
    pt: "A gravação precisa ter pelo menos {s}s",
  },
  voice_err_failed: {
    en: "Voice creation failed",
    pt: "Não foi possível criar a voz",
  },
  video_title: {
    en: "Your clips, your song",
    pt: "Seus vídeos, sua música",
  },
  video_subtitle: {
    en: "Upload your own footage and we'll stitch it into a video for one of your songs.",
    pt: "Envie seus próprios vídeos e a gente junta tudo num clipe com uma das suas músicas.",
  },
  clip_intro: {
    en: "Upload {min}-{max} of your own clips (DJ footage, you singing, anything) -- they're stitched together with crossfades and topped with one of your songs.",
    pt: "Envie de {min} a {max} vídeos seus (tocando, cantando, o que quiser) — eles são unidos com transições suaves e ganham uma das suas músicas por cima.",
  },
  clip_song: {
    en: "Song",
    pt: "Música",
  },
  clip_no_songs: {
    en: "No songs yet",
    pt: "Nenhuma música ainda",
  },
  clip_clips: {
    en: "Clips ({min}-{max} videos)",
    pt: "Vídeos ({min} a {max})",
  },
  clip_selected: {
    en: "{n} clip(s) selected",
    pt: "{n} vídeo(s) selecionado(s)",
  },
  clip_need_more: {
    en: " -- need at least {min}",
    pt: " — precisa de pelo menos {min}",
  },
  clip_starting: {
    en: "Starting...",
    pt: "Iniciando...",
  },
  clip_generate: {
    en: "Generate video",
    pt: "Gerar vídeo",
  },
  clip_failed_start: {
    en: "Failed to start video render",
    pt: "Não foi possível começar o vídeo",
  },
  clip_none: {
    en: "No clip videos yet.",
    pt: "Nenhum clipe ainda.",
  },
  clip_job: {
    en: "{title} ({n} clips)",
    pt: "{title} ({n} vídeos)",
  },
  clip_processing: {
    en: "Processing…",
    pt: "Processando…",
  },
  clip_failed: {
    en: "Failed",
    pt: "Falhou",
  },
  clip_ready: {
    en: "Ready",
    pt: "Pronto",
  },
  billing_free_songs: {
    en: "You have {n} free song(s) to try Jakebox.",
    pt: "Você tem {n} música(s) grátis para experimentar o Jakebox.",
  },
  billing_tx_plan: {
    en: "Monthly plan",
    pt: "Plano mensal",
  },

  // Contact form
  contact_name: {
    en: "Name",
    pt: "Nome",
  },
  contact_phone: {
    en: "Phone",
    pt: "Telefone",
  },
  contact_city: {
    en: "City",
    pt: "Cidade",
  },
  contact_country: {
    en: "Country",
    pt: "País",
  },
  contact_message: {
    en: "How can we help?",
    pt: "Como podemos ajudar?",
  },
  contact_message_placeholder: {
    en: "Tell us your question, the problem you found, or what you need.",
    pt: "Conte sua dúvida, o problema que encontrou ou o que você precisa.",
  },
  contact_required_note: {
    en: "* required",
    pt: "* obrigatório",
  },
  contact_send: {
    en: "Send message",
    pt: "Enviar mensagem",
  },
  contact_sent: {
    en: "Message sent! We'll get back to you by email as soon as we can.",
    pt: "Mensagem enviada! Responderemos por e-mail o quanto antes.",
  },
  contact_err_missing: {
    en: "Please fill in your name, a valid email, phone and the message.",
    pt: "Preencha nome, um e-mail válido, telefone e a mensagem.",
  },
  contact_err_too_many: {
    en: "Too many messages in a short time. Please try again later.",
    pt: "Muitas mensagens em pouco tempo. Tente de novo mais tarde.",
  },
  contact_err_send: {
    en: "We couldn't send your message. Please email us at contact@jakeboxmusic.com.",
    pt: "Não conseguimos enviar sua mensagem. Escreva para contact@jakeboxmusic.com.",
  },
} as const;

export type DictionaryKey = keyof typeof DICTIONARY;

/** Fills `{name}` placeholders in a translated string. */
export function interpolate(text: string, vars?: Record<string, string | number>): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}
