import { DEFAULT_LANDING_CONTENT, type LandingContent, type PricingPlan, type PortfolioItem } from "./types";

/** Refresh only known legacy copy. Custom owner-written content remains editable. */
export function presentLandingContent(content: LandingContent): LandingContent {
  const defaults = DEFAULT_LANDING_CONTENT;
  const hero = { ...content.hero };
  if (["معون لبناء المواقع والمتاجر الإلكترونية", "تصميم مواقع ومتاجر إلكترونية احترافية"].includes(hero.title)) hero.title = defaults.hero.title;
  if (["باحتراف وبكل بساطة", "في السعودية"].includes(hero.accent)) hero.accent = defaults.hero.accent;
  if (["نحوّل فكرتك إلى موقع أو متجر إلكتروني احترافي يعكس هوية تجارتك ويسهّل وصول عملائك إلى منتجاتك وخدماتك.", "معون تبني لك موقعًا أو متجرًا إلكترونيًا يعكس هوية نشاطك، وتجهزه بالمنتجات والمحتوى، ثم تسلمه جاهزًا للإدارة."].includes(hero.subtitle)) hero.subtitle = defaults.hero.subtitle;
  if (hero.primaryBtn === "تواصل عبر واتساب") hero.primaryBtn = defaults.hero.primaryBtn;
  if (hero.secondaryBtn === "شاهد أعمالي") hero.secondaryBtn = defaults.hero.secondaryBtn;
  const heads = { ...content.heads };
  if (["متاجر بُنيت على معون", "عينات من المتاجر التي صُنعت بحب ❤"].includes(heads.portfolio.title)) heads.portfolio = defaults.heads.portfolio;
  if (heads.pricing.title === "باقات واضحة… بدون مفاجآت") heads.pricing = defaults.heads.pricing;
  if (heads.features.sub === "بُنية مبنية لتتحمل نمو عدد المتاجر") heads.features = defaults.heads.features;
  return {
    ...content, hero, heads,
    cta: content.cta.title === "جاهز تنطلق بثقتك؟" ? defaults.cta : content.cta,
    stats: content.stats.filter((s) => !/فكرة|بدأت معنا|تجهيز متجرك|باقات مناسبة|سعر يبدأ|تحكمك في متجرك/.test(s.label)),
    services: content.services.map((s) => {
      if (s.title === "أمان وعزل كامل") return defaults.services[4];
      if (s.title === "SEO محلي بالعربي") return defaults.services[3];
      return s;
    }),
    nav: {
      ...content.nav,
      links: content.nav.links.map((link) => link.href === "#portfolio" && link.label === "أعمالي" ? { ...link, label: "نماذج المتاجر" } : link),
      cta: content.nav.cta === "ابدأ مشروعك" ? defaults.nav.cta : content.nav.cta,
      ctaMobile: content.nav.ctaMobile === "ابدأ مشروعك عبر واتساب" ? defaults.nav.ctaMobile : content.nav.ctaMobile,
    },
  };
}

export function presentPricingPlan(plan: PricingPlan): PricingPlan {
  let name = plan.name;
  if (/باقة الانطلاقة/.test(name)) name = "باقة الانطلاقة";
  else if (/باقة الراحة/.test(name)) name = "باقة الراحة";
  else if (/باقة التاجر/.test(name)) name = "باقة التاجر";
  const features = plan.features.flatMap((feature) => {
    // There is currently no card-payment provider in the checkout.
    if (/Apple\s*Pay|مدى|فيزا|بوابة دفع رقمية|الدفع الفوري/i.test(feature)) return [];
    if (/نضمن.*فور|إصلاح.*فور/.test(feature)) return ["استضافة المتجر ومعالجة الأعطال التقنية ضمن نطاق الدعم المتفق عليه."];
    if (/نرفع.*(?:مهما|دون.*قيود)/.test(feature)) return ["رفع وتنسيق المنتجات وفق العدد المتفق عليه قبل التجهيز."];
    if (/آلاف الزوار|أعلى مستويات الأمان|فائقة السرعة/.test(feature)) return [];
    if (/التسويق والجني الأرباح/.test(feature)) return ["تجهيز المنتجات يساعدك على توفير وقتك والتركيز على نشاطك."];
    if (/ريّح رأسك|واسترخِ/.test(feature)) return ["أرسل صور المنتجات والمنيو عبر واتساب، ونتولى التجهيز حسب الباقة."];
    if (/رابط المتجر.*:\/\//.test(feature)) return ["رابط خاص بمتجرك مثل name.maaoun.com."];
    if (/حتى مع رفع 60 منتج/.test(feature)) return ["عرض حتى 60 منتجًا وتنظيم صورها وأسعارها."];
    if (/تحسين محركات البحث/.test(feature)) return ["تهيئة عناوين المتجر وأوصاف المنتجات لمحركات البحث، دون ضمان ترتيب معين."];
    if (/^جاهز للانطلاق:/.test(feature)) return ["تجهيز المتجر وتنسيق الألوان بما يناسب نشاطك."];
    if (/^إدارة ذاتية بالكامل:/.test(feature)) return ["ترفع منتجاتك بنفسك، حتى 30 منتجًا، مع شرح أساسيات الإدارة."];
    if (/^إدخال شامل للمنتجات:/.test(feature)) return ["نجهّز حتى 60 منتجًا بالصور والأوصاف والأسعار والخيارات."];
    if (feature === "كل مميزات الباقة الاقتصادية.") return ["كل مزايا باقة الانطلاقة."];
    if (/^استضافة سحابية/.test(feature)) return ["استضافة المتجر ضمن الاشتراك."];
    return [feature];
  });
  return { ...plan, name, features };
}

const DEMO_IMAGES = new Set(["/seed/rshaf-cover.jpg", "/seed/portfolio-perfume.jpg", "/seed/sweets-cover.jpg", "/seed/honey-cover.jpg", "/seed/osra-cover.jpg"]);
const DEMO_IDS = new Set(["pf-rshaf", "pf-oud", "pf-sweets", "pf-honey", "pf-osra"]);
export function isDemoPortfolio(item: PortfolioItem): boolean {
  return DEMO_IDS.has(item.id) || DEMO_IMAGES.has(item.imageUrl) || /نموذج تجريبي/.test(item.tags);
}
