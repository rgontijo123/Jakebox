import { pageMetadata } from "@/lib/seo";
import { getLocale } from "@/lib/i18n/server";
import { PublicPricing } from "@/components/PublicPricing";

export async function generateMetadata() {
  return pageMetadata("pricing", "/pricing", await getLocale());
}

export default function PricingPage() {
  return <PublicPricing />;
}
