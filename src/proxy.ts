import { NextResponse, type NextRequest } from "next/server";
import { LANG_HEADER } from "@/lib/i18n/langHeader";
import { SOURCE_COOKIE, classifySource } from "@/lib/signupSource";

const LOCALE_COOKIE = "jakebox-locale";

/** Where this visit came from, if it came from outside: ?utm_source= / ?ref=
 * first, else the Referer's host. Null for internal or direct visits. */
function externalSource(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const tagged = q.get("utm_source") || q.get("ref") || q.get("src");
  const referer = request.headers.get("referer");
  let refHost: string | null = null;
  if (referer) {
    try {
      refHost = new URL(referer).hostname.replace(/^www\./, "");
    } catch {}
  }
  if (refHost && refHost.endsWith(request.nextUrl.hostname.replace(/^www\./, ""))) refHost = null;
  if (refHost === "localhost" || refHost?.endsWith("onrender.com")) refHost = null;
  if (!tagged && !refHost) return null;
  const source = classifySource(tagged || refHost!);
  return [source, refHost ?? "", request.nextUrl.pathname].join("|").slice(0, 300);
}

/** `?lang=pt` / `?lang=en` pins the page language for that request (so search
 * engines can crawl each language at its own URL — the hreflang alternates
 * point here) and remembers it in the same cookie the language switch uses.
 * Also remembers the first outside source of a visitor (signup attribution). */
export function proxy(request: NextRequest) {
  const lang = request.nextUrl.searchParams.get("lang");
  const pinLang = lang === "pt" || lang === "en";
  const source = request.cookies.has(SOURCE_COOKIE) ? null : externalSource(request);
  if (!pinLang && !source) return NextResponse.next();

  let response: NextResponse;
  if (pinLang) {
    const headers = new Headers(request.headers);
    headers.set(LANG_HEADER, lang);
    response = NextResponse.next({ request: { headers } });
    response.cookies.set(LOCALE_COOKIE, lang, { path: "/", maxAge: 31536000, sameSite: "lax" });
  } else {
    response = NextResponse.next();
  }
  if (source) {
    response.cookies.set(SOURCE_COOKIE, encodeURIComponent(source), {
      path: "/",
      maxAge: 90 * 86400,
      sameSite: "lax",
      httpOnly: true,
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icons|branding|fonts|radio/|sw.js|.*\.(?:png|jpg|jpeg|svg|webp|mp3|mp4|ico|json|txt|xml)$).*)"],
};
