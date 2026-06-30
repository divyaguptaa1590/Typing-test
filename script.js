const WORD_POOLS = {
  easy: [
    "the quick brown fox jumps over the lazy dog",
    "she sells sea shells by the sea shore",
    "a stitch in time saves nine and all is well",
    "to be or not to be that is the question",
    "all that glitters is not gold in this world",
    "the sun rises in the east and sets in the west",
    "birds of a feather flock together always",
    "actions speak louder than words every time",
    "every cloud has a silver lining we believe",
    "practice makes perfect and never give up",
    "look before you leap into the unknown world",
    "you reap what you sow in this great life",
    "good things come to those who wait patiently",
    "the early bird catches the worm each morning",
    "where there is a will there is always a way",
    "life is what you make it so make it great",
    "keep calm and carry on through the day ahead",
    "hard work pays off in the end every single time",
    "dream big and work hard to reach your goals",
    "stay positive and keep moving forward always",
  ],
  medium: [
    "programming is the art of telling another human what one wants the computer to do in precise steps",
    "the function of good software is to make the complex appear to be simple to all who use it",
    "first solve the problem then write the code in a clear and concise and readable way for others",
    "clean code always looks like it was written by someone who cared deeply about the craft",
    "the best error message is the one that never shows up because you prevented the bug entirely",
    "simplicity is the soul of efficiency and every great programmer knows this truth from day one",
    "any fool can write code that a computer can understand but only good programmers write code humans can read",
    "code is like humor and when you have to explain it then it is not very good at all",
    "before software can be reusable it first has to be usable and that takes careful design thinking",
    "the most important property of a program is whether it accomplishes the intention of its user correctly",
    "software is a great combination between artistry and engineering and both must be balanced carefully",
    "debugging is twice as hard as writing the code in the first place so write it clearly",
    "the cheapest fastest and most reliable components are those that aren't there in the first place",
    "measuring programming progress by lines of code is like measuring aircraft building progress by weight alone",
    "there are only two hard things in computer science cache invalidation and naming things properly",
  ],
  hard: [
    "asynchronous programming paradigms fundamentally alter the execution context by decoupling operations from synchronous call stacks enabling concurrent workflows without blocking the main execution thread unnecessarily",
    "polymorphism encapsulation inheritance and abstraction collectively constitute the foundational pillars upon which object oriented programming architectures are systematically constructed and maintained over time",
    "the implementation of sophisticated recursive algorithms necessitates meticulous consideration of base cases termination conditions and stack depth limitations to circumvent catastrophic stack overflow exceptions",
    "cryptographic hash functions exhibit collision resistance preimage resistance and second preimage resistance properties that are fundamentally essential for maintaining data integrity in distributed systems",
    "distributed consensus algorithms such as raft and paxos solve the fundamental problem of achieving agreement among unreliable network nodes despite arbitrary message delays and node failures",
    "memoization transforms exponential time complexity algorithms into polynomial time solutions by systematically caching previously computed subproblem results and retrieving them upon subsequent identical computations",
    "the theoretical underpinnings of quantum computing leverage superposition and entanglement phenomena to perform probabilistic computations across multiple states simultaneously transcending classical binary limitations significantly",
    "microservices architectural patterns decompose monolithic applications into independently deployable loosely coupled services communicating through well defined application programming interfaces and message queues efficiently",
    "the computational complexity of nondeterministic polynomial time problems remains one of the most profound unsolved questions in theoretical computer science with significant implications for cryptography and security",
    "gradient descent optimization algorithms iteratively adjust model parameters in the direction of steepest descent of the loss function surface to minimize prediction errors during neural network training",
  ],
};

const RANKS = [
  { min: 0,   label: "Beginner 🐢",     color: "#94A3B8" },
  { min: 20,  label: "Learner 📚",      color: "#60A5FA" },
  { min: 35,  label: "Improving ⚡",    color: "#34D399" },
  { min: 50,  label: "Competent 💪",    color: "#FBBF24" },
  { min: 65,  label: "Fast Typist 🚀",  color: "#A78BFA" },
  { min: 80,  label: "Pro Typist 🔥",   color: "#F97316" },
  { min: 100, label: "Speed Demon 👾",  color: "#7C83FF" },
  { min: 130, label: "Keyboard God ⚡", color: "#EC4899" },
];

const $ = id => document.getElementById(id);

let selectedDuration = 30;
let selectedDiff = "easy";
let timer = null;
let timeLeft = 30;
let totalTime = 30;
let started = false;
let finished = false;
let currentText = "";
let currentIndex = 0;
let correctChars = 0;
let wrongChars = 0;
let totalKeystrokes = 0;
let startTime = null;

const pages = {
  home:   $("homePage"),
  test:   $("testPage"),
  result: $("resultPage"),
};

function showPage(name) {
  Object.values(pages).forEach(p => p.classList.add("hidden"));
  pages[name].classList.remove("hidden");
}

