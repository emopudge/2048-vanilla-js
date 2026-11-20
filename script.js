const boardElement = document.querySelector("#game-board");
const scoreElement = document.querySelector("#score");
const bestScoreElement = document.querySelector("#best-score");
const mobileControls = document.querySelector(".mobile-controls");
const newGameButton = document.querySelector("#new-game");
const gameOverModal = document.querySelector("#game-over-modal");
const restartAfterGameButton = document.querySelector("#restart-after-game");

const SIZE = 4;
const BEST_SCORE_KEY = "gosling-2048-best-score";
let board = [];
let score = 0;
let gameOver = false;

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
    return;
  }

  score += gainedScore;
  addRandomTile();
  renderBoard();
  updateScore();
}

function startNewGame() {
  board = createEmptyBoard();
  score = 0;
  gameOver = false;
  gameOverModal.hidden = true;
  mobileControls.hidden = false;
  addRandomTile();
  addRandomTile();
  renderBoard();
  updateScore();
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
restartAfterGameButton.addEventListener("click", startNewGame);

bestScoreElement.textContent = getBestScore();
startNewGame();
