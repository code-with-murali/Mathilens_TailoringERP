// QA sweep: every route, every breakpoint. Reports horizontal overflow, the elements causing it,
// console errors, failed requests, heading order, missing alt text and low-contrast risks.
import puppeteer from "puppeteer-core";
import fs from "node:fs";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.env.BASE ?? "http://localhost:4321";
const SHOTS = "shots";
fs.mkdirSync(SHOTS, { recursive: true });

const ROUTES = [
  "/", "/about", "/services", "/services/mens-tailoring", "/services/custom-clothing",
  "/suits", "/blazers", "/shirts", "/trousers", "/wedding",
  "/bulk-orders", "/bulk-orders/corporate", "/bulk-orders/schools",
  "/bulk-orders/colleges", "/bulk-orders/institutions",
  "/fabrics", "/process", "/mannargudi", "/delta-region",
  "/journal", "/journal/how-should-a-mens-blazer-fit",
  "/contact", "/shop", "/privacy", "/terms", "/shipping-policy", "/alterations-and-returns",
  "/this-route-does-not-exist",
];

const VIEWPORTS = [
  { name: "1440", width: 1440, height: 900 },
  { name: "1024", width: 1024, height: 800 },
  { name: "768", width: 768, height: 1024 },
  { name: "390", width: 390, height: 844 },
  { name: "375", width: 375, height: 812 },
];

const SHOT_ROUTES = new Set(process.env.SHOT_ROUTES?.split(",") ?? ["/"]);
const only = process.env.ONLY?.split(",");

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--disable-gpu", "--no-sandbox", "--font-render-hinting=none"],
});

const problems = [];
const note = (route, viewport, kind, detail) =>
  problems.push({ route, viewport, kind, detail });

for (const route of only ?? ROUTES) {
  for (const viewport of VIEWPORTS) {
    const page = await browser.newPage();
    await page.setViewport({ width: viewport.width, height: viewport.height, deviceScaleFactor: 1 });

    const consoleErrors = [];
    const failed = [];
    page.on("console", (m) => {
      if (m.type() === "error") consoleErrors.push(m.text());
    });
    page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message}`));
    page.on("requestfailed", (r) => failed.push(`${r.url()} — ${r.failure()?.errorText}`));
    page.on("response", (r) => {
      if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`);
    });

    const expected404 = route === "/this-route-does-not-exist";
    const response = await page.goto(BASE + route, { waitUntil: "networkidle2", timeout: 45000 });
    // Let scroll-reveal fire so nothing is measured while still translated.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise((r) => setTimeout(r, 400));
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise((r) => setTimeout(r, 200));

    const audit = await page.evaluate(() => {
      const docWidth = document.documentElement.clientWidth;
      const offenders = [];
      for (const el of document.querySelectorAll("body *")) {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) continue;
        if (rect.right > docWidth + 1 || rect.left < -1) {
          const style = getComputedStyle(el);
          if (style.position === "fixed" || style.position === "absolute") continue;
          offenders.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.className?.toString?.() ?? "").slice(0, 90),
            left: Math.round(rect.left),
            right: Math.round(rect.right),
          });
        }
      }
      const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => ({
        level: Number(h.tagName[1]),
        text: h.textContent.trim().slice(0, 60),
      }));
      const imagesWithoutAlt = [...document.querySelectorAll("img")]
        .filter((i) => !i.hasAttribute("alt"))
        .map((i) => i.getAttribute("src"));
      const links = [...document.querySelectorAll("a")].map((a) => ({
        href: a.getAttribute("href"),
        text: a.textContent.trim().slice(0, 40),
        label: a.getAttribute("aria-label"),
      }));
      const jsonLd = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => {
        try {
          return JSON.parse(s.textContent)["@type"];
        } catch {
          return "INVALID_JSON";
        }
      });
      return {
        docWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
        offenders: offenders.slice(0, 12),
        headings,
        imagesWithoutAlt,
        links,
        jsonLd,
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.content,
        canonical: document.querySelector('link[rel="canonical"]')?.href,
        ogImage: document.querySelector('meta[property="og:image"]')?.content,
        h1Count: document.querySelectorAll("h1").length,
      };
    });

    if (!expected404 && response.status() !== 200) {
      note(route, viewport.name, "status", response.status());
    }

    if (audit.scrollWidth > audit.docWidth + 1) {
      note(route, viewport.name, "overflow", `scrollWidth ${audit.scrollWidth} > ${audit.docWidth}`);
    }
    if (audit.offenders.length) {
      note(route, viewport.name, "offenders", JSON.stringify(audit.offenders));
    }
    if (consoleErrors.length && !expected404)
      note(route, viewport.name, "console", consoleErrors.slice(0, 4).join(" | "));
    // ERR_ABORTED is the harness, not the site: closing the page cancels whatever prefetches
    // are still in flight. The 404 route is expected to 404.
    const realFailed = failed.filter(
      (f) => !f.includes("this-route-does-not-exist") && !f.includes("net::ERR_ABORTED"),
    );
    if (realFailed.length) note(route, viewport.name, "requests", realFailed.slice(0, 4).join(" | "));

    // Page-level checks only need running once.
    if (viewport.name === "1440") {
      if (audit.h1Count !== 1) note(route, "-", "h1", `${audit.h1Count} h1 elements`);
      if (!audit.title) note(route, "-", "title", "missing");
      if (audit.title && audit.title.length > 65) note(route, "-", "title-length", `${audit.title.length}: ${audit.title}`);
      if (!audit.description) note(route, "-", "description", "missing");
      if (audit.description && (audit.description.length < 70 || audit.description.length > 175))
        note(route, "-", "description-length", `${audit.description.length}`);
      if (!expected404 && !audit.canonical) note(route, "-", "canonical", "missing");
      if (audit.imagesWithoutAlt.length) note(route, "-", "alt", audit.imagesWithoutAlt.join(", "));
      if (audit.jsonLd.includes("INVALID_JSON")) note(route, "-", "jsonld", "unparseable");

      let previous = 0;
      for (const heading of audit.headings) {
        if (previous && heading.level > previous + 1)
          note(route, "-", "heading-order", `h${previous} -> h${heading.level} "${heading.text}"`);
        previous = heading.level;
      }

      for (const link of audit.links) {
        if (!link.text && !link.label) note(route, "-", "link-name", `empty link to ${link.href}`);
      }
    }

    if (SHOT_ROUTES.has(route) || process.env.SHOT_ALL) {
      await page.screenshot({
        path: `${SHOTS}/${route.replace(/\W+/g, "_") || "home"}-${viewport.name}.png`,
        fullPage: Boolean(process.env.FULL),
      });
    }

    await page.close();
  }
}

await browser.close();

if (problems.length === 0) {
  console.log("CLEAN — no problems found");
} else {
  const grouped = {};
  for (const p of problems) (grouped[p.kind] ??= []).push(p);
  for (const [kind, list] of Object.entries(grouped)) {
    console.log(`\n### ${kind} (${list.length})`);
    for (const p of list.slice(0, 14)) console.log(`  ${p.route} @${p.viewport}: ${p.detail}`);
    if (list.length > 14) console.log(`  ... ${list.length - 14} more`);
  }
}
