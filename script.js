const boardElement = document.querySelector("#game-board");
const scoreElement = document.querySelector("#score");
const bestScoreElement = document.querySelector("#best-score");
const mobileControls = document.querySelector(".mobile-controls");
const newGameButton = document.querySelector("#new-game");
const undoButton = document.querySelector("#undo");
const gameOverModal = document.querySelector("#game-over-modal");
const restartAfterGameButton = document.querySelector("#restart-after-game");
const leaderboardModal = document.querySelector("#leaderboard-modal");
const leaderboardButton = document.querySelector("#leaderboard-button");
const closeLeaderboardButton = document.querySelector("#close-leaderboard");
const leaderboardList = document.querySelector("#leaderboard-list");
const saveScoreButton = document.querySelector("#save-score");
const saveScoreArea = document.querySelector("#save-score-area");
const playerNameInput = document.querySelector("#player-name");
const gameOverMessage = document.querySelector("#game-over-message");
const currentThemeElement = document.querySelector("#current-theme");
const themeProgressText = document.querySelector("#theme-progress-text");
const themeProgressBar = document.querySelector("#theme-progress-bar");
const soundToggleButton = document.querySelector("#sound-toggle");
const themeAudio = document.querySelector("#theme-audio");
const musicModeSelect = document.querySelector("#music-mode");
const playlistPicker = document.querySelector("#playlist-picker");
const playlistTrackSelect = document.querySelector("#playlist-track");
const imageCache = new Map();

const SIZE = 4;
const BEST_SCORE_KEY = "gosling-2048-best-score";
const GAME_STATE_KEY = "gosling-2048-game-state";
const LEADERBOARD_KEY = "gosling-2048-leaderboard";
const THEME_KEY = "gosling-2048-theme";
const SOUND_KEY = "gosling-2048-sound";
const MUSIC_MODE_KEY = "gosling-2048-music-mode";
const PLAYLIST_TRACK_KEY = "gosling-2048-playlist-track";
const MUSIC_POSITION_KEY = "gosling-2048-music-position";
const MUSIC_PAUSED_KEY = "gosling-2048-music-paused";
let board = [];
let score = 0;
let gameOver = false;
let previousState = null;
let scoreSaved = false;
let soundEnabled = localStorage.getItem(SOUND_KEY) === "true";
let musicMode = localStorage.getItem(MUSIC_MODE_KEY) || "themes";
let playlistTrack = localStorage.getItem(PLAYLIST_TRACK_KEY) || "la-la-land";
let audioPaused = localStorage.getItem(MUSIC_PAUSED_KEY) === "true";

const themes = [
  { title: "Ла-Ла Ленд", threshold: 2, className: "theme-la-la-land", audio: "assets/audio/la-la-land.mp3" },
  { title: "Бегущий по лезвию 2049", threshold: 16, className: "theme-blade-runner-2049", audio: "assets/audio/blade-runner-2049.mp3" },
  { title: "Драйв", threshold: 32, className: "theme-drive", audio: "assets/audio/drive.mp3" },
  { title: "Эта дурацкая любовь", threshold: 64, className: "theme-crazy-love", audio: "assets/audio/crazy-stupid-love.mp3" },
  { title: "Только бог простит", threshold: 128, className: "theme-only-god-forgives", audio: "assets/audio/only-god-forgives.mp3" },
  { title: "Место под соснами", threshold: 256, className: "theme-place-beyond-the-pines", audio: "assets/audio/the-place-beyond-the-pines.mp3" },
  { title: "Первый человек", threshold: 512, className: "theme-first-man", audio: "assets/audio/first-man.mp3" },
  { title: "Барби", threshold: 1024, className: "theme-barbie", audio: "assets/audio/barbie.mp3" },
];

const tileThemeImages = {
  2: "assets/images/la-la-land-2.jpg",
  4: "assets/images/la-la-land-4.jpg",
  8: "assets/images/la-la-land-8.jpg",
  16: "assets/images/blade-runner-2049.jpg",
  32: "assets/images/drive.jpg",
  64: "assets/images/crazy-stupid-love.jpg",
  128: "assets/images/only-god-forgives.jpg",
  256: "assets/images/the-place-beyond-the-pines.jpg",
  512: "assets/images/first-man.jpg",
  1024: "assets/images/barbie.jpg",
  2048: "assets/images/barbie.jpg",
};

