import { notFound } from "next/navigation";
import { getStoreCtx } from "@/lib/tenant";
import { getCurrentUser } from "@/lib/session";
import { requireStoreAccess } from "@/lib/authorize";
import { services } from "@/lib/services";
import { storeHref } from "@/lib/links";
import StoreSetup from "@/components/admin/store-setup";

export const metadata = { title: "إعداد المتجر" };
export default async function StoreSetupPage() {
  const ctx = await getStoreCtx();
  if (!ctx?.bundle) notFound();
  const { store, settings } = ctx.bundle;
  requireStoreAccess(await getCurrentUser(), store.id);
  const [categories, products, pages, site] = await Promise.all([
    services().listCategories(store.id, true), services().listProducts(store.id, { includeHidden: true }),
    services().listPages(store.id), services().getSiteSettings(),
  ]);
  return <StoreSetup store={{ ...store, clientCredentials: null }} settings={settings} categories={categories} products={products} pages={pages} contact={site.whatsappNumber} storeUrl={await storeHref(store.subdomain)} />;
}
