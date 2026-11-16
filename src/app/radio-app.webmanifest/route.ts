/** PWA manifest for Rádio Jakebox on its own: "Install" / "Add to Home
 * Screen" from /radio gives a standalone radio app (no browser bar) that
 * opens straight on the player. */
export function GET() {
  return Response.json(
    {
      name: "Rádio Jakebox",
      short_name: "Rádio Jakebox",
      description: "Músicas criadas no Jakebox, ao vivo 24 horas por dia.",
      id: "/radio",
      start_url: "/radio?app=1",
      scope: "/radio",
      display: "standalone",
      orientation: "portrait",
      background_color: "#09090b",
      theme_color: "#09090b",
      icons: [
        { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json", "Cache-Control": "public, max-age=3600" } },
  );
}
