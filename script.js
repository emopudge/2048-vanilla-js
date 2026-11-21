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
const musicTrackTitle = document.querySelector("#music-track-title");
const musicProgress = document.querySelector("#music-progress");
const musicTime = document.querySelector("#music-time");

const SIZE = 4;
const BEST_SCORE_KEY = "gosling-2048-best-score";
const GAME_STATE_KEY = "gosling-2048-game-state";
const LEADERBOARD_KEY = "gosling-2048-leaderboard";
const SOUND_KEY = "gosling-2048-sound";
const MUSIC_MODE_KEY = "gosling-2048-music-mode";
const PLAYLIST_TRACK_KEY = "gosling-2048-playlist-track";
const MUSIC_POSITION_KEY = "gosling-2048-music-position";
const MUSIC_PAUSED_KEY = "gosling-2048-music-paused";
const DISCOVERED_VALUES_KEY = "gosling-2048-discovered-values";
const DEFAULT_VOLUME = 0.65;
const TILE_ANIMATION_MS = 320;
function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    return;
  }
}

let board = [];
let score = 0;
let gameOver = false;
let previousState = null;
let scoreSaved = false;
let soundEnabled = safeGet(SOUND_KEY) === "true";
let musicMode = safeGet(MUSIC_MODE_KEY) || "themes";
let playlistTrack = safeGet(PLAYLIST_TRACK_KEY) || "la-la-land";
let audioPaused = safeGet(MUSIC_PAUSED_KEY) === "true";
let audioFadeToken = 0;
let discoveredValues = new Set([2]);
let isAnimating = false;

const themes = [
  { title: "Ла-Ла Ленд", threshold: 2, className: "theme-la-la-land", audio: "assets/audio/la-la-land.mp3" },
  { title: "Бегущий по лезвию 2049", threshold: 16, className: "theme-blade-runner-2049", audio: "assets/audio/blade-runner-2049.mp3" },
  { title: "Драйв", threshold: 32, className: "theme-drive", audio: "assets/audio/drive.mp3" },
  { title: "Эта дурацкая любовь", threshold: 64, className: "theme-crazy-love", audio: "assets/audio/crazy-stupid-love.mp3" },
  { title: "Только бог простит", threshold: 128, className: "theme-only-god-forgives", audio: "assets/audio/only-god-forgives.mp3" },
  { title: "Место под соснами", threshold: 256, className: "theme-place-beyond-the-pines", audio: "assets/audio/the-place-beyond-the-pines.mp3" },
  { title: "Первый человек", threshold: 512, className: "theme-first-man", audio: "assets/audio/first-man.mp3" },
  { title: "Барби", threshold: 1024, className: "theme-barbie", audio: "assets/audio/barbie.mp3" },
  { title: "Славные парни", threshold: 2048, className: "theme-the-nice-guys", audio: "assets/audio/the-nice-guys.mp3" },
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
  2048: "assets/images/the-nice-guys.jpg",
  4096: "assets/images/the-nice-guys.jpg",
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
  "the-nice-guys": "assets/audio/the-nice-guys.mp3",
};

const trackTitles = {
  "la-la-land": "Ла-Ла Ленд",
  "blade-runner-2049": "Бегущий по лезвию 2049",
  drive: "Драйв",
  "crazy-stupid-love": "Эта дурацкая любовь",
  "only-god-forgives": "Только бог простит",
  "the-place-beyond-the-pines": "Место под соснами",
  "first-man": "Первый человек",
  barbie: "Барби",
  "the-nice-guys": "Славные парни",
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
  4096: ["#d2a44a", "#f9f6f2"],
};

function createEmptyBoard() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function getBestScore() {
  return Number(safeGet(BEST_SCORE_KEY)) || 0;
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
  const themeChanged = document.body.dataset.activeTheme !== activeTheme.className;

  document.body.classList.remove(...themes.map((theme) => theme.className));
  document.body.classList.add(activeTheme.className);
  document.body.dataset.activeTheme = activeTheme.className;
  document.body.dataset.theme = activeTheme.className;
  currentThemeElement.textContent = activeTheme.title;

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

  applyMusicSource(nextSource, false, musicMode === "themes" && themeChanged);
}

