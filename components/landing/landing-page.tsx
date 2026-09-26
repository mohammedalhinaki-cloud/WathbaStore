// ============================================================
// معون — الصفحة الرئيسية العامة (Landing Page)
// تُعرض على maaoun.com فقط — لا يظهر فيها أي شيء عن لوحة الإدارة
//
// الثيم الداكن الفاخر: خلفية #0F172A، بطاقات #1E293B، نصوص #F8FAFC،
// نصوص ثانوية #94A3B8، وأزرار/تدرّجات #E65100 ← #FFD600.
// ============================================================

import Image from "next/image";
import {
  ArrowLeft,
  BadgeCheck,
  Globe,
  MessageCircle,
  Palette,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Store,
  Tag,
  Timer,
  Users,
  Wand2,
  Zap,
} from "lucide-react";
import { services } from "@/lib/services";
import {
  APP_NAME,
  developerUrl,
  formatPrice,
  mainDomain,
} from "@/lib/constants";
import { waChatLink } from "@/lib/wa";
import LandingNav from "./nav";
import Faq from "./faq";
import HeroStats from "./hero-stats";
import PricingPlans from "./pricing-plans";
import SocialLinks from "@/components/social-links";
import SiteJsonLd from "@/components/site/site-json-ld";
import type { LandingSectionKey } from "@/lib/types";

/**
 * أيقونات ثابتة بالترتيب — النصوص (العناوين والأوصاف) تأتي من
 * settings.landing الذي يحرره المالك في /admin/content.
 */
const SERVICE_ICONS = [Store, Palette, MessageCircle, Search, ShieldCheck, Wand2];
const ABOUT_CARD_ICONS = [Zap, Rocket, Users, Tag];

