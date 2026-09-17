/* ===========================================================
   Reading Buddies — audio engine
   • speak()  : text-to-speech (Web Speech API) for reading words aloud
   • sfx()    : tiny synthesised sound effects (WebAudio) — no files needed
   Everything fails soft: if a browser has no voice, the app still works.
   =========================================================== */

const Audio = (() => {
  let ctx = null;
  let soundOn = true;
  let voice = null;
  let voicesReady = false;

  function pickVoice() {
    if (!("speechSynthesis" in window)) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    if (!voices.length) return null;
    const prefer = [
      /Samantha/i, /Google US English/i, /Microsoft (Aria|Jenny|Zira)/i,
      /Karen/i, /Moira/i, /Tessa/i, /Google UK English Female/i
    ];
    for (const rx of prefer) {
      const v = voices.find(v => rx.test(v.name) && /^en/i.test(v.lang));
      if (v) return v;
    }
    return voices.find(v => /^en[-_]/i.test(v.lang)) || voices.find(v => /^en/i.test(v.lang)) || voices[0];
  }

  function initVoices() {
    if (!("speechSynthesis" in window)) return;
    voice = pickVoice();
    voicesReady = !!voice;
    // Voices often arrive asynchronously.
    window.speechSynthesis.onvoiceschanged = () => { voice = pickVoice(); voicesReady = !!voice; };
  }
  initVoices();

  function unlock() {
    try {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) ctx = new AC();
      }
      if (ctx && ctx.state === "suspended") ctx.resume();
    } catch (e) { /* audio is a bonus, never a blocker */ }
  }

  /* ---------- speech ---------- */
  function speak(text, opts = {}) {
    if (!soundOn) return Promise.resolve();
    if (!("speechSynthesis" in window) || !text) return Promise.resolve();
    return new Promise(resolve => {
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(String(text));
        if (!voice) voice = pickVoice();
        if (voice) u.voice = voice;
        u.lang = (voice && voice.lang) || "en-US";
        u.rate = opts.rate != null ? opts.rate : 0.82;
        u.pitch = opts.pitch != null ? opts.pitch : 1.15;
        u.volume = 1;
        let done = false;
        const finish = () => { if (!done) { done = true; resolve(); } };
        u.onend = finish;
        u.onerror = finish;
        window.speechSynthesis.speak(u);
        // Safety net: some browsers drop onend.
        setTimeout(finish, Math.max(1200, String(text).length * 180));
      } catch (e) { resolve(); }
    });
  }

  function stopSpeaking() {
    try { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); } catch (e) {}
  }

  /* ---------- sound effects ---------- */
  function tone(freq, start, dur, type = "sine", gain = 0.16) {
    if (!soundOn) return;
    unlock();
    if (!ctx) return;
    const t0 = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  function sfx(name) {
    if (!soundOn) return;
    switch (name) {
      case "tap":    tone(660, 0, 0.08, "triangle", 0.10); break;
      case "pop":    tone(880, 0, 0.09, "sine", 0.12); tone(1320, 0.05, 0.09, "sine", 0.09); break;
      case "correct":tone(659, 0, 0.12); tone(880, 0.10, 0.14); tone(1175, 0.22, 0.20); break;
      case "wrong":  tone(220, 0, 0.16, "sawtooth", 0.09); tone(165, 0.14, 0.22, "sawtooth", 0.08); break;
      case "star":   [1046, 1318, 1568, 2093].forEach((f, i) => tone(f, i * 0.08, 0.18, "triangle", 0.11)); break;
      case "cheer":  [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, i * 0.07, 0.22, "sine", 0.12)); break;
      case "whoosh": tone(600, 0, 0.22, "sine", 0.07); break;
    }
  }

  function setSound(on) {
    soundOn = !!on;
    if (!soundOn) stopSpeaking();
    else unlock();
  }
  const isOn = () => soundOn;
  const hasSpeech = () => "speechSynthesis" in window;

  return { speak, stopSpeaking, sfx, setSound, isOn, hasSpeech, unlock, initVoices };
})();
