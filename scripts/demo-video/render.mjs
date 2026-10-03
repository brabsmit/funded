// Renders the part 5 demo frame by frame: home → Oakridge, cursor and highlights cued to the voiceover.
// Usage: node scripts/demo-video/render.mjs <workDir> <baseUrl> <voDurationSeconds>
// Reads vo.txt (here) and, if present, <workDir>/vo.alignment.json; writes <workDir>/frames/f%05d.png at 30 fps.
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const [work, base, durArg] = process.argv.slice(2);
const FPS = 30, W = 1280, H = 720, SCALE = 1.5; // 1920x1080 output
const PAD = 0.8; // silent lead-in and tail; the editor trims about a second off each end
const voDur = Number(durArg);

// Cue times: exact from ElevenLabs character timings when available, else proportional to position in the text.
const text = readFileSync(join(here, 'vo.txt'), 'utf8').replace(/<break[^>]*>/g, '').trim();
const alignPath = join(work, 'vo.alignment.json');
const align = existsSync(alignPath) ? JSON.parse(readFileSync(alignPath, 'utf8')) : null;
const cue = (phrase) => {
  const src = align?.text ?? text;
  const i = src.indexOf(phrase);
  if (i < 0) throw new Error(`cue not in vo.txt: ${phrase}`);
  return PAD + (align ? align.starts[i] : (i / src.length) * voDur);
};
const c = {
  pick: cue('Pick a school'), stage: cue('See what stage'), who: cue('who decides'), next: cue('what happens next'),
  oak: cue('For Oakridge'), cost: cue('thirty-one'), window: cue('scheduled for'), vote: cue('November'),
  real: cue("That's a real answer"), time: cue('And it cost'), family: cue('If one family'),
};
const total = PAD + voDur + PAD;
const tSwitch = Math.min(c.pick + 1.0, c.stage);

const ease = (x) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);
// Piecewise track: keys are [time, value]; the move into each key takes `lead` seconds, ending at its time.
const track = (keys, lead) => (t) => {
  let v = keys[0][1];
  for (const [kt, kv] of keys.slice(1)) {
    if (t <= kt - lead) break;
    const p = ease(Math.min(1, (t - (kt - lead)) / lead));
    v = Array.isArray(kv) ? kv.map((x, i) => v[i] + (x - v[i]) * p) : v + (kv - v) * p;
    if (p < 1) break;
  }
  return v;
};

const overlay = () => {
  const el = (css) => { const d = document.createElement('div'); d.style.cssText = css; document.body.appendChild(d); return d; };
  const ring = el('position:absolute;z-index:9998;border-radius:10px;box-shadow:0 0 0 3px #d9622b,0 0 0 9px rgba(217,98,43,.22);pointer-events:none;opacity:0');
  const ripple = el('position:fixed;z-index:9999;width:0;height:0;border-radius:50%;border:3px solid #d9622b;pointer-events:none;opacity:0;transform:translate(-50%,-50%)');
  const cur = el('position:fixed;z-index:10000;pointer-events:none;width:22px;height:32px');
  cur.innerHTML = '<svg viewBox="0 0 22 32" width="22" height="32"><path d="M2 2v23l6-5.5 4 9.5 4-1.8-4-9.2h8z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  document.documentElement.style.scrollBehavior = 'auto';
  window.__frame = ({ y, cx, cy, box, alpha, rip }) => {
    window.scrollTo(0, y);
    cur.style.left = `${cx}px`; cur.style.top = `${cy}px`;
    if (box) Object.assign(ring.style, { left: `${box.x - 8}px`, top: `${box.y - 6}px`, width: `${box.w + 16}px`, height: `${box.h + 12}px` });
    ring.style.opacity = alpha;
    const r = rip * 56;
    Object.assign(ripple.style, { left: `${cx}px`, top: `${cy}px`, width: `${r}px`, height: `${r}px`, opacity: rip > 0 && rip < 1 ? 1 - rip : 0 });
  };
  // Page-coordinate boxes for everything the demo points at.
  const rect = (n) => { if (!n) return null; const r = n.getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height }; };
  const byText = (sel, s) => [...document.querySelectorAll(sel)].find((n) => n.textContent.trim() === s);
  const costDt = byText('dt', 'Cost');
  let card = costDt; while (card && !/\bborder\b|\bbg-/.test(card.className) ) card = card.parentElement;
  return {
    oakCard: rect([...document.querySelectorAll('[data-testid=school-card]')].find((n) => /Oakridge/.test(n.textContent))),
    answer: rect(document.querySelector('[data-testid=countdown]')?.parentElement),
    stands: rect(byText('dt', 'Where it stands')?.parentElement),
    who: rect(byText('dt', 'Who decides next')?.parentElement),
    move: rect(byText('dt', 'Your next move')?.parentElement),
    cost: rect(costDt?.parentElement),
    window: rect(byText('dt', 'Window')?.parentElement),
    nextCard: rect(card),
    axis: rect(document.querySelector('[role=img][aria-label^="From the first public step"]')),
    ask: rect(document.querySelector('[data-testid=ask]')),
    engage: rect(document.querySelector('[data-testid=engage-item]')),
    maxY: document.documentElement.scrollHeight - innerHeight,
  };
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: SCALE });
const frames = join(work, 'frames');
rmSync(frames, { recursive: true, force: true });
mkdirSync(frames, { recursive: true });
let n = 0;
const snap = () => page.screenshot({ path: join(frames, `f${String(n++).padStart(5, '0')}.png`) });

