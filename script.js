// ==============================
//  TIC TAC TOE — CYBERPUNK EDITION
//  Game Logic + Sound Engine
// ==============================

// ---- STATE ----
let playerNames = { X: 'PLAYER X', O: 'PLAYER O' };
let board = Array(9).fill(null);
let currentPlayer = 'X';
let gameActive = false;
let scores = { X: 0, O: 0, draws: 0 };

// Win combinations: [index, index, index] and SVG line coords [x1,y1,x2,y2]
const WIN_COMBOS = [
  { cells: [0, 1, 2], line: [50, 47, 250, 47] },    // top row
  { cells: [3, 4, 5], line: [50, 150, 250, 150] },   // mid row
  { cells: [6, 7, 8], line: [50, 253, 250, 253] },   // bot row
  { cells: [0, 3, 6], line: [47, 50, 47, 250] },     // left col
  { cells: [1, 4, 7], line: [150, 50, 150, 250] },   // mid col
  { cells: [2, 5, 8], line: [253, 50, 253, 250] },   // right col
  { cells: [0, 4, 8], line: [47, 47, 253, 253] },    // diag \
  { cells: [2, 4, 6], line: [253, 47, 47, 253] },    // diag /
];

// ==============================
//  AUDIO ENGINE (Web Audio API)
// ==============================
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(frequency, type, duration, gain = 0.3, delay = 0) {
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay);

  gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
  gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + delay + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
}

function soundClick(player) {
  if (player === 'X') {
    playTone(520, 'square', 0.12, 0.25);
    playTone(660, 'square', 0.08, 0.12, 0.08);
  } else {
    playTone(330, 'sine', 0.12, 0.25);
    playTone(440, 'sine', 0.1, 0.15, 0.07);
  }
}

function soundWin() {
  const melody = [523, 659, 784, 1047];
  melody.forEach((freq, i) => {
    playTone(freq, 'sine', 0.3, 0.35, i * 0.12);
  });
  // Add a cymbal-like noise
  setTimeout(() => {
    playTone(800, 'sawtooth', 0.2, 0.1);
  }, 400);
}

function soundDraw() {
  playTone(300, 'triangle', 0.2, 0.2);
  playTone(250, 'triangle', 0.25, 0.18, 0.15);
}

// ==============================
//  SETUP
// ==============================
function startGame() {
  const nameX = document.getElementById('player1-name').value.trim().toUpperCase() || 'PLAYER X';
  const nameO = document.getElementById('player2-name').value.trim().toUpperCase() || 'PLAYER O';

  playerNames.X = nameX.substring(0, 12);
  playerNames.O = nameO.substring(0, 12);

  document.getElementById('display-name-x').textContent = playerNames.X;
  document.getElementById('display-name-o').textContent = playerNames.O;

  document.getElementById('setup-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');

  scores = { X: 0, O: 0, draws: 0 };
  updateScores();
  resetGame();
}

// ==============================
//  GAME LOGIC
// ==============================
function resetGame() {
  board = Array(9).fill(null);
  currentPlayer = 'X';
  gameActive = true;

  // Clear cells
  document.querySelectorAll('.cell').forEach(cell => {
    cell.textContent = '';
    cell.className = 'cell';
  });

  // Clear win line
  const line = document.getElementById('win-line');
  line.setAttribute('x1', 0);
  line.setAttribute('y1', 0);
  line.setAttribute('x2', 0);
  line.setAttribute('y2', 0);
  line.className = 'win-line-path';
  line.style.strokeDashoffset = '500';

  updateTurnUI();
}

function newGame() {
  document.getElementById('result-modal').classList.add('hidden');
  document.getElementById('game-screen').classList.add('hidden');
  document.getElementById('setup-screen').classList.remove('hidden');
  scores = { X: 0, O: 0, draws: 0 };
  gameActive = false;
}

function makeMove(index) {
  if (!gameActive || board[index]) return;

  board[index] = currentPlayer;

  const cell = document.getElementById(`cell-${index}`);
  cell.textContent = currentPlayer;
  cell.classList.add('taken', `${currentPlayer.toLowerCase()}-cell`);

  soundClick(currentPlayer);

  const result = checkResult();

  if (result === 'win') {
    handleWin();
  } else if (result === 'draw') {
    handleDraw();
  } else {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateTurnUI();
  }
}

function checkResult() {
  for (const combo of WIN_COMBOS) {
    const [a, b, c] = combo.cells;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return 'win';
    }
  }
  if (board.every(cell => cell !== null)) return 'draw';
  return null;
}

function getWinCombo() {
  for (const combo of WIN_COMBOS) {
    const [a, b, c] = combo.cells;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return combo;
    }
  }
  return null;
}

function handleWin() {
  gameActive = false;
  const combo = getWinCombo();

  // Highlight winning cells
  setTimeout(() => {
    combo.cells.forEach(i => {
      document.getElementById(`cell-${i}`).classList.add('winning-cell');
    });
    drawWinLine(combo);
  }, 100);

  scores[currentPlayer]++;
  updateScores();

  soundWin();

  setTimeout(() => {
    showModal('win', currentPlayer);
  }, 700);
}

function handleDraw() {
  gameActive = false;
  scores.draws++;
  updateScores();
  soundDraw();

  setTimeout(() => {
    showModal('draw', null);
  }, 400);
}