function updateSoundButton() {
  const icon = !soundEnabled || audioPaused ? "▶" : "Ⅱ";
  const label = !soundEnabled
    ? "Воспроизвести музыку"
    : audioPaused
      ? "Продолжить музыку"
      : "Поставить музыку на паузу";

  soundToggleButton.textContent = icon;
  soundToggleButton.setAttribute("aria-label", label);
  soundToggleButton.title = label;
  soundToggleButton.setAttribute("aria-pressed", String(soundEnabled && !audioPaused));
}

function updateMusicControls() {
  musicModeSelect.value = musicMode;
  playlistTrackSelect.value = playlistTrack;
  playlistPicker.hidden = musicMode !== "playlist";
}

function updateMobileControls() {
  mobileControls.hidden = gameOver;
}

function updateTrackTitle() {
  const activeTheme = getActiveTheme();
  const trackKey = musicMode === "playlist"
    ? playlistTrack
    : activeTheme.className.replace("theme-", "");

  musicTrackTitle.textContent = trackTitles[trackKey] || activeTheme.title;
}

function setMusicSource({ startPlayback = false, resetPosition = false } = {}) {
  const activeTheme = getActiveTheme();
  const nextSource = musicMode === "playlist"
    ? playlistTracks[playlistTrack]
    : activeTheme.audio;

  applyMusicSource(nextSource, startPlayback, resetPosition);
}

function getMusicPositions() {
  try {
    const positions = JSON.parse(safeGet(MUSIC_POSITION_KEY) || "{}");
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
  safeSet(MUSIC_POSITION_KEY, JSON.stringify(positions));
}

function fadeVolume(target, duration = 450, onComplete = () => {}, fadeToken = ++audioFadeToken) {
  const startedVolume = themeAudio.volume;
  const startedAt = performance.now();

  function step(now) {
    if (fadeToken !== audioFadeToken) {
      return;
    }

    const progress = Math.min(1, (now - startedAt) / duration);
    themeAudio.volume = startedVolume + (target - startedVolume) * progress;

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      themeAudio.volume = target;
      onComplete();
    }
  }

  requestAnimationFrame(step);
}