const playlistTracks = {
  "la-la-land": "assets/audio/la-la-land.mp3",
  "blade-runner-2049": "assets/audio/blade-runner-2049.mp3",
  drive: "assets/audio/drive.mp3",
  "crazy-stupid-love": "assets/audio/crazy-stupid-love.mp3",
  "only-god-forgives": "assets/audio/only-god-forgives.mp3",
  "the-place-beyond-the-pines": "assets/audio/the-place-beyond-the-pines.mp3",
  "first-man": "assets/audio/first-man.mp3",
  barbie: "assets/audio/barbie.mp3",
};

const tileColors = {
  2: ["#eee4da", "#776e65"],
  4: ["#ede0c8", "#776e65"],
  8: ["#f2b179", "#f9f6f2"],
  16: ["#f59563", "#f9f6f2"],
  32: ["#f67c5f", "#f9f6f2"],
  64: ["#f65e3b", "#f9f6f2"],
  128: ["#edcf72", "#f9f6f2"],
  256: ["#edcc61", "#f9f6f2"],
  512: ["#edc850", "#f9f6f2"],
  1024: ["#edc53f", "#f9f6f2"],
  2048: ["#edc22e", "#f9f6f2"],
};

function createEmptyBoard() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function getBestScore() {
  return Number(localStorage.getItem(BEST_SCORE_KEY)) || 0;
}

function getMaxTile() {
  return Math.max(...board.flat(), 0);
}

function getActiveTheme() {
  const maxTile = getMaxTile();
  let activeTheme = themes[0];

  themes.forEach((theme) => {
    if (maxTile >= theme.threshold) {
      activeTheme = theme;
    }
  });

  return activeTheme;
}

function updateTheme() {
  const maxTile = getMaxTile();
  const activeTheme = getActiveTheme();
  const activeIndex = themes.indexOf(activeTheme);
  const nextTheme = themes[activeIndex + 1];

  document.body.classList.remove(...themes.map((theme) => theme.className));
  document.body.classList.add(activeTheme.className);
  currentThemeElement.textContent = activeTheme.title;
  localStorage.setItem(THEME_KEY, activeTheme.className);

  if (nextTheme) {
    const previousThreshold = activeTheme.threshold;
    const progress = Math.max(0, Math.min(100,
      ((maxTile - previousThreshold) / (nextTheme.threshold - previousThreshold)) * 100
    ));
    themeProgressText.textContent = `Следующая сцена: ${nextTheme.title}`;
    themeProgressBar.style.width = `${progress}%`;
  } else {
    themeProgressText.textContent = "Коллекция открыта";
    themeProgressBar.style.width = "100%";
  }

  const nextSource = musicMode === "playlist"
    ? playlistTracks[playlistTrack]
    : activeTheme.audio;

  applyMusicSource(nextSource);
}

function updateSoundButton() {
  const status = !soundEnabled ? "выкл" : audioPaused ? "пауза" : "играет";
  soundToggleButton.textContent = `Музыка: ${status}`;
  soundToggleButton.setAttribute("aria-pressed", String(soundEnabled));
}

function updateMusicControls() {
  musicModeSelect.value = musicMode;
  playlistTrackSelect.value = playlistTrack;
  playlistPicker.hidden = musicMode !== "playlist";
}

function setMusicSource({ startPlayback = false } = {}) {
  const activeTheme = getActiveTheme();
  const nextSource = musicMode === "playlist"
    ? playlistTracks[playlistTrack]
    : activeTheme.audio;

  applyMusicSource(nextSource, startPlayback);
}

function getMusicPositions() {
  try {
    const positions = JSON.parse(localStorage.getItem(MUSIC_POSITION_KEY) || "{}");
    return positions && typeof positions === "object" ? positions : {};
  } catch {
    return {};
  }
}

function rememberMusicPosition() {
  const source = themeAudio.dataset.source;

  if (!source || !Number.isFinite(themeAudio.currentTime)) {
    return;
  }

  const positions = getMusicPositions();
  positions[source] = themeAudio.currentTime;
  localStorage.setItem(MUSIC_POSITION_KEY, JSON.stringify(positions));
}

