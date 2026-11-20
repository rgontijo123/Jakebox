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
  cookie_text: {
    en: "We use Google Analytics cookies to understand how Jakebox is used and improve it. You can decline.",
    pt: "Usamos cookies do Google Analytics para entender como o Jakebox é usado e melhorá-lo. Você pode recusar.",
  },
  cookie_accept: { en: "Accept", pt: "Aceitar" },
  cookie_decline: { en: "Decline", pt: "Recusar" },
  footer_contact: { en: "Contact Us", pt: "Fale Conosco" },

  // Home page
  home_subtitle: {
    en: "Write your lyrics, describe the sound, and Jakebox turns it into an original song in minutes.",
    pt: "Escreva sua letra, descreva o som e o Jakebox transforma tudo em uma música original em minutos.",
  },
  home_get_started: { en: "Get started", pt: "Começar" },
  home_pricing: { en: "Pricing", pt: "Preços" },
  upload_cover: { en: "Cover image (optional)", pt: "Imagem de capa (opcional)" },
  list_public_add: {
    en: "Make public: anyone can listen and vote on the Explore page",
    pt: "Tornar pública: qualquer pessoa pode ouvir e votar na página Explorar",
  },
  list_public_remove: { en: "Public — click to make private", pt: "Pública — clique para deixar privada" },
  nav_explore: { en: "Explore", pt: "Explorar" },
  explore_title: { en: "Community songs", pt: "Músicas da comunidade" },
  explore_subtitle: {
    en: "Songs made with Jakebox and shared by their creators. Listen, vote for your favorites — the most voted can go on Jakebox Radio.",
    pt: "Músicas criadas no Jakebox e compartilhadas pelos autores. Ouça e vote nas suas favoritas — as mais votadas podem tocar na Rádio Jakebox.",
  },
  explore_top: { en: "Most voted", pt: "Mais votadas" },
  explore_new: { en: "Newest", pt: "Novas" },
  explore_all: { en: "All", pt: "Todas" },
  explore_national: { en: "Brazilian", pt: "Nacionais" },
  explore_international: { en: "International", pt: "Internacionais" },
  explore_vote: { en: "Vote", pt: "Votar" },
  explore_voted: { en: "Voted", pt: "Você votou" },
  explore_login_to_vote: { en: "Log in to vote", pt: "Entre para votar" },
  explore_empty: {
    en: "No public songs yet. Make yours public with the 🌐 button in your song list!",
    pt: "Ainda não há músicas públicas. Deixe a sua pública com o botão 🌐 na sua lista de músicas!",
  },
  explore_on_radio: { en: "On the radio", pt: "Na rádio" },
  explore_more: { en: "Load more", pt: "Carregar mais" },
  explore_share_cta: { en: "Make your own song", pt: "Crie a sua música" },
  share_title: { en: "Share Jakebox Radio", pt: "Divulgue a Rádio Jakebox" },
  share_hint: {
    en: "Text and link are ready — pick a network, or copy and paste wherever you like.",
    pt: "Texto e link já estão prontos — escolha a rede ou copie e cole onde quiser.",
  },
  share_native: { en: "Share", pt: "Compartilhar" },
  share_copy_text: { en: "Copy text + link", pt: "Copiar texto + link" },
  share_copy_link: { en: "Copy link", pt: "Copiar link" },
  share_copied: { en: "Copied", pt: "Copiado" },
  share_story: { en: "Story image (Instagram)", pt: "Imagem para Story (Instagram)" },
  share_story_hint: {
    en: "Post it as a story and add a link sticker with jakeboxmusic.com/radio",
    pt: "Poste no story e adicione o adesivo de link com jakeboxmusic.com/radio",
  },
  radio_install: { en: "Install the radio app", pt: "Instalar o app da rádio" },
  radio_stop: { en: "Stop", pt: "Parar" },
  radio_mute: { en: "Mute", pt: "Silenciar" },
  radio_unmute: { en: "Unmute", pt: "Ativar som" },
  radio_intro: { en: "Coming up", pt: "Vem aí" },
  list_radio_add: { en: "Put on Jakebox Radio", pt: "Colocar na Rádio Jakebox" },
  list_radio_remove: { en: "Take off Jakebox Radio", pt: "Tirar da Rádio Jakebox" },
  list_radio_badge: { en: "On the radio", pt: "Na rádio" },
  list_public_badge: { en: "Public", pt: "Pública" },
  list_radio_added: {
    en: "Added to Jakebox Radio! It joins the live programme in a moment.",
    pt: "Adicionada à Rádio Jakebox! Ela entra na programação ao vivo em instantes.",
  },
  list_radio_removed: { en: "Taken off Jakebox Radio.", pt: "Retirada da Rádio Jakebox." },
  list_radio_failed: {
    en: "Couldn't change the radio. Make the song public (🌐) first, then try again.",
    pt: "Não deu para mudar a rádio. Deixe a música pública (🌐) e tente de novo.",
  },
  nav_radio: { en: "Radio", pt: "Rádio" },
  radio_title: { en: "Jakebox Radio", pt: "Rádio Jakebox" },
  radio_subtitle: {
    en: "Songs created with Jakebox, live 24 hours a day.",
    pt: "Músicas criadas no Jakebox, ao vivo 24 horas por dia.",
  },
  radio_live: { en: "LIVE", pt: "AO VIVO" },
  radio_listen: { en: "Listen live", pt: "Ouvir ao vivo" },
  radio_pause: { en: "Pause", pt: "Pausar" },
  radio_now: { en: "Now playing", pt: "Tocando agora" },
  radio_next: { en: "Up next", pt: "A seguir" },
  radio_jingle: { en: "Station ID", pt: "Vinheta" },
  radio_empty: { en: "The radio is getting ready — come back soon!", pt: "A rádio está se preparando — volte em breve!" },
  radio_cta: { en: "Vote for the next songs on the radio", pt: "Vote nas próximas músicas da rádio" },
  radio_volume: { en: "Volume", pt: "Volume" },
  home_h1: { en: "Turn your lyrics into a song with AI", pt: "Transforme sua letra em música com inteligência artificial" },
  home_free_note: { en: "2 free songs when you sign up · no card needed", pt: "2 músicas grátis no cadastro · sem cartão" },
  home_how_title: { en: "How it works", pt: "Como funciona" },
  home_step1_title: { en: "Write or paste your lyrics", pt: "Escreva ou cole sua letra" },
  home_step1_body: {
    en: "A love song, a birthday tribute, a joke for your friends — any lyrics work. Mark verses and chorus if you like.",
    pt: "Uma declaração de amor, um parabéns, uma zoeira com os amigos — qualquer letra serve. Marque verso e refrão se quiser.",
  },
  home_step2_title: { en: "Pick a genre and style", pt: "Escolha o gênero e o estilo" },
  home_step2_body: {
    en: "Reggae, rock, pop, funk, sertanejo, MPB, gospel, hip hop, lo-fi… or describe the sound in your own words.",
    pt: "Sertanejo, funk, pagode, MPB, gospel, forró, rock, reggae, pop, lo-fi… ou descreva o som do seu jeito.",
  },
  home_step3_title: { en: "Get your song and music video", pt: "Receba a música e o videoclipe" },
  home_step3_body: {
    en: "In a few minutes you get an original, sung song plus a vertical music video ready for Reels, TikTok and Shorts.",
    pt: "Em poucos minutos chega uma música original cantada, com videoclipe vertical pronto para Reels, TikTok e Shorts.",
  },
  home_faq_title: { en: "Frequently asked questions", pt: "Perguntas frequentes" },
  home_faq1_q: { en: "Is Jakebox free?", pt: "O Jakebox é grátis?" },
  home_faq1_a: {
    en: "Every new account gets 2 free songs, no credit card needed. After that, choose a monthly plan or a one-time credit pack.",
    pt: "Toda conta nova ganha 2 músicas grátis, sem cartão de crédito. Depois você escolhe um plano mensal ou um pacote de créditos avulso.",
  },
  home_faq2_q: { en: "Do I need to know music?", pt: "Preciso saber música?" },
  home_faq2_a: {
    en: "No. Just write the lyrics and choose a style — the AI composes the melody, the arrangement and sings it.",
    pt: "Não. É só escrever a letra e escolher o estilo — a inteligência artificial compõe a melodia, o arranjo e canta.",
  },
  home_faq3_q: { en: "Which languages can the song be in?", pt: "Em quais idiomas a música pode ser?" },
  home_faq3_a: {
    en: "English, Portuguese (Brazil or Portugal), Spanish, German and Japanese.",
    pt: "Português (Brasil ou Portugal), inglês, espanhol, alemão e japonês.",
  },
  home_faq4_q: { en: "Does every song come with a video?", pt: "Toda música vem com videoclipe?" },
  home_faq4_a: {
    en: "Yes. Each song gets a vertical music video with its cover art, ready to post on social media.",
    pt: "Sim. Cada música ganha um videoclipe vertical com a capa, pronto para postar nas redes sociais.",
  },
  home_faq5_q: { en: "How long does it take?", pt: "Quanto tempo demora?" },
  home_faq5_a: {
    en: "Usually just a few minutes for the song. The video is created right after.",
    pt: "Normalmente poucos minutos para a música. O videoclipe é criado logo em seguida.",
  },

  // Auth
  login_title: { en: "Log in", pt: "Entrar" },
  login_email: { en: "Email", pt: "E-mail" },
  login_password: { en: "Password", pt: "Senha" },
  login_submit: { en: "Log in", pt: "Entrar" },
  login_submitting: { en: "Logging in...", pt: "Entrando..." },
  login_forgot: { en: "Forgot password?", pt: "Esqueceu a senha?" },
  login_no_account: { en: "No account yet?", pt: "Ainda não tem conta?" },
  login_invalid: { en: "Invalid email or password", pt: "E-mail ou senha inválidos" },
  login_locked: {
    en: "Too many failed attempts. Try again after {time}, or reset your password below.",
    pt: "Muitas tentativas sem sucesso. Tente novamente depois de {time} ou redefina sua senha abaixo.",
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
  create_duration: { en: "Target duration", pt: "Duração desejada" },
  create_versions: { en: "Versions:", pt: "Versões:" },
  create_generate: { en: "Generate song", pt: "Gerar música" },
  create_submitting: { en: "Submitting...", pt: "Enviando..." },
  create_rights_confirm: {
    en: "I confirm I have the rights to generate this content and it doesn't imitate a real artist or infringe on copyright.",
    pt: "Confirmo que tenho os direitos para gerar este conteúdo e que ele não imita um artista real nem viola direitos autorais.",
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
  pack_tagline_standard: { en: "For regular creators", pt: "Para quem cria sempre" },
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
    pt: "As músicas se renovam todo mês (as não usadas não acumulam)",
  },
  plan_feature_3: {
    en: "Failed generations give the song back automatically",
    pt: "Se uma geração falhar, a música volta automaticamente",
  },
  plan_subscribe: { en: "Subscribe", pt: "Assinar" },
  plan_current: { en: "Your plan", pt: "Seu plano" },
  plan_status_active: { en: "Active — renews on", pt: "Ativo — renova em" },
  plan_status_canceling: { en: "Canceled — ends on", pt: "Cancelado — termina em" },
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
    en: "(optional — inspires the new song's style)",
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
    en: "(optional — sings with a cloned voice instead of the default)",
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
    en: "Using a reference song or a cloned voice generates a single version (no A/B).",
    pt: "Com música de referência ou voz clonada, é gerada uma única versão (sem A/B).",
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
    pt: "Sua letra ({words} palavras) precisa de uns {rec}s para um ritmo tranquilo — com {dur}s o vocal provavelmente vai soar corrido.",
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
  err_failure_no_credits: { en: "not enough credits", pt: "créditos insuficientes" },
  err_failure_interrupted: {
    en: "it was interrupted (the server restarted). Your credits were returned, please try again",
    pt: "foi interrompida (o servidor reiniciou). Seus créditos foram devolvidos, tente de novo",
  },
  err_failure_provider: {
    en: "the music service couldn't create this track",
    pt: "o serviço de música não conseguiu criar esta faixa",
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
    pt: "A geração falhou: {reason}. Seus créditos foram devolvidos.",
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
    pt: "Enviar link de redefinição",
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
    pt: "Senha atualizada. Redirecionando para o login...",
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
    en: "Paste the lyrics if you have them — they show up synced in the player",
    pt: "Cole a letra, se tiver — ela aparece sincronizada no player",
  },
  upload_err_file: {
    en: "Choose an audio file",
    pt: "Escolha um arquivo de áudio",
  },
  upload_err_title: {
    en: "Give it a title",
    pt: "Dê um título à música",
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
    en: "Read something out loud for at least {s} seconds, clearly and with no other voices around — this becomes the singing voice for your future songs.",
    pt: "Leia algo em voz alta por pelo menos {s} segundos, com clareza e sem outras vozes por perto — essa será a voz que canta nas suas próximas músicas.",
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
    pt: "Este navegador não permite gravar pelo microfone (ou a página não está em https/localhost).",
  },
  voice_err_blocked: {
    en: "Microphone access was blocked — allow it for this site in the browser's address-bar permissions and try again.",
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
    en: "Upload {min} to {max} of your own clips (DJ footage, you singing, anything) — they're stitched together with crossfades and set to one of your songs.",
    pt: "Envie de {min} a {max} vídeos seus (discotecando, cantando, o que quiser) — eles são unidos com transições suaves e ganham uma das suas músicas como trilha.",
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
    en: "Clips ({min} to {max} videos)",
    pt: "Vídeos ({min} a {max})",
  },
  clip_selected: {
    en: "{n} clip(s) selected",
    pt: "{n} vídeo(s) selecionado(s)",
  },
  clip_need_more: {
    en: " — you need at least {min}",
    pt: " — são necessários pelo menos {min}",
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
    en: "Couldn't start the video render",
    pt: "Não foi possível iniciar a criação do vídeo",
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
  feedback_title: { en: "What do you think of Jakebox?", pt: "O que você achou do Jakebox?" },
  feedback_body: {
    en: "Jakebox is brand new and your opinion shapes what comes next. Everything is optional: answer what you want.",
    pt: "O Jakebox é novo e a sua opinião decide o que vem a seguir. Tudo é opcional: responda o que quiser.",
  },
  feedback_rating: { en: "How would you rate Jakebox?", pt: "Que nota você dá para o Jakebox?" },
  feedback_heard: { en: "How did you hear about Jakebox?", pt: "Como você ficou sabendo do Jakebox?" },
  feedback_heard_instagram: { en: "Instagram", pt: "Instagram" },
  feedback_heard_facebook: { en: "Facebook", pt: "Facebook" },
  feedback_heard_tiktok: { en: "TikTok", pt: "TikTok" },
  feedback_heard_youtube: { en: "YouTube", pt: "YouTube" },
  feedback_heard_linkedin: { en: "LinkedIn", pt: "LinkedIn" },
  feedback_heard_whatsapp: { en: "WhatsApp", pt: "WhatsApp" },
  feedback_heard_friend: { en: "A friend", pt: "Indicação de amigo" },
  feedback_heard_google: { en: "Google / search", pt: "Google / pesquisa" },
  feedback_heard_other: { en: "Other", pt: "Outro" },
  feedback_heard_other_placeholder: { en: "Where?", pt: "Onde?" },
  feedback_created: { en: "Were you able to create your song?", pt: "Você conseguiu criar a sua música?" },
  feedback_created_yes: { en: "Yes", pt: "Sim" },
  feedback_created_partly: { en: "Sort of", pt: "Mais ou menos" },
  feedback_created_no: { en: "No", pt: "Não" },
  feedback_ease: { en: "Was it easy to use?", pt: "Foi fácil de usar?" },
  feedback_ease_easy: { en: "Easy", pt: "Fácil" },
  feedback_ease_ok: { en: "OK", pt: "Normal" },
  feedback_ease_hard: { en: "Hard", pt: "Difícil" },
  feedback_liked: { en: "What did you like most?", pt: "O que você mais gostou?" },
  feedback_improve: {
    en: "What didn't you like? What should we improve?",
    pt: "Do que você não gostou? O que podemos melhorar?",
  },
  feedback_improve_placeholder: {
    en: "e.g. a genre you missed, a bug, something that took too long...",
    pt: "ex.: um gênero que faltou, um erro, algo que demorou demais...",
  },
  feedback_send: { en: "Send feedback", pt: "Enviar opinião" },
  feedback_sent: {
    en: "Thank you! Your feedback went straight to the Jakebox team. 🎶",
    pt: "Obrigado! Sua opinião foi direto para a equipe do Jakebox. 🎶",
  },
  feedback_err_empty: { en: "Answer at least one question first.", pt: "Responda pelo menos uma pergunta primeiro." },
  feedback_err_send: {
    en: "We couldn't send it. Please email us at contact@jakeboxmusic.com.",
    pt: "Não conseguimos enviar. Escreva para contact@jakeboxmusic.com.",
  },
  feedback_login_needed: {
    en: "This link is invalid. Log in to send your feedback:",
    pt: "Este link não é válido. Entre na sua conta para mandar sua opinião:",
  },
  contact_err_send: {
    en: "We couldn't send your message. Please email us at contact@jakeboxmusic.com.",
    pt: "Não conseguimos enviar sua mensagem. Escreva para contact@jakeboxmusic.com.",
  },

  // Genre picker
  genre_pick: {
    en: "Pick a genre and a ready-made style (or write your own below)",
    pt: "Escolha um gênero e um estilo pronto (ou escreva o seu abaixo)",
  },

  // Voice cloning status
  voice_preparing: {
    en: "{name} (preparing…)",
    pt: "{name} (preparando…)",
  },
  voice_preparing_note: {
    en: "Your new voice is being prepared — this takes 1 to 3 minutes. It will show up here when ready.",
    pt: "Sua nova voz está sendo preparada — leva de 1 a 3 minutos. Ela aparece aqui quando ficar pronta.",
  },
  voice_failed_note: {
    en: "Couldn't create the voice \"{name}\": {reason}",
    pt: "Não foi possível criar a voz \"{name}\": {reason}",
  },

  // Admin user list
  admin_users_total: {
    en: "{n} users",
    pt: "{n} usuários",
  },
  admin_search: {
    en: "Search by email or name...",
    pt: "Buscar por e-mail ou nome...",
  },
  admin_no_users: {
    en: "No users found.",
    pt: "Nenhum usuário encontrado.",
  },
  admin_songs_n: {
    en: "{n} songs",
    pt: "{n} músicas",
  },
  admin_credits_n: {
    en: "{n} credits",
    pt: "{n} créditos",
  },
  admin_quota_n: {
    en: "{n} included songs",
    pt: "{n} músicas incluídas",
  },
  admin_plan: {
    en: "plan {plan}",
    pt: "plano {plan}",
  },
  admin_banned: {
    en: "banned",
    pt: "banido",
  },
  admin_edit: {
    en: "Edit",
    pt: "Editar",
  },
  admin_send_reset: {
    en: "Send reset link",
    pt: "Enviar link de nova senha",
  },
  admin_reset_sent: {
    en: "Reset link sent to the user's email.",
    pt: "Link de nova senha enviado para o e-mail do usuário.",
  },
  admin_ban: {
    en: "Ban",
    pt: "Banir",
  },
  admin_unban: {
    en: "Unban",
    pt: "Desbanir",
  },
  admin_banned_done: {
    en: "User banned.",
    pt: "Usuário banido.",
  },
  admin_unbanned: {
    en: "User unbanned.",
    pt: "Usuário desbanido.",
  },
  admin_delete: {
    en: "Delete",
    pt: "Excluir",
  },
  admin_quota_label: {
    en: "Included songs",
    pt: "Músicas incluídas",
  },
  admin_credit_delta_label: {
    en: "Add/remove credits",
    pt: "Adicionar/remover créditos",
  },
  admin_save: {
    en: "Save",
    pt: "Salvar",
  },
  admin_cancel: {
    en: "Cancel",
    pt: "Cancelar",
  },
  admin_saved: {
    en: "Saved.",
    pt: "Salvo.",
  },
  admin_delete_confirm: {
    en: "Permanently delete {email} ({songs} songs, {credits} credits)? This can't be undone.",
    pt: "Excluir {email} definitivamente ({songs} músicas, {credits} créditos)? Não dá para desfazer.",
  },
  admin_delete_has_plan: {
    en: "This user has an active monthly plan. Cancel it in Stripe first so they aren't charged again.",
    pt: "Este usuário tem um plano mensal ativo. Cancele no Stripe primeiro para ele não ser cobrado de novo.",
  },
  admin_delete_yes: {
    en: "Yes, delete",
    pt: "Sim, excluir",
  },
  admin_deleted: {
    en: "User deleted.",
    pt: "Usuário excluído.",
  },

  // Admin user count (singular)
  admin_users_one: {
    en: "1 user",
    pt: "1 usuário",
  },

  // OAuth buttons
  oauth_google: {
    en: "Continue with Google",
    pt: "Continuar com Google",
  },
  oauth_facebook: {
    en: "Continue with Facebook",
    pt: "Continuar com Facebook",
  },
  oauth_failed: {
    en: "The sign-in didn't finish. Please try again. If you opened Jakebox from Instagram, Facebook or TikTok, open it in your browser (Chrome or Safari) first.",
    pt: "O login não foi concluído. Tente de novo. Se você abriu o Jakebox pelo Instagram, Facebook ou TikTok, abra no navegador (Chrome ou Safari) antes.",
  },
  oauth_inapp: {
    en: "You're in the Instagram/Facebook/TikTok browser, where Google sign-in doesn't work. Open Jakebox in your browser to sign in with Google.",
    pt: "Você está no navegador do Instagram/Facebook/TikTok, onde o login com Google não funciona. Abra o Jakebox no navegador para entrar com o Google.",
  },
  oauth_inapp_ios: {
    en: "Tap ··· (top right) and choose \"Open in browser\".",
    pt: "Toque em ··· (no canto de cima) e escolha \"Abrir no navegador\".",
  },
  oauth_open_chrome: { en: "Open in Chrome", pt: "Abrir no Chrome" },
  oauth_or: {
    en: "or",
    pt: "ou",
  },

  // Nav / home / player / radio (accessibility labels and small bits)
  nav_switch_language: { en: "Switch language", pt: "Mudar idioma" },
  nav_open_menu: { en: "Open menu", pt: "Abrir menu" },
  nav_close_menu: { en: "Close menu", pt: "Fechar menu" },
  home_logo_alt: { en: "Jake, the Jakebox mascot", pt: "Jake, o mascote do Jakebox" },
  player_download: { en: "Download", pt: "Baixar" },
  player_video: { en: "Video", pt: "Vídeo" },
  player_download_video: { en: "Download video", pt: "Baixar vídeo" },
  radio_play: { en: "Play", pt: "Tocar" },
  share_text: {
    en: "📻 Jakebox Radio is on the air! Songs made with AI on Jakebox, playing live 24 hours a day. Listen now:",
    pt: "📻 A Rádio Jakebox está no ar! Músicas criadas com inteligência artificial no Jakebox, tocando ao vivo 24 horas por dia. Ouça agora:",
  },
  price_per_song: { en: "song", pt: "música" },

  // API errors shown to the user (mapped from the server's English messages
  // in src/lib/i18n/apiErrors.ts)
  err_not_signed_in: { en: "You're not logged in. Log in and try again.", pt: "Você não está conectado. Entre e tente novamente." },
  err_not_found: { en: "Not found.", pt: "Não encontrado." },
  err_forbidden: { en: "You don't have permission to do this.", pt: "Você não tem permissão para fazer isso." },
  err_invalid_form: { en: "Invalid form data. Please try again.", pt: "Dados do formulário inválidos. Tente novamente." },
  err_ref_and_voice: {
    en: "Use a reference song or a voice, not both",
    pt: "Use uma música de referência ou uma voz, não as duas",
  },
  err_ref_not_found: { en: "Reference song not found", pt: "Música de referência não encontrada" },
  err_voice_not_found: { en: "Voice not found", pt: "Voz não encontrada" },
  err_voice_not_ready: { en: "This voice isn't ready yet", pt: "Esta voz ainda não está pronta" },
  err_upload_empty: { en: "The uploaded file is empty", pt: "O arquivo enviado está vazio" },
  err_upload_too_large: { en: "File is too large (max 30MB)", pt: "O arquivo é grande demais (máximo de 30 MB)" },
  err_upload_unreadable: {
    en: "Couldn't read that audio file — is it a valid audio format?",
    pt: "Não foi possível ler esse arquivo de áudio — ele está em um formato de áudio válido?",
  },
  err_voice_required: { en: "Audio recording is required", pt: "A gravação de áudio é obrigatória" },
  err_voice_empty: { en: "The recording is empty", pt: "A gravação está vazia" },
  err_voice_too_large: { en: "Recording is too large (max 20MB)", pt: "A gravação é grande demais (máximo de 20 MB)" },
  err_voice_unreadable: {
    en: "Couldn't read that recording — try recording again",
    pt: "Não foi possível ler essa gravação — tente gravar de novo",
  },
  err_invalid_email: { en: "Invalid email", pt: "E-mail inválido" },
  err_password_rules: {
    en: "Password requirements: at least 8 characters, including a number and a special character",
    pt: "Requisitos da senha: no mínimo 8 caracteres, incluindo um número e um caractere especial",
  },
  err_accept_terms: { en: "You must accept the Terms of Use", pt: "Você precisa aceitar os Termos de Uso" },
  err_email_taken: { en: "An account with this email already exists", pt: "Já existe uma conta com este e-mail" },
  err_reset_missing_token: { en: "Missing reset token", pt: "O código de redefinição está faltando" },
  err_reset_invalid: {
    en: "This reset link is invalid or has expired",
    pt: "Este link de redefinição é inválido ou expirou",
  },
  err_plan_exists: { en: "You already have an active plan", pt: "Você já tem um plano ativo" },
  err_no_plan: { en: "No active plan", pt: "Nenhum plano ativo" },
  err_song_not_found: { en: "Song not found", pt: "Música não encontrada" },
  err_song_audio_unreadable: {
    en: "Couldn't read the song's audio file",
    pt: "Não foi possível ler o arquivo de áudio da música",
  },
  err_clip_count: { en: "Upload {min} to {max} clips", pt: "Envie de {min} a {max} vídeos" },
  err_clip_too_large: {
    en: "{name} is too large (max {max}MB per clip)",
    pt: "{name} é grande demais (máximo de {max} MB por vídeo)",
  },
  err_email_not_sent: { en: "The email could not be sent", pt: "Não foi possível enviar o e-mail" },
  err_cant_ban_owner: { en: "Can't ban the owner", pt: "Não é possível banir o dono" },
  err_owner_only_delete: { en: "Only the owner can delete users", pt: "Só o dono pode excluir usuários" },
  err_staff_not_deletable: {
    en: "Owner/admin accounts can't be deleted here",
    pt: "Contas de dono/admin não podem ser excluídas aqui",
  },
  err_quota_invalid: {
    en: "Included songs must be a whole number from 0 to 1000",
    pt: "Músicas incluídas: use um número inteiro de 0 a 1000",
  },
  err_credit_delta_invalid: {
    en: "Credits to add/remove must be a whole number",
    pt: "Os créditos a adicionar/remover devem ser um número inteiro",
  },

  // Video Studio / Studio (staff-only tools)
  vstudio_title: { en: "Lyric Video", pt: "Vídeo com letra" },
  vstudio_go_studio: { en: "Go to Studio", pt: "Ir para o Estúdio" },
  vstudio_subtitle: {
    en: "Turns a song into a Whisper-aligned captioned lyric video via the Video Studio service.",
    pt: "Transforma uma música em um vídeo com a letra legendada e sincronizada pelo Whisper, usando o serviço Video Studio.",
  },
  vstudio_no_renders: { en: "No video renders yet.", pt: "Nenhum vídeo renderizado ainda." },
  vstudio_working: { en: "Working...", pt: "Processando..." },
  vstudio_edit_in_studio: { en: "Edit shorts & links in Studio", pt: "Editar cortes e links no Estúdio" },
  studio_new_video: { en: "+ Generate a video", pt: "+ Gerar um vídeo" },
  studio_subtitle: {
    en: "Cut short clips, copy promo hashtags, and save the channel's Spotify/YouTube links for videos rendered in Video Studio.",
    pt: "Corte clipes curtos, copie as hashtags de divulgação e salve os links do canal no Spotify/YouTube para os vídeos renderizados no Video Studio.",
  },
  studio_no_videos: {
    en: "No finished videos yet — generate one in Video first.",
    pt: "Nenhum vídeo pronto ainda — gere um em Vídeo primeiro.",
  },
  studio_copied: { en: "Copied!", pt: "Copiado!" },
  studio_copy_promo: { en: "Copy promo text", pt: "Copiar texto de divulgação" },
  studio_short_clip: { en: "Short clip", pt: "Clipe curto" },
  studio_not_cut: { en: "Not cut yet", pt: "Ainda não cortado" },
  studio_start_seconds: { en: "Start (seconds)", pt: "Início (segundos)" },
  studio_end_seconds: { en: "End (seconds)", pt: "Fim (segundos)" },
  studio_to: { en: "to", pt: "até" },
  studio_cut: { en: "Cut", pt: "Cortar" },
  studio_auto_chorus: { en: "Auto-detect chorus", pt: "Detectar refrão automaticamente" },
  studio_channel_links: {
    en: "Channel links (shared across all videos)",
    pt: "Links do canal (valem para todos os vídeos)",
  },
  studio_spotify_link: { en: "Spotify link", pt: "Link do Spotify" },
  studio_youtube_link: { en: "YouTube link", pt: "Link do YouTube" },
  studio_cut_failed: { en: "Couldn't cut the short clip", pt: "Não foi possível cortar o clipe curto" },
  studio_links_failed: { en: "Couldn't save the links", pt: "Não foi possível salvar os links" },
  studio_job_not_ready: { en: "This video isn't ready yet", pt: "Este vídeo ainda não está pronto" },
} as const;

export type DictionaryKey = keyof typeof DICTIONARY;

/** Fills `{name}` placeholders in a translated string. */
export function interpolate(text: string, vars?: Record<string, string | number>): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}