// Scene 1: home. Cursor drifts to the Oakridge card and clicks.
await page.goto(base);
const home = await page.evaluate(overlay);
const oc = [home.oakCard.x + home.oakCard.w * 0.45, home.oakCard.y + home.oakCard.h * 0.6];
const homeCur = track([[0, [W * 0.72, H * 0.78]], [c.pick + 0.35, oc]], 1.3);
const tClick = tSwitch - 0.35;
for (; n / FPS < tSwitch;) {
  const t = n / FPS;
  const [cx, cy] = homeCur(t);
  const near = Math.max(0, Math.min(1, (t - (c.pick - 0.2)) / 0.3));
  await page.evaluate((s) => window.__frame(s), { y: 0, cx, cy, box: home.oakCard, alpha: near, rip: (t - tClick) / 0.35 });
  await snap();
}

// Scene 2: Oakridge. Short answer → Nov 3 milestone (cost, window, vote) → time scale → what to ask.
await page.goto(new URL('aps/schools/oakridge/', base).href);
const b = await page.evaluate(overlay);
for (const k of ['answer', 'stands', 'who', 'move', 'cost', 'window', 'nextCard', 'axis', 'ask', 'engage']) if (!b[k]) throw new Error(`target not found on page: ${k}`);
const centre = (box) => Math.max(0, Math.min(b.maxY, box.y + box.h / 2 - H / 2));
const scroll = track([
  [tSwitch, 0], [c.stage + 0.5, centre(b.answer)], [c.oak + 0.9, centre(b.nextCard)],
  [c.real + 1.2, centre(b.axis)], [c.time + 1.4, centre(b.engage)],
], 1.1);
const stops = [ // [time the highlight lands, box]
  [c.stage + 0.5, b.stands], [c.who, b.who], [c.next, b.move],
  [c.cost, b.cost], [c.window + 0.4, b.window], [c.vote - 0.6, b.nextCard],
  [c.real + 1.2, b.axis], [c.family, b.ask],
];
const point = (box) => [box.x + Math.min(box.w * 0.6, 420), box.y + box.h * 0.72];
const curPage = track([[tSwitch, [oc[0], oc[1]]], ...stops.map(([t, box]) => [t, point(box)])], 0.7);
for (; n / FPS < total;) {
  const t = n / FPS;
  const y = scroll(t);
  const [px, py] = curPage(t);
  const i = stops.findLastIndex(([st]) => t >= st - 0.25);
  let box = null, alpha = 0;
  if (i >= 0) {
    box = stops[i][1];
    const nextAt = stops[i + 1]?.[0] ?? Infinity;
    alpha = Math.min(1, (t - (stops[i][0] - 0.25)) / 0.25, Math.max(0, (nextAt - 0.25 - t) / 0.2));
  }
  await page.evaluate((s) => window.__frame(s), { y, cx: px, cy: py - y, box, alpha: Math.max(0, alpha), rip: 0 });
  await snap();
}
await browser.close();
console.log(`${n} frames, ${(n / FPS).toFixed(2)}s`);