function applyMusicSource(nextSource, startPlayback = false, resetPosition = false) {
  updateTrackTitle();
  themeAudio.loop = musicMode === "themes";

  if (!nextSource || themeAudio.dataset.source === nextSource) {
    ++audioFadeToken;
    themeAudio.volume = DEFAULT_VOLUME;

    if (resetPosition) {
      themeAudio.currentTime = 0;
    }

    if (startPlayback) {
      soundEnabled = true;
      audioPaused = false;
      safeSet(SOUND_KEY, "true");
      safeSet(MUSIC_PAUSED_KEY, "false");
      themeAudio.play().catch(() => {});
      updateSoundButton();
    }
    return;
  }

  rememberMusicPosition();
  const sourceRequest = ++audioFadeToken;
  themeAudio.dataset.request = String(sourceRequest);

  fadeVolume(0, 450, () => {
    if (themeAudio.dataset.request !== String(sourceRequest)) {
      return;
    }

    themeAudio.pause();
    themeAudio.src = nextSource;
    themeAudio.dataset.source = nextSource;
    themeAudio.loop = musicMode === "themes";
    themeAudio.load();

    let restored = false;
    const playWhenReady = () => {
      if (themeAudio.dataset.request !== String(sourceRequest)) {
        return;
      }

      if (restored) {
        return;
      }

      restored = true;
      const position = musicMode === "playlist"
        ? getMusicPositions()[nextSource]
        : 0;

      if (Number.isFinite(position) && position < themeAudio.duration) {
        themeAudio.currentTime = position;
      }

      if (startPlayback || (soundEnabled && !audioPaused)) {
        themeAudio.play().catch(() => {});
        fadeVolume(DEFAULT_VOLUME, 700, () => {}, sourceRequest);
      }
    };

    themeAudio.addEventListener("loadedmetadata", playWhenReady, { once: true });
    themeAudio.addEventListener("canplay", playWhenReady, { once: true });
  }, sourceRequest);
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

function updateMusicProgress() {
  if (Number.isFinite(themeAudio.duration)) {
    musicProgress.max = themeAudio.duration;
    musicProgress.value = themeAudio.currentTime;
  }
  musicTime.textContent = `${formatTime(themeAudio.currentTime)} / ${formatTime(themeAudio.duration)}`;
}

themeAudio.addEventListener("ended", () => {
  if (musicMode !== "playlist") {
    return;
  }

  const tracks = Object.keys(playlistTracks);
  const currentIndex = tracks.indexOf(playlistTrack);
  playlistTrack = tracks[(currentIndex + 1) % tracks.length];
  playlistTrackSelect.value = playlistTrack;
  safeSet(PLAYLIST_TRACK_KEY, playlistTrack);
  updateTrackTitle();
  setMusicSource();
});

themeAudio.addEventListener("timeupdate", () => {
  updateMusicProgress();
});
themeAudio.addEventListener("durationchange", updateMusicProgress);
themeAudio.addEventListener("pause", rememberMusicPosition);
window.addEventListener("beforeunload", rememberMusicPosition);

musicProgress.addEventListener("input", () => {
  themeAudio.currentTime = Number(musicProgress.value);
  rememberMusicPosition();
  updateMusicProgress();
});

function applyTileImage(tile, value) {
  const imageSource = tileThemeImages[value];

  if (!imageSource) {
    return;
  }

  const backgroundImage = `linear-gradient(rgba(8, 10, 13, 0.12), rgba(8, 10, 13, 0.36)), url("${imageSource}")`;
  tile.style.backgroundImage = backgroundImage;
  tile.classList.add("tile-with-image");
}

function updateScore() {
  scoreElement.textContent = score;

  if (score > getBestScore()) {
    safeSet(BEST_SCORE_KEY, String(score));
  }

  bestScoreElement.textContent = getBestScore();
}

function saveGameState() {
  safeSet(GAME_STATE_KEY, JSON.stringify({
    board,
    score,
    gameOver,
  }));
}

function getSavedGameState() {
  const savedState = safeGet(GAME_STATE_KEY);

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
    && parsedState.board.every((row) => Array.isArray(row)
      && row.length === SIZE
      && row.every((value) => Number.isFinite(value) && value >= 0));

  if (!hasValidBoard || typeof parsedState.score !== "number") {
    return null;
  }

  return parsedState;
}

function loadDiscoveredValues() {
  try {
    const savedValues = JSON.parse(safeGet(DISCOVERED_VALUES_KEY) || "[2]");
    discoveredValues = new Set(
      (Array.isArray(savedValues) ? savedValues : [2])
        .map(Number)
        .filter(Number.isFinite)
    );
  } catch {
    discoveredValues = new Set([2]);
  }
}

function rememberDiscoveredValues(values) {
  let changed = false;

  values.forEach((value) => {
    if (value && !discoveredValues.has(value)) {
      discoveredValues.add(value);
      changed = true;
    }
  });

  if (changed) {
    safeSet(DISCOVERED_VALUES_KEY, JSON.stringify([...discoveredValues]));
  }
}

function getLeaderboard() {
  const savedLeaderboard = safeGet(LEADERBOARD_KEY);

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
  const leaderboard = getLeaderboard().slice(0, 10);
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
  if (score <= 0) {
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
  leaderboard.sort((a, b) => b.score - a.score
    || new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime());
  leaderboard.splice(10);

  safeSet(LEADERBOARD_KEY, JSON.stringify(leaderboard));
  scoreSaved = true;
  saveScoreArea.hidden = true;
  gameOverMessage.textContent = "Ваш рекорд сохранен";
  renderLeaderboard();
}

function findMoveSource(rowIndex, columnIndex, value, previousBoard, direction, consumedSources) {
  if (!previousBoard || !direction) {
    return null;
  }

  if (previousBoard[rowIndex][columnIndex] === value
    && !consumedSources.has(`${rowIndex}-${columnIndex}`)) {
    consumedSources.add(`${rowIndex}-${columnIndex}`);
    return [rowIndex, columnIndex];
  }

  const candidates = [];
  if (direction === "left") {
    for (let column = columnIndex + 1; column < SIZE; column += 1) candidates.push([rowIndex, column]);
  } else if (direction === "right") {
    for (let column = columnIndex - 1; column >= 0; column -= 1) candidates.push([rowIndex, column]);
  } else if (direction === "up") {
    for (let row = rowIndex + 1; row < SIZE; row += 1) candidates.push([row, columnIndex]);
  } else if (direction === "down") {
    for (let row = rowIndex - 1; row >= 0; row -= 1) candidates.push([row, columnIndex]);
  }

  const source = candidates.find(([row, column]) =>
    previousBoard[row][column] === value
    && !consumedSources.has(`${row}-${column}`)
  );

  if (!source) {
    return null;
  }
  consumedSources.add(`${source[0]}-${source[1]}`);
  return source;
}

function buildMergePlan(previousBoard, direction) {
  const mergePlan = new Map();

  const addMerge = (targetRow, targetColumn, sources, value) => {
    mergePlan.set(`${targetRow}-${targetColumn}`, { sources, value });
  };

  if (direction === "left" || direction === "right") {
    previousBoard.forEach((row, rowIndex) => {
      const line = direction === "right" ? [...row].reverse() : [...row];
      const compacted = line.filter(Boolean);
      let targetIndex = 0;

      for (let index = 0; index < compacted.length; index += 1) {
        if (compacted[index] === compacted[index + 1]) {
          const originalIndexes = direction === "right"
            ? [SIZE - 1 - index, SIZE - 2 - index]
            : [index, index + 1];
          const targetColumn = direction === "right"
            ? SIZE - 1 - targetIndex
            : targetIndex;
          const value = compacted[index] * 2;

          addMerge(
            rowIndex,
            targetColumn,
            originalIndexes.map((column) => [rowIndex, column]),
            value
          );
          index += 1;
        }
        targetIndex += 1;
      }
    });
  } else {
    for (let columnIndex = 0; columnIndex < SIZE; columnIndex += 1) {
      const column = previousBoard.map((row) => row[columnIndex]);
      const line = direction === "down" ? [...column].reverse() : [...column];
      const compacted = line.filter(Boolean);
      let targetIndex = 0;

      for (let index = 0; index < compacted.length; index += 1) {
        if (compacted[index] === compacted[index + 1]) {
          const originalIndexes = direction === "down"
            ? [SIZE - 1 - index, SIZE - 2 - index]
            : [index, index + 1];
          const targetRow = direction === "down"
            ? SIZE - 1 - targetIndex
            : targetIndex;
          const value = compacted[index] * 2;

          addMerge(
            targetRow,
            columnIndex,
            originalIndexes.map((row) => [row, columnIndex]),
            value
          );
          index += 1;
        }
        targetIndex += 1;
      }
    }
  }

  return mergePlan;
}

function animateTileTo(tile, destinationRow, destinationColumn, onComplete = null) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    tile.style.setProperty("--row", destinationRow);
    tile.style.setProperty("--column", destinationColumn);
    if (onComplete) {
      onComplete();
    }
    return;
  }

  const sourceRect = tile.getBoundingClientRect();
  const sourceRow = tile.style.getPropertyValue("--row");
  const sourceColumn = tile.style.getPropertyValue("--column");

  tile.style.setProperty("--row", destinationRow);
  tile.style.setProperty("--column", destinationColumn);
  const destinationRect = tile.getBoundingClientRect();

  tile.style.setProperty("--row", sourceRow);
  tile.style.setProperty("--column", sourceColumn);
  void tile.offsetWidth;

  const deltaX = destinationRect.left - sourceRect.left;
  const deltaY = destinationRect.top - sourceRect.top;

  if (Math.abs(deltaX) + Math.abs(deltaY) < 1) {
    if (onComplete) {
      onComplete();
    }
    return;
  }

  const animation = tile.animate([
    { transform: "translate3d(0, 0, 0)" },
    { transform: `translate3d(${deltaX}px, ${deltaY}px, 0)` },
  ], {
    duration: TILE_ANIMATION_MS,
    easing: "cubic-bezier(0.22, 0.61, 0.36, 1)",
    fill: "forwards",
  });

  window.setTimeout(() => {
    animation.cancel();
    tile.style.transition = "none";
    tile.style.setProperty("--row", destinationRow);
    tile.style.setProperty("--column", destinationColumn);
    void tile.offsetWidth;
    tile.style.removeProperty("transition");
    if (onComplete) {
      onComplete();
    }
  }, TILE_ANIMATION_MS);
}

