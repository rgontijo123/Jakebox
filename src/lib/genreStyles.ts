/** Ready-made style prompts grouped by genre, shown on the Create page so a
 * user can pick a sound and only write the lyrics. Prompts stay in English
 * (that's what the music models follow best) and never name real artists;
 * only the labels are translated. `language` pre-selects the lyrics language
 * when the style is clearly tied to one. */
export type GenreStyle = { name: { en: string; pt: string }; prompt: string; language?: string };
export type Genre = { id: string; emoji: string; name: { en: string; pt: string }; styles: GenreStyle[] };

export const GENRES: Genre[] = [
  {
    id: "reggae",
    emoji: "🌴",
    name: { en: "Reggae", pt: "Reggae" },
    styles: [
      {
        name: { en: "Roots rasta", pt: "Roots rasta" },
        prompt:
          "Roots reggae, laid-back rasta vibe, 75 BPM, off-beat skank guitar, deep warm bassline, one-drop drums, organ bubble, smooth melodic male vocal, warm and positive",
      },
      {
        name: { en: "Brazilian reggae", pt: "Reggae brasileiro" },
        prompt:
          "Brazilian reggae, relaxed groove, 78 BPM, off-beat guitar chords, round bass, light percussion, harmonica fills, smooth male vocal in Brazilian Portuguese, sunny and nostalgic",
        language: "pt-BR",
      },
      {
        name: { en: "Reggae with harmonica & bongos", pt: "Reggae com gaita e bongô" },
        prompt:
          "Roots reggae, 75 BPM, off-beat skank guitar, deep bassline, one-drop drums, bongo percussion grooves, soulful harmonica melodies and solos, light dub echoes, smooth melodic male vocal",
      },
      {
        name: { en: "Dub", pt: "Dub" },
        prompt:
          "Dub reggae, 70 BPM, heavy sub bass, sparse drums, spring reverb and tape delay echoes on guitar and snare, melodica, mostly instrumental with short echoed vocal phrases",
      },
    ],
  },
  {
    id: "rock",
    emoji: "🎸",
    name: { en: "Rock", pt: "Rock" },
    styles: [
      {
        name: { en: "Classic rock", pt: "Rock clássico" },
        prompt:
          "Classic rock, 120 BPM, crunchy overdriven electric guitars, solid bass, live drums, guitar solo, powerful raspy male vocal, anthemic chorus",
      },
      {
        name: { en: "Pop rock", pt: "Pop rock" },
        prompt:
          "Upbeat pop rock, 128 BPM, bright electric guitars, punchy drums, catchy sing-along chorus, energetic clear vocal, radio-friendly",
      },
      {
        name: { en: "Romantic rock ballad", pt: "Balada rock romântica" },
        prompt:
          "Romantic rock ballad, 72 BPM, clean arpeggiated guitar, piano, building to big distorted chorus, emotional melodic guitar solo, heartfelt male vocal",
      },
      {
        name: { en: "Hard rock", pt: "Hard rock" },
        prompt:
          "Hard rock, 140 BPM, heavy distorted riffs, driving bass, hard-hitting drums, shredding guitar solo, gritty powerful vocal",
      },
    ],
  },
  {
    id: "electronic",
    emoji: "🎧",
    name: { en: "Techno / Electronic", pt: "Techno / Eletrônica" },
    styles: [
      {
        name: { en: "Melodic techno", pt: "Techno melódico" },
        prompt:
          "Melodic techno, 124 BPM, deep rolling bassline, hypnotic arpeggiated synths, atmospheric pads, steady four-on-the-floor kick, emotional breakdown and drop, airy processed vocal",
      },
      {
        name: { en: "Big room house", pt: "Big room house" },
        prompt:
          "Big room house, 128 BPM, festival energy, huge synth lead drop, side-chained pads, build-up with snare roll, euphoric vocal hook",
      },
      {
        name: { en: "Psytrance", pt: "Psytrance" },
        prompt:
          "Psytrance, 142 BPM, rolling triplet bassline, acid squelches, psychedelic synth layers, driving kick, hypnotic and energetic, short chanted vocal phrases",
      },
      {
        name: { en: "Romantic techno (English duet)", pt: "Techno romântico (dueto em inglês)" },
        prompt:
          "Melodic techno, romantic yet energetic, 124 BPM, warm rolling bassline, lush emotional synth pads, female and male duet vocals in English, both processed with light reverb, euphoric drop",
        language: "en",
      },
      {
        name: { en: "Peak-time techno", pt: "Techno eletrônico (pista)" },
        prompt:
          "Peak-time techno, 132 BPM, pounding kick, driving rumbling bass, hypnotic stabs, industrial percussion, dark warehouse energy, short repeated vocal phrases",
      },
      {
        name: { en: "Uplifting trance", pt: "Trance" },
        prompt:
          "Uplifting trance, 138 BPM, soaring supersaw leads, rolling offbeat bass, long emotional breakdown with piano, big euphoric drop, ethereal vocal",
      },
      {
        name: { en: "Drum and bass", pt: "Drum and bass" },
        prompt:
          "Liquid drum and bass, 174 BPM, fast breakbeats, deep rolling sub bass, atmospheric pads, smooth soulful vocal",
      },
      {
        name: { en: "Deep house", pt: "Deep house" },
        prompt:
          "Deep house, 120 BPM, warm groovy bassline, soft chords, crisp hi-hats, smooth soulful vocal, relaxed late-night club vibe",
      },
    ],
  },
  {
    id: "pop",
    emoji: "⭐",
    name: { en: "Pop", pt: "Pop" },
    styles: [
      {
        name: { en: "Upbeat pop", pt: "Pop animado" },
        prompt:
          "Upbeat modern pop, 118 BPM, bright synths, punchy drums, catchy hook, polished production, clear confident vocal",
      },
      {
        name: { en: "Brazilian pop", pt: "Pop brasileiro" },
        prompt:
          "Brazilian pop, 110 BPM, acoustic and electric guitars, light electronic beat, catchy chorus, warm vocal in Brazilian Portuguese",
        language: "pt-BR",
      },
      {
        name: { en: "80s synth-pop", pt: "Synth-pop anos 80" },
        prompt:
          "80s synth-pop, 115 BPM, retro analog synths, gated reverb drums, driving bassline, nostalgic melodic vocal",
      },
      {
        name: { en: "Pop ballad", pt: "Balada pop" },
        prompt:
          "Emotional pop ballad, 70 BPM, piano and soft strings, gentle build, heartfelt intimate vocal, big final chorus",
      },
    ],
  },
  {
    id: "sertanejo",
    emoji: "🤠",
    name: { en: "Sertanejo", pt: "Sertanejo" },
    styles: [
      {
        name: { en: "Sertanejo universitário", pt: "Sertanejo universitário" },
        prompt:
          "Sertanejo universitário, 100 BPM, acoustic guitar, accordion, upbeat drums and bass, catchy party chorus, male duo vocals in Brazilian Portuguese",
        language: "pt-BR",
      },
      {
        name: { en: "Sofrência", pt: "Sofrência" },
        prompt:
          "Sertanejo sofrência, 85 BPM, accordion, acoustic guitar, emotional heartbreak mood, dramatic chorus, passionate vocal in Brazilian Portuguese",
        language: "pt-BR",
      },
      {
        name: { en: "Raiz (traditional)", pt: "Sertanejo raiz" },
        prompt:
          "Traditional Brazilian sertanejo raiz, 90 BPM, viola caipira, acoustic guitar, simple rhythm, two-voice harmony in Brazilian Portuguese, countryside nostalgia",
        language: "pt-BR",
      },
    ],
  },
  {
    id: "samba",
    emoji: "🥁",
    name: { en: "Samba & Pagode", pt: "Samba e Pagode" },
    styles: [
      {
        name: { en: "Roots samba", pt: "Samba de raiz" },
        prompt:
          "Brazilian roots samba, 96 BPM, cavaquinho, 7-string guitar, pandeiro, surdo and tamborim, group backing vocals, joyful male lead vocal in Brazilian Portuguese",
        language: "pt-BR",
      },
      {
        name: { en: "Pagode", pt: "Pagode" },
        prompt:
          "Brazilian pagode, 92 BPM, cavaquinho, banjo, pandeiro, tantã, warm bass, romantic and festive, smooth vocal in Brazilian Portuguese with group chorus",
        language: "pt-BR",
      },
      {
        name: { en: "Stadium samba (fan chant)", pt: "Samba de torcida" },
        prompt:
          "Stadium samba, 104 BPM, big drums section (surdo, caixa, repinique), cavaquinho, crowd chanting chorus, energetic proud vocal in Brazilian Portuguese",
        language: "pt-BR",
      },
    ],
  },
  {
    id: "funk",
    emoji: "🔊",
    name: { en: "Brazilian funk", pt: "Funk" },
    styles: [
      {
        name: { en: "Funk carioca", pt: "Funk carioca" },
        prompt:
          "Brazilian funk carioca, 130 BPM, tamborzão beat, heavy 808 bass, vocal chops, party energy, confident vocal in Brazilian Portuguese",
        language: "pt-BR",
      },
      {
        name: { en: "Melodic funk", pt: "Funk melody" },
        prompt:
          "Brazilian melodic funk, 125 BPM, funk beat with soft synth chords, catchy romantic melody, smooth vocal in Brazilian Portuguese",
        language: "pt-BR",
      },
    ],
  },
  {
    id: "mpb",
    emoji: "🌙",
    name: { en: "MPB & Bossa nova", pt: "MPB e Bossa nova" },
    styles: [
      {
        name: { en: "Bossa nova", pt: "Bossa nova" },
        prompt:
          "Bossa nova, 120 BPM, nylon-string guitar with syncopated chords, soft brushed drums, upright bass, gentle flute, intimate soft vocal in Brazilian Portuguese",
        language: "pt-BR",
      },
      {
        name: { en: "Acoustic MPB", pt: "MPB acústica" },
        prompt:
          "Acoustic MPB, 95 BPM, acoustic guitar, light percussion, piano, poetic warm vocal in Brazilian Portuguese, gentle and nostalgic",
        language: "pt-BR",
      },
    ],
  },
  {
    id: "romantic",
    emoji: "🌹",
    name: { en: "Romantic", pt: "Romântico" },
    styles: [
      {
        name: { en: "Crooner standard", pt: "Standard crooner" },
        prompt:
          "Classic romantic jazz standard, 1950s crooner style, 72 BPM, lush string orchestra, soft brushed drums, upright bass, piano fills, muted trumpet, warm velvety baritone male vocal, elegant and romantic",
      },
      {
        name: { en: "Big band swing", pt: "Swing com big band" },
        prompt:
          "Big band swing, 1950s style, 128 BPM, brass section hits, saxophone section, walking upright bass, swinging ride cymbal, piano, smooth charismatic crooner male vocal, joyful and romantic",
      },
      {
        name: { en: "Piano bar ballad", pt: "Balada de piano-bar" },
        prompt:
          "Intimate late-night jazz ballad, 66 BPM, solo piano with soft upright bass and brushes, tenor saxophone fills, smoky piano-bar atmosphere, tender sultry vocal, romantic and nostalgic",
      },
      {
        name: { en: "Romantic bolero", pt: "Bolero romântico" },
        prompt:
          "Romantic bolero, 80 BPM, nylon-string guitar requinto melodies, soft bongos and maracas, warm strings, upright bass, passionate heartfelt vocal, nostalgic and dreamy",
      },
      {
        name: { en: "Romantic duet", pt: "Dueto romântico" },
        prompt:
          "Romantic orchestral duet ballad, 70 BPM, piano, lush strings, soft drums, male and female vocals alternating verses and harmonizing in the chorus, timeless and heartfelt",
      },
    ],
  },
  {
    id: "hiphop",
    emoji: "🎤",
    name: { en: "Hip hop / Rap", pt: "Hip hop / Rap" },
    styles: [
      {
        name: { en: "Boom bap", pt: "Boom bap" },
        prompt:
          "Boom bap hip hop, 90 BPM, dusty drum breaks, jazzy piano sample, deep bass, confident rhythmic rap verses with a melodic hook",
      },
      {
        name: { en: "Trap", pt: "Trap" },
        prompt: "Trap, 140 BPM half-time, rolling hi-hats, booming 808s, dark synths, melodic auto-tuned hook, energetic rap verses",
      },
      {
        name: { en: "Brazilian rap", pt: "Rap nacional" },
        prompt:
          "Brazilian rap, 92 BPM, hard-hitting drums, soulful sample, deep bass, storytelling rap in Brazilian Portuguese, melodic chorus",
        language: "pt-BR",
      },
    ],
  },
  {
    id: "forro",
    emoji: "🪗",
    name: { en: "Forró", pt: "Forró" },
    styles: [
      {
        name: { en: "Forró pé-de-serra", pt: "Forró pé-de-serra" },
        prompt:
          "Forró pé-de-serra, 120 BPM, accordion, zabumba, triangle, danceable northeastern Brazilian groove, warm vocal in Brazilian Portuguese",
        language: "pt-BR",
      },
      {
        name: { en: "Modern forró", pt: "Forró moderno" },
        prompt:
          "Modern forró, 125 BPM, accordion, electric bass, drums, keyboards, upbeat party chorus, vocal in Brazilian Portuguese",
        language: "pt-BR",
      },
    ],
  },
  {
    id: "gospel",
    emoji: "🙏",
    name: { en: "Gospel / Worship", pt: "Gospel / Louvor" },
    styles: [
      {
        name: { en: "Worship", pt: "Louvor" },
        prompt:
          "Contemporary worship, 72 BPM, piano and ambient pads, building drums and electric guitar swells, uplifting heartfelt vocal, big congregational chorus",
      },
      {
        name: { en: "Gospel choir", pt: "Gospel com coral" },
        prompt: "Gospel, 95 BPM, Hammond organ, piano, clapping, energetic choir backing, powerful soulful lead vocal",
      },
    ],
  },
  {
    id: "chill",
    emoji: "☕",
    name: { en: "Lo-fi / Chill", pt: "Lo-fi / Chill" },
    styles: [
      {
        name: { en: "Lo-fi", pt: "Lo-fi" },
        prompt:
          "Lo-fi hip hop, 80 BPM, dusty vinyl crackle, mellow jazzy chords, soft boom bap drums, warm bass, relaxed soft vocal",
      },
      {
        name: { en: "Acoustic chill", pt: "Acústico tranquilo" },
        prompt: "Acoustic chill, 85 BPM, fingerpicked acoustic guitar, soft percussion, gentle warm vocal, calm and cozy",
      },
    ],
  },
];
