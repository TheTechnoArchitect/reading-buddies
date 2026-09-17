/* ===========================================================
   Reading Buddies — app logic
   Games: Digraph Safari · Sight Word Hunt · Word Builder ·
          Read With Me (sentences) · Flashcards · Sticker Book
   =========================================================== */

/* ---------------- tiny helpers ---------------- */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const rnd  = n => Math.floor(Math.random() * n);
const pick = arr => arr[rnd(arr.length)];
const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));

/* ---------------- persistent state ---------------- */
const SAVE_KEY = "luna-reading-buddies-v1";
const state = {
  sound: true,
  level: "easy",          // easy | medium | hard
  stars: 0,
  stickers: [],           // sticker names earned
  knownWords: [],         // sight words the child marked as known
  played: {}              // rounds completed per activity
};

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) Object.assign(state, JSON.parse(raw));
  } catch (e) {}
}
function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {}
}

function addStars(n) {
  state.stars += n;
  save();
  const pill = $("#scorePill");
  $("#starCount").textContent = state.stars;
  pill.classList.remove("bump");
  void pill.offsetWidth;
  pill.classList.add("bump");
}

function awardSticker() {
  const left = STICKERS.filter(s => !state.stickers.includes(s.name));
  if (!left.length) return null;
  const s = pick(left);
  state.stickers.push(s.name);
  save();
  return s;
}

const levelNum = () => ({ easy: 1, medium: 2, hard: 3 }[state.level] || 1);
const optionCount = () => ({ easy: 2, medium: 3, hard: 4 }[state.level] || 2);

/* ---------------- mascot + juice ---------------- */
let bubbleTimer = null;
function say(text, ms = 3200) {
  const bubble = $("#speechBubble");
  bubble.textContent = text;
  bubble.classList.remove("say");
  void bubble.offsetWidth;
  bubble.classList.add("say");
  $("#mascotFace").textContent = pick(["🦉", "🦉", "🐤", "🦊"]);
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => {
    $("#mascotFace").textContent = "🦉";
    bubble.textContent = "You're doing great — keep going!";
  }, ms);
}

function celebrate(count = 46) {
  const layer = $("#confettiLayer");
  const colors = ["#ff77c8", "#43b7ff", "#38d39f", "#ffc93c", "#ff9448", "#9b6bff"];
  for (let i = 0; i < count; i++) {
    const c = document.createElement("i");
    c.className = "confetti";
    c.style.left = Math.random() * 100 + "vw";
    c.style.background = pick(colors);
    c.style.animationDuration = (1.1 + Math.random() * 1.4) + "s";
    c.style.animationDelay = (Math.random() * 0.35) + "s";
    c.style.transform = `rotate(${rnd(360)}deg)`;
    if (Math.random() < 0.4) c.style.borderRadius = "50%";
    layer.appendChild(c);
    setTimeout(() => c.remove(), 3000);
  }
}

function starBurst(x, y) {
  const s = document.createElement("div");
  s.className = "star-burst";
  s.textContent = pick(["⭐", "🌟", "✨", "💫"]);
  s.style.left = x + "px";
  s.style.top = y + "px";
  s.style.setProperty("--dx", (rnd(160) - 80) + "px");
  s.style.setProperty("--dy", (-100 - rnd(80)) + "px");
  document.body.appendChild(s);
  setTimeout(() => s.remove(), 950);
}

/* ---------------- speech wrappers ---------------- */
function speak(text, opts) { return Audio.speak(text, opts); }
function speakWordSlow(w) { return speak(w, { rate: 0.66, pitch: 1.1 }); }
function speakDigraphSound(key) {
  const d = DIGRAPHS[key];
  return speak(`${d.sound}`, { rate: 0.6, pitch: 1.0 });
}

/* ---------------- shared UI bits ---------------- */
function screenTitle(title, sub) {
  return `<h1 class="screen-title">${esc(title)}</h1>` +
         (sub ? `<p class="screen-sub">${esc(sub)}</p>` : "");
}

function progressBar(done, total) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return `<div class="progress" role="progressbar" aria-valuenow="${done}" aria-valuemax="${total}">
            <i style="width:${pct}%"></i></div>`;
}

/* ---------------- router ---------------- */
const SCREENS = {
  home: renderHome,
  safari: renderSafari,
  hunt: renderHunt,
  builder: renderBuilder,
  sentences: renderSentences,
  flashcards: renderFlashcards,
  stickers: renderStickers
};
let current = "home";

