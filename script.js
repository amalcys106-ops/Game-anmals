// لعبة تفاعلية بسيطة للحيوانات - مناسب لطفولة المبكرة
// النمط: اضغط على بطاقة الحيوان لعرض اسمه ونطقه.
// الزغار: استخدمت SpeechSynthesis بدلاً من ملف صوت لتسهيل التشغيل بدون أصول.

const animals = [
  { emoji: "🐶", nameAr: "كلب", nameEn: "Dog", color: "#FFEDD5" },
  { emoji: "🐱", nameAr: "قط", nameEn: "Cat", color: "#FFE4F0" },
  { emoji: "🐭", nameAr: "فأر", nameEn: "Mouse", color: "#E6FFFA" },
  { emoji: "🐷", nameAr: "خنزير", nameEn: "Pig", color: "#FFF1F2" },
  { emoji: "🐮", nameAr: "بقرة", nameEn: "Cow", color: "#FEF3C7" },
  { emoji: "🐵", nameAr: "قرد", nameEn: "Monkey", color: "#F0F9FF" },
  { emoji: "🐤", nameAr: "عصفور", nameEn: "Bird", color: "#ECFCCB" },
  { emoji: "🐸", nameAr: "ضفدع", nameEn: "Frog", color: "#E0F2FE" }
];

const board = document.getElementById("board");
const langToggle = document.getElementById("langToggle");
const shuffleBtn = document.getElementById("shuffleBtn");
const quizBtn = document.getElementById("quizBtn");

let quizActive = false;
let currentQuizIndex = null;

// Helper: Speak a given text with chosen language (ar or en)
function speak(text, lang = "ar") {
  if (!("speechSynthesis" in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang === "ar" ? "ar-SA" : "en-US";
  // try to pick a relatively clear voice
  const voices = window.speechSynthesis.getVoices();
  if (voices.length) {
    const match = voices.find(v => v.lang.startsWith(utter.lang)) || voices[0];
    utter.voice = match;
  }
  utter.rate = 0.95;
  utter.pitch = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

// Create a card element
function createCard(animal, index) {
  const card = document.createElement("button");
  card.className = "card";
  card.style.background = animal.color;
  card.setAttribute("aria-label", `${animal.nameAr} ${animal.nameEn}`);
  card.setAttribute("data-index", index);
  card.setAttribute("tabindex", "0");

  const emoji = document.createElement("div");
  emoji.className = "emoji";
  emoji.textContent = animal.emoji;

  const name = document.createElement("div");
  name.className = "name";
  name.textContent = ""; // initially hidden

  card.appendChild(emoji);
  card.appendChild(name);

  // Interaction
  card.addEventListener("click", () => onCardClick(card, animal, name, index));
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      card.click();
    }
  });

  return card;
}

function revealName(nameEl, animal, lang) {
  const text = lang === "ar" ? animal.nameAr : animal.nameEn;
  nameEl.textContent = text;
  // show with animation
  nameEl.classList.add("visible", "pop");
  setTimeout(() => nameEl.classList.remove("pop"), 380);
}

function hideName(nameEl) {
  nameEl.classList.remove("visible");
  setTimeout(() => { nameEl.textContent = ""; }, 220);
}

function onCardClick(card, animal, nameEl, index){
  const lang = langToggle.checked ? "en" : "ar";
  // If quiz is active, check answer
  if (quizActive) {
    handleQuizAnswer(index, animal);
    return;
  }

  // Normal reveal
  revealName(nameEl, animal, lang);
  // small playful sound via oscillator (no files)
  playPing();
  // speak the name
  speak(lang === "ar" ? animal.nameAr : animal.nameEn, lang);
  // small card pop
  card.classList.add("pop");
  setTimeout(() => card.classList.remove("pop"), 360);
  // hide name after delay (helps little kids practice)
  setTimeout(() => hideName(nameEl), 2600);
}

// tiny ping using WebAudio
function playPing(){
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.value = 0.05;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
    setTimeout(()=>{ o.stop(); ctx.close(); }, 300);
  } catch (e) { /* ignore if not supported */ }
}

