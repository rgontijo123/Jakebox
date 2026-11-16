import { pageMetadata } from "@/lib/seo";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata() {
  return pageMetadata("signup", "/signup", await getLocale());
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