function applyMusicSource(nextSource, startPlayback = false) {
  themeAudio.loop = musicMode === "themes";

  if (!nextSource || themeAudio.dataset.source === nextSource) {
    if (startPlayback) {
      soundEnabled = true;
      audioPaused = false;
      localStorage.setItem(SOUND_KEY, "true");
      localStorage.setItem(MUSIC_PAUSED_KEY, "false");
      themeAudio.play().catch(() => {});
      updateSoundButton();
    }
    return;
  }

  rememberMusicPosition();
  themeAudio.src = nextSource;
  themeAudio.dataset.source = nextSource;

  let restored = false;
  const playWhenReady = () => {
    if (restored) {
      return;
    }

    restored = true;
    const position = getMusicPositions()[nextSource];

    if (Number.isFinite(position) && position < themeAudio.duration) {
      themeAudio.currentTime = position;
    }

    if (startPlayback || (soundEnabled && !audioPaused)) {
      themeAudio.play().catch(() => {});
    }
  };

  themeAudio.addEventListener("loadedmetadata", playWhenReady, { once: true });
  themeAudio.addEventListener("canplay", playWhenReady, { once: true });
  themeAudio.load();
}

themeAudio.addEventListener("ended", () => {
  if (musicMode !== "playlist") {
    return;
  }

  const tracks = Object.keys(playlistTracks);
  const currentIndex = tracks.indexOf(playlistTrack);
  playlistTrack = tracks[(currentIndex + 1) % tracks.length];
  playlistTrackSelect.value = playlistTrack;
  localStorage.setItem(PLAYLIST_TRACK_KEY, playlistTrack);
  setMusicSource();
});

themeAudio.addEventListener("timeupdate", () => {
  if (Math.floor(themeAudio.currentTime) % 5 === 0) {
    rememberMusicPosition();
  }
});

function applyTileImage(tile, value) {
  const imageSource = tileThemeImages[value];

  if (!imageSource) {
    return;
  }

  const backgroundImage = `linear-gradient(rgba(8, 10, 13, 0.12), rgba(8, 10, 13, 0.36)), url("${imageSource}")`;
  tile.style.backgroundImage = backgroundImage;
  tile.classList.add("tile-with-image");

  if (!imageCache.has(imageSource)) {
    const image = new Image();
    image.src = imageSource;
    image.onerror = () => {
      imageCache.set(imageSource, false);
      const fallbackSource = "assets/images/la-la-land.jpg";
      tile.style.backgroundImage = `linear-gradient(rgba(8, 10, 13, 0.12), rgba(8, 10, 13, 0.36)), url("${fallbackSource}")`;
    };
    image.onload = () => imageCache.set(imageSource, true);
    imageCache.set(imageSource, image);
  } else if (imageCache.get(imageSource) === false) {
    const fallbackSource = "assets/images/la-la-land.jpg";
    tile.style.backgroundImage = `linear-gradient(rgba(8, 10, 13, 0.12), rgba(8, 10, 13, 0.36)), url("${fallbackSource}")`;
  }
}

function updateScore() {
  scoreElement.textContent = score;

  if (score > getBestScore()) {
    localStorage.setItem(BEST_SCORE_KEY, String(score));
  }

  bestScoreElement.textContent = getBestScore();
}

function saveGameState() {
  localStorage.setItem(GAME_STATE_KEY, JSON.stringify({
    board,
    score,
    gameOver,
  }));
}

function getSavedGameState() {
  const savedState = localStorage.getItem(GAME_STATE_KEY);

  if (!savedState) {
    return null;
  }

  let parsedState;

  try {
    parsedState = JSON.parse(savedState);
  } catch {
    return null;
  }

  const hasValidBoard = Array.isArray(parsedState.board)
    && parsedState.board.length === SIZE
    && parsedState.board.every((row) => Array.isArray(row) && row.length === SIZE);

  if (!hasValidBoard || typeof parsedState.score !== "number") {
    return null;
  }

  return parsedState;
}

function getLeaderboard() {
  const savedLeaderboard = localStorage.getItem(LEADERBOARD_KEY);

  if (!savedLeaderboard) {
    return [];
  }

  try {
    const leaderboard = JSON.parse(savedLeaderboard);
    return Array.isArray(leaderboard) ? leaderboard : [];
  } catch {
    return [];
  }
}