// Render board
function renderBoard(list = animals) {
  board.innerHTML = "";
  list.forEach((a, i) => board.appendChild(createCard(a, i)));
}

// Shuffle utility
function shuffleArray(arr){
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Controls
shuffleBtn.addEventListener("click", () => {
  const copy = animals.slice();
  shuffleArray(copy);
  renderBoard(copy);
});

// Simple quiz: speak an animal name and ask the child to press the right card
quizBtn.addEventListener("click", () => {
  if (!quizActive) startQuiz();
  else stopQuiz();
});

function startQuiz(){
  quizActive = true;
  quizBtn.textContent = "إيقاف الاختبار";
  // choose random animal
  currentQuizIndex = Math.floor(Math.random() * animals.length);
  const lang = langToggle.checked ? "en" : "ar";
  const promptText = lang === "ar" ? `أين ${animals[currentQuizIndex].nameAr}؟` : `Where is the ${animals[currentQuizIndex].nameEn}?`;
  // speak name only (clear and friendly)
  speak(lang === "ar" ? animals[currentQuizIndex].nameAr : animals[currentQuizIndex].nameEn, lang);
  // add hint in board aria
  board.setAttribute("aria-label", promptText);
}

function stopQuiz() {
  quizActive = false;
  currentQuizIndex = null;
  quizBtn.textContent = "اختبار بسيط";
  board.removeAttribute("aria-label");
}

function handleQuizAnswer(clickedIndex, animal){
  const lang = langToggle.checked ? "en" : "ar";
  if (clickedIndex === currentQuizIndex) {
    // correct
    const msg = lang === "ar" ? "إجابة صحيحة! أحسنت!" : "Great! That's correct!";
    speak(msg, lang);
    celebrateCorrect(clickedIndex);
    // end quiz after short celebration
    setTimeout(stopQuiz, 1400);
  } else {
    // wrong - gentle encouragement
    const msg = lang === "ar" ? "حاول مرة أخرى" : "Try again";
    speak(msg, lang);
    // small shake effect on the clicked card
    const card = board.querySelector(`.card[data-index="${clickedIndex}"]`);
    if (card) {
      card.animate([
        { transform: 'translateX(0)' },
        { transform: 'translateX(-8px)' },
        { transform: 'translateX(8px)' },
        { transform: 'translateX(0)' }
      ], { duration: 420 });
    }
  }
}

function celebrateCorrect(index){
  // highlight the correct card briefly and show the name
  const card = board.querySelector(`.card[data-index="${index}"]`);
  if (!card) return;
  const nameEl = card.querySelector(".name");
  revealName(nameEl, animals[index], langToggle.checked ? "en" : "ar");
  card.animate([
    { transform: 'scale(1)' },
    { transform: 'scale(1.08)' },
    { transform: 'scale(1)' }
  ], { duration: 700, easing: 'ease-out' });
  // playful ascending tones
  playMelody([660, 880, 1100], 130);
}

// sequence tones
function playMelody(freqs, stepMs){
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    let t = ctx.currentTime;
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = f;
      g.gain.value = 0.05;
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t + i * (stepMs / 1000));
      o.stop(t + (i+1) * (stepMs / 1000));
    });
    setTimeout(()=>ctx.close(), freqs.length * stepMs + 50);
  } catch(e){}
}

// Initialization
renderBoard(animals);

// Make voices available in some browsers after they load
if (typeof speechSynthesis !== "undefined") {
  speechSynthesis.onvoiceschanged = () => { /* no-op to populate voices */ };
}

// Accessibility tip: if user toggles language while in quiz, give brief hint
langToggle.addEventListener("change", () => {
  if (quizActive && currentQuizIndex !== null) {
    const lang = langToggle.checked ? "en" : "ar";
    speak(lang === "ar" ? animals[currentQuizIndex].nameAr : animals[currentQuizIndex].nameEn, lang);
  } else {
    const lang = langToggle.checked ? "en" : "ar";
    speak(lang === "ar" ? "العربية" : "English", lang);
  }
});