export default async function LandingPage() {
  const [settings, plans, offers, portfolio] = await Promise.all([
    services().getSiteSettings(),
    services().listPlans(true),
    services().listOffers(),
    services().listPortfolio(true),
  ]);

  const now = Date.now();
  const liveOffers = offers.filter((o) => {
    if (!o.isActive) return false;
    if (o.startsAt && new Date(o.startsAt).getTime() > now) return false;
    if (o.endsAt && new Date(o.endsAt).getTime() < now) return false;
    return true;
  });

  const wa = settings.whatsappNumber ? waChatLink(settings.whatsappNumber) : "#";
  const devUrl = developerUrl(settings.developerUrl);
  const domain = mainDomain();
  const L = settings.landing;
  const heroImg = L.hero.imageUrl || "/seed/hero.jpg";
  const heroImgLocal = heroImg.startsWith("/");
  const T = L.toggles;
  const hidden = new Set(L.sections.hidden);
  /** يظهر القسم؟ وترتيبه (CSS order) حسب ما يحدده المالك */
  const show = (k: LandingSectionKey) => !hidden.has(k);
  const ord = (k: LandingSectionKey) => ({ order: L.sections.order.indexOf(k) });
  const navLinks = L.nav.links.filter((l) => {
    const key = l.href.slice(1) as LandingSectionKey;
    return !(L.sections.order.includes(key) && hidden.has(key));
  });
  const showHeroImage = T.heroImage;

  return (
    <div id="top" className="bg-base text-fg">
      {/* بيانات Structured Data للموقع العام (WebSite + Organization) */}
      <SiteJsonLd />

      <LandingNav whatsappHref={wa} content={{ ...L.nav, links: navLinks }} showCta={T.navCta} />

      {/* ============ Hero ============ */}
      {/*
        الغلاف يملأ الشاشة الأولى بالضبط (100svh) وينتهي عند نهاية كروت
        الإحصائيات — لا يظهر أي قسم آخر ضمن الشاشة الأولى.
        بلا حد سفلي: يتصل الغلاف بالقسم التالي على نفس الخلفية مباشرة.
      */}
      <section className="relative flex min-h-[100svh] flex-col overflow-hidden pt-16">
        {/*
          التوهّجات الزخرفية تتلاشى تدريجيًا قبل الحافة السفلية للغلاف
          (mask) — فلا تظهر حافة مقطوعة بسبب overflow-hidden، وينتقل
          الغلاف إلى القسم التالي بنعومة بلا أي خط فاصل.
        */}
        <div className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,#000_60%,transparent)]">
          <div className="absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-brand-600/20 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-accent-400/10 blur-[100px]" />
        </div>

        {/*
          مسافات الغلاف (متدرّجة لتوضيح التسلسل البصري):
          العنوان ← الوصف ← الأزرار ← كروت الإحصائيات، وكل مسافة أكبر من
          التي قبلها حتى يأخذ كل عنصر حقه ولا تبدو العناصر متزاحمة.
        */}
        <div
          className={`relative mx-auto grid w-full max-w-7xl flex-1 items-center gap-12 px-4 pb-14 pt-8 sm:px-6 sm:pb-16 sm:pt-10 lg:gap-14 lg:pb-16 lg:pt-10 ${
            showHeroImage ? "lg:grid-cols-2" : "max-w-4xl text-center"
          }`}
        >
          <div className="order-2 lg:order-1">
            <h1 className="text-[2rem] font-extrabold leading-[1.2] text-fg sm:text-[2.6rem] lg:text-[3.2rem]">
              {L.hero.title}{" "}
              <span className="mt-1 block bg-gradient-to-l from-brand-600 to-accent-400 bg-clip-text text-transparent">
                {L.hero.accent}
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-[1rem] leading-7 text-muted sm:mt-7 sm:text-lg sm:leading-8 lg:mt-8">
              {L.hero.subtitle}
            </p>

            {(T.heroPrimaryBtn || T.heroSecondaryBtn) && (
            <div className="mt-8 flex flex-row flex-nowrap items-center justify-center gap-3 sm:mt-10">
              {T.heroPrimaryBtn && (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary min-w-0 gap-1.5 whitespace-nowrap px-3 py-3 text-xs sm:gap-2 sm:px-6 sm:py-3.5 sm:text-[1rem]"
              >
                <MessageCircle className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
                {L.hero.primaryBtn}
              </a>
              )}
              {T.heroSecondaryBtn && (
              <a
                href="#portfolio"
                className="flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl border border-line bg-surface px-3 py-3 text-xs font-bold text-fg transition-colors hover:bg-surface-2 sm:gap-2 sm:px-6 sm:py-3.5 sm:text-[1rem]"
              >
                {L.hero.secondaryBtn}
                <ArrowLeft className="h-4 w-4" />
              </a>
              )}
            </div>
            )}

            {T.heroStats && <HeroStats items={L.stats} />}
          </div>

          {showHeroImage && (
          <div className="relative order-1 mx-auto w-full max-w-md sm:max-w-lg lg:order-2 lg:max-w-none">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-brand-600/25 to-accent-400/15 blur-2xl" />
            {heroImgLocal ? (
              <Image
                src={heroImg}
                alt="معاينة متاجر معون"
                width={1200}
                height={900}
                priority
                className="relative w-full rounded-3xl border border-line shadow-2xl shadow-black/40"
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={heroImg}
                alt="معاينة متاجر معون"
                loading="eager"
                className="relative w-full rounded-3xl border border-line shadow-2xl shadow-black/40"
              />
            )}
            {T.heroBadge && (
            <div className="absolute -bottom-5 right-6 flex items-center gap-3 rounded-2xl border border-line bg-surface/95 px-4 py-3 shadow-xl backdrop-blur">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
                <BadgeCheck className="h-5 w-5 text-emerald-400" />
              </span>
              <div>
                <p className="text-sm font-bold text-fg">{L.hero.badgeTitle}</p>
                <p className="text-xs text-muted">{L.hero.badgeDesc}</p>
              </div>
            </div>
            )}
          </div>
          )}
        </div>
      </section>

      {/*
        الأقسام أسفل الغلاف — ترتيبها وإظهارها يتحكم به المالك.
        كل الأقسام على خلفية الصفحة نفسها (bg-base) بلا حدود فاصلة ولا
        أشرطة ملوّنة متناوبة — فيبقى التصميم متناسقًا مهما تغيّر الترتيب،
        والفصل بينها بالمسافات وترويسات الأقسام فقط.
      */}
      <div className="flex flex-col">

      {/* ============ عن معون ============ */}
      {show("about") && (
      <section id="about" style={ord("about")} className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className={`grid items-center gap-10 ${T.aboutCards ? "lg:grid-cols-2" : ""}`}>
          <div className="order-2 lg:order-1">
            <SectionBadge icon={<Globe className="h-4 w-4" />} text={L.about.badge} />
            <h2 className="mt-4 text-3xl font-extrabold text-fg sm:text-4xl">
              {L.about.title}
            </h2>
            <p className="mt-5 text-lg leading-8 text-muted">
              {settings.aboutText ||
                "معون منصة متكاملة أنشئ بها متاجر إلكترونية للعملاء على نطاقات فرعية خاصة، أجهزها بالكامل وأسلّم كل متجر لصاحبه ليديره بنفسه."}
            </p>
            {T.aboutBullets && (
            <ul className="mt-6 space-y-3">
              {L.about.bullets.map((t, i) => (
                <li key={`${t}-${i}`} className="flex items-start gap-3 text-ink-300">
                  <BadgeCheck className="mt-1 h-5 w-5 shrink-0 text-accent-400" />
                  <span>{t.replace("{domain}", domain)}</span>
                </li>
              ))}
            </ul>
            )}
          </div>
          {T.aboutCards && (
          <div className="order-1 grid grid-cols-2 gap-4 lg:order-2">
            {L.about.cards.map((c, i) => {
              const Icon = ABOUT_CARD_ICONS[i % ABOUT_CARD_ICONS.length];
              return (
                <InfoCard
                  key={`${c.title}-${i}`}
                  icon={<Icon className="h-6 w-6" />}
                  title={c.title}
                  desc={c.desc}
                />
              );
            })}
          </div>
          )}
        </div>
      </section>
      )}

      {/* ============ الخدمات ============ */}
      {show("services") && (
      <section id="services" style={ord("services")} className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
        <SectionHead
          badge={L.heads.services.badge}
          title={L.heads.services.title}
          sub={L.heads.services.sub}
        />
        <div className="mt-8 grid gap-5 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
          {L.services.map((s, i) => {
            const Icon = SERVICE_ICONS[i % SERVICE_ICONS.length];
            return (
              <div
                key={`${s.title}-${i}`}
                className="card-dark group rounded-3xl p-6 transition-all hover:-translate-y-1 hover:border-brand-500/40"
              >
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600/25 to-accent-400/15 ring-1 ring-brand-500/30">
                  <Icon className="h-6 w-6 text-brand-300" />
                </span>
                <h3 className="text-lg font-bold text-fg">{s.title}</h3>
                <p className="mt-2 text-sm leading-7 text-muted">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </section>
      )}

      {/* ============ الأعمال ============ */}
      {show("portfolio") && portfolio.length > 0 && (
      <section id="portfolio" style={ord("portfolio")} className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
        <SectionHead
          badge={L.heads.portfolio.badge}
          title={L.heads.portfolio.title}
          sub={L.heads.portfolio.sub}
        />
        <div className="mt-8 grid gap-6 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
          {portfolio.map((p) => (
            <a
              key={p.id}
              href={p.storeUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="card-dark group overflow-hidden rounded-3xl transition-all hover:-translate-y-1 hover:border-brand-500/40 hover:shadow-xl hover:shadow-black/30"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-ink-800">
                <Image
                  src={p.imageUrl || "/seed/hero.jpg"}
                  alt={p.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-fg">{p.title}</h3>
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-400">
                    يعمل
                  </span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-sm text-muted">{p.description}</p>
                {p.tags && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.tags.split(",").slice(0, 3).map((t) => (
                      <span key={t} className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-ink-300">
                        {t.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </a>
          ))}
        </div>
      </section>
      )}

      {/* ============ الأسعار ============ */}
      {/*
        الباقات قائمة مطوية مثل «الأسئلة الشائعة»: الاسم والسعر ظاهران،
        والتفاصيل (المزايا + زر الطلب) تُفتح وتُغلق بالضغط — فلا يأخذ
        القسم مساحة رأسية كبيرة. الأسعار تُنسَّق هنا في الخادم.
      */}
      {show("pricing") && plans.length > 0 && (
      <section id="pricing" style={ord("pricing")} className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
        <SectionHead
          badge={L.heads.pricing.badge}
          title={L.heads.pricing.title}
          sub={L.heads.pricing.sub}
        />
        <PricingPlans
          orderHref={wa}
          plans={plans.map((p) => ({
            id: p.id,
            name: p.name,
            price: formatPrice(p.price, p.currency),
            oldPrice: p.oldPrice != null ? formatPrice(p.oldPrice, p.currency) : null,
            features: p.features,
            isFeatured: p.isFeatured,
          }))}
        />
      </section>
      )}

      {/* ============ العروض ============ */}
      {show("offers") && liveOffers.length > 0 && (
        <section id="offers" style={ord("offers")} className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
          <SectionHead
            badge={L.heads.offers.badge}
            title={L.heads.offers.title}
            sub={L.heads.offers.sub}
          />
          <div className="mt-8 grid gap-5 sm:mt-10 md:grid-cols-2">
            {liveOffers.map((o) => (
              <div
                key={o.id}
                className="card-dark relative overflow-hidden rounded-3xl border-accent-400/25 bg-gradient-to-l from-brand-600/15 via-transparent to-transparent p-6"
              >
                <span className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-accent-400/10 blur-2xl" />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Timer className="h-5 w-5 text-accent-400" />
                      <h3 className="text-lg font-extrabold text-fg">{o.title}</h3>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-ink-300">{o.description}</p>
                    {(o.endsAt || o.startsAt) && (
                      <p className="mt-3 text-xs font-semibold text-accent-400">
                        {o.startsAt && `يبدأ: ${new Date(o.startsAt).toLocaleDateString("ar-SA")}`}
                        {o.startsAt && o.endsAt && " — "}
                        {o.endsAt && `ينتهي: ${new Date(o.endsAt).toLocaleDateString("ar-SA")}`}
                      </p>
                    )}
                  </div>
                  {o.oldPrice != null && o.price > 0 && (
                    <div className="shrink-0 text-left">
                      <p className="text-xs text-muted line-through">{formatPrice(o.oldPrice, o.currency)}</p>
                      <p className="text-2xl font-extrabold text-accent-400">
                        {formatPrice(o.price, o.currency)}
                      </p>
                    </div>
                  )}
                </div>
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary mt-5 px-5 py-2.5 text-sm"
                >
                  أحجز العرض
                  <ArrowLeft className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============ المميزات ============ */}
      {show("features") && (
      <section id="features" style={ord("features")} className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
        <SectionHead
          badge={L.heads.features.badge}
          title={L.heads.features.title}
          sub={L.heads.features.sub}
        />
        <div className="mt-8 grid gap-x-8 gap-y-6 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
          {(settings.features.length
            ? settings.features
            : [
                { title: "نطاق فرعي خاص", desc: "كل متجر على نطاق مستقل بدون شراء دومين." },
                { title: "تصميم مخصص", desc: "قوالب وخطوط وألوان قابلة للتخصيص." },
              ]
          ).map((f) => (
            <div key={f.title} className="flex items-start gap-4">
              <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600/15 ring-1 ring-brand-500/30">
                <Sparkles className="h-5 w-5 text-brand-300" />
              </span>
              <div>
                <h4 className="font-bold text-fg">{f.title}</h4>
                <p className="mt-1 text-sm leading-6 text-muted">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      )}

      {/* ============ FAQ ============ */}
      {show("faq") && settings.faq.length > 0 && (
      <section id="faq" style={ord("faq")} className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
        <SectionHead
          badge={L.heads.faq.badge}
          title={L.heads.faq.title}
          sub={L.heads.faq.sub}
        />
        <Faq items={settings.faq} />
      </section>
      )}

      {/* ============ CTA ============ */}
      {show("cta") && (
      <section id="cta" style={ord("cta")} className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-l from-brand-600 via-brand-500 to-accent-400 px-6 py-14 text-center sm:px-12">
          <div className="pointer-events-none absolute -top-24 right-1/4 h-64 w-64 rounded-full bg-accent-400/25 blur-3xl" />
          <h2 className="text-3xl font-extrabold text-ink-950 sm:text-4xl">{L.cta.title}</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg font-semibold text-ink-950/80">
            {L.cta.desc}
          </p>
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-ink-950 px-8 py-4 text-lg font-extrabold text-accent-400 shadow-2xl shadow-ink-950/40 transition-transform hover:scale-[1.03] hover:bg-ink-900"
          >
            <MessageCircle className="h-6 w-6 text-emerald-400" />
            {L.cta.button}
          </a>
        </div>
      </section>
      )}
      </div>

      {/* ============ Footer ============ */}
      {T.footer && (
      <footer className="bg-base">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex flex-col gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/mark.svg"
                alt={APP_NAME}
                width={100}
                height={36}
                className="h-9 w-auto"
              />
              <span className="text-[11px] font-semibold text-muted">{L.footer.tagline}</span>
            </div>
            <p className="mt-4 max-w-md text-sm leading-7 text-muted">
              {settings.aboutText || "منصة إنشاء المتاجر الإلكترونية على نطاقات فرعية — أنشئ، جهّز، وسلّم."}
            </p>
            {T.footerSocial && (
            <SocialLinks
              className="mt-5"
              instagram={settings.socialInstagram}
              snapchat={settings.socialSnapchat}
              tiktok={settings.socialTiktok}
            />
            )}
          </div>
          {T.footerLinks && navLinks.length > 0 && (
          <div>
            <h4 className="text-sm font-extrabold text-fg">روابط سريعة</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              {navLinks.map((l) => (
                <li key={l.href}><a href={l.href} className="hover:text-fg">{l.label}</a></li>
              ))}
            </ul>
          </div>
          )}
          {T.footerContact && (
          <div>
            <h4 className="text-sm font-extrabold text-fg">تواصل</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              <li>
                <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-fg">
                  <MessageCircle className="h-4 w-4 text-emerald-400" />
                  واتساب {APP_NAME}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-brand-400" />
                {settings.whatsappNumber ? "متاحون على واتساب" : "قريبًا"}
              </li>
            </ul>
          </div>
          )}
        </div>
        {/* سطر الحقوق: خط خافت داخل عرض المحتوى فقط — لا خط حاد بعرض الشاشة */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="border-t border-line/40 py-5 text-center text-xs text-ink-500">
            © {new Date().getFullYear()} {APP_NAME} {domain} — جميع الحقوق محفوظة ·{" "}
            <a href={devUrl} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-fg">
              {domain}
            </a>
          </div>
        </div>
      </footer>
      )}
    </div>
  );
}

function InfoCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="card-dark rounded-3xl p-6">
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-accent-400/10 text-accent-400">
        {icon}
      </span>
      <h3 className="font-bold text-fg">{title}</h3>
      <p className="mt-1.5 text-sm leading-6 text-muted">{desc}</p>
    </div>
  );
}

function SectionBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-600/10 px-4 py-1.5 text-xs font-bold text-brand-300">
      {icon}
      {text}
    </span>
  );
}

function SectionHead({ badge, title, sub }: { badge: string; title: string; sub: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="inline-flex items-center rounded-full border border-brand-500/30 bg-brand-600/10 px-4 py-1.5 text-xs font-bold text-brand-300">
        {badge}
      </span>
      <h2 className="mt-4 text-3xl font-extrabold text-fg sm:text-4xl">{title}</h2>
      <p className="mt-3 text-lg text-muted">{sub}</p>
    </div>
  );
}
