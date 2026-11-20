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

const SIZE = 4;
const BEST_SCORE_KEY = "gosling-2048-best-score";
const GAME_STATE_KEY = "gosling-2048-game-state";
const LEADERBOARD_KEY = "gosling-2048-leaderboard";
let board = [];
let score = 0;
let gameOver = false;
let previousState = null;
let scoreSaved = false;

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

function renderBoard(previousBoard = null) {
  const fragment = document.createDocumentFragment();
  const consumedSources = new Set();

  for (let index = 0; index < 16; index += 1) {
    const cell = document.createElement("div");
    cell.className = "board-cell";
    cell.setAttribute("aria-hidden", "true");
    cell.style.setProperty("--row", Math.floor(index / SIZE));
    cell.style.setProperty("--column", index % SIZE);
    fragment.appendChild(cell);
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

      if (previousBoard) {
        if (previousBoard[rowIndex][columnIndex] === value) {
          shouldAnimate = true;
        } else {
          for (let oldRow = 0; oldRow < SIZE && !shouldAnimate; oldRow += 1) {
            for (let oldColumn = 0; oldColumn < SIZE; oldColumn += 1) {
              const sourceKey = `${oldRow}-${oldColumn}`;
              const oldValue = previousBoard[oldRow][oldColumn];
              const isMergeSource = value > 2 && oldValue === value / 2;
              const isMovedSource = oldValue === value;

              if (!consumedSources.has(sourceKey) && (isMergeSource || isMovedSource)) {
                consumedSources.add(sourceKey);
                sourceRow = oldRow;
                sourceColumn = oldColumn;
                shouldAnimate = oldRow !== rowIndex || oldColumn !== columnIndex;
                break;
              }
            }
          }
        }
      }

      tile.style.setProperty("--row", shouldAnimate ? sourceRow : rowIndex);
      tile.style.setProperty("--column", shouldAnimate ? sourceColumn : columnIndex);

      const [background, color] = tileColors[value] || ["#3c3a32", "#f9f6f2"];
      tile.style.backgroundColor = background;
      tile.style.color = color;

      if (shouldAnimate) {
        tile.classList.add("tile-moving");
        tile.classList.add("tile-entering");
      } else if (!previousBoard || previousBoard[rowIndex][columnIndex] === 0) {
        tile.classList.add("tile-entering");
      }
      fragment.appendChild(tile);
    });
  });

  boardElement.replaceChildren(fragment);
  undoButton.disabled = previousState === null || gameOver;

  if (previousBoard) {
    requestAnimationFrame(() => {
      board.forEach((row, rowIndex) => {
        row.forEach((value, columnIndex) => {
          if (value) {
            const tile = boardElement.querySelector(
              `.tile[data-row="${rowIndex}"][data-column="${columnIndex}"]`
            );

            if (tile) {
              tile.style.setProperty("--row", rowIndex);
              tile.style.setProperty("--column", columnIndex);
              tile.classList.remove("tile-moving");
            }
          }
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
  renderBoard(JSON.parse(previousBoard));
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

bestScoreElement.textContent = getBestScore();
const savedGameState = getSavedGameState();

if (savedGameState) {
  board = savedGameState.board;
  score = savedGameState.score;
  gameOver = Boolean(savedGameState.gameOver);
  mobileControls.hidden = gameOver;
  renderBoard();
  updateScore();

  if (gameOver) {
    gameOverModal.hidden = false;
  }
} else {
  startNewGame();
}