function renderBoard(previousBoard = null, direction = null, newlyDiscoveredValues = new Set()) {
  const fragment = document.createDocumentFragment();
  const snapshotBoard = board.map((row) => [...row]);
  const consumedSources = new Set();
  const mergePlan = previousBoard ? buildMergePlan(previousBoard, direction) : new Map();
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

  snapshotBoard.forEach((row, rowIndex) => {
    row.forEach((value, columnIndex) => {
      if (value === 0) {
        return;
      }

      let sourceRow = rowIndex;
      let sourceColumn = columnIndex;
      let shouldAnimate = false;
      let mergingValue = null;
      const targetMerge = mergePlan.get(`${rowIndex}-${columnIndex}`);

      if (targetMerge) {
        mergingValue = targetMerge.value;
        [sourceRow, sourceColumn] = targetMerge.sources[0];
        shouldAnimate = sourceRow !== rowIndex || sourceColumn !== columnIndex;
      } else {
        const source = findMoveSource(
          rowIndex,
          columnIndex,
          value,
          previousBoard,
          direction,
          consumedSources,
          mergePlan
        );
        if (!source) {
          sourceRow = rowIndex;
          sourceColumn = columnIndex;
        } else {
        [sourceRow, sourceColumn] = source;
        shouldAnimate = sourceRow !== rowIndex || sourceColumn !== columnIndex;
        }
      }

      const tile = document.createElement("div");
      tile.className = "tile";
      tile.setAttribute("role", "gridcell");
      const displayValue = value;
      tile.textContent = String(displayValue);
      tile.dataset.value = String(displayValue);
      tile.dataset.row = rowIndex;
      tile.dataset.column = columnIndex;
      tile.setAttribute("aria-label", `Плитка ${displayValue}`);

      tile.style.setProperty("--row", shouldAnimate ? sourceRow : rowIndex);
      tile.style.setProperty("--column", shouldAnimate ? sourceColumn : columnIndex);

      const [background, color] = tileColors[value] || ["#3c3a32", "#f9f6f2"];
      tile.style.backgroundColor = background;
      tile.style.color = color;
      applyTileImage(tile, displayValue);

      if (shouldAnimate) {
        tile.classList.add("tile-moving");
        if (mergingValue) {
          tile.classList.add("tile-merging");
          tile.dataset.mergeTarget = "true";
          tile.dataset.mergeValue = String(mergingValue);
        }
      } else if (!shouldAnimate && (!previousBoard || previousBoard[rowIndex][columnIndex] === 0)) {
        tile.classList.add("tile-entering");
      }
      if (newlyDiscoveredValues.has(value)) {
        tile.classList.add("tile-new-value");
      }
      fragment.appendChild(tile);
    });
  });

  if (previousBoard) {
    mergePlan.forEach((merge, targetKey) => {
      const [targetRow, targetColumn] = targetKey.split("-").map(Number);

      merge.sources.slice(1).forEach(([sourceRow, sourceColumn]) => {
        const duplicate = document.createElement("div");
        duplicate.className = "tile tile-moving tile-merging";
        duplicate.setAttribute("role", "gridcell");
        const sourceValue = merge.value / 2;
        duplicate.textContent = String(sourceValue);
        duplicate.dataset.value = String(sourceValue);
        duplicate.dataset.row = targetRow;
        duplicate.dataset.column = targetColumn;
        duplicate.dataset.sourceRow = sourceRow;
        duplicate.dataset.sourceColumn = sourceColumn;
        duplicate.dataset.mergeValue = String(merge.value);
        duplicate.style.setProperty("--row", sourceRow);
        duplicate.style.setProperty("--column", sourceColumn);
        duplicate.style.zIndex = "20";
        applyTileImage(duplicate, sourceValue);
        fragment.appendChild(duplicate);
      });
    });
  }

  tileLayer.replaceChildren(fragment);
  undoButton.disabled = previousState === null || gameOver;

  if (previousBoard) {
    requestAnimationFrame(() => {
      if (previousLayer) {
        previousLayer.style.visibility = "hidden";
      }

      tileLayer.querySelectorAll(".tile[data-source-row]").forEach((duplicate) => {
        animateTileTo(
          duplicate,
          duplicate.dataset.row,
          duplicate.dataset.column,
          () => duplicate.remove()
        );
      });

      snapshotBoard.forEach((row, rowIndex) => {
        row.forEach((value, columnIndex) => {
          if (value) {
            const tile = tileLayer.querySelector(
              `.tile[data-row="${rowIndex}"][data-column="${columnIndex}"]`
            );

            if (tile) {
              if (tile.classList.contains("tile-moving")) {
                animateTileTo(tile, rowIndex, columnIndex, () => {
                  if (tile.dataset.mergeTarget === "true") {
                    const mergedValue = Number(tile.dataset.mergeValue);
                    tile.textContent = String(mergedValue);
                    tile.dataset.value = String(mergedValue);
                    tile.setAttribute("aria-label", `Плитка ${mergedValue}`);
                    applyTileImage(tile, mergedValue);
                  }
                  tile.classList.remove("tile-moving");
                  tile.classList.remove("tile-merging");
                });
              }
            }
          }
        });
      });

      if (previousLayer) {
        window.setTimeout(() => previousLayer.remove(), TILE_ANIMATION_MS);
      }
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
    return null;
  }

  const [row, column] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const value = Math.random() < 0.9 ? 2 : 4;
  board[row][column] = value;
  return [row, column, value];
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
  if (gameOver || isAnimating) {
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
  const newlyDiscoveredValues = new Set();
  addRandomTile();
  if (Math.random() < 0.25) {
    addRandomTile();
  }
  board.flat().forEach((value) => {
    if (value && !discoveredValues.has(value)) {
      newlyDiscoveredValues.add(value);
    }
  });
  rememberDiscoveredValues(newlyDiscoveredValues);
  renderBoard(JSON.parse(previousBoard), direction, newlyDiscoveredValues);
  isAnimating = true;
  window.setTimeout(() => {
    isAnimating = false;
  }, TILE_ANIMATION_MS);
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
  previousState = null;
  scoreSaved = false;
  saveScoreArea.hidden = false;
  playerNameInput.value = "";
  gameOverMessage.textContent = "Введите имя, чтобы сохранить результат.";
  updateMobileControls();
  gameOverModal.hidden = false;
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
  updateTheme();
  updateScore();
  saveGameState();
}

function startNewGame() {
  loadDiscoveredValues();
  board = createEmptyBoard();
  score = 0;
  gameOver = false;
  previousState = null;
  scoreSaved = false;
  gameOverModal.hidden = true;
  updateMobileControls();
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
  if (event.repeat || (event.target instanceof Element && event.target.matches("input, textarea, select"))) {
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
}, { passive: false });

boardElement.addEventListener("touchmove", (event) => {
  if (touchStart) {
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 10) {
      return;
    }
    event.preventDefault();
  }
}, { passive: false });

boardElement.addEventListener("touchcancel", () => {
  touchStart = null;
});

boardElement.addEventListener("touchend", (event) => {
  if (!touchStart) {
    return;
  }

  event.preventDefault();
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
}, { passive: false });

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
  updateMobileControls();
  if (soundEnabled && !audioPaused) {
    themeAudio.volume = DEFAULT_VOLUME;
    themeAudio.play().catch(() => {});
  }
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden && themeAudio.src && soundEnabled && !audioPaused) {
    themeAudio.volume = DEFAULT_VOLUME;
    themeAudio.play().catch(() => {});
  }
});

