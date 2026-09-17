# 🦉 Reading Buddies — digraphs & sight words

A small, super-interactive reading game for a beginning reader (roughly ages 4–7).
Every tap talks, every round ends in confetti and a sticker. Nothing to install —
it is plain HTML, CSS and JavaScript.

## How to run it

| What you want | Do this |
|---|---|
| On a phone/tablet/computer, served | open the preview URL from the app (served with `python3 -m http.server`) |
| Offline, one file, easy to email or copy to a USB stick | open **`reading-buddies-standalone.html`** — CSS and JS are inside that single file |
| Edit the words | open `data.js` — all words, pictures, sentences and stickers live there |

Sound is read out with the browser's built-in voice (Web Speech API). Chrome, Edge
and Safari all speak. If a browser has no voice, the app shows a small note and
everything still works silently.

## The six activities

1. **🔤 Digraph Safari** — two letters make one sound! The word is shown with its
   digraph missing (`🐟 fi__`). Hear the word, then tap the two letters that
   complete it. Covers **sh, ch, th, wh, ph, ck, ng, qu**.
2. **⭐ Sight Word Hunt** — hear a word, tap the matching written word. Distractors
   are deliberately *similar* (same first letter, same length), so the child has to
   really read, not guess.
3. **🧩 Word Builder** — hear a word, then tap the letter tiles in order to spell it.
   A wrong letter is gently rejected and tells them which letter is next.
4. **📖 Read With Me** — 15 little sentences. Tap any word to hear it, or press
   *Read it to me* and each word lights up as it is read (pointing practice).
5. **🃏 Flashcards** — explore all 8 digraph sounds (with example words) and all
   178 sight words. "✅ I know it!" collects words into the child's own word bank.
6. **🏅 Sticker Book** — stars, 12 collectible stickers, and the words they know
   by heart. Stickers are won by finishing a round.

**Difficulty** (Easy / Medium / Hard) changes the number of answer choices
(2 → 3 → 4) and which word list is used.

## Teaching notes for grown-ups

* **Do it together at first.** Let the child tap, you say the sound out loud with
  them. The app reads the word, but a person's voice does the teaching.
* **Digraphs first, then sight words.** Digraphs are decodable — the child can work
  them out. Sight words (`the`, `said`, `you`) *can't* be sounded out, so those are
  about memory; three short sessions beat one long one.
* **Wrong answers are cheap.** A wrong tap just fades out and the child tries again;
  they only lose the star for that word, never progress. Keep it light.
* **5 minutes is plenty.** Finish a round (8 words), admire the sticker, stop.
* **Make it physical:** after "🐟 fi__", ask them to write *sh* with a finger on the
  table, or find a *sh* word on a cereal box.

## Files

```
index.html                    the app (loads the files below)
styles.css                    all the look-and-feel
data.js                       words, pictures, sentences, stickers  <-- edit me
audio.js                      speech (text-to-speech) + sound effects
app.js                        the games
smoke-test.cjs                automated test that plays every game (46 checks)
reading-buddies-standalone.html   single-file offline version
```

## Run the tests

```bash
npm install jsdom
node smoke-test.cjs      # loads the app in a real DOM and plays all six games
```