function renderLeaderboard() {
  const leaderboard = getLeaderboard();
  const fragment = document.createDocumentFragment();

  if (leaderboard.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.textContent = "Пока нет сохраненных результатов";
    row.appendChild(cell);
    fragment.appendChild(row);
  } else {
    leaderboard.forEach((record, index) => {
      const row = document.createElement("tr");
      const placeCell = document.createElement("td");
      const nameCell = document.createElement("td");
      const scoreCell = document.createElement("td");
      const dateCell = document.createElement("td");

      placeCell.textContent = String(index + 1);
      nameCell.textContent = record.name;
      scoreCell.textContent = String(record.score);
      dateCell.textContent = record.date;
      row.append(placeCell, nameCell, scoreCell, dateCell);
      fragment.appendChild(row);
    });
  }

  leaderboardList.replaceChildren(fragment);
}

function saveScore() {
  if (scoreSaved) {
    return;
  }

  const name = playerNameInput.value.trim() || "Аноним";
  const leaderboard = getLeaderboard();
  const submittedAt = new Date();
  const date = new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(submittedAt);

  leaderboard.push({ name, score, date, submittedAt: submittedAt.toISOString() });
  leaderboard.sort((first, second) => second.score - first.score);

  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard.slice(0, 10)));
  scoreSaved = true;
  saveScoreArea.hidden = true;
  gameOverMessage.textContent = "Ваш рекорд сохранен";
  renderLeaderboard();
}

function getAnimationSource(rowIndex, columnIndex, value, previousBoard, direction, consumedSources) {
  if (!previousBoard || !direction) {
    return null;
  }

  const candidates = [];
  const addCandidate = (row, column) => {
    if (row >= 0 && row < SIZE && column >= 0 && column < SIZE) {
      candidates.push([row, column]);
    }
  };

  if (direction === "left") {
    for (let column = columnIndex + 1; column < SIZE; column += 1) {
      addCandidate(rowIndex, column);
    }
  } else if (direction === "right") {
    for (let column = columnIndex - 1; column >= 0; column -= 1) {
      addCandidate(rowIndex, column);
    }
  } else if (direction === "up") {
    for (let row = rowIndex + 1; row < SIZE; row += 1) {
      addCandidate(row, columnIndex);
    }
  } else if (direction === "down") {
    for (let row = rowIndex - 1; row >= 0; row -= 1) {
      addCandidate(row, columnIndex);
    }
  }

  const source = candidates.find(([row, column]) => {
    const sourceKey = `${row}-${column}`;
    const sourceValue = previousBoard[row][column];
    return !consumedSources.has(sourceKey)
      && (sourceValue === value || sourceValue === value / 2);
  });

  if (!source) {
    return null;
  }

  consumedSources.add(`${source[0]}-${source[1]}`);
  return source;
}

function renderBoard(previousBoard = null, direction = null) {
  const fragment = document.createDocumentFragment();
  const consumedSources = new Set();
  let tileLayer = boardElement.querySelector(".tile-layer-active")
    || boardElement.querySelector(".tile-layer");
  let previousLayer = null;

  if (!tileLayer) {
    tileLayer = document.createElement("div");
    tileLayer.className = "tile-layer tile-layer-active";

    for (let index = 0; index < 16; index += 1) {
      const cell = document.createElement("div");
      cell.className = "board-cell";
      cell.setAttribute("aria-hidden", "true");
      cell.style.setProperty("--row", Math.floor(index / SIZE));
      cell.style.setProperty("--column", index % SIZE);
      boardElement.appendChild(cell);
    }

    boardElement.appendChild(tileLayer);
  } else if (previousBoard) {
    previousLayer = tileLayer;
    tileLayer.classList.remove("tile-layer-active");
    const nextLayer = document.createElement("div");
    nextLayer.className = "tile-layer tile-layer-active";
    boardElement.appendChild(nextLayer);
    tileLayer = nextLayer;
  } else {
    boardElement.querySelectorAll(".tile-layer:not(.tile-layer-active)")
      .forEach((layer) => layer.remove());
  }

  board.forEach((row, rowIndex) => {
    row.forEach((value, columnIndex) => {
      if (value === 0) {
        return;
      }

      const tile = document.createElement("div");
      tile.className = "tile";
      tile.setAttribute("role", "gridcell");
      tile.textContent = value;
      tile.dataset.value = value;
      tile.dataset.row = rowIndex;
      tile.dataset.column = columnIndex;
      tile.setAttribute("aria-label", `Плитка ${value}`);

      let sourceRow = rowIndex;
      let sourceColumn = columnIndex;
      let shouldAnimate = false;

      const source = getAnimationSource(
        rowIndex,
        columnIndex,
        value,
        previousBoard,
        direction,
        consumedSources
      );

      if (source) {
        [sourceRow, sourceColumn] = source;
        shouldAnimate = true;
      }

      tile.style.setProperty("--row", shouldAnimate ? sourceRow : rowIndex);
      tile.style.setProperty("--column", shouldAnimate ? sourceColumn : columnIndex);

      const [background, color] = tileColors[value] || ["#3c3a32", "#f9f6f2"];
      tile.style.backgroundColor = background;
      tile.style.color = color;
      applyTileImage(tile, value);

      if (shouldAnimate) {
        tile.classList.add("tile-moving");
      } else if (!previousBoard || previousBoard[rowIndex][columnIndex] === 0) {
        tile.classList.add("tile-entering");
      }
      fragment.appendChild(tile);
    });
  });

  tileLayer.replaceChildren(fragment);
  undoButton.disabled = previousState === null || gameOver;

  if (previousBoard) {
    requestAnimationFrame(() => {
      if (previousLayer) {
        previousLayer.style.visibility = "hidden";
      }

      requestAnimationFrame(() => {
        board.forEach((row, rowIndex) => {
          row.forEach((value, columnIndex) => {
            if (value) {
              const tile = tileLayer.querySelector(
                `.tile[data-row="${rowIndex}"][data-column="${columnIndex}"]`
              );

              if (tile) {
                tile.style.setProperty("--row", rowIndex);
                tile.style.setProperty("--column", columnIndex);
                tile.classList.remove("tile-moving");
              }
            }
          });

          window.setTimeout(() => {
            const oldLayers = boardElement.querySelectorAll(".tile-layer:not(.tile-layer-active)");
            oldLayers.forEach((layer) => layer.remove());
          }, 520);
        });
      });
    });
  }
}

