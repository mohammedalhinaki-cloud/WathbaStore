import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, '..');
const temporary = mkdtempSync(path.join(tmpdir(), 'maaoun-landing-'));
try {
  for (const filename of ['types', 'landing-marketing', 'constants', 'wa']) {
    const source = readFileSync(path.join(root, 'lib', `${filename}.ts`), 'utf8');
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
    writeFileSync(path.join(temporary, `${filename}.js`), compiled.outputText);
  }
  const { mergeLandingContent, DEFAULT_LANDING_CONTENT } = require(path.join(temporary, 'types.js'));
  const { presentLandingContent, presentPricingPlan, isDemoPortfolio } = require(path.join(temporary, 'landing-marketing.js'));
  const { presentSiteSettings, SITE_DESCRIPTION } = require(path.join(temporary, 'constants.js'));
  const { waChatLink } = require(path.join(temporary, 'wa.js'));

  const oldOrder = ['services', 'portfolio', 'pricing', 'faq', 'cta'];
  const merged = mergeLandingContent({ sections: { order: oldOrder, hidden: ['portfolio'] }, hero: { title: 'عنوان خاص بالمالك' }, stats: [{ value: 42, label: 'متاجر موثقة' }], commerce: { fees: 'رسوم تجهيز متفق عليها', cancellation: 'شروط الإلغاء الخاصة بالمالك' } });
  assert.deepEqual(merged.sections.order.filter(k => oldOrder.includes(k)), oldOrder);
  assert(merged.sections.order.indexOf('steps') < merged.sections.order.indexOf('pricing'));
  assert(merged.sections.order.indexOf('terms') < merged.sections.order.indexOf('cta'));
  assert.deepEqual(merged.sections.hidden, ['portfolio']);
  assert.equal(merged.commerce.fees, 'رسوم تجهيز متفق عليها');
  assert.equal(merged.commerce.cancellation, 'شروط الإلغاء الخاصة بالمالك');
  assert.equal(merged.commerce.billingLabel, 'شهريًا');
  assert.equal(merged.stats[0].value, 42);
  assert.deepEqual(mergeLandingContent(null), DEFAULT_LANDING_CONTENT);
  assert.doesNotThrow(() => mergeLandingContent({ stats: [null, { value: 'bad' }] }));

  const current = presentLandingContent(merged);
  assert.equal(current.hero.title, 'عنوان خاص بالمالك');
  assert.equal(current.stats[0].value, 42);
  const legacy = mergeLandingContent({ hero: { title: 'تصميم مواقع ومتاجر إلكترونية احترافية', accent: 'في السعودية' }, stats: [{ value: 99, label: 'بدأت معنا' }, { value: 24, label: 'لتجهيز متجرك' }] });
  const legacyCopy = structuredClone(legacy);
  const refreshed = presentLandingContent(legacy);
  assert.equal(refreshed.hero.title, DEFAULT_LANDING_CONTENT.hero.title);
  assert.equal(refreshed.stats.length, 0);
  assert.deepEqual(legacy, legacyCopy);

  const plan = { id: 'plan-live', name: '🔥 2. باقة الراحة — ( الشائعة )', price: 49, oldPrice: null, currency: 'ر.س', features: ['كل مميزات الباقة الاقتصادية.', 'بوابة دفع رقمية: Apple Pay، مدى، فيزا', 'إدخال شامل للمنتجات: حتى 60 منتج', 'نضمن لك إصلاح أي أعطال فوراً.', 'نرفع كافة منتجاتك مهما كان عددها دون قيود.', 'اشتراك يضمن أعلى مستويات الأمان لتحمل ضغط آلاف الزوار', 'ميزة خاصة بالمالك'], isFeatured: true, isVisible: true, sortOrder: 1, updatedAt: '2026-10-10' };
  const original = structuredClone(plan);
  const displayed = presentPricingPlan(plan);
  assert.equal(displayed.name, 'باقة الراحة');
  assert.equal(displayed.price, 49);
  assert.equal(displayed.oldPrice, null);
  assert(!displayed.features.some(f => /Apple Pay|مدى|فيزا|آلاف الزوار|فوراً/.test(f)));
  assert(displayed.features.includes('ميزة خاصة بالمالك'));
  assert(displayed.features.includes('كل مزايا باقة الانطلاقة.'));
  assert.deepEqual(plan, original);

  const demo = { id: 'pf-oud', imageUrl: '/seed/portfolio-perfume.jpg', tags: 'عود' };
  assert(isDemoPortfolio(demo));
  assert(isDemoPortfolio({ id: 'custom', imageUrl: '/uploads/test.jpg', tags: 'نموذج تجريبي' }));
  assert(!isDemoPortfolio({ id: 'customer-real', imageUrl: '/uploads/customer.jpg', tags: 'قهوة' }));

  const settings = { landing: { hero: { title: 'معين لبناء المواقع والمتاجر الإلكترونية' } }, aboutText: '', developerUrl: '', heroTitle: '', heroSubtitle: '', features: [], faq: [], socialInstagram: '', socialSnapchat: '', socialTiktok: '', seoDescription: 'ابدأ بـ 499 ريال تدفع مرة واحدة وبدون رسوم إضافية' };
  const presentation = presentSiteSettings(settings);
  assert.equal(presentation.seoDescription, SITE_DESCRIPTION);
  assert.equal(presentation.landing.hero.title, DEFAULT_LANDING_CONTENT.hero.title);
  assert.equal(presentSiteSettings({ ...settings, seoDescription: 'وصف SEO خاص بالمالك' }).seoDescription, 'وصف SEO خاص بالمالك');
  const message = `السلام عليكم، أرغب في ${displayed.name}.\nالسعر المعروض: 49 ر.س شهريًا.`;
  const url = new URL(waChatLink('+966 50 123 4567', message));
  assert.equal(url.pathname, '/966501234567');
  assert.equal(url.searchParams.get('text'), message);
  console.log('Landing checks passed: legacy content, owner edits, section order, monthly billing, plan claims, demo labels, SEO, WhatsApp encoding.');
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
