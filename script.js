const boardElement = document.querySelector("#game-board");

function createBoard() {
  const fragment = document.createDocumentFragment();

  for (let index = 0; index < 16; index += 1) {
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.setAttribute("role", "gridcell");
    tile.setAttribute("aria-label", "Пустая клетка");
    fragment.appendChild(tile);
  }

  boardElement.replaceChildren(fragment);
}

createBoard();