function nextRound() {
  document.getElementById('result-modal').classList.add('hidden');
  resetGame();
}

// ==============================
//  WIN LINE ANIMATION
// ==============================
function drawWinLine(combo) {
  const line = document.getElementById('win-line');
  const [x1, y1, x2, y2] = combo.line;

  line.setAttribute('x1', x1);
  line.setAttribute('y1', y1);
  line.setAttribute('x2', x2);
  line.setAttribute('y2', y2);

  const className = currentPlayer === 'X' ? 'win-line-path win-line-x' : 'win-line-path win-line-o';
  line.className = className;

  // Calculate length for dash animation
  const length = Math.hypot(x2 - x1, y2 - y1);
  line.style.strokeDasharray = length;
  line.style.strokeDashoffset = length;

  // Trigger animation
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      line.style.strokeDashoffset = 0;
    });
  });
}

// ==============================
//  UI UPDATES
// ==============================
function updateTurnUI() {
  const name = playerNames[currentPlayer];
  const symbol = currentPlayer === 'X' ? '⚡' : '🔮';
  const neonClass = currentPlayer === 'X' ? 'neon-x' : 'neon-o';

  document.getElementById('current-player-name').textContent = name;
  document.getElementById('turn-symbol').textContent = symbol;
  document.getElementById('turn-symbol').className = neonClass;

  const barFill = document.getElementById('turn-bar-fill');
  barFill.className = `turn-bar-fill turn-bar-${currentPlayer.toLowerCase()}`;

  // Score card active state
  document.getElementById('score-x').classList.toggle('active-turn', currentPlayer === 'X');
  document.getElementById('score-o').classList.toggle('active-turn', currentPlayer === 'O');
}

function updateScores() {
  document.getElementById('score-value-x').textContent = scores.X;
  document.getElementById('score-value-o').textContent = scores.O;
  document.getElementById('score-draws').textContent = scores.draws;
}

// ==============================
//  MODAL
// ==============================
function showModal(type, player) {
  const modal = document.getElementById('result-modal');
  const modalBox = document.getElementById('modal-box');
  const icon = document.getElementById('modal-icon');
  const title = document.getElementById('modal-title');
  const subtitle = document.getElementById('modal-subtitle');

  if (type === 'win') {
    icon.textContent = '🏆';
    title.textContent = 'WINNER!';
    title.style.color = player === 'X' ? 'var(--neon-x)' : 'var(--neon-o)';
    title.style.textShadow = player === 'X'
      ? '0 0 20px var(--neon-x)'
      : '0 0 20px var(--neon-o)';
    subtitle.textContent = `${playerNames[player]} wins this round!`;

    // Update modal border
    modalBox.style.borderColor = player === 'X'
      ? 'var(--neon-x-dim)'
      : 'var(--neon-o-dim)';
    modalBox.style.boxShadow = player === 'X'
      ? '0 0 40px var(--neon-x-glow)'
      : '0 0 40px var(--neon-o-glow)';

    spawnParticles(player);
  } else {
    icon.textContent = '🤝';
    title.textContent = "IT'S A DRAW!";
    title.style.color = 'var(--text-primary)';
    title.style.textShadow = 'none';
    subtitle.textContent = 'No winners this round.';
    modalBox.style.borderColor = 'var(--border-color)';
    modalBox.style.boxShadow = 'none';
  }

  modal.classList.remove('hidden');
}

// ==============================
//  PARTICLE EFFECT
// ==============================
function spawnParticles(player) {
  const container = document.getElementById('modal-particles');
  container.innerHTML = '';

  const color = player === 'X' ? '#00f5ff' : '#ff2d78';
  const count = 20;

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.backgroundColor = color;
    p.style.boxShadow = `0 0 6px ${color}`;
    p.style.left = `${Math.random() * 100}%`;
    p.style.top = `${Math.random() * 100}%`;

    const angle = Math.random() * 360;
    const distance = 60 + Math.random() * 80;
    const tx = Math.cos((angle * Math.PI) / 180) * distance + 'px';
    const ty = Math.sin((angle * Math.PI) / 180) * distance + 'px';

    p.style.setProperty('--tx', tx);
    p.style.setProperty('--ty', ty);
    p.style.animationDelay = Math.random() * 0.3 + 's';
    p.style.animationDuration = (0.8 + Math.random() * 0.6) + 's';

    container.appendChild(p);
  }
}

// ==============================
//  KEYBOARD SUPPORT
// ==============================
document.addEventListener('keydown', (e) => {
  // Press Enter to start
  if (!gameActive) {
    if (e.key === 'Enter') {
      const setupScreen = document.getElementById('setup-screen');
      if (!setupScreen.classList.contains('hidden')) {
        startGame();
      }
    }
    return;
  }

  // Press R to reset
  if (e.key === 'r' || e.key === 'R') resetGame();
  // Press N to new game
  if (e.key === 'n' || e.key === 'N') newGame();

  // Number keys 1-9 to play cells
  const keyMap = {
    '1': 6, '2': 7, '3': 8,
    '4': 3, '5': 4, '6': 5,
    '7': 0, '8': 1, '9': 2
  };
  if (keyMap[e.key] !== undefined) {
    makeMove(keyMap[e.key]);
  }
});
