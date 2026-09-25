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
  APP_TAGLINE,
  developerUrl,
  formatPrice,
  mainDomain,
  HERO_TITLE,
  HERO_TITLE_ACCENT,
  HERO_SUBTITLE,
} from "@/lib/constants";
import { waChatLink } from "@/lib/wa";
import LandingNav from "./nav";
import Faq from "./faq";
import HeroStats, { type HeroStat } from "./hero-stats";
import SocialLinks from "@/components/social-links";
import SiteJsonLd from "@/components/site/site-json-ld";

const SERVICES = [
  {
    icon: Store,
    title: "تأسيس متجر كامل",
    desc: "من الفكرة إلى الإطلاق: أنشئ متجرك على نطاق فرعي خاص، بهيكله ومنتجاته وصفحاته.",
  },
  {
    icon: Palette,
    title: "تصميم بهوية متجرك",
    desc: "قوالب جاهزة قابلة للتخصيص: قوالب، خطوط عربية، وألوان تعكس هوية نشاطك.",
  },
  {
    icon: MessageCircle,
    title: "الطلب عبر واتساب",
    desc: "زر «اطلب عبر واتساب» برسالة جاهزة تتضمن المنتج والسعر — بدون تعقيد ودون بوابات دفع.",
  },
  {
    icon: Search,
    title: "SEO محلي بالعربي",
    desc: "عناوين ووصف وكلمات مفتاحية مخصصة لكل متجر حتى يظهر في نتائج البحث.",
  },
  {
    icon: ShieldCheck,
    title: "أمان وعزل كامل",
    desc: "عزل حقيقي لبيانات كل متجر على مستوى قاعدة البيانات وصلاحيات صارمة لكل حساب.",
  },
  {
    icon: Wand2,
    title: "لوحة تحكم للعميل",
    desc: "بعد التسليم يدير العميل متجره بنفسه: منتجات، أسعار، صور، وأقسام — من لوحة مستقلة.",
  },
];

