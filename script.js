// ---------- Screen switching ----------
const screens = {
  cake: document.getElementById("screen-cake"),
  game: document.getElementById("screen-game"),
  note: document.getElementById("screen-note"),
};

const cakeBtn = document.getElementById("cakeBtn");
const popBtn = document.getElementById("popBtn");
const toNoteBtn = document.getElementById("toNoteBtn");
const replayBtn = document.getElementById("replayBtn");

const photoWall = document.getElementById("photoWall");
const progressEl = document.getElementById("progress");

// ---------- Music (start on first tap anywhere) ----------
// ---------- Music (mobile-safe: touchstart + click) ----------
const bgm = document.getElementById("bgm");
const musicToggle = document.getElementById("musicToggle");

let musicWanted = true;
let musicStarted = false;

function updateMusicIcon() {
  if (!musicToggle) return;
  musicToggle.textContent = musicWanted ? "🔊" : "🔇";
}

function startMusicFromGesture() {
  if (!bgm || !musicWanted) return;

  bgm.volume = 0.35;

  const p = bgm.play();
  if (p && typeof p.then === "function") {
    p.then(() => { musicStarted = true; }).catch(() => {});
  } else {
    musicStarted = true;
  }
}

function firstInteractionHandler() {
  if (musicStarted) return;
  startMusicFromGesture();
  // махаме всички слушатели след опита
  document.removeEventListener("touchstart", firstInteractionHandler, true);
  document.removeEventListener("click", firstInteractionHandler, true);
  document.removeEventListener("keydown", firstInteractionKeyHandler, true);
}

function firstInteractionKeyHandler(e) {
  if (e.key === "Enter" || e.key === " ") firstInteractionHandler();
}

// ✅ ключът: iOS харесва touchstart, а click е fallback
document.addEventListener("touchstart", firstInteractionHandler, true); // capture=true
document.addEventListener("click", firstInteractionHandler, true);      // capture=true
document.addEventListener("keydown", firstInteractionKeyHandler, true);

musicToggle?.addEventListener("click", (e) => {
  e.stopPropagation();
  musicWanted = !musicWanted;
  updateMusicIcon();

  if (!bgm) return;

  if (!musicWanted) {
    bgm.pause();
  } else {
    startMusicFromGesture(); // toggle click е user gesture
  }
});

updateMusicIcon();


// Toggle button still works
musicToggle?.addEventListener("click", (e) => {
  e.stopPropagation(); // avoid double-trigger with global click
  musicWanted = !musicWanted;
  updateMusicIcon();

  if (!bgm) return;

  if (!musicWanted) {
    bgm.pause();
  } else {
    startMusicFromGesture();
  }
});

updateMusicIcon();

// Start music on FIRST tap/click anywhere (once)
function firstInteractionHandler() {
  if (musicStarted) return;
  startMusicFromGesture();
}

function firstInteractionKeyHandler(e) {
  if (e.key === "Enter" || e.key === " ") firstInteractionHandler();
}

document.addEventListener("pointerdown", firstInteractionHandler, { once: true });
document.addEventListener("keydown", firstInteractionKeyHandler, { once: true });

// ---------- Confetti ----------
function burstConfetti({ big = false } = {}) {
  if (typeof confetti !== "function") return;

  const count = big ? 180 : 90;
  confetti({
    particleCount: count,
    spread: big ? 95 : 70,
    origin: { y: 0.7 },
    scalar: big ? 1.0 : 0.9,
  });
}

