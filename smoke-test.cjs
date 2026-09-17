/* Smoke test: loads the app in jsdom and actually PLAYS every game. */
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("/workspace/node_modules/jsdom");

const DIR = "/workspace/reading-buddies";
const sleep = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const ok = (label, cond, extra = "") => {
  if (cond) { pass++; console.log("  ✅ " + label); }
  else { fail++; console.log("  ❌ " + label + (extra ? "  -> " + extra : "")); }
};

(async () => {
  // ---- serve the app over http:// (a real origin, so localStorage works) ----
  const http = require("http");
  const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
  const server = http.createServer((req, res) => {
    let f = req.url.split("?")[0];
    if (f === "/") f = "/index.html";
    try {
      let body = fs.readFileSync(path.join(DIR, f));
      if (f === "/index.html") {
        // drop remote font links so the test never touches the network
        body = Buffer.from(String(body).replace(/<link[^>]*fonts[^>]*>/g, ""));
      }
      res.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "text/plain" });
      res.end(body);
    } catch (e) { res.writeHead(404); res.end("nope"); }
  });
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const PORT = server.address().port;

  const dom = await JSDOM.fromURL(`http://127.0.0.1:${PORT}/index.html`, {
    runScripts: "dangerously", resources: "usable", pretendToBeVisual: true
  });
  const { window } = dom;
  window.scrollTo = () => {};

  // ---- stub the Web Speech API (jsdom has none) ----
  const spoken = [];
  window.SpeechSynthesisUtterance = class { constructor(t) { this.text = String(t); } };
  window.speechSynthesis = {
    speak(u) { spoken.push(u.text); setTimeout(() => u.onend && u.onend(), 1); },
    cancel() {}, getVoices: () => [], onvoiceschanged: null, speaking: false
  };

  const run = code => window.eval(code);
  const doc = window.document;
  const $$ = s => Array.from(doc.querySelectorAll(s));
  const click = el => { if (!el) throw new Error("click(): element not found"); el.click(); };
  const screen = () => doc.getElementById("screen").textContent;

  // ---- wait for the three scripts to load and boot() to run ----
  await new Promise((res, rej) => {
    let tries = 0;
    const tick = () => {
      if (window.eval("typeof renderHome === 'function' && document.querySelector('[data-go]') !== null")) return res();
      if (++tries > 200) return rej(new Error("scripts never booted the app"));
      setTimeout(tick, 25);
    };
    tick();
  });
  const V = () => window.eval("typeof state !== 'undefined' ? state : null");

  console.log("\n1) HOME");
  ok("boots without throwing", V() !== null);
  ok("6 activity tiles render", $$("[data-go]").length === 6, $$("[data-go]").length);
  ok("mascot bubble greets", doc.getElementById("speechBubble").textContent.length > 5);
  ok("star counter present", doc.getElementById("starCount").textContent === "0");

  console.log("\n2) DIGRAPH SAFARI (easy = 2 choices)");
  click(doc.querySelector('[data-go="safari"]'));
  ok("game screen shows digraph options", $$("#opts .option").length === 2, $$("#opts .option").length);
  ok("word blank rendered", doc.querySelector(".big-word .blank") !== null);
  const r1 = run("session.round");
  ok("round has a target digraph", !!r1.key && !!r1.entry.word, JSON.stringify(r1.key));
  ok("target word really contains its digraph", r1.entry.word.includes(r1.key), r1.entry.word + "/" + r1.key);
  const starsBefore = run("state.stars");
  click(doc.querySelector(`#opts .option[data-key="${r1.key}"]`));
  ok("correct pick plays a sound effect + speech", spoken.length > 0);
  await sleep(2200);
  ok("advances to word 2", run("session.index") === 1, run("session.index"));
  ok("awarded a star", run("state.stars") === starsBefore + 1, run("state.stars"));
  // wrong answer path
  const r2 = run("session.round");
  const wrongKey = r2.options.find(k => k !== r2.key);
  click(doc.querySelector(`#opts .option[data-key="${wrongKey}"]`));
  ok("wrong pick marks the option, no crash", run("session.round").answered === false);
  ok("wrong key still marked wrong in DOM", doc.querySelector("#opts .option.wrong") !== null);

  console.log("\n3) FINISH A FULL SAFARI ROUND (8 words -> results + sticker)");
  run("session.index = 7; session.correct = 7; session.round = newSafariRound(); paintSafari(true);");
  click(doc.querySelector(`#opts .option[data-key="${run("session.round.key")}"]`));
  await sleep(2200);
  ok("results screen appears", /out of/.test(screen()), screen().slice(0, 60));
  ok("sticker was awarded", run("state.stickers").length >= 1, JSON.stringify(run("state.stickers")));
  ok("progress persisted to localStorage", (window.localStorage.getItem("luna-reading-buddies-v1") || "").includes("stickers"));

  console.log("\n4) HARD LEVEL CHANGES THE GAME");
  click(doc.getElementById("homeBtn2"));
  click(doc.querySelector('[data-level="hard"]'));
  ok("hard level hint shown", /4 choices/.test(screen()));
  click(doc.querySelector('[data-go="safari"]'));
  ok("hard = 4 digraph options", $$("#opts .option").length === 4, $$("#opts .option").length);

  console.log("\n5) SIGHT WORD HUNT");
  click(doc.getElementById("homeBtn"));
  click(doc.querySelector('[data-go="hunt"]'));
  const h = run("session.round");
  ok("hunt round has target + 4 options", !!h.target && h.options.length === 4, h.options.join(","));
  ok("target is among the options", h.options.includes(h.target));
  ok("distractors are unique", new Set(h.options).size === h.options.length);
  const spokenBefore = spoken.length;
  click(doc.querySelector(`#opts .option[data-word="${h.target}"]`));
  ok("reads the word + a sample sentence aloud", spoken.slice(spokenBefore).join(" ").toLowerCase().includes(h.target));
  await sleep(2500);
  ok("hunt advances", run("session.index") === 1, run("session.index"));

  console.log("\n6) WORD BUILDER (spell it letter by letter)");
  click(doc.getElementById("homeBtn"));
  click(doc.querySelector('[data-go="builder"]'));
  const b = run("session.round");
  ok("target word + shuffled tiles", !!b.target && b.letters.length >= b.target.length);
  ok("slots match word length", $$("#slots .slot").length === b.target.length, $$("#slots .slot").length);
  ok("first slot is highlighted as next", doc.querySelector("#slots .slot.next") !== null);
  // deliberately tap a wrong letter first
  const wrongTile = $$("#tiles .letter").find(t => t.dataset.char !== b.target[0]);
  if (wrongTile) { click(wrongTile); ok("wrong letter rejected (slot stays empty)", $$("#slots .slot.filled").length === 0); }
  for (const ch of b.target) click($$("#tiles .letter").find(t => t.dataset.char === ch && !t.classList.contains("used")));
  ok("word gets completed", run("session.round").answered === true, run("session.round").placed?.join(""));
  ok("all slots filled with the target", $$("#slots .slot.filled").length === b.target.length);
  await sleep(2500);
  ok("builder advances to next word", run("session.index") === 1, run("session.index"));

  console.log("\n7) READ WITH ME (sentences)");
  click(doc.getElementById("homeBtn"));
  click(doc.querySelector('[data-go="sentences"]'));
  ok("sentence rendered as tappable words", $$("#sentence .sword").length > 3, $$("#sentence .sword").length);
  click($$("#sentence .sword")[0]);
  ok("tapping a word speaks it", spoken[spoken.length - 1].length > 0, spoken[spoken.length - 1]);
  ok("word highlights while spoken", doc.querySelector("#sentence .sword.speaking") !== null);
  click(doc.getElementById("readAll"));
  await sleep(2500);
  click(doc.getElementById("nextSent"));
  ok("next sentence loads", /Sentence 2 of/.test(screen()), screen().slice(0, 50));

  console.log("\n8) FLASHCARDS");
  click(doc.getElementById("homeBtn"));
  click(doc.querySelector('[data-go="flashcards"]'));
  ok("digraph chip shows sh/ch/th…", /^(sh|ch|th|wh|ph|ck|ng|qu)$/.test(doc.getElementById("chip").textContent.trim()));
  ok("all 8 sounds listed", $$("[data-key]").length === 8, $$("[data-key]").length);
  click(doc.querySelector('[data-key="ch"]'));
  ok("switching sound works", doc.getElementById("chip").textContent.trim() === "ch");
  click(doc.getElementById("nextWordBtn"));
  ok("next word works", /words ·/.test(screen()));
  click(doc.querySelector('[data-mode="sight"]'));
  ok("sight word card renders a word", doc.querySelector(".flashcard .big-word").textContent.trim().length > 0);
  const knownBefore = run("state.knownWords").length;
  click(doc.getElementById("knowBtn"));
  ok("'I know it' saves the word", run("state.knownWords").length === knownBefore + 1);

  console.log("\n9) STICKER BOOK + RESET");
  click(doc.getElementById("homeBtn"));
  click(doc.querySelector('[data-go="stickers"]'));
  ok("sticker grid shows all 12 stickers", $$(".sticker").length === 12, $$(".sticker").length);
  ok("earned sticker is not locked", $$(".sticker:not(.locked)").length >= 1);
  ok("known words listed for re-reading", $$("[data-say]").length >= 1);
  click(doc.getElementById("resetBtn"));
  ok("reset clears stars", run("state.stars") === 0 && run("state.stickers").length === 0);

  console.log("\n10) SOUND TOGGLE");
  click(doc.getElementById("soundBtn"));
  ok("mute works", run("state.sound") === false && doc.getElementById("soundBtn").textContent === "🔇");
  click(doc.getElementById("soundBtn"));
  ok("unmute works", run("state.sound") === true);

  console.log(`\n===== ${pass} passed, ${fail} failed =====`);
  server.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error("TEST CRASHED:", e); process.exit(2); });
