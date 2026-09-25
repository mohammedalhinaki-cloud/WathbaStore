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
      const subtitle = headline.nextElementSibling;
      const primary = hero.querySelector("a");
      const secondary = primary.nextElementSibling;
      const actions = primary.parentElement;
      const grid = actions.nextElementSibling;
      const header = document.querySelector("header");
      const footer = document.querySelector("footer");
      const rect = (el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      };
      const gapBetween = (above, below) =>
        below.getBoundingClientRect().top - above.getBoundingClientRect().bottom;
      return {
        title: headline.textContent.replace(/\s+/g, " ").trim(),
        subtitle: subtitle.textContent.trim(),
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
        // Hero breathing room: headline → subtitle → buttons → statistics cards
        spacing: {
          titleToSubtitle: gapBetween(headline, subtitle),
          subtitleToActions: gapBetween(subtitle, actions),
          actionsToStats: gapBetween(actions, grid),
        },
        // Every landing section sits on the page background with no divider lines
        sections: [...document.querySelectorAll("#top section")].map((s) => {
          const style = getComputedStyle(s);
          return {
            id: s.id || "hero",
            borderTop: style.borderTopWidth,
            borderBottom: style.borderBottomWidth,
            background: style.backgroundColor,
          };
        }),
        footerBorder: footer ? getComputedStyle(footer).borderTopWidth : "0px",
        overflow: document.documentElement.scrollWidth > innerWidth,
        headerBackground: getComputedStyle(header).backgroundColor,
        headerBorder: getComputedStyle(header).borderBottomWidth,
        headerBorderColor: getComputedStyle(header).borderBottomColor,
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
    assert.equal(layout.gridGap, width < 640 ? "12px" : "16px");
    assert.equal(layout.cards.length, 4);
    if (width < 640) {
      assert.equal(layout.cards[0].y, layout.cards[1].y);
      assert.equal(layout.cards[2].y, layout.cards[3].y);
      assert.ok(layout.cards[2].y > layout.cards[0].y);
    }
    const { titleToSubtitle, subtitleToActions, actionsToStats } = layout.spacing;
    assert.ok(titleToSubtitle >= 24, `Headline → subtitle spacing ${titleToSubtitle}px at ${width}px`);
    assert.ok(subtitleToActions >= 32, `Subtitle → buttons spacing ${subtitleToActions}px at ${width}px`);
    assert.ok(actionsToStats >= 40, `Buttons → statistics spacing ${actionsToStats}px at ${width}px`);
    assert.ok(titleToSubtitle < subtitleToActions && subtitleToActions < actionsToStats,
      `Hero spacing should grow down the hero at ${width}px: ${JSON.stringify(layout.spacing)}`);
    for (const s of layout.sections) {
      assert.equal(s.borderTop, "0px", `Divider above section ${s.id}`);
      assert.equal(s.borderBottom, "0px", `Divider below section ${s.id}`);
      assert.equal(s.background, "rgba(0, 0, 0, 0)", `Section ${s.id} should use the page background`);
    }
    assert.equal(layout.footerBorder, "0px", "Divider above the footer");
    assert.equal(layout.overflow, false, `Horizontal overflow at ${width}px`);
    assert.ok(["rgba(0, 0, 0, 0)", "rgb(15, 23, 42)"].includes(layout.headerBackground));
    // At the top of the page the header border is either absent or fully transparent.
    assert.ok(layout.headerBorder === "0px" || layout.headerBorderColor === "rgba(0, 0, 0, 0)");
    // Tailwind's shadow-none computes to transparent zero-sized shadow layers.
    assert.ok(layout.headerShadow === "none" ||
      layout.headerShadow.replaceAll("rgba(0, 0, 0, 0) 0px 0px 0px 0px", "").replaceAll(", ", "") === "");
    assert.equal(layout.logoLoaded, true);
    await page.screenshot({ path: `${output}/landing-${width}.png` });

    // Pricing plans: a collapsed accordion like the FAQ — one plan open at a time.
    const toggles = page.locator("#pricing button[aria-expanded]");
    const planCount = await toggles.count();
    if (planCount > 0) {
      const panels = () => page.evaluate(() =>
        [...document.querySelectorAll("#pricing [role=region]")].map((p) => ({
          height: p.getBoundingClientRect().height,
          inert: p.inert,
        })));
      for (let i = 0; i < planCount; i++) {
        assert.equal(await toggles.nth(i).getAttribute("aria-expanded"), "false", `Plan ${i} starts collapsed`);
      }
      assert.ok((await panels()).every((p) => p.height === 0 && p.inert), "Collapsed plan details are hidden");
      await toggles.nth(0).click();
      assert.equal(await toggles.nth(0).getAttribute("aria-expanded"), "true");
      let state = await panels();
      assert.ok(state[0].height > 0 && !state[0].inert, "Opened plan shows its details");
      if (planCount > 1) {
        await toggles.nth(1).click();
        state = await panels();
        assert.equal(await toggles.nth(0).getAttribute("aria-expanded"), "false", "Opening a plan closes the previous one");
        assert.ok(state[0].height === 0 && state[0].inert);
        assert.ok(state[1].height > 0 && !state[1].inert);
      }
      await toggles.nth(planCount > 1 ? 1 : 0).click();
      assert.ok((await panels()).every((p) => p.height === 0), "Plan details collapse again");
    }
    console.log(`PASS ${width}px: copy, header, logo, hero spacing, horizontal actions, statistics, no section dividers, pricing accordion, no overflow`);
  }
  assert.deepEqual(errors, [], "Browser runtime errors");
  console.log(`Screenshots: ${output}/`);
} finally {
  await browser.close();
}
