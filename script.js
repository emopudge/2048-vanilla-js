const boardElement = document.querySelector("#game-board");
const scoreElement = document.querySelector("#score");
const bestScoreElement = document.querySelector("#best-score");
const mobileControls = document.querySelector(".mobile-controls");
const newGameButton = document.querySelector("#new-game");
const undoButton = document.querySelector("#undo");
const gameOverModal = document.querySelector("#game-over-modal");
const restartAfterGameButton = document.querySelector("#restart-after-game");

const SIZE = 4;
const BEST_SCORE_KEY = "gosling-2048-best-score";
const GAME_STATE_KEY = "gosling-2048-game-state";
let board = [];
let score = 0;
let gameOver = false;
let previousState = null;

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

  const parsedState = JSON.parse(savedState);
  const hasValidBoard = Array.isArray(parsedState.board)
    && parsedState.board.length === SIZE
    && parsedState.board.every((row) => Array.isArray(row) && row.length === SIZE);

  if (!hasValidBoard || typeof parsedState.score !== "number") {
    return null;
  }

  return parsedState;
}

function renderBoard() {
  const fragment = document.createDocumentFragment();

  board.flat().forEach((value) => {
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.setAttribute("role", "gridcell");

    if (value) {
      tile.textContent = value;
      tile.dataset.value = value;
      tile.setAttribute("aria-label", `Плитка ${value}`);

      const [background, color] = tileColors[value] || ["#3c3a32", "#f9f6f2"];
      tile.style.backgroundColor = background;
      tile.style.color = color;
    } else {
      tile.setAttribute("aria-label", "Пустая клетка");
    }

    fragment.appendChild(tile);
  });

  boardElement.replaceChildren(fragment);
  undoButton.disabled = previousState === null || gameOver;
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
  renderBoard();
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
  gameOverModal.hidden = true;
  mobileControls.hidden = false;
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

newGameButton.addEventListener("click", startNewGame);
undoButton.addEventListener("click", undoMove);
restartAfterGameButton.addEventListener("click", startNewGame);

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
