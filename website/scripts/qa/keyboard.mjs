import puppeteer from "puppeteer-core";
const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args:["--no-sandbox","--disable-gpu"] });

// Desktop: tab order and focus visibility from a cold load.
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.goto("http://127.0.0.1:4322/", { waitUntil: "networkidle2" });
const seq = [];
for (let i = 0; i < 12; i++) {
  await p.keyboard.press("Tab");
  seq.push(await p.evaluate(() => {
    const el = document.activeElement;
    if (!el) return "none";
    const cs = getComputedStyle(el);
    const ring = cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0;
    return `${el.tagName.toLowerCase()}:${(el.textContent||"").trim().slice(0,26)||el.getAttribute("aria-label")||""}${ring?"":"  [NO FOCUS RING]"}`;
  }));
}
console.log("Desktop tab order:");
seq.forEach((s,i)=>console.log(`  ${i+1}. ${s}`));

// Mobile drawer: open, Escape, and whether the page behind is locked.
const m = await b.newPage();
await m.setViewport({ width: 390, height: 844 });
await m.goto("http://127.0.0.1:4322/", { waitUntil: "networkidle2" });
await m.click('button[aria-controls="site-menu"]');
await new Promise(r=>setTimeout(r,250));
const open = await m.evaluate(() => ({
  expanded: document.querySelector('button[aria-controls="site-menu"]').getAttribute("aria-expanded"),
  menuVisible: !document.getElementById("site-menu").hasAttribute("hidden"),
  bodyLocked: getComputedStyle(document.body).overflow === "hidden",
}));
await m.keyboard.press("Escape");
await new Promise(r=>setTimeout(r,250));
const closed = await m.evaluate(() => ({
  expanded: document.querySelector('button[aria-controls="site-menu"]').getAttribute("aria-expanded"),
  menuVisible: !document.getElementById("site-menu").hasAttribute("hidden"),
  bodyLocked: getComputedStyle(document.body).overflow === "hidden",
}));
console.log("\nMobile drawer  open:", JSON.stringify(open));
console.log("after Escape :", JSON.stringify(closed));

// Skip link
await m.goto("http://127.0.0.1:4322/", { waitUntil: "networkidle2" });
await m.keyboard.press("Tab");
console.log("\nFirst Tab lands on:", await m.evaluate(() => {
  const el = document.activeElement;
  const cs = getComputedStyle(el);
  return `${el.tagName.toLowerCase()} "${el.textContent.trim()}" visible=${cs.position!=="absolute"||cs.clip==="auto"||el.getBoundingClientRect().width>1}`;
}));
await b.close();