/** إحصائيات قسم الغلاف — تعدّ من 0 حتى القيمة عند ظهورها في الشاشة */
const HERO_STATS: HeroStat[] = [
  { value: 100, suffix: "+", label: "فكرة متجر بدأت معنا" },
  { value: 499, unit: "ريال", label: "سعر يبدأ منه متجرك" },
  { value: 7, unit: "أيام", label: "لتجهيز متجرك" },
  { value: 100, suffix: "%", label: "تحكمك في متجرك" },
];

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

  return (
    <div id="top" className="bg-base text-fg">
      {/* بيانات Structured Data للموقع العام (WebSite + Organization) */}
      <SiteJsonLd />

      <LandingNav whatsappHref={wa} />

      {/* ============ Hero ============ */}
      <section className="relative overflow-hidden pt-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-brand-600/20 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-accent-400/10 blur-[100px]" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pb-12 pt-7 sm:px-6 sm:pt-9 lg:grid-cols-2 lg:gap-12 lg:pb-16 lg:pt-12">
          <div>
            <h1 className="text-[2rem] font-extrabold leading-[1.2] text-fg sm:text-[2.6rem] lg:text-[3.2rem]">
              {HERO_TITLE}{" "}
              <span className="mt-1 block bg-gradient-to-l from-brand-600 to-accent-400 bg-clip-text text-transparent">
                {HERO_TITLE_ACCENT}
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-[1rem] leading-7 text-muted sm:mt-5 sm:text-lg sm:leading-8">
              {HERO_SUBTITLE}
            </p>

            <div className="mt-6 flex flex-row flex-nowrap items-center justify-center gap-3 sm:mt-7">
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary min-w-0 gap-1.5 whitespace-nowrap px-3 py-3 text-xs sm:gap-2 sm:px-6 sm:py-3.5 sm:text-[1rem]"
              >
                <MessageCircle className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
                تواصل عبر واتساب
              </a>
              <a
                href="#portfolio"
                className="flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl border border-line bg-surface px-3 py-3 text-xs font-bold text-fg transition-colors hover:bg-surface-2 sm:gap-2 sm:px-6 sm:py-3.5 sm:text-[1rem]"
              >
                شاهد أعمالي
                <ArrowLeft className="h-4 w-4" />
              </a>
            </div>

            <HeroStats items={HERO_STATS} />
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-brand-600/25 to-accent-400/15 blur-2xl" />
            <Image
              src="/seed/hero.jpg"
              alt="معاينة متاجر معون"
              width={1200}
              height={900}
              priority
              className="relative w-full rounded-3xl border border-line shadow-2xl shadow-black/40"
            />
            <div className="absolute -bottom-5 right-6 flex items-center gap-3 rounded-2xl border border-line bg-surface/95 px-4 py-3 shadow-xl backdrop-blur">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
                <BadgeCheck className="h-5 w-5 text-emerald-400" />
              </span>
              <div>
                <p className="text-sm font-bold text-fg">تسليم جاهز للعمل</p>
                <p className="text-xs text-muted">نطاق فرعي + لوحة تحكم العميل</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ عن معون ============ */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <SectionBadge icon={<Globe className="h-4 w-4" />} text="ما هو معون؟" />
            <h2 className="mt-4 text-3xl font-extrabold text-fg sm:text-4xl">
              منصة أدير بها متاجر أعمالي… وأسلّمها جاهزة
            </h2>
            <p className="mt-5 text-lg leading-8 text-muted">
              {settings.aboutText ||
                "معون منصة متكاملة أنشئ بها متاجر إلكترونية للعملاء على نطاقات فرعية خاصة، أجهزها بالكامل وأسلّم كل متجر لصاحبه ليديره بنفسه."}
            </p>
            <ul className="mt-6 space-y-3">
              {[
                `كل متجر على نطاق فرعي مستقل: name.${domain}`,
                "تصميم ومنتجات وSEO أجهزها أنا قبل التسليم",
                "لوحة تحكم مستقلة لكل عميل بعد التسليم",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 text-ink-300">
                  <BadgeCheck className="mt-1 h-5 w-5 shrink-0 text-accent-400" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="order-1 grid grid-cols-2 gap-4 lg:order-2">
            <InfoCard icon={<Zap className="h-6 w-6" />} title="سريع" desc="تصميم خفيف محسّن للأداء على الجوال والكمبيوتر." />
            <InfoCard icon={<Rocket className="h-6 w-6" />} title="تسليم جاهز" desc="متجر كامل: منتجات، أقسام، صفحات، واتساب." />
            <InfoCard icon={<Users className="h-6 w-6" />} title="إدارة ذاتية" desc="العميل يدير متجره من لوحته بعد التسليم." />
            <InfoCard icon={<Tag className="h-6 w-6" />} title="بأسعار واضحة" desc="باقات بسيطة بدون رسوم خفية أو مفاجآت." />
          </div>
        </div>
      </section>

      {/* ============ الخدمات ============ */}
      <section id="services" className="border-t border-line/50 bg-surface/40 py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHead
            badge="الخدمات"
            title="كل ما يحتاجه متجرك… في مكان واحد"
            sub="من الإنشاء إلى التسليم، وكل خطوة بين المراحل"
          />
          <div className="mt-8 grid gap-5 sm:mt-10 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s) => (
              <div
                key={s.title}
                className="card-dark group rounded-3xl p-6 transition-all hover:-translate-y-1 hover:border-brand-500/40"
              >
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600/25 to-accent-400/15 ring-1 ring-brand-500/30">
                  <s.icon className="h-6 w-6 text-brand-300" />
                </span>
                <h3 className="text-lg font-bold text-fg">{s.title}</h3>
                <p className="mt-2 text-sm leading-7 text-muted">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ الأعمال ============ */}
      <section id="portfolio" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
        <SectionHead
          badge="أعمالي"
          title="متاجر بُنيت على معون"
          sub="عينات من المتاجر التي أنشأتها وجاهزتها"
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

      {/* ============ الأسعار ============ */}
      <section id="pricing" className="border-t border-line/50 bg-surface/40 py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHead
            badge="الأسعار"
            title="باقات واضحة… بدون مفاجآت"
            sub="اختر ما يناسب نشاطك، وابدأ عبر واتساب"
          />
          <div className="mt-8 grid gap-6 sm:mt-10 lg:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.id}
                className={`relative rounded-3xl border p-7 ${
                  p.isFeatured
                    ? "border-accent-400/50 bg-gradient-to-b from-brand-600/15 to-transparent shadow-xl shadow-brand-600/10"
                    : "border-line bg-surface"
                }`}
              >
                {p.isFeatured && (
                  <span className="absolute -top-3.5 right-6 rounded-full bg-gradient-to-l from-brand-600 to-accent-400 px-4 py-1 text-xs font-extrabold text-ink-950">
                    الأكثر طلبًا
                  </span>
                )}
                <h3 className="text-lg font-extrabold text-fg">{p.name}</h3>
                <div className="mt-4 flex items-end gap-2">
                  <span className="text-4xl font-extrabold text-fg">
                    {formatPrice(p.price, p.currency)}
                  </span>
                  {p.oldPrice != null && (
                    <span className="mb-1 text-sm text-muted line-through">
                      {formatPrice(p.oldPrice, p.currency)}
                    </span>
                  )}
                </div>
                <ul className="mt-6 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-ink-300">
                      <BadgeCheck className="mt-0.5 h-4.5 w-4.5 shrink-0 text-accent-400" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-7 flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-extrabold transition-transform hover:scale-[1.02] ${
                    p.isFeatured
                      ? "btn-primary flex"
                      : "border border-line bg-white/5 text-fg hover:bg-white/10"
                  }`}
                >
                  اطلب هذه الباقة
                  <ArrowLeft className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ العروض ============ */}
      {liveOffers.length > 0 && (
        <section id="offers" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
          <SectionHead
            badge="عروض حصرية"
            title="العروض الحالية"
            sub="فرص محدودة — لا تفوتها"
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
      <section className="border-t border-line/50 bg-surface/40 py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHead
            badge="لماذا معون؟"
            title="مميزات تجعل الفرق"
            sub="بُنية مبنية لتتحمل نمو عدد المتاجر"
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
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section id="faq" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
        <SectionHead
          badge="الأسئلة الشائعة"
          title="كل ما تريد معرفته"
          sub="إن كان لديك سؤال آخر، تواصل عبر واتساب"
        />
        <Faq items={settings.faq} />
      </section>

      {/* ============ CTA ============ */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-l from-brand-600 via-brand-500 to-accent-400 px-6 py-14 text-center sm:px-12">
          <div className="pointer-events-none absolute -top-24 right-1/4 h-64 w-64 rounded-full bg-accent-400/25 blur-3xl" />
          <h2 className="text-3xl font-extrabold text-ink-950 sm:text-4xl">جاهز تنطلق بثقتك؟</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg font-semibold text-ink-950/80">
            أرسل لي رسالة عبر واتساب وأخبرني عن نشاطك — وسأجهز لك متجرًا جاهزًا خلال أيام.
          </p>
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-ink-950 px-8 py-4 text-lg font-extrabold text-accent-400 shadow-2xl shadow-ink-950/40 transition-transform hover:scale-[1.03] hover:bg-ink-900"
          >
            <MessageCircle className="h-6 w-6 text-emerald-400" />
            ابدأ الآن عبر واتساب
          </a>
        </div>
      </section>

      {/* ============ Footer ============ */}
      <footer className="border-t border-line bg-base">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/mark.svg" alt="" width={36} height={36} className="h-9 w-9" />
              <span className="flex flex-col leading-tight">
                <span className="text-xl font-extrabold text-fg">{APP_NAME}</span>
                <span className="text-[11px] font-semibold text-muted">{APP_TAGLINE}</span>
              </span>
            </div>
            <p className="mt-4 max-w-md text-sm leading-7 text-muted">
              {settings.aboutText || "منصة إنشاء المتاجر الإلكترونية على نطاقات فرعية — أنشئ، جهّز، وسلّم."}
            </p>
            <SocialLinks
              className="mt-5"
              instagram={settings.socialInstagram}
              snapchat={settings.socialSnapchat}
              tiktok={settings.socialTiktok}
            />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-fg">روابط سريعة</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              <li><a href="#services" className="hover:text-fg">الخدمات</a></li>
              <li><a href="#portfolio" className="hover:text-fg">أعمالي</a></li>
              <li><a href="#pricing" className="hover:text-fg">الأسعار</a></li>
              <li><a href="#offers" className="hover:text-fg">العروض</a></li>
              <li><a href="#faq" className="hover:text-fg">الأسئلة الشائعة</a></li>
            </ul>
          </div>
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
        </div>
        <div className="border-t border-line py-5 text-center text-xs text-ink-500">
          © {new Date().getFullYear()} {APP_NAME} {domain} — جميع الحقوق محفوظة ·{" "}
          <a href={devUrl} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-fg">
            {domain}
          </a>
        </div>
      </footer>
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