function addRandomTile() {
  const emptyCells = [];

  board.forEach((row, rowIndex) => {
    row.forEach((value, columnIndex) => {
      if (value === 0) {
        emptyCells.push([rowIndex, columnIndex]);
      }
    });
  });

  if (emptyCells.length === 0) {
    return;
  }

  const [row, column] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  board[row][column] = Math.random() < 0.9 ? 2 : 4;
}

function slideLine(line) {
  const compacted = line.filter(Boolean);
  const merged = [];
  let gainedScore = 0;

  for (let index = 0; index < compacted.length; index += 1) {
    if (compacted[index] === compacted[index + 1]) {
      const mergedValue = compacted[index] * 2;
      merged.push(mergedValue);
      gainedScore += mergedValue;
      index += 1;
    } else {
      merged.push(compacted[index]);
    }
  }

  while (merged.length < SIZE) {
    merged.push(0);
  }

  return { line: merged, gainedScore };
}

function getColumn(columnIndex) {
  return board.map((row) => row[columnIndex]);
}

function setColumn(columnIndex, values) {
  values.forEach((value, rowIndex) => {
    board[rowIndex][columnIndex] = value;
  });
}

function move(direction) {
  if (gameOver) {
    return;
  }

  const previousBoard = JSON.stringify(board);
  let gainedScore = 0;

  if (direction === "left" || direction === "right") {
    board = board.map((row) => {
      const line = direction === "right" ? [...row].reverse() : row;
      const result = slideLine(line);
      gainedScore += result.gainedScore;
      return direction === "right" ? result.line.reverse() : result.line;
    });
  } else {
    for (let columnIndex = 0; columnIndex < SIZE; columnIndex += 1) {
      const column = getColumn(columnIndex);
      const line = direction === "down" ? column.reverse() : column;
      const result = slideLine(line);
      gainedScore += result.gainedScore;
      setColumn(columnIndex, direction === "down" ? result.line.reverse() : result.line);
    }
  }

  if (JSON.stringify(board) === previousBoard) {
    if (!hasAvailableMoves()) {
      finishGame();
    }
    return;
  }

  previousState = {
    board: JSON.parse(previousBoard),
    score,
  };
  score += gainedScore;
  addRandomTile();
  renderBoard(JSON.parse(previousBoard), direction);
  updateTheme();
  updateScore();
  saveGameState();

  if (!hasAvailableMoves()) {
    finishGame();
  }
}

function hasAvailableMoves() {
  for (let rowIndex = 0; rowIndex < SIZE; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < SIZE; columnIndex += 1) {
      if (board[rowIndex][columnIndex] === 0) {
        return true;
      }

      const currentValue = board[rowIndex][columnIndex];
      const rightValue = board[rowIndex][columnIndex + 1];
      const bottomValue = board[rowIndex + 1]?.[columnIndex];

      if (currentValue === rightValue || currentValue === bottomValue) {
        return true;
      }
    }
  }

  return false;
}