function loadBestScores() {
  const best = JSON.parse(localStorage.getItem("typerush_best") || "{}");
  $("hsWpm").textContent   = best.wpm   || "--";
  $("hsAcc").textContent   = best.acc   ? best.acc + "%" : "--";
  $("hsTests").textContent = best.tests || "0";
}

function loadProfile() {
  const history = JSON.parse(localStorage.getItem("typerush_history") || "[]");
  const list = $("historyList");

  if (!history.length) {
    list.innerHTML = '<li class="history-empty">No tests yet. Finish one to start tracking your progress.</li>';
    renderImprovement(history);
    return;
  }

  list.innerHTML = history.slice(0, 5).map(item => `
    <li class="history-item">
      <span>${item.diff ? item.diff.charAt(0).toUpperCase() + item.diff.slice(1) : "Test"} · ${item.wpm} WPM</span>
      <span class="history-meta">${item.acc}% · ${item.date}</span>
    </li>
  `).join("");

  renderImprovement(history);
}

function renderImprovement(history) {
  const box = $("improvementBox");
  const badge = $("improvementBadge");
  const text = $("improvementText");
  const deltaEl = $("improvementDelta");
  const labelEl = $("improvementLabel");

  if (history.length < 2) {
    box.classList.remove("warning", "neutral");
    badge.textContent = "Start practicing";
    text.textContent = "Complete a few tests to see whether your speed is improving.";
    deltaEl.textContent = "0 WPM";
    labelEl.textContent = "No trend yet";
    return;
  }

  const latest = history[0];
  const previous = history[1];
  const wpmDelta = latest.wpm - previous.wpm;
  const accDelta = latest.acc - previous.acc;
  const improved = wpmDelta > 0 || accDelta > 0;

  box.classList.remove("warning", "neutral");
  if (!improved) box.classList.add("warning");

  badge.textContent = improved ? "Improved" : "Needs practice";
  text.textContent = improved
    ? `Nice work! You are ${Math.abs(wpmDelta)} WPM stronger and ${Math.abs(accDelta)}% more accurate than your last run.`
    : `Your last run was ${Math.abs(wpmDelta)} WPM lower than your previous one. Keep practicing!`;
  deltaEl.textContent = `${wpmDelta >= 0 ? "+" : ""}${wpmDelta} WPM`;
  labelEl.textContent = `Accuracy ${accDelta >= 0 ? "+" : ""}${accDelta}%`;
}

function saveBestScore(wpm, acc) {
  const best  = JSON.parse(localStorage.getItem("typerush_best") || "{}");
  best.wpm    = Math.max(wpm, best.wpm || 0);
  best.acc    = best.acc === undefined || acc > best.acc ? acc : best.acc;
  best.tests  = (best.tests || 0) + 1;
  localStorage.setItem("typerush_best", JSON.stringify(best));
}

function saveAttemptToHistory(wpm, acc) {
  const history = JSON.parse(localStorage.getItem("typerush_history") || "[]");
  history.unshift({
    wpm,
    acc,
    date: new Date().toLocaleDateString(),
    diff: selectedDiff,
  });
  localStorage.setItem("typerush_history", JSON.stringify(history.slice(0, 6)));
}

document.querySelectorAll("#durationGroup .pill").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#durationGroup .pill").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedDuration = parseInt(btn.dataset.val);
  });
});

document.querySelectorAll("#diffGroup .pill").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#diffGroup .pill").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedDiff = btn.dataset.val;
  });
});

$("startBtn").addEventListener("click", () => { initTest(); showPage("test"); });
$("backBtn").addEventListener("click", () => { clearInterval(timer); showPage("home"); loadBestScores(); loadProfile(); });
$("restartBtn").addEventListener("click", () => { clearInterval(timer); initTest(); });
$("tryAgainBtn").addEventListener("click", () => { clearInterval(timer); initTest(); showPage("test"); });
$("homeBtn").addEventListener("click", () => { showPage("home"); loadBestScores(); loadProfile(); });

function getRandomText(diff) {
  const pool = WORD_POOLS[diff];
  return pool[Math.floor(Math.random() * pool.length)];
}

function buildTextDisplay(text) {
  const display = $("textDisplay");
  display.innerHTML = "";
  text.split("").forEach((char, i) => {
    const span = document.createElement("span");
    span.classList.add("char");
    span.dataset.index = i;
    span.textContent = char;
    if (i === 0) span.classList.add("current");
    display.appendChild(span);
  });
}

function initTest() {
  clearInterval(timer);
  started = false; finished = false;
  currentIndex = 0; correctChars = 0; wrongChars = 0;
  totalKeystrokes = 0; startTime = null;
  timeLeft = selectedDuration; totalTime = selectedDuration;

  currentText = getRandomText(selectedDiff);
  buildTextDisplay(currentText);

  $("typeInput").value = "";
  $("typeInput").disabled = false;
  $("liveTimer").textContent = timeLeft;
  $("liveWpm").textContent = "0";
  $("liveAcc").textContent = "100";
  $("liveChars").textContent = "0";
  $("progressFill").style.width = "0%";
  $("diffBadge").textContent = selectedDiff.charAt(0).toUpperCase() + selectedDiff.slice(1);

  setTimeout(() => $("typeInput").focus(), 50);
}

