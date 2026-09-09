(function () {
  "use strict";

  const Logic = window.TotonoeruLogic;
  const TOTAL_ROUNDS = 3;
  const state = {
    difficulty: "easy", puzzles: [], roundIndex: 0, selectedIndex: null,
    hintPair: [], roundComplete: false, finishDelay: null
  };

  const elements = {
    startScreen: document.querySelector("#start-screen"),
    gameScreen: document.querySelector("#game-screen"),
    endScreen: document.querySelector("#end-screen"),
    startButton: document.querySelector("#start-button"),
    roundLabel: document.querySelector("#round-label"),
    difficultyLabel: document.querySelector("#difficulty-label"),
    targetBoard: document.querySelector("#target-board"),
    gameBoard: document.querySelector("#game-board"),
    guidance: document.querySelector("#move-guidance"),
    status: document.querySelector("#status-message"),
    hintButton: document.querySelector("#hint-button"),
    undoButton: document.querySelector("#undo-button"),
    resetButton: document.querySelector("#reset-button"),
    roundComplete: document.querySelector("#round-complete"),
    nextButton: document.querySelector("#next-button"),
    finishButton: document.querySelector("#finish-button"),
    replayButton: document.querySelector("#replay-button"),
    endMessage: document.querySelector("#end-message"),
    endActions: document.querySelector("#end-actions")
  };

  function currentPuzzle() { return state.puzzles[state.roundIndex]; }

  function setScreen(screenName) {
    elements.startScreen.hidden = screenName !== "start";
    elements.gameScreen.hidden = screenName !== "game";
    elements.endScreen.hidden = screenName !== "end";
  }

  function makeTileDescription(tile, position) {
    return `${position + 1}番、${tile.colorName}の${tile.symbolName}`;
  }

  function renderTarget(puzzle) {
    elements.targetBoard.innerHTML = "";
    elements.targetBoard.style.setProperty("--grid-size", puzzle.gridSize);
    puzzle.target.forEach((tileId, index) => {
      const tile = Logic.tileById(puzzle, tileId);
      const item = document.createElement("div");
      item.className = "target-tile";
      item.setAttribute("role", "img");
      item.style.setProperty("--tile-color", tile.color);
      item.textContent = tile.symbol;
      item.setAttribute("aria-label", makeTileDescription(tile, index));
      elements.targetBoard.appendChild(item);
    });
  }

  function renderBoard(options) {
    const puzzle = currentPuzzle();
    const focusIndex = options && Number.isInteger(options.focusIndex) ? options.focusIndex : null;
    elements.gameBoard.innerHTML = "";
    elements.gameBoard.style.setProperty("--grid-size", puzzle.gridSize);

    puzzle.current.forEach((tileId, index) => {
      const tile = Logic.tileById(puzzle, tileId);
      const button = document.createElement("button");
      const selected = state.selectedIndex === index;
      button.type = "button";
      button.className = "tile";
      button.dataset.index = String(index);
      button.style.setProperty("--tile-color", tile.color);
      button.setAttribute("aria-label", `${makeTileDescription(tile, index)}。${selected ? "選択中" : "選ぶ"}`);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
      button.disabled = state.roundComplete;
      if (selected) button.classList.add("is-selected");
      if (state.hintPair.includes(index)) button.classList.add("is-hint");

      const symbol = document.createElement("span");
      symbol.className = "tile-symbol";
      symbol.setAttribute("aria-hidden", "true");
      symbol.textContent = tile.symbol;
      const name = document.createElement("span");
      name.className = "tile-name";
      name.setAttribute("aria-hidden", "true");
      name.textContent = tile.colorName;
      button.append(symbol, name);
      elements.gameBoard.appendChild(button);
    });

    if (focusIndex !== null) {
      const focusTarget = elements.gameBoard.querySelector(`[data-index="${focusIndex}"]`);
      if (focusTarget) focusTarget.focus();
    }
  }

  function updateControls() {
    const puzzle = currentPuzzle();
    elements.undoButton.disabled = state.roundComplete || puzzle.history.length === 0;
    elements.hintButton.disabled = state.roundComplete;
    elements.resetButton.disabled = state.roundComplete || Logic.arraysEqual(puzzle.current, puzzle.initial);
  }

  function updateProgress() {
    for (let index = 0; index < TOTAL_ROUNDS; index += 1) {
      const segment = document.querySelector(`#progress-${index + 1}`);
      segment.className = index < state.roundIndex ? "is-done" : index === state.roundIndex ? "is-current" : "";
    }
  }

  function renderRound() {
    const puzzle = currentPuzzle();
    state.selectedIndex = null;
    state.hintPair = [];
    state.roundComplete = false;
    elements.roundLabel.textContent = `${state.roundIndex + 1}問目 / ${TOTAL_ROUNDS}問`;
    elements.difficultyLabel.textContent = state.difficulty === "easy" ? "やさしい" : "ふつう";
    elements.guidance.textContent = "入れ替える2枚を選びます";
    elements.status.textContent = "1枚目を選んでください。";
    elements.roundComplete.hidden = true;
    elements.nextButton.textContent = state.roundIndex === TOTAL_ROUNDS - 1 ? "おしまいへ" : "次の問題";
    renderTarget(puzzle);
    renderBoard();
    updateControls();
    updateProgress();
  }

  function beginSession() {
    clearTimeout(state.finishDelay);
    const selected = document.querySelector('input[name="difficulty"]:checked');
    state.difficulty = selected ? selected.value : "easy";
    state.puzzles = Array.from({ length: TOTAL_ROUNDS }, () => Logic.createPuzzle(state.difficulty));
    state.roundIndex = 0;
    elements.endMessage.textContent = "ここが今日の区切りです。";
    elements.endActions.hidden = false;
    setScreen("game");
    renderRound();
    elements.gameBoard.querySelector("button").focus();
  }

  function completeRound() {
    state.roundComplete = true;
    state.selectedIndex = null;
    state.hintPair = [];
    renderBoard();
    updateControls();
    elements.guidance.textContent = "見本と同じになりました";
    elements.status.textContent = "整いました。";
    if (state.roundIndex === TOTAL_ROUNDS - 1) {
      const prefersLessMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      state.finishDelay = window.setTimeout(showEnd, prefersLessMotion ? 0 : 700);
      return;
    }
    elements.roundComplete.hidden = false;
    elements.nextButton.focus();
  }

  function chooseTile(index) {
    if (state.roundComplete) return;
    state.hintPair = [];
    if (state.selectedIndex === null) {
      state.selectedIndex = index;
      elements.guidance.textContent = "もう1枚を選びます";
      elements.status.textContent = "1枚選びました。入れ替えるもう1枚を選んでください。";
      renderBoard({ focusIndex: index });
      return;
    }
    if (state.selectedIndex === index) {
      state.selectedIndex = null;
      elements.guidance.textContent = "入れ替える2枚を選びます";
      elements.status.textContent = "選択を外しました。";
      renderBoard({ focusIndex: index });
      return;
    }
    Logic.swap(currentPuzzle(), state.selectedIndex, index);
    state.selectedIndex = null;
    elements.guidance.textContent = "入れ替える2枚を選びます";
    if (Logic.isSolved(currentPuzzle())) completeRound();
    else {
      elements.status.textContent = "2枚を入れ替えました。続けて整えましょう。";
      renderBoard({ focusIndex: index });
      updateControls();
    }
  }

  function showHint() {
    state.selectedIndex = null;
    const pair = Logic.getHintPair(currentPuzzle());
    state.hintPair = pair || [];
    if (pair) {
      elements.status.textContent = "点線の2枚を入れ替えると、1枚が見本の位置に戻ります。";
      elements.guidance.textContent = "点線の2枚に注目";
      renderBoard({ focusIndex: pair[0] });
    }
  }

  function undoMove() {
    if (!Logic.undo(currentPuzzle())) return;
    state.selectedIndex = null;
    state.hintPair = [];
    elements.status.textContent = "ひとつ前の並びに戻しました。";
    elements.guidance.textContent = "入れ替える2枚を選びます";
    renderBoard();
    updateControls();
  }

  function resetRound() {
    Logic.reset(currentPuzzle());
    state.selectedIndex = null;
    state.hintPair = [];
    elements.status.textContent = "この問題の最初の並びに戻しました。";
    elements.guidance.textContent = "入れ替える2枚を選びます";
    renderBoard();
    updateControls();
  }

  function nextRound() {
    if (state.roundIndex >= TOTAL_ROUNDS - 1) return showEnd();
    state.roundIndex += 1;
    renderRound();
    elements.gameBoard.querySelector("button").focus();
  }

  function showEnd() {
    clearTimeout(state.finishDelay);
    setScreen("end");
    elements.finishButton.focus();
  }

  function finish() {
    elements.endMessage.textContent = "おつかれさまでした。この画面は閉じて大丈夫です。";
    elements.endActions.hidden = true;
    elements.endScreen.setAttribute("tabindex", "-1");
    elements.endScreen.focus({ preventScroll: true });
  }

  function handleBoardKeys(event) {
    const tile = event.target.closest(".tile");
    if (!tile || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const puzzle = currentPuzzle();
    const current = Number(tile.dataset.index);
    const offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -puzzle.gridSize, ArrowDown: puzzle.gridSize };
    let next = current + offsets[event.key];
    if (event.key === "ArrowLeft" && current % puzzle.gridSize === 0) next = current;
    if (event.key === "ArrowRight" && current % puzzle.gridSize === puzzle.gridSize - 1) next = current;
    if (next < 0 || next >= puzzle.current.length) next = current;
    const nextTile = elements.gameBoard.querySelector(`[data-index="${next}"]`);
    if (nextTile) nextTile.focus();
  }

  elements.startButton.addEventListener("click", beginSession);
  elements.gameBoard.addEventListener("click", (event) => {
    const tile = event.target.closest(".tile");
    if (tile) chooseTile(Number(tile.dataset.index));
  });
  elements.gameBoard.addEventListener("keydown", handleBoardKeys);
  elements.hintButton.addEventListener("click", showHint);
  elements.undoButton.addEventListener("click", undoMove);
  elements.resetButton.addEventListener("click", resetRound);
  elements.nextButton.addEventListener("click", nextRound);
  elements.finishButton.addEventListener("click", finish);
  elements.replayButton.addEventListener("click", beginSession);
})();
