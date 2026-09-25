// ============================================================
// معين — الصفحة الرئيسية العامة (Landing Page)
// تُعرض على maaoun.com فقط — لا يظهر فيها أي شيء عن لوحة الإدارة
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
import { APP_NAME, developerUrl, formatPrice, mainDomain } from "@/lib/constants";
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
    <div id="top" className="bg-ink-950">
      {/* بيانات Structured Data للموقع العام (WebSite + Organization) */}
      <SiteJsonLd />

      <LandingNav whatsappHref={wa} />

      {/* ============ Hero ============ */}
      <section className="relative overflow-hidden pt-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-brand-600/20 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-accent-500/10 blur-[100px]" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/10 px-4 py-1.5 text-xs font-bold text-brand-300">
              <Sparkles className="h-3.5 w-3.5" />
              منصة متكاملة لإنشاء المتاجر الإلكترونية
            </div>
            <h1 className="text-4xl font-extrabold leading-[1.2] text-white sm:text-5xl lg:text-[3.4rem]">
              {settings.heroTitle || "متجرك الإلكتروني…"}
              <span className="mt-2 block bg-gradient-to-l from-accent-400 to-accent-500 bg-clip-text text-transparent">
                مع معين
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-ink-300">
              {settings.heroSubtitle ||
                "أبني لك متجرًا إلكترونيًا متكاملًا على نطاق خاص بك — أنشئه وأجهّزه بالكامل وأسلّمه جاهزًا."}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 rounded-2xl bg-gradient-to-l from-accent-500 to-accent-400 px-6 py-3.5 text-base font-extrabold text-ink-950 shadow-xl shadow-accent-500/25 transition-transform hover:scale-[1.03]"
              >
                <MessageCircle className="h-5 w-5" />
                تواصل عبر واتساب
              </a>
              <a
                href="#portfolio"
                className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3.5 text-base font-bold text-white transition-colors hover:bg-white/10"
              >
                شاهد أعمالي
                <ArrowLeft className="h-4 w-4" />
              </a>
            </div>

            <HeroStats items={HERO_STATS} />
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-brand-500/30 to-accent-500/20 blur-2xl" />
            <Image
              src="/seed/hero.jpg"
              alt="معاينة متاجر معين"
              width={1200}
              height={900}
              priority
              className="relative w-full rounded-3xl border border-white/10 shadow-2xl"
            />
            <div className="absolute -bottom-5 right-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-ink-900/90 px-4 py-3 shadow-xl backdrop-blur">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
                <BadgeCheck className="h-5 w-5 text-emerald-400" />
              </span>
              <div>
                <p className="text-sm font-bold text-white">تسليم جاهز للعمل</p>
                <p className="text-xs text-ink-400">نطاق فرعي + لوحة تحكم العميل</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ عن معين ============ */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <SectionBadge icon={<Globe className="h-4 w-4" />} text="ما هو معين؟" />
            <h2 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl">
              منصة أدير بها متاجر أعمالي… وأسلّمها جاهزة
            </h2>
            <p className="mt-5 text-lg leading-8 text-ink-300">
              {settings.aboutText ||
                "معين منصة متكاملة أنشئ بها متاجر إلكترونية للعملاء على نطاقات فرعية خاصة، أجهزها بالكامل وأسلّم كل متجر لصاحبه ليديره بنفسه."}
            </p>
            <ul className="mt-6 space-y-3">
              {[
                `كل متجر على نطاق فرعي مستقل: name.${domain}`,
                "تصميم ومنتجات وSEO أجهزها أنا قبل التسليم",
                "لوحة تحكم مستقلة لكل عميل بعد التسليم",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 text-ink-200">
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
      <section id="services" className="border-t border-white/5 bg-ink-900/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHead
            badge="الخدمات"
            title="كل ما يحتاجه متجرك… في مكان واحد"
            sub="من الإنشاء إلى التسليم، وكل خطوة بين المراحل"
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s) => (
              <div
                key={s.title}
                className="group rounded-3xl border border-white/8 bg-white/[0.03] p-6 transition-all hover:-translate-y-1 hover:border-brand-400/30 hover:bg-white/[0.05]"
              >
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/20 to-violet-500/20 ring-1 ring-brand-400/20">
                  <s.icon className="h-6 w-6 text-brand-300" />
                </span>
                <h3 className="text-lg font-bold text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-7 text-ink-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ الأعمال ============ */}
      <section id="portfolio" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <SectionHead
          badge="أعمالي"
          title="متاجر بُنيت على معين"
          sub="عينات من المتاجر التي أنشأتها وجاهزتها"
          light
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {portfolio.map((p) => (
            <a
              key={p.id}
              href={p.storeUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="group overflow-hidden rounded-3xl border border-ink-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-ink-100">
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
                  <h3 className="font-bold text-ink-900">{p.title}</h3>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                    يعمل
                  </span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-sm text-ink-500">{p.description}</p>
                {p.tags && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.tags.split(",").slice(0, 3).map((t) => (
                      <span key={t} className="rounded-md bg-ink-100 px-2 py-0.5 text-[11px] font-semibold text-ink-600">
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
      <section id="pricing" className="border-t border-white/5 bg-ink-900/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHead
            badge="الأسعار"
            title="باقات واضحة… بدون مفاجآت"
            sub="اختر ما يناسب نشاطك، وابدأ عبر واتساب"
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.id}
                className={`relative rounded-3xl border p-7 ${
                  p.isFeatured
                    ? "border-accent-400/40 bg-gradient-to-b from-accent-500/10 to-transparent shadow-xl shadow-accent-500/10"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                {p.isFeatured && (
                  <span className="absolute -top-3.5 right-6 rounded-full bg-gradient-to-l from-accent-500 to-accent-400 px-4 py-1 text-xs font-extrabold text-ink-950">
                    الأكثر طلبًا
                  </span>
                )}
                <h3 className="text-lg font-extrabold text-white">{p.name}</h3>
                <div className="mt-4 flex items-end gap-2">
                  <span className="text-4xl font-extrabold text-white">
                    {formatPrice(p.price, p.currency)}
                  </span>
                  {p.oldPrice != null && (
                    <span className="mb-1 text-sm text-ink-500 line-through">
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
                      ? "bg-gradient-to-l from-accent-500 to-accent-400 text-ink-950"
                      : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
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
        <section id="offers" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <SectionHead
            badge="عروض حصرية"
            title="العروض الحالية"
            sub="فرص محدودة — لا تفوتها"
            light
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {liveOffers.map((o) => (
              <div
                key={o.id}
                className="relative overflow-hidden rounded-3xl border border-accent-400/25 bg-gradient-to-l from-accent-500/10 via-transparent to-transparent p-6"
              >
                <span className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-accent-500/10 blur-2xl" />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Timer className="h-5 w-5 text-accent-500" />
                      <h3 className="text-lg font-extrabold text-white">{o.title}</h3>
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
                      <p className="text-xs text-ink-500 line-through">{formatPrice(o.oldPrice, o.currency)}</p>
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
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent-500 px-5 py-2.5 text-sm font-extrabold text-ink-950 transition-transform hover:scale-[1.02]"
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
      <section className="border-t border-white/5 bg-ink-900/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHead
            badge="لماذا معين؟"
            title="مميزات تجعل الفرق"
            sub="بُنية مبنية لتتحمل نمو عدد المتاجر"
          />
          <div className="mt-12 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {(settings.features.length
              ? settings.features
              : [
                  { title: "نطاق فرعي خاص", desc: "كل متجر على نطاق مستقل بدون شراء دومين." },
                  { title: "تصميم مخصص", desc: "قوالب وخطوط وألوان قابلة للتخصيص." },
                ]
            ).map((f) => (
              <div key={f.title} className="flex items-start gap-4">
                <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 ring-1 ring-brand-400/25">
                  <Sparkles className="h-5 w-5 text-brand-300" />
                </span>
                <div>
                  <h4 className="font-bold text-white">{f.title}</h4>
                  <p className="mt-1 text-sm leading-6 text-ink-400">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section id="faq" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <SectionHead
          badge="الأسئلة الشائعة"
          title="كل ما تريد معرفته"
          sub="إن كان لديك سؤال آخر، تواصل عبر واتساب"
          light
        />
        <Faq items={settings.faq} />
      </section>

      {/* ============ CTA ============ */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-l from-brand-700 via-brand-600 to-violet-700 px-6 py-14 text-center sm:px-12">
          <div className="pointer-events-none absolute -top-24 right-1/4 h-64 w-64 rounded-full bg-accent-400/20 blur-3xl" />
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">جاهز تنطلق بثقتك؟</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-brand-100">
            أرسل لي رسالة عبر واتساب وأخبرني عن نشاطك — وسأجهز لك متجرًا جاهزًا خلال أيام.
          </p>
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-white px-8 py-4 text-lg font-extrabold text-brand-700 shadow-2xl transition-transform hover:scale-[1.03]"
          >
            <MessageCircle className="h-6 w-6 text-emerald-500" />
            ابدأ الآن عبر واتساب
          </a>
        </div>
      </section>

      {/* ============ Footer ============ */}
      <footer className="border-t border-white/10 bg-ink-950">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600">
                <Store className="h-5 w-5 text-white" />
              </span>
              <span className="text-xl font-extrabold text-white">{APP_NAME}</span>
            </div>
            <p className="mt-4 max-w-md text-sm leading-7 text-ink-400">
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
            <h4 className="text-sm font-extrabold text-white">روابط سريعة</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-ink-400">
              <li><a href="#services" className="hover:text-white">الخدمات</a></li>
              <li><a href="#portfolio" className="hover:text-white">أعمالي</a></li>
              <li><a href="#pricing" className="hover:text-white">الأسعار</a></li>
              <li><a href="#offers" className="hover:text-white">العروض</a></li>
              <li><a href="#faq" className="hover:text-white">الأسئلة الشائعة</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-white">تواصل</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-ink-400">
              <li>
                <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white">
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
        <div className="border-t border-white/10 py-5 text-center text-xs text-ink-500">
          © {new Date().getFullYear()} {APP_NAME} {domain} — جميع الحقوق محفوظة ·{" "}
          <a href={devUrl} target="_blank" rel="noopener noreferrer" className="text-ink-400 hover:text-white">
            {domain}
          </a>
        </div>
      </footer>
    </div>
  );
}

function InfoCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-6">
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-accent-500/15 text-accent-400">
        {icon}
      </span>
      <h3 className="font-bold text-white">{title}</h3>
      <p className="mt-1.5 text-sm leading-6 text-ink-400">{desc}</p>
    </div>
  );
}

function SectionBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/10 px-4 py-1.5 text-xs font-bold text-brand-300">
      {icon}
      {text}
    </span>
  );
}

function SectionHead({
  badge,
  title,
  sub,
  light,
}: {
  badge: string;
  title: string;
  sub: string;
  light?: boolean;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span
        className={`inline-flex items-center rounded-full px-4 py-1.5 text-xs font-bold ${
          light ? "bg-brand-50 text-brand-700 ring-1 ring-brand-200" : "border border-brand-400/30 bg-brand-500/10 text-brand-300"
        }`}
      >
        {badge}
      </span>
      <h2
        className={`mt-4 text-3xl font-extrabold sm:text-4xl ${
          light ? "text-ink-900" : "text-white"
        }`}
      >
        {title}
      </h2>
      <p className={`mt-3 text-lg ${light ? "text-ink-500" : "text-ink-400"}`}>{sub}</p>
    </div>
  );
}