$("typeInput").addEventListener("input", function() {
  if (finished) return;
  const typed = $("typeInput").value;

  if (!started && typed.length > 0) {
    started = true;
    startTime = Date.now();
    startTimer();
  }

  totalKeystrokes++;

  const spans = $("textDisplay").querySelectorAll(".char");
  spans.forEach(s => s.classList.remove("correct", "wrong", "current"));

  let correct = 0, wrong = 0;
  for (let i = 0; i < typed.length; i++) {
    if (i >= currentText.length) break;
    if (typed[i] === currentText[i]) { spans[i].classList.add("correct"); correct++; }
    else { spans[i].classList.add("wrong"); wrong++; }
  }

  correctChars = correct;
  wrongChars = wrong;

  if (typed.length < currentText.length) spans[typed.length].classList.add("current");

  updateLiveStats();

  if (typed.length >= currentText.length) {
    currentText = getRandomText(selectedDiff);
    $("typeInput").value = "";
    buildTextDisplay(currentText);
    totalKeystrokes += typed.length;
  }
});

function startTimer() {
  timer = setInterval(() => {
    timeLeft--;
    $("liveTimer").textContent = timeLeft;
    $("progressFill").style.width = ((totalTime - timeLeft) / totalTime * 100) + "%";
    if (timeLeft <= 0) { clearInterval(timer); endTest(); }
  }, 1000);
}

function updateLiveStats() {
  const elapsed = started ? (Date.now() - startTime) / 60000 : 0;
  const wpm = elapsed > 0 ? Math.round((correctChars / 5) / elapsed) : 0;
  const total = correctChars + wrongChars;
  const acc = total > 0 ? Math.round((correctChars / total) * 100) : 100;
  $("liveWpm").textContent = wpm;
  $("liveAcc").textContent = acc;
  $("liveChars").textContent = correctChars + wrongChars;
}

function endTest() {
  finished = true;
  $("typeInput").disabled = true;

  const elapsed = started ? (Date.now() - startTime) / 60000 : 0;
  const wpm = elapsed > 0 ? Math.round((correctChars / 5) / elapsed) : 0;
  const total = correctChars + wrongChars;
  const acc = total > 0 ? Math.round((correctChars / total) * 100) : 100;
  const rawWpm = elapsed > 0 ? Math.round(((correctChars + wrongChars) / 5) / elapsed) : 0;
  const timeTaken = totalTime - timeLeft;
  const correctWords = Math.floor(correctChars / 5);
  const wrongWords = Math.floor(wrongChars / 5);

  saveBestScore(wpm, acc);
  saveAttemptToHistory(wpm, acc);
  loadBestScores();
  loadProfile();
  showResult({ wpm, acc, correctWords, wrongWords, totalKeystrokes, timeTaken, rawWpm });
  showPage("result");
}

function showResult({ wpm, acc, correctWords, wrongWords, totalKeystrokes, timeTaken, rawWpm }) {
  const rank = getRank(wpm);
  $("rankEmoji").textContent = rank.label.split(" ").slice(-1)[0];
  $("rankLabel").textContent = rank.label.split(" ").slice(0, -1).join(" ");
  $("rankBadge").style.borderColor = rank.color + "44";
  $("rankBadge").style.background  = rank.color + "15";
  $("rankLabel").style.color = rank.color;

  animateNumber($("resultWpm"), 0, wpm, 1200);

  const circumference = 2 * Math.PI * 52;
  const offset = circumference - Math.min(wpm / 150, 1) * circumference;

  const svg = $("resultWpm").closest(".result-wpm-ring").querySelector(".ring-svg");
  if (!svg.querySelector("defs")) {
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const grad = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    grad.setAttribute("id", "ringGrad");
    grad.setAttribute("x1", "0%"); grad.setAttribute("y1", "0%");
    grad.setAttribute("x2", "100%"); grad.setAttribute("y2", "0%");
    const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop1.setAttribute("offset", "0%"); stop1.setAttribute("stop-color", "#7C83FF");
    const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop2.setAttribute("offset", "100%"); stop2.setAttribute("stop-color", "#A78BFA");
    grad.appendChild(stop1); grad.appendChild(stop2);
    defs.appendChild(grad); svg.insertBefore(defs, svg.firstChild);
  }

  setTimeout(() => { $("ringFg").style.strokeDashoffset = offset; }, 100);

  $("resultAcc").textContent        = acc + "%";
  $("resultCorrect").textContent    = correctWords;
  $("resultWrong").textContent      = wrongWords;
  $("resultKeystrokes").textContent = totalKeystrokes;
  $("resultTime").textContent       = timeTaken + "s";
  $("resultRaw").textContent        = rawWpm;
}

function animateNumber(el, from, to, duration) {
  const start = performance.now();
  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(from + (to - from) * eased);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function getRank(wpm) {
  let rank = RANKS[0];
  for (const r of RANKS) { if (wpm >= r.min) rank = r; }
  return rank;
}

loadBestScores();
loadProfile();
showPage("home");