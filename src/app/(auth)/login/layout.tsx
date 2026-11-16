import { pageMetadata } from "@/lib/seo";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata() {
  return pageMetadata("login", "/login", await getLocale());
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
