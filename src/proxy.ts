import { NextResponse, type NextRequest } from "next/server";
import { LANG_HEADER } from "@/lib/i18n/langHeader";

const LOCALE_COOKIE = "jakebox-locale";

/** `?lang=pt` / `?lang=en` pins the page language for that request (so search
 * engines can crawl each language at its own URL — the hreflang alternates
 * point here) and remembers it in the same cookie the language switch uses. */
export function proxy(request: NextRequest) {
  const lang = request.nextUrl.searchParams.get("lang");
  if (lang !== "pt" && lang !== "en") return NextResponse.next();

  const headers = new Headers(request.headers);
  headers.set(LANG_HEADER, lang);
  const response = NextResponse.next({ request: { headers } });
  response.cookies.set(LOCALE_COOKIE, lang, { path: "/", maxAge: 31536000, sameSite: "lax" });
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|icons|branding|fonts|sw.js).*)",
      has: [{ type: "query", key: "lang" }],
    },
  ],
};
