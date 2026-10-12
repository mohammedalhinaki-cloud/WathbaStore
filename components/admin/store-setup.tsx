"use client";
import { useEffect, useState } from "react";
import type { Store, StoreSettings, Category, Product, StorePage } from "@/lib/types";
import { waChatLink } from "@/lib/wa";
import { storeUrl as publicStoreUrl } from "@/lib/constants";
import StoreInfoForm from "./store-info-form";
import DesignForm from "./design-form";
import StoreSettingsForm from "./store-settings-form";
import SeoForm from "./seo-form";
import CategoriesManager from "./categories-manager";
import PagesManager from "./pages-manager";
import ProductForm from "./product-form";
import SubdomainManager from "./subdomain-manager";
import { SetupSaveContext } from "./setup-save-context";

interface Props { store: Store; settings: StoreSettings; categories: Category[]; products: Product[]; pages: StorePage[]; contact: string; storeUrl: string }
export default function StoreSetup({ store, settings, categories, products, pages, contact, storeUrl }: Props) {
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const hasUnsaved = Object.values(dirty).some(Boolean);
  const mark = (id: string, value: boolean) => setDirty((old) => ({ ...old, [id]: value }));
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (hasUnsaved) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasUnsaved]);
  function section(id: string, title: string, children: React.ReactNode, initiallyOpen = false) {
    return <details key={id} open={initiallyOpen || undefined} className="rounded-2xl border border-ink-200 bg-white p-4 sm:p-6"><summary className="cursor-pointer text-lg font-extrabold text-ink-900">{title}{dirty[id] && <span className="mr-2 text-xs font-normal text-amber-700">تغييرات غير محفوظة</span>}</summary><SetupSaveContext.Provider value={{ saved: () => mark(id, false), dirty: () => mark(id, true) }}><div className="mt-5" onChangeCapture={() => mark(id, true)} onClickCapture={(event) => { if ((event.target as HTMLElement).closest("button[aria-pressed]")) mark(id, true); }}>{children}</div></SetupSaveContext.Provider></details>;
  }
  return <div className="space-y-5">
    <div><h1 className="text-2xl font-extrabold text-ink-900">جهّز متجرك بنفسك</h1><p className="mt-2 text-sm leading-7 text-ink-500">عدّل الأقسام التالية واحفظ تغييراتك داخل كل قسم، ثم اضغط «انشر المتجر» في آخر الصفحة.</p><a href={storeUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block font-bold text-brand-600">معاينة المتجر ↗</a></div>
    {section("info", "١. بيانات المتجر والصور", <StoreInfoForm store={store} settings={settings} />, true)}
    {section("design", "٢. التصميم والخطوط والألوان", <DesignForm store={store} settings={settings} />)}
    {section("categories", "٣. الأقسام", <CategoriesManager storeId={store.id} categories={categories} />)}
    {section("products", "٤. المنتجات", <div className="space-y-4">
      <button className="rounded-xl bg-brand-600 px-4 py-3 font-bold text-white" onClick={() => { if (!dirty.products || confirm("تجاهل تعديلات المنتج غير المحفوظة؟")) { mark("products", false); setProduct(null); } }}>إضافة منتج</button>
      <div className="grid gap-2 sm:grid-cols-2">{products.map((p) => <button key={p.id} className="rounded-xl border p-3 text-right font-bold" onClick={() => { if (!dirty.products || confirm("تجاهل تعديلات المنتج غير المحفوظة؟")) { mark("products", false); setProduct(p); } }}>{p.name} — تعديل</button>)}</div>
      {product !== undefined && <ProductForm key={product?.id ?? "new"} storeId={store.id} categories={categories} product={product ?? undefined} backHref="/admin/setup" onDone={() => { mark("products", false); setProduct(undefined); }} />}
    </div>)}
    {section("pages", "٥. الصفحات والمحتوى", <PagesManager storeId={store.id} pages={pages} />)}
    {section("settings", "٦. التواصل والحسابات البنكية", <StoreSettingsForm store={store} settings={settings} lockAttribution />)}
    {section("seo", "٧. الظهور في محركات البحث", <SeoForm store={store} settings={settings} canonicalBase={publicStoreUrl(store.subdomain)} />)}
    {section("domain", "٨. رابط المتجر", <SubdomainManager store={store} clientSetup />)}
    <section className="rounded-2xl border border-brand-200 bg-brand-50 p-6"><h2 className="text-lg font-extrabold">٩. جاهز للنشر</h2><p className="mt-2 text-sm leading-7">سيُفتح واتساب برسالة جاهزة إلى معون لإبلاغنا بانتهاء الإعداد وطلب نشر المتجر.</p>
      {hasUnsaved && <p role="status" className="mt-3 text-sm text-amber-800">احفظ التغييرات غير المحفوظة أعلاه قبل طلب النشر.</p>}
      {!contact && <p role="alert" className="mt-3 text-sm text-rose-700">رقم التواصل مع معون غير مضبوط حاليًا. تواصل مع مسؤول المنصة.</p>}
      <a aria-disabled={hasUnsaved || !contact} href={hasUnsaved || !contact ? undefined : waChatLink(contact, `انتهيت من إعداد المتجر\nاسم المتجر: ${store.name}\nرابط المتجر: ${publicStoreUrl(store.subdomain)}`)} target="_blank" rel="noopener noreferrer" className={`mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-600 px-8 py-3 font-extrabold text-white ${hasUnsaved || !contact ? "cursor-not-allowed opacity-50" : "hover:bg-emerald-700"}`}>انشر المتجر</a>
    </section>
  </div>;
}
