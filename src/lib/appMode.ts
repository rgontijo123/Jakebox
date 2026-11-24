/** "App mode": the site running inside the Android app (a Trusted Web
 * Activity that opens /create?app=android). Google Play doesn't allow selling
 * digital goods through our own checkout inside the app, so purchases are
 * hidden there: anything marked `web-only` disappears, `app-only` appears
 * (see globals.css). Detected before first paint by APP_MODE_SCRIPT and kept
 * for the rest of the app session in sessionStorage -- not a cookie, since the
 * app shares Chrome's cookie jar and the normal browser must keep its prices. */
export const ANDROID_PACKAGE = "com.jakeboxmusic.app";

export const APP_MODE_SCRIPT = `try{var k="jakebox-app";if(new URLSearchParams(location.search).get("app")==="android"||document.referrer.indexOf("android-app://${ANDROID_PACKAGE}")===0)sessionStorage.setItem(k,"android");if(sessionStorage.getItem(k))document.documentElement.classList.add("in-app")}catch(e){}`;

export function isInApp() {
  return typeof document !== "undefined" && document.documentElement.classList.contains("in-app");
}