function finishGame() {
  gameOver = true;
  scoreSaved = false;
  saveScoreArea.hidden = false;
  playerNameInput.value = "";
  gameOverMessage.textContent = "Сохраните свой результат в таблицу лидеров.";
  mobileControls.hidden = true;
  gameOverModal.hidden = false;
  renderBoard();
  saveGameState();
}

function undoMove() {
  if (!previousState || gameOver) {
    return;
  }

  board = previousState.board;
  score = previousState.score;
  previousState = null;
  renderBoard();
  updateScore();
  saveGameState();
}

function startNewGame() {
  board = createEmptyBoard();
  score = 0;
  gameOver = false;
  previousState = null;
  scoreSaved = false;
  gameOverModal.hidden = true;
  mobileControls.hidden = gameOver;
  addRandomTile();
  addRandomTile();
  renderBoard();
  updateTheme();
  updateScore();
  saveGameState();
}

document.addEventListener("keydown", (event) => {
  const directions = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
  };
  const direction = directions[event.key];

  if (!direction) {
    return;
  }

  event.preventDefault();
  move(direction);
});

mobileControls.addEventListener("click", (event) => {
  const button = event.target.closest("[data-direction]");

  if (button) {
    move(button.dataset.direction);
  }
});

let touchStart = null;

boardElement.addEventListener("touchstart", (event) => {
  const touch = event.changedTouches[0];
  touchStart = { x: touch.clientX, y: touch.clientY };
}, { passive: true });

boardElement.addEventListener("touchend", (event) => {
  if (!touchStart) {
    return;
  }

  const touch = event.changedTouches[0];
  const deltaX = touch.clientX - touchStart.x;
  const deltaY = touch.clientY - touchStart.y;
  touchStart = null;

  if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 30) {
    return;
  }

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    move(deltaX > 0 ? "right" : "left");
  } else {
    move(deltaY > 0 ? "down" : "up");
  }
}, { passive: true });

newGameButton.addEventListener("click", startNewGame);
undoButton.addEventListener("click", undoMove);
restartAfterGameButton.addEventListener("click", startNewGame);
saveScoreButton.addEventListener("click", saveScore);

leaderboardButton.addEventListener("click", () => {
  renderLeaderboard();
  leaderboardModal.hidden = false;
  mobileControls.hidden = true;
});

closeLeaderboardButton.addEventListener("click", () => {
  leaderboardModal.hidden = true;
  mobileControls.hidden = gameOver;
});

soundToggleButton.addEventListener("click", () => {
  if (!soundEnabled) {
    soundEnabled = true;
    audioPaused = false;
  } else {
    audioPaused = !audioPaused;
  }

  localStorage.setItem(SOUND_KEY, String(soundEnabled));
  localStorage.setItem(MUSIC_PAUSED_KEY, String(audioPaused));
  updateSoundButton();

  if (soundEnabled && !audioPaused) {
    themeAudio.play().catch(() => {});
  } else {
    themeAudio.pause();
  }
});

musicModeSelect.addEventListener("change", () => {
  musicMode = musicModeSelect.value;
  soundEnabled = true;
  audioPaused = false;
  localStorage.setItem(MUSIC_MODE_KEY, musicMode);
  localStorage.setItem(SOUND_KEY, "true");
  localStorage.setItem(MUSIC_PAUSED_KEY, "false");
  updateMusicControls();
  updateSoundButton();
  setMusicSource({ startPlayback: true });
});

playlistTrackSelect.addEventListener("change", () => {
  playlistTrack = playlistTrackSelect.value;
  localStorage.setItem(PLAYLIST_TRACK_KEY, playlistTrack);
  setMusicSource();
});

bestScoreElement.textContent = getBestScore();
const savedGameState = getSavedGameState();

if (savedGameState) {
  board = savedGameState.board;
  score = savedGameState.score;
  gameOver = Boolean(savedGameState.gameOver);
  mobileControls.hidden = gameOver;
  renderBoard();
  updateTheme();
  updateScore();

  if (gameOver) {
    gameOverModal.hidden = false;
  }
} else {
  startNewGame();
}

updateSoundButton();
updateMusicControls();