soundToggleButton.addEventListener("click", () => {
  if (!soundEnabled) {
    soundEnabled = true;
    audioPaused = false;
  } else {
    audioPaused = !audioPaused;
  }

  safeSet(SOUND_KEY, String(soundEnabled));
  safeSet(MUSIC_PAUSED_KEY, String(audioPaused));
  updateSoundButton();

  if (soundEnabled && !audioPaused) {
    const activeTheme = getActiveTheme();
    const nextSource = musicMode === "playlist"
      ? playlistTracks[playlistTrack]
      : activeTheme.audio;
    applyMusicSource(nextSource, true);
  } else {
    themeAudio.pause();
  }
});

musicModeSelect.addEventListener("change", () => {
  musicMode = musicModeSelect.value;
  soundEnabled = true;
  audioPaused = false;
  safeSet(MUSIC_MODE_KEY, musicMode);
  safeSet(SOUND_KEY, "true");
  safeSet(MUSIC_PAUSED_KEY, "false");
  updateMusicControls();
  updateSoundButton();
  setMusicSource({
    startPlayback: true,
    resetPosition: musicMode === "themes",
  });
});

playlistTrackSelect.addEventListener("change", () => {
  playlistTrack = playlistTrackSelect.value;
  safeSet(PLAYLIST_TRACK_KEY, playlistTrack);
  setMusicSource({ startPlayback: soundEnabled && !audioPaused });
});

bestScoreElement.textContent = getBestScore();
const savedGameState = getSavedGameState();

if (savedGameState) {
  board = savedGameState.board;
  score = savedGameState.score;
  gameOver = Boolean(savedGameState.gameOver);
  loadDiscoveredValues();
  board.flat().forEach((value) => {
    if (value) {
      discoveredValues.add(value);
    }
  });
  updateMobileControls();
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
