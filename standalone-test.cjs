/* Verify the single-file offline build actually runs (no missing pieces). */
const fs = require("fs"), path = require("path"), http = require("http");
const { JSDOM } = require("/workspace/node_modules/jsdom");
const DIR = "/workspace/reading-buddies";
const FILE = "reading-buddies-standalone.html";

(async () => {
  const html = fs.readFileSync(path.join(DIR, FILE), "utf8");
  const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/html" }); res.end(html);
  });
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;

  const dom = await JSDOM.fromURL(`http://127.0.0.1:${port}/`, {
    runScripts: "dangerously", resources: "usable", pretendToBeVisual: true
  });
  const { window } = dom; window.scrollTo = () => {};
  window.SpeechSynthesisUtterance = class { constructor(t) { this.text = String(t); } };
  window.speechSynthesis = { speak(u) { setTimeout(() => u.onend && u.onend(), 1); }, cancel() {}, getVoices: () => [], onvoiceschanged: null };

  await new Promise(res => setTimeout(res, 700));
  const doc = window.document;
  const tiles = doc.querySelectorAll("[data-go]").length;
  const noNet = !/https?:\/\/(?!www\.w3\.org)/.test(html);
  console.log("script blocks inlined :", (html.match(/<script/g) || []).length, "(expect 1)");
  console.log("style blocks inlined  :", (html.match(/<style/g) || []).length, "(expect 1)");
  console.log("no network references :", noNet);
  console.log("home tiles rendered   :", tiles, "(expect 6)");

  const safari = doc.querySelector('[data-go="safari"]');
  if (safari) {
    safari.click();
    await new Promise(res => setTimeout(res, 200));
    const opts = doc.querySelectorAll("#opts .option").length;
    const key = window.eval("session.round.key");
    console.log("safari opens          :", opts, "options, target digraph =", key);
    window.eval(`document.querySelector('#opts .option[data-key="${key}"]').click()`);
    await new Promise(res => setTimeout(res, 2100));
    console.log("playing the game works:", window.eval("session.index") === 1);
    console.log("stars awarded         :", window.eval("state.stars"));
  } else { console.log("safari tile MISSING"); }

  const okAll = tiles === 6 && (html.match(/<script/g) || []).length === 1 && noNet;
  console.log(okAll ? "\nSTANDALONE BUILD: PASS" : "\nSTANDALONE BUILD: FAIL");
  server.close();
  process.exit(okAll ? 0 : 1);
})().catch(e => { console.error("CRASH", e); process.exit(2); });
