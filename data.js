/* ===========================================================
   Reading Buddies — word & activity data
   Everything the games need lives here, so a parent or teacher
   can add words without touching the game logic.
   =========================================================== */

/* Digraph sounds. A digraph is two letters that make ONE sound. */
const DIGRAPHS = {
  sh: { sound: "shh",   tip: "s + h say /sh/ — like a quiet train",  color: 1 },
  ch: { sound: "chuh",  tip: "c + h say /ch/ — like a choo-choo",    color: 2 },
  th: { sound: "th",    tip: "t + h say /th/ — tongue between teeth", color: 3 },
  wh: { sound: "wuh",   tip: "w + h say /w/ — like a whistle blowing", color: 4 },
  ph: { sound: "fff",   tip: "p + h say /f/ — a sneaky /f/ sound",   color: 5 },
  ck: { sound: "k",     tip: "c + k say /k/ — at the END of a word",  color: 6 },
  ng: { sound: "ng",    tip: "n + g hum at the back of your mouth",   color: 7 },
  qu: { sound: "kwuh",  tip: "q + u always go together — /kw/",       color: 8 }
};

const DIGRAPH_WORDS = {
  sh: [
    { word: "ship",   emoji: "🚢" }, { word: "shoe",  emoji: "👟" },
    { word: "fish",   emoji: "🐟" }, { word: "shell", emoji: "🐚" },
    { word: "shark",  emoji: "🦈" }, { word: "shirt", emoji: "👕" },
    { word: "sheep",  emoji: "🐑" }, { word: "brush", emoji: "🖌️" },
    { word: "mushroom", emoji: "🍄" }
  ],
  ch: [
    { word: "chair",  emoji: "🪑" }, { word: "cheese", emoji: "🧀" },
    { word: "chick",  emoji: "🐤" }, { word: "cherry", emoji: "🍒" },
    { word: "lunch",  emoji: "🍱" }, { word: "beach",  emoji: "🏖️" },
    { word: "chocolate", emoji: "🍫" }, { word: "peach", emoji: "🍑" }
  ],
  th: [
    { word: "thumb",  emoji: "👍" }, { word: "three",  emoji: "3️⃣" },
    { word: "bath",   emoji: "🛁" }, { word: "tooth",  emoji: "🦷" },
    { word: "feather", emoji: "🪶" }, { word: "think", emoji: "🤔" },
    { word: "thunder", emoji: "⛈️" }, { word: "moth",  emoji: "🦋" }
  ],
  wh: [
    { word: "whale",  emoji: "🐳" }, { word: "wheel",  emoji: "🛞" },
    { word: "white",  emoji: "⚪" }, { word: "wheat",  emoji: "🌾" },
    { word: "whistle", emoji: "📣" }, { word: "whisk", emoji: "🥄" },
    { word: "whirlpool", emoji: "🌀" }
  ],
  ph: [
    { word: "phone",  emoji: "📱" }, { word: "photo",  emoji: "📷" },
    { word: "elephant", emoji: "🐘" }, { word: "dolphin", emoji: "🐬" },
    { word: "trophy", emoji: "🏆" }, { word: "alphabet", emoji: "🔤" }
  ],
  ck: [
    { word: "duck",   emoji: "🦆" }, { word: "sock",   emoji: "🧦" },
    { word: "rock",   emoji: "🪨" }, { word: "clock",  emoji: "🕐" },
    { word: "truck",  emoji: "🚚" }, { word: "snack",  emoji: "🍪" },
    { word: "cracker", emoji: "🍘" }, { word: "locket", emoji: "📿" }
  ],
  ng: [
    { word: "ring",   emoji: "💍" }, { word: "king",   emoji: "🤴" },
    { word: "sing",   emoji: "🎤" }, { word: "wing",   emoji: "🪽" },
    { word: "swing",  emoji: "🛝" }, { word: "song",   emoji: "🎵" },
    { word: "strong", emoji: "💪" }, { word: "spring", emoji: "🌸" }
  ],
  qu: [
    { word: "queen",  emoji: "👑" }, { word: "question", emoji: "❓" },
    { word: "quilt",  emoji: "🛏️" }, { word: "quack",  emoji: "🦆" },
    { word: "quick",  emoji: "⚡" }, { word: "quarter", emoji: "🪙" }
  ]
};

/* Sight words — words we learn "by heart" (Dolch lists, levelled). */
const SIGHT_WORDS = {
  1: ["a","and","away","big","blue","can","come","down","find","for",
      "funny","go","help","here","I","in","is","it","jump","little",
      "look","make","me","my","not","one","play","red","run","said",
      "see","the","three","to","two","up","we","where","yellow","you"],
  2: ["all","am","are","at","ate","be","black","brown","but","came",
      "did","do","eat","four","get","good","have","he","into","like",
      "must","new","no","now","on","our","out","please","pretty","ran",
      "ride","saw","say","she","so","soon","that","there","they","this",
      "too","under","want","was","well","went","what","white","who","will",
      "with","yes"],
  3: ["after","again","an","any","as","ask","by","could","every","fly",
      "from","give","going","had","has","her","him","his","how","just",
      "know","let","live","may","of","old","once","open","over","put",
      "round","some","stop","take","thank","them","then","think","walk",
      "were","when","always","around","because","before","best","both",
      "buy","call","cold","does","don't","fast","first","five","found",
      "gave","goes","green","its","made","many","off","or","pull","read",
      "right","sing","sit","sleep","tell","their","these","those","upon",
      "us","use","very","wash","which","why","wish","work","would","write",
      "your"]
};

/* Tap-and-read sentences: decodable words + sight words. */
const SENTENCES = [
  { emoji: "🐟", text: "The fish can swim." },
  { emoji: "🚢", text: "A big ship went up." },
  { emoji: "🧦", text: "She has a red sock." },
  { emoji: "👑", text: "The king has a ring." },
  { emoji: "🦆", text: "I like my little duck." },
  { emoji: "🐳", text: "Can you see the whale?" },
  { emoji: "🏖️", text: "They went to the beach." },
  { emoji: "🐤", text: "Look at the three chicks!" },
  { emoji: "🌙", text: "We can look up at the moon." },
  { emoji: "🍄", text: "That is a big mushroom." },
  { emoji: "🐘", text: "The elephant can run fast." },
  { emoji: "🧀", text: "Please give me some cheese." },
  { emoji: "👍", text: "Give me a thumbs up!" },
  { emoji: "⛈️", text: "The thunder is very loud." },
  { emoji: "🦈", text: "Do not go in with the shark!" }
];

/* Stickers handed out after a finished round. */
const STICKERS = [
  { emoji: "🦁", name: "Brave Lion" },   { emoji: "🐙", name: "Clever Octopus" },
  { emoji: "🐝", name: "Busy Bee" },     { emoji: "🦄", name: "Magic Unicorn" },
  { emoji: "🐼", name: "Panda Pal" },    { emoji: "🐸", name: "Jumping Frog" },
  { emoji: "🦖", name: "Dino Reader" },  { emoji: "🐢", name: "Steady Turtle" },
  { emoji: "🦋", name: "Bright Butterfly" }, { emoji: "🐬", name: "Happy Dolphin" },
  { emoji: "🚀", name: "Rocket Reader" }, { emoji: "🌟", name: "Super Star" }
];

const PRAISE = ["Yes!", "Wow!", "Great job!", "You got it!", "Amazing!", "Super!", "Nice reading!"];
const OOPS   = ["Try again!", "Almost! Listen again.", "Not quite — have another go.", "So close!"];
