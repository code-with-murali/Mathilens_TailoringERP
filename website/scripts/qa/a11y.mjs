// Objective accessibility audit: axe-core against every built route, desktop and mobile.
import puppeteer from "puppeteer-core";
import { readFileSync } from "node:fs";

const AXE = readFileSync("node_modules/axe-core/axe.min.js", "utf8");
const BASE = "http://127.0.0.1:4322";
const ROUTES = ["/", "/about", "/services", "/services/mens-tailoring", "/services/custom-clothing",
  "/suits", "/blazers", "/shirts", "/trousers", "/wedding", "/bulk-orders",
  "/bulk-orders/corporate", "/bulk-orders/schools", "/bulk-orders/colleges",
  "/bulk-orders/institutions", "/fabrics", "/process", "/mannargudi", "/delta-region",
  "/journal", "/journal/how-should-a-mens-blazer-fit", "/contact", "/shop",
  "/privacy", "/terms", "/shipping-policy", "/alterations-and-returns"];

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new", args: ["--no-sandbox", "--disable-gpu"],
});

const all = new Map();
for (const width of [1440, 390]) {
  for (const route of ROUTES) {
    const page = await browser.newPage();
    await page.setViewport({ width, height: width === 390 ? 844 : 900 });
    await page.goto(BASE + route, { waitUntil: "networkidle2", timeout: 60000 });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await new Promise((r) => setTimeout(r, 350));
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.evaluate(AXE);
    const results = await page.evaluate(async () =>
      await window.axe.run(document, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] },
      }),
    );
    for (const v of results.violations) {
      const key = `${v.id}@${width}`;
      if (!all.has(key)) all.set(key, { id: v.id, impact: v.impact, help: v.help, width, routes: new Set(), sample: v.nodes[0]?.html?.slice(0, 150) });
      all.get(key).routes.add(route);
    }
    await page.close();
  }
}
await browser.close();

if (all.size === 0) console.log("axe: 0 violations across all routes at 1440 and 390");
else {
  const order = { critical: 0, serious: 1, moderate: 2, minor: 3 };
  for (const v of [...all.values()].sort((a, b) => (order[a.impact] ?? 9) - (order[b.impact] ?? 9))) {
    console.log(`\n[${v.impact}] ${v.id} @${v.width}px — ${v.help}`);
    console.log(`  ${v.routes.size} route(s): ${[...v.routes].slice(0, 5).join(", ")}${v.routes.size > 5 ? " …" : ""}`);
    console.log(`  e.g. ${v.sample}`);
  }
}