function go(name) {
  current = SCREENS[name] ? name : "home";
  Audio.stopSpeaking();
  Audio.sfx("whoosh");
  SCREENS[current]();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* =========================================================
   HOME
   ========================================================= */
function renderHome() {
  $("#screen").innerHTML = `
    ${screenTitle("Reading Buddies", "Tap a game and let's read together!")}

    <div class="card">
      <div class="tiles">
        <button class="tile t-blue"  data-go="safari">
          <span class="t-emoji">🔤</span><span class="t-name">Digraph Safari</span>
          <span class="t-desc">sh · ch · th · wh · ph · ck · ng · qu</span>
        </button>
        <button class="tile t-pink"  data-go="hunt">
          <span class="t-emoji">⭐</span><span class="t-name">Sight Word Hunt</span>
          <span class="t-desc">Listen, then tap the word you hear</span>
        </button>
        <button class="tile t-green" data-go="builder">
          <span class="t-emoji">🧩</span><span class="t-name">Word Builder</span>
          <span class="t-desc">Tap the letters to spell the word</span>
        </button>
        <button class="tile t-purple" data-go="sentences">
          <span class="t-emoji">📖</span><span class="t-name">Read With Me</span>
          <span class="t-desc">Tap each word in a little sentence</span>
        </button>
        <button class="tile t-teal"  data-go="flashcards">
          <span class="t-emoji">🃏</span><span class="t-name">Flashcards</span>
          <span class="t-desc">Look, listen and learn new sounds</span>
        </button>
        <button class="tile t-yellow" data-go="stickers">
          <span class="t-emoji">🏅</span><span class="t-name">My Sticker Book</span>
          <span class="t-desc">${state.stickers.length} of ${STICKERS.length} collected</span>
        </button>
      </div>

      <h3 style="text-align:center;margin:22px 0 0">How hard should it be?</h3>
      <div class="level-pick" id="levelPick">
        ${["easy", "medium", "hard"].map(l =>
          `<button class="level-btn ${state.level === l ? "active" : ""}" data-level="${l}">
             ${l === "easy" ? "🐣 Easy" : l === "medium" ? "🐥 Medium" : "🦅 Hard"}
           </button>`).join("")}
      </div>
      <p class="hint" id="levelHint">${levelHint()}</p>
    </div>

    <p class="hint" style="margin-top:14px">
      Grown-ups: turn the sound on 🔊 and let your reader tap — every tap talks!
    </p>`;

  $$("[data-go]").forEach(b => b.addEventListener("click", () => go(b.dataset.go)));
  $$("[data-level]").forEach(b => b.addEventListener("click", () => {
    state.level = b.dataset.level; save(); Audio.sfx("pop"); renderHome();
  }));
  say("Hi! I'm Ollie the Owl. Which game shall we play?");
}

function levelHint() {
  return {
    easy:   "2 choices · short and simple words",
    medium: "3 choices · a little trickier",
    hard:   "4 choices · big-reader challenge"
  }[state.level];
}

/* =========================================================
   GAME 1 — DIGRAPH SAFARI
   Listen to the word, then tap the two letters that are missing.
   ========================================================= */
const session = { total: 8, index: 0, correct: 0, firstTry: true, round: null };

function allDigraphKeys() { return Object.keys(DIGRAPHS); }

function newSafariRound() {
  const keys = allDigraphKeys();
  const key = pick(keys);
  const entry = pick(DIGRAPH_WORDS[key]);
  const { before, after } = splitWord(entry.word, key);
  const n = optionCount();
  const others = shuffle(keys.filter(k => k !== key)).slice(0, n - 1);
  const options = shuffle([key, ...others]);
  return { key, entry, before, after, options, answered: false };
}

function splitWord(word, key) {
  const i = word.toLowerCase().indexOf(key);
  if (i < 0) return { before: word, after: "" };
  return { before: word.slice(0, i), after: word.slice(i + key.length) };
}

function renderSafari() {
  session.index = 0; session.correct = 0; session.total = 8;
  session.firstTry = true;
  session.round = newSafariRound();
  paintSafari();
}

function paintSafari(busy) {
  const r = session.round;
  const n = optionCount();
  $("#screen").innerHTML = `
    ${screenTitle("Digraph Safari", "Which two letters are hiding in the word?")}
    <div class="card pop" id="gameCard">
      <div class="q-top">
        <span class="pill">Word ${session.index + 1} of ${session.total}</span>
        <span class="pill streak">⭐ ${session.correct} right</span>
      </div>
      ${progressBar(session.index, session.total)}

      <div class="emoji-hero" aria-hidden="true">${r.entry.emoji}</div>
      <div class="big-word" aria-label="word with missing letters">
        ${esc(r.before)}<span class="blank">__</span>${esc(r.after)}
      </div>

      <div class="prompt-row">
        <button class="speak-btn" id="hearBtn"><span class="spk">🔊</span> Hear the word</button>
        <button class="speak-btn ghost small" id="soundBtn2">👂 Just the sound</button>
      </div>
      <p class="hint">Listen… then tap the two letters that make that sound.</p>

      <div class="options" id="opts">
        ${r.options.map(k => `
          <button class="option" data-key="${k}" style="color:#2c3b57">
            ${esc(k)}<span class="opt-sub">${esc(DIGRAPHS[k].sound)}</span>
          </button>`).join("")}
      </div>
    </div>`;

  $("#hearBtn").addEventListener("click", () => { Audio.sfx("tap"); speakWordSlow(r.entry.word); });
  $("#soundBtn2").addEventListener("click", () => { Audio.sfx("tap"); speakDigraphSound(r.key); });

  $$("#opts .option").forEach(btn => btn.addEventListener("click", e => {
    if (session.round.answered && btn.dataset.key !== session.round.key) return;
    checkSafari(btn, e);
  }));

  if (!busy) {
    say("Listen closely — which two letters are missing?");
    setTimeout(() => speakWordSlow(r.entry.word), 260);
  }
}

function checkSafari(btn, e) {
  const r = session.round;
  const chosen = btn.dataset.key;

  if (chosen === r.key) {
    r.answered = true;
    btn.classList.add("correct");
    Audio.sfx("correct");
    if (session.firstTry) { session.correct++; addStars(1); }
    const rect = btn.getBoundingClientRect();
    starBurst(rect.left + rect.width / 2, rect.top);
    celebrate(30);
    say(`${pick(PRAISE)} "${r.entry.word}" has ${r.key} — ${DIGRAPHS[r.key].tip}.`);
    speak(`Yes! ${r.entry.word}. ${r.key} says ${DIGRAPHS[r.key].sound}.`);
    session.index++;
    session.firstTry = true;
    setTimeout(() => {
      if (session.index >= session.total) return safariResults();
      session.round = newSafariRound();
      paintSafari(true);
      setTimeout(() => speakWordSlow(session.round.entry.word), 300);
    }, 1700);
  } else {
    session.firstTry = false;
    btn.classList.add("wrong");
    Audio.sfx("wrong");
    say(`Oops! That's "${DIGRAPHS[chosen].sound}". Try the other one.`);
    speak("Not quite. Try again.");
    setTimeout(() => {
      btn.classList.remove("wrong");
      btn.classList.add("dim");
      btn.disabled = true;
    }, 500);
  }
}

function safariResults() {
  Audio.sfx("cheer");
  celebrate(90);
  const st = awardSticker();
  state.played.safari = (state.played.safari || 0) + 1; save();
  $("#screen").innerHTML = resultsHTML(
    "Digraph Detective!",
    session.correct,
    session.total,
    st,
    "You listened for the sounds inside words — that's real reading!"
  );
  wireResults(() => renderSafari());
  say("Amazing work! You are a digraph detective!");
}

/* =========================================================
   GAME 2 — SIGHT WORD HUNT
   Hear the word, tap the written word.
   ========================================================= */
function wordPool() {
  return SIGHT_WORDS[levelNum()] || SIGHT_WORDS[1];
}

function similarDistractors(target, pool, n) {
  const ranked = pool.filter(w => w !== target).map(w => {
    let score = 0;
    if (w[0] === target[0]) score += 3;
    if (w.length === target.length) score += 2;
    if (w.slice(-1) === target.slice(-1)) score += 1;
    if (Math.abs(w.length - target.length) <= 1) score += 1;
    return { w, score };
  }).sort((a, b) => b.score - a.score);
  const top = ranked.slice(0, Math.max(8, n * 3)).map(r => r.w);
  return shuffle(top.length >= n ? top : ranked.map(r => r.w)).slice(0, n);
}

function newHuntRound() {
  const pool = wordPool();
  const target = pick(pool);
  const n = optionCount();
  const options = shuffle([target, ...similarDistractors(target, pool, n - 1)]);
  return { target, options, answered: false, tries: 0 };
}

function renderHunt() {
  session.index = 0; session.correct = 0; session.total = 8;
  session.round = newHuntRound();
  session.firstTry = true;
  paintHunt();
}

function paintHunt(busy) {
  const r = session.round;
  $("#screen").innerHTML = `
    ${screenTitle("Sight Word Hunt", "Listen… then tap the word you hear!")}
    <div class="card pop">
      <div class="q-top">
        <span class="pill">Word ${session.index + 1} of ${session.total}</span>
        <span class="pill streak">⭐ ${session.correct} right</span>
      </div>
      ${progressBar(session.index, session.total)}

      <div class="emoji-hero">${r.answered ? "🎉" : "❓"}</div>
      <div class="prompt-row">
        <button class="speak-btn" id="hearBtn"><span class="spk">🔊</span> Say it again</button>
      </div>
      <p class="hint">Tip: look at the first letter, then the whole word.</p>

      <div class="options" id="opts">
        ${r.options.map(w => `<button class="option" data-word="${esc(w)}">${esc(w)}</button>`).join("")}
      </div>
    </div>`;

  $("#hearBtn").addEventListener("click", () => { Audio.sfx("tap"); speakWordSlow(r.target); });
  $$("#opts .option").forEach(btn => btn.addEventListener("click", e => checkHunt(btn, e)));
  if (!busy) setTimeout(() => speakWordSlow(r.target), 250);
}

function checkHunt(btn, e) {
  const r = session.round;
  if (r.answered) return;
  const word = btn.dataset.word;

  if (word === r.target) {
    r.answered = true;
    btn.classList.add("correct");
    Audio.sfx("correct");
    addStars(1);
    session.correct++;
    const rect = btn.getBoundingClientRect();
    starBurst(rect.left + rect.width / 2, rect.top);
    celebrate(30);
    const sentence = sentenceFor(r.target);
    say(`${pick(PRAISE)} "${r.target}" — ${sentence}`);
    speak(`${r.target}. ${cap(r.target)}. ${sentence}`, { rate: 0.78 });
    session.index++;
    setTimeout(() => {
      if (session.index >= session.total) return huntResults();
      session.round = newHuntRound();
      paintHunt(true);
      setTimeout(() => speakWordSlow(session.round.target), 350);
    }, 2100);
  } else {
    r.tries++;
    btn.classList.add("wrong");
    Audio.sfx("wrong");
    say(`That says "${word}". Listen again — you can do it!`);
    speak("That is not it. Listen again.");
    setTimeout(() => { btn.classList.remove("wrong"); btn.classList.add("dim"); btn.disabled = true; }, 500);
  }
}

function sentenceFor(w) {
  const bank = {
    the: "Look at the ship.", a: "A big duck.", and: "You and me.", see: "I see a fish.",
    can: "Can you jump?", go: "Let's go to the beach!", I: "I like my cat.",
    like: "I like cheese.", my: "My little sock.", you: "You can do it!",
    we: "We can play.", is: "The king is here.", it: "It is a rock.",
    she: "She has a ring.", he: "He can sing.", they: "They went up.",
    this: "This is my lunch.", that: "That is a whale.", look: "Look at the moon.",
    little: "My little chick.", come: "Come and see.", here: "Here is my thumb.",
    said: "She said hello.", want: "I want a snack.", have: "I have a tooth."
  };
  return bank[w] || `I can read "${w}".`;
}

function huntResults() {
  Audio.sfx("cheer"); celebrate(90);
  const st = awardSticker();
  state.played.hunt = (state.played.hunt || 0) + 1; save();
  $("#screen").innerHTML = resultsHTML(
    "Sight Word Star!",
    session.correct, session.total, st,
    "Sight words are tricky — they don't follow the rules. You remembered them!"
  );
  wireResults(() => renderHunt());
  say("Super reading! Those words are yours now.");
}

/* =========================================================
   GAME 3 — WORD BUILDER
   ========================================================= */
function newBuildRound() {
  const pool = wordPool().filter(w => w.length <= (state.level === "easy" ? 3 : state.level === "medium" ? 4 : 6));
  const words = pool.length >= 5 ? pool : wordPool();
  const target = pick(words);
  const extra = state.level === "hard" ? 2 : 0;
  const alphabet = "abcdefghijklmnopqrstuvwxyz".split("").filter(c => !target.includes(c));
  const letters = shuffle([...target.split(""), ...shuffle(alphabet).slice(0, extra)]);
  return { target, letters, placed: [], answered: false };
}

function renderBuilder() {
  session.index = 0; session.correct = 0; session.total = 6;
  session.round = newBuildRound();
  paintBuilder();
}

function paintBuilder(busy, solved) {
  const r = session.round;
  // Which tiles are already used? (count-based, so repeated letters work)
  function tileHTML() {
    const need = {};
    r.placed.forEach(c => { need[c] = (need[c] || 0) + 1; });
    const seen = {};
    return r.letters.map(c => {
      seen[c] = (seen[c] || 0) + 1;
      const used = seen[c] <= (need[c] || 0);
      return `<button class="letter ${used ? "used" : ""}" data-char="${c}">${esc(c)}</button>`;
    }).join("");
  }

  $("#screen").innerHTML = `
    ${screenTitle("Word Builder", "Tap the letters in order to spell the word")}
    <div class="card pop">
      <div class="q-top">
        <span class="pill">Word ${session.index + 1} of ${session.total}</span>
        <span class="pill streak">⭐ ${session.correct} built</span>
      </div>
      ${progressBar(session.index, session.total)}

      <div class="prompt-row">
        <button class="speak-btn" id="hearBtn"><span class="spk">🔊</span> Hear the word</button>
        <button class="speak-btn ghost small" id="undoBtn">↩︎ Undo</button>
      </div>

      <div class="slots" id="slots">
        ${r.target.split("").map((_, i) =>
          `<div class="slot ${i < r.placed.length ? "filled" : ""} ${!solved && i === r.placed.length ? "next" : ""}">${r.placed[i] ? esc(r.placed[i]) : ""}</div>`
        ).join("")}
      </div>

      <div class="letter-tiles" id="tiles">
        ${tileHTML()}
      </div>
      <p class="hint">${solved
        ? `🎉 You built <b>${esc(r.target)}</b>! Say it with me!`
        : 'Say the sounds as you tap: c · a · t → "cat"'}</p>
    </div>`;

  $("#hearBtn").addEventListener("click", () => { Audio.sfx("tap"); speakWordSlow(r.target); });
  $("#undoBtn").addEventListener("click", () => {
    if (!r.placed.length) return;
    r.placed.pop(); Audio.sfx("tap"); paintBuilder(true);
  });

  $$("#tiles .letter").forEach(btn => btn.addEventListener("click", () => {
    if (r.answered) return;
    const c = btn.dataset.char;
    const nextLetter = r.target[r.placed.length];
    if (c === nextLetter) {
      r.placed.push(c);
      Audio.sfx("pop");
      speak(String(c), { rate: 0.8, pitch: 1.25 });
      if (r.placed.length === r.target.length) {
        r.answered = true;
        Audio.sfx("correct");
        addStars(1);
        session.correct++;
        const rect = btn.getBoundingClientRect();
        starBurst(rect.left + rect.width / 2, rect.top);
        celebrate(36);
        paintBuilder(true, true);          // show the finished word
        say(`You spelled "${r.target}"! Let's read it together.`);
        setTimeout(() => speak(`${r.target}. ${cap(r.target)}!`, { rate: 0.7 }), 550);
        session.index++;
        setTimeout(() => {
          if (session.index >= session.total) return builderResults();
          session.round = newBuildRound();
          paintBuilder(true);
          setTimeout(() => speakWordSlow(session.round.target), 350);
        }, 2300);
      } else {
        paintBuilder(true);
        speakWordSlow(r.target.slice(0, r.placed.length));
      }
    } else {
      Audio.sfx("wrong");
      btn.classList.add("wrong");
      say(`"${c}" comes later. We need "${nextLetter}" next.`);
      setTimeout(() => btn.classList.remove("wrong"), 500);
    }
  }));

  if (!busy) setTimeout(() => speakWordSlow(r.target), 250);
}

function builderResults() {
  Audio.sfx("cheer"); celebrate(90);
  const st = awardSticker();
  state.played.builder = (state.played.builder || 0) + 1; save();
  $("#screen").innerHTML = resultsHTML(
    "Word Builder!",
    session.correct, session.total, st,
    "You stretched the word out and built it. That's how writers spell!"
  );
  wireResults(() => renderBuilder());
  say("Fantastic spelling! You built every word.");
}

/* =========================================================
   GAME 4 — READ WITH ME (sentences)
   ========================================================= */
let sentenceIdx = 0;
function renderSentences() {
  const s = SENTENCES[sentenceIdx % SENTENCES.length];
  const words = s.text.split(" ");
  $("#screen").innerHTML = `
    ${screenTitle("Read With Me", "Tap any word to hear it")}
    <div class="card pop">
      <div class="q-top">
        <span class="pill">Sentence ${(sentenceIdx % SENTENCES.length) + 1} of ${SENTENCES.length}</span>
        <span class="pill streak">👆 tap the words</span>
      </div>
      <div class="emoji-hero">${s.emoji}</div>
      <div class="sentence" id="sentence">
        ${words.map((w, i) => `<button class="sword" data-i="${i}" data-w="${esc(w)}">${esc(w)}</button>`).join("")}
      </div>
      <div class="prompt-row">
        <button class="speak-btn" id="readAll"><span class="spk">▶︎</span> Read it to me</button>
        <button class="speak-btn ghost small" id="readSlow">🐢 Slowly</button>
      </div>
      <div class="btn-row">
        <button class="action blue" id="nextSent">Next sentence ➜</button>
      </div>
    </div>
    <div class="card" style="margin-top:16px">
      <p class="hint" style="margin:0">
        Reading tip: point to each word while you say it. Words with <b>sh, ch, th, ck</b>
        get their own special sound!
      </p>
    </div>`;

  $$("#sentence .sword").forEach(b => b.addEventListener("click", ev => {
    Audio.sfx("tap");
    highlightWord(b);
    speak(b.dataset.w.replace(/[.!?,"]/g, ""), { rate: 0.7 });
  }));

  $("#readAll").addEventListener("click", () => readAll(words, 0.82));
  $("#readSlow").addEventListener("click", () => readAll(words, 0.6));
  $("#nextSent").addEventListener("click", () => {
    sentenceIdx++;
    Audio.sfx("pop");
    if (sentenceIdx % 5 === 0) { addStars(1); celebrate(24); say("You read 5 sentences! Here's a star ⭐"); }
    renderSentences();
  });

  say("Point to each word and read it out loud with me!");
}

let readingAll = false;
async function readAll(words, rate) {
  if (readingAll) return;
  readingAll = true;
  const btns = $$("#sentence .sword");
  btns.forEach(b => b.classList.remove("speaking"));
  for (let i = 0; i < words.length; i++) {
    btns.forEach(b => b.classList.remove("speaking"));
    if (btns[i]) btns[i].classList.add("speaking");
    await speak(words[i].replace(/[.!?,"]/g, ""), { rate, pitch: 1.15 });
    await new Promise(r => setTimeout(r, 110));
  }
  btns.forEach(b => b.classList.remove("speaking"));
  readingAll = false;
}

function highlightWord(btn) {
  $$("#sentence .sword").forEach(b => b.classList.remove("speaking"));
  btn.classList.add("speaking");
}

/* =========================================================
   FLASHCARDS (explore mode)
   ========================================================= */
let fcMode = "digraph";
let fcKeyIndex = 0;
let fcWordIndex = 0;
let fcSightIndex = 0;

function renderFlashcards() {
  if (fcMode === "digraph") return renderDigraphCards();
  return renderSightCards();
}

function renderDigraphCards() {
  const keys = allDigraphKeys();
  const key = keys[fcKeyIndex % keys.length];
  const d = DIGRAPHS[key];
  const words = DIGRAPH_WORDS[key];
  const w = words[fcWordIndex % words.length];
  const { before, after } = splitWord(w.word, key);

  $("#screen").innerHTML = `
    ${screenTitle("Sound Flashcards", "Tap the letters to hear the sound")}
    <div class="level-pick">
      <button class="level-btn active" data-mode="digraph">🔤 Digraphs</button>
      <button class="level-btn" data-mode="sight">⭐ Sight words</button>
    </div>

    <div class="flashcard pop" id="fc">
      <div class="digraph-chip c${d.color}" id="chip">${esc(key)}</div>
      <p class="hint" style="font-size:18px;margin-top:14px">${esc(d.tip)}</p>
      <p class="hint">The sound is <b>${esc(d.sound)}</b></p>
    </div>

    <div class="card" style="margin-top:16px">
      <div class="q-top">
        <span class="pill">${esc(key)} words · ${(fcWordIndex % words.length) + 1} of ${words.length}</span>
        <span class="pill streak">Tap a word 👇</span>
      </div>
      <div class="emoji-hero" style="font-size:76px">${w.emoji}</div>
      <div class="big-word" style="font-size:clamp(38px,11vw,66px)">
        ${esc(before)}<span style="color:#ff5ba8">${esc(key)}</span>${esc(after)}
      </div>
      <div class="btn-row">
        <button class="action blue" id="hearWordBtn">🔊 Hear the word</button>
        <button class="action alt" id="nextWordBtn">Next word ➜</button>
      </div>
      <div class="options" style="margin-top:18px">
        ${allDigraphKeys().map(k => `
          <button class="option ${k === key ? "correct" : ""}" data-key="${k}" style="font-size:26px">
            ${esc(k)}<span class="opt-sub">${esc(DIGRAPHS[k].sound)}</span>
          </button>`).join("")}
      </div>
      <p class="hint">Tap any sound to switch to it.</p>
    </div>`;

  const hear = () => { Audio.sfx("tap"); speakDigraphSound(key).then(() => speak(`${w.word}`, { rate: 0.7 })); };
  $("#fc").addEventListener("click", hear);
  $("#chip").addEventListener("click", ev => { ev.stopPropagation(); hear(); });
  $("#hearWordBtn").addEventListener("click", hear);
  $("#nextWordBtn").addEventListener("click", () => { fcWordIndex++; Audio.sfx("pop"); renderDigraphCards(); });
  $$("[data-mode]").forEach(b => b.addEventListener("click", () => { fcMode = b.dataset.mode; Audio.sfx("pop"); renderFlashcards(); }));
  $$("[data-key]").forEach(b => b.addEventListener("click", () => {
    fcKeyIndex = allDigraphKeys().indexOf(b.dataset.key);
    fcWordIndex = 0;
    Audio.sfx("pop");
    renderDigraphCards();
  }));

  say(`${key} says ${d.sound}. Can you say it? ${key}… ${w.word}!`);
  setTimeout(() => speak(`${key}. ${key} says ${d.sound}. ${w.word}`, { rate: 0.7 }), 400);
}

function renderSightCards() {
  const pool = wordPool();
  const word = pool[fcSightIndex % pool.length];
  const known = state.knownWords.includes(word);

  $("#screen").innerHTML = `
    ${screenTitle("Word Flashcards", "Tap the card to hear the word")}
    <div class="level-pick">
      <button class="level-btn" data-mode="digraph">🔤 Digraphs</button>
      <button class="level-btn active" data-mode="sight">⭐ Sight words</button>
    </div>

    <div class="flashcard pop" id="fc">
      <div class="big-word" style="font-size:clamp(52px,16vw,104px)">${esc(word)}</div>
      <p class="hint" id="tapHint">👆 tap to hear it</p>
      ${known ? `<p class="pill" style="margin-top:12px">✅ you know this one</p>` : ""}
    </div>

    <div class="btn-row">
      <button class="action blue" id="againBtn">🔊 Say it again</button>
      <button class="action" id="knowBtn">✅ I know it!</button>
      <button class="action alt" id="nextCard">Next ➜</button>
    </div>

    <div class="card" style="margin-top:16px">
      <div class="q-top">
        <span class="pill">Word ${(fcSightIndex % pool.length) + 1} of ${pool.length}</span>
        <span class="pill streak">✅ known: ${state.knownWords.length}</span>
      </div>
      <p class="hint" style="margin:6px 0 0">Sight words are words we learn to know
      <b>in a flash</b> — no sounding out needed!</p>
    </div>`;

  const hear = () => { Audio.sfx("tap"); speakWordSlow(word); };
  $("#fc").addEventListener("click", hear);
  $("#againBtn").addEventListener("click", hear);
  $("#nextCard").addEventListener("click", () => { fcSightIndex++; Audio.sfx("pop"); renderSightCards(); });
  $("#knowBtn").addEventListener("click", () => {
    Audio.sfx("star");
    celebrate(30);
    if (!state.knownWords.includes(word)) state.knownWords.push(word);
    save();
    addStars(1);
    say(`Wonderful! You know "${word}". ⭐`);
    speak(`Great! You know ${word}.`, { rate: 0.78 });
    setTimeout(() => { fcSightIndex++; renderSightCards(); }, 1400);
  });
  $$("[data-mode]").forEach(b => b.addEventListener("click", () => { fcMode = b.dataset.mode; Audio.sfx("pop"); renderFlashcards(); }));

  say(`Can you read this word? ${word}.`);
  setTimeout(() => speakWordSlow(word), 400);
}

/* =========================================================
   STICKER BOOK + PROGRESS
   ========================================================= */
function renderStickers() {
  $("#screen").innerHTML = `
    ${screenTitle("My Sticker Book", "Finish a round to win a sticker!")}
    <div class="card">
      <div class="q-top">
        <span class="pill">⭐ Stars: ${state.stars}</span>
        <span class="pill streak">🏅 Stickers: ${state.stickers.length}/${STICKERS.length}</span>
        <span class="pill">✅ Words I know: ${state.knownWords.length}</span>
      </div>
      <div class="sticker-grid">
        ${STICKERS.map(s => {
          const got = state.stickers.includes(s.name);
          return `<div class="sticker ${got ? "" : "locked"}">
                    <span class="s-emoji">${got ? s.emoji : "❔"}</span>
                    <span class="s-name">${got ? esc(s.name) : "Locked"}</span>
                  </div>`;
        }).join("")}
      </div>
    </div>

    ${state.knownWords.length ? `
    <div class="card" style="margin-top:16px">
      <h3 style="margin:0 0 8px">Words you know by heart ❤️</h3>
      <div class="sentence">
        ${state.knownWords.slice(-40).map(w => `<button class="sword" data-say="${esc(w)}">${esc(w)}</button>`).join("")}
      </div>
      <p class="hint">Tap any word to hear it again.</p>
    </div>` : ""}

    <div class="btn-row">
      <button class="action blue" id="backHome">🏠 More games</button>
      <button class="action alt" id="resetBtn">↺ Start over</button>
    </div>`;

  $$("[data-say]").forEach(b => b.addEventListener("click", () => { Audio.sfx("tap"); speakWordSlow(b.dataset.say); }));
  $("#backHome").addEventListener("click", () => go("home"));
  $("#resetBtn").addEventListener("click", () => {
    state.stars = 0; state.stickers = []; state.knownWords = []; state.played = {};
    save();
    $("#starCount").textContent = "0";
    Audio.sfx("pop");
    celebrate(40);
    say("All fresh and new! Let's read again.");
    renderStickers();
  });

  say("Look at all your stickers — you are a superstar reader!");
}

/* =========================================================
   RESULTS SCREEN
   ========================================================= */
function resultsHTML(title, correct, total, sticker, blurb) {
  const filled = Math.round((correct / total) * 3);
  return `
    <div class="card pop result">
      <div class="big-emoji">${filled === 3 ? "🏆" : filled === 2 ? "🎉" : "💪"}</div>
      <h2>${esc(title)}</h2>
      <div class="star-row">
        ${[1, 2, 3].map(i => `<span class="${i <= Math.max(1, filled) ? "on" : ""}">⭐</span>`).join("")}
      </div>
      <p class="hint" style="font-size:19px">You got <b>${correct}</b> out of <b>${total}</b>!</p>
      <p class="hint">${esc(blurb)}</p>
      ${sticker ? `<div class="sticker" style="max-width:180px;margin:16px auto 0">
        <span class="s-emoji">${sticker.emoji}</span>
        <span class="s-name">New sticker: ${esc(sticker.name)}!</span>
      </div>` : `<p class="hint">You collected every sticker — wow! 🏅</p>`}
      <div class="btn-row">
        <button class="action" id="againBtn2">🔁 Play again</button>
        <button class="action blue" id="homeBtn2">🏠 More games</button>
      </div>
    </div>`;
}

function wireResults(againFn) {
  $("#againBtn2").addEventListener("click", () => { Audio.sfx("pop"); againFn(); });
  $("#homeBtn2").addEventListener("click", () => go("home"));
}

/* =========================================================
   BOOT
   ========================================================= */
function boot() {
  load();
  $("#starCount").textContent = state.stars;
  $("#soundBtn").textContent = state.sound ? "🔊" : "🔇";

  $("#homeBtn").addEventListener("click", () => go("home"));
  $("#soundBtn").addEventListener("click", () => {
    state.sound = !state.sound;
    Audio.setSound(state.sound);
    save();
    $("#soundBtn").textContent = state.sound ? "🔊" : "🔇";
    if (state.sound) { Audio.sfx("pop"); say("Sound is on!"); }
    else say("Sound is off. Tap 🔊 to turn it back on.", 5000);
  });

  // if this browser can't talk, tell the grown-up (games still work silently)
  if (!Audio.hasSpeech()) {
    const w = document.createElement("div");
    w.className = "warn";
    w.textContent = "🔈 This browser can't read words out loud. The games still work — try Chrome, Edge or Safari to hear the words.";
    document.body.insertBefore(w, document.getElementById("screen"));
  }

  // unlock audio on the very first interaction (browser policy)
  const unlock = () => { Audio.unlock(); document.removeEventListener("pointerdown", unlock); };
  document.addEventListener("pointerdown", unlock);

  // keyboard: Esc = home, Space = repeat the current prompt
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") go("home");
  });

  go("home");
}

document.addEventListener("DOMContentLoaded", boot);
