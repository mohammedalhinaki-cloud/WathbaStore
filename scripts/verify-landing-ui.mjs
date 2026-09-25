// Run against a running local server: LANDING_URL=http://localhost:3000 node scripts/verify-landing-ui.mjs
// Requires an optional local Playwright installation: npm install --no-save --package-lock=false @playwright/test
// Then: npx playwright install chromium
// CHROMIUM_PATH can point to an existing Chromium installation.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const output = ".data/ui-check";
await mkdir(output, { recursive: true });
try {
  const page = await browser.newPage({ reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const width of [320, 375, 390, 430, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(process.env.LANDING_URL || "http://localhost:3000", { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const layout = await page.evaluate(() => {
      const headline = document.querySelector("h1");
      const hero = headline.closest("section");
      const primary = hero.querySelector("a");
      const secondary = primary.nextElementSibling;
      const actions = primary.parentElement;
      const grid = actions.nextElementSibling;
      const header = document.querySelector("header");
      const rect = (el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      };
      return {
        title: headline.textContent.replace(/\s+/g, " ").trim(),
        subtitle: headline.nextElementSibling.textContent.trim(),
        buttons: [rect(primary), rect(secondary)],
        secondaryColor: getComputedStyle(secondary).color,
        buttonFontSize: getComputedStyle(primary).fontSize,
        actionGap: getComputedStyle(actions).gap,
        actionWrap: getComputedStyle(actions).flexWrap,
        actionDirection: getComputedStyle(actions).flexDirection,
        actionAlignment: getComputedStyle(actions).justifyContent,
        gridColumns: getComputedStyle(grid).gridTemplateColumns.split(" ").length,
        gridGap: getComputedStyle(grid).gap,
        cards: [...grid.children].map(rect),
        overflow: document.documentElement.scrollWidth > innerWidth,
        headerBackground: getComputedStyle(header).backgroundColor,
        headerBorder: getComputedStyle(header).borderBottomWidth,
        headerShadow: getComputedStyle(header).boxShadow,
        logoLoaded: header.querySelector("img").naturalWidth > 0,
      };
    });
    assert.equal(layout.title, "متجرك الإلكتروني الاحترافي... بكل بساطة");
    assert.equal(layout.subtitle, "نساعدك في تحويل فكرتك إلى متجر إلكتروني متكامل يعكس هوية تجارتك ويجذب عملاءك.");
    assert.equal(layout.secondaryColor, "rgb(248, 250, 252)");
    assert.equal(layout.buttonFontSize, width < 640 ? "12px" : "16px");
    assert.equal(layout.actionGap, "12px");
    assert.equal(layout.actionWrap, "nowrap");
    assert.equal(layout.actionDirection, "row");
    assert.equal(layout.actionAlignment, "center");
    assert.ok(Math.abs(layout.buttons[0].y - layout.buttons[1].y) < 2);
    assert.equal(layout.gridColumns, width < 640 ? 2 : 4);
    assert.equal(layout.gridGap, "12px");
    assert.equal(layout.cards.length, 4);
    if (width < 640) {
      assert.equal(layout.cards[0].y, layout.cards[1].y);
      assert.equal(layout.cards[2].y, layout.cards[3].y);
      assert.ok(layout.cards[2].y > layout.cards[0].y);
    }
    assert.equal(layout.overflow, false, `Horizontal overflow at ${width}px`);
    assert.ok(["rgba(0, 0, 0, 0)", "rgb(15, 23, 42)"].includes(layout.headerBackground));
    assert.equal(layout.headerBorder, "0px");
    // Tailwind's shadow-none computes to transparent zero-sized shadow layers.
    assert.ok(layout.headerShadow === "none" ||
      layout.headerShadow.replaceAll("rgba(0, 0, 0, 0) 0px 0px 0px 0px", "").replaceAll(", ", "") === "");
    assert.equal(layout.logoLoaded, true);
    await page.screenshot({ path: `${output}/landing-${width}.png` });
    console.log(`PASS ${width}px: copy, header, logo, horizontal actions, statistics, no overflow`);
  }
  assert.deepEqual(errors, [], "Browser runtime errors");
  console.log(`Screenshots: ${output}/`);
} finally {
  await browser.close();
}