// ---------- Helpers ----------
function showScreen(which) {
  Object.values(screens).forEach(s => s.classList.remove("is-active"));
  screens[which].classList.add("is-active");
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ---------- Mini game (photo pop) ----------
const photos = [
  "./img/2.jpg",
  "./img/1.jpg",
  "./img/3.jpg",
  "./img/4.jpg",
  "./img/5.jpg",
  "./img/6.jpg",
];

let photoIndex = 0;

function updateProgress() {
  progressEl.textContent = `${photoIndex} / ${photos.length}`;
}

function popPhoto() {
  if (photoIndex >= photos.length) return;

  const src = photos[photoIndex];

  const card = document.createElement("div");
  card.className = "photo";
  card.style.setProperty("--rot", `${(Math.random() * 10 - 5).toFixed(2)}deg`);

  const img = document.createElement("img");
  img.alt = "memory photo";
  img.src = src;

  card.appendChild(img);
  photoWall.appendChild(card);

  photoIndex++;
  updateProgress();

  burstConfetti({ big: false });

  if (photoIndex >= photos.length) {
    toNoteBtn.disabled = false;
    setTimeout(() => burstConfetti({ big: true }), 250);
    progressEl.textContent = `всички събрани◝(ᵔᗜᵔ)◜! ${photoIndex} / ${photos.length}`;
  }
}

function resetGame() {
  photoIndex = 0;
  photoWall.innerHTML = "";
  toNoteBtn.disabled = true;
  updateProgress();
}

// ---------- Note: typewriter + tap-to-continue ----------
const noteCard = document.getElementById("noteCard");
const noteText = document.getElementById("noteText");
const noteHint = document.getElementById("noteHint");

// EDIT THIS (each inner array = one “tap page”)
const notePages = [
  [
    "⋆｡‧˚ʚ ୨ৎ ɞ˚‧｡⋆Честит рожден ден, сестричке!⋆｡‧˚ʚ ୨ৎ ɞ˚‧｡⋆",
    "Ти си човекът, който превръща обикновените дни в истории,  ✧˖°.",
    "тихите моменти – в смях,",
    "а трудните – в „ще мине, аз съм тук ⋆✴︎˚｡⋆“."
  ],
  [
    "Пожелавам ти живот, който да те глези:",
    "мечти, които не се страхуват да растат જ⁀➴",
    "усмивки, които идват без повод,",
    "и любов, която винаги намира пътя ти. (˶ᵔ ᵕ ᵔ˶)"
  ],
  [
    "Бъди все така смела, истинска и малко магична –",
    "светът има нужда точно от твоята светлина",
    "- Обичам те и съм безкрайно щастлив, че си ми сестра ⸜(｡˃ ᵕ ˂ )⸝♡",
    "Честит рожден ден! 🎂✨",
    "— от Мони",
  ],
];

let pageIndex = 0;
let isTyping = false;

async function typeParagraph(text, pEl) {
  for (let i = 0; i < text.length; i++) {
    pEl.textContent += text[i];
    await sleep(18);
  }
}

async function renderPage(idx) {
  if (!noteText) return;

  isTyping = true;
  noteText.innerHTML = "";
  if (noteHint) noteHint.style.opacity = "0";

  for (const line of notePages[idx]) {
    const p = document.createElement("p");
    p.textContent = "";
    noteText.appendChild(p);
    await typeParagraph(line, p);
    await sleep(160);
  }

  isTyping = false;
  if (noteHint) noteHint.style.opacity = "";
}

async function nextNotePage() {
  if (isTyping) return;

  pageIndex++;
  if (pageIndex >= notePages.length) {
    burstConfetti({ big: true });
    pageIndex = notePages.length - 1;
    return;
  }

  burstConfetti({ big: false });
  await renderPage(pageIndex);
}

noteCard?.addEventListener("click", nextNotePage);
noteCard?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") nextNotePage();
});

// ---------- Navigation ----------
updateProgress();

cakeBtn.addEventListener("click", () => {
  burstConfetti({ big: true });
  showScreen("game");
});

popBtn.addEventListener("click", popPhoto);

toNoteBtn.addEventListener("click", async () => {
  burstConfetti({ big: true });
  showScreen("note");
  pageIndex = 0;
  await renderPage(pageIndex);
});

replayBtn.addEventListener("click", () => {
  resetGame();
  showScreen("cake");
});
