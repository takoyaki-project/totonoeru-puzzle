(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.TotonoeruLogic = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const PALETTES = [
    {
      name: "朝の光",
      colors: [
        { value: "#ffb05f", name: "だいだい" },
        { value: "#73c8d3", name: "みずいろ" },
        { value: "#ef8e7b", name: "さんご" }
      ]
    },
    {
      name: "森と空",
      colors: [
        { value: "#8fcf9e", name: "みどり" },
        { value: "#7db8e6", name: "あお" },
        { value: "#f3ca62", name: "きいろ" }
      ]
    },
    {
      name: "夕暮れ",
      colors: [
        { value: "#c6a0df", name: "むらさき" },
        { value: "#f29aaf", name: "ももいろ" },
        { value: "#73cfc0", name: "あおみどり" }
      ]
    }
  ];

  const SYMBOL_SETS = [
    [
      { glyph: "○", name: "まる" },
      { glyph: "△", name: "さんかく" },
      { glyph: "□", name: "しかく" }
    ],
    [
      { glyph: "◇", name: "ひしがた" },
      { glyph: "＋", name: "プラス" },
      { glyph: "＊", name: "ほし" }
    ],
    [
      { glyph: "●", name: "くろまる" },
      { glyph: "▲", name: "くろさんかく" },
      { glyph: "■", name: "くろしかく" }
    ]
  ];

  const TARGET_PATTERNS = {
    easy: [
      [0, 1, 2, 3],
      [0, 2, 3, 1],
      [3, 1, 0, 2],
      [1, 3, 2, 0]
    ],
    normal: [
      [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [0, 3, 6, 1, 4, 7, 2, 5, 8],
      [0, 1, 2, 7, 8, 3, 6, 5, 4],
      [4, 0, 8, 2, 6, 1, 7, 3, 5]
    ]
  };

  function pick(items, random) {
    return items[Math.floor(random() * items.length)];
  }

  function createTiles(difficulty, palette, symbols) {
    const count = difficulty === "easy" ? 4 : 9;
    const colorCount = difficulty === "easy" ? 2 : 3;
    const symbolCount = difficulty === "easy" ? 2 : 3;
    const tiles = [];

    for (let index = 0; index < count; index += 1) {
      const color = palette.colors[Math.floor(index / symbolCount) % colorCount];
      const symbol = symbols[index % symbolCount];
      tiles.push({
        id: `tile-${index}`,
        color: color.value,
        colorName: color.name,
        symbol: symbol.glyph,
        symbolName: symbol.name
      });
    }
    return tiles;
  }

  function arraysEqual(a, b) {
    return a.length === b.length && a.every((value, index) => value === b[index]);
  }

  function scramble(target, difficulty, random) {
    const result = target.slice();
    const swaps = difficulty === "easy" ? 2 : 5;

    for (let step = 0; step < swaps; step += 1) {
      const first = Math.floor(random() * result.length);
      let second = Math.floor(random() * result.length);
      if (second === first) second = (second + 1) % result.length;
      [result[first], result[second]] = [result[second], result[first]];
    }

    if (arraysEqual(result, target)) {
      [result[0], result[1]] = [result[1], result[0]];
    }
    return result;
  }

  function createPuzzle(difficulty, random) {
    const level = difficulty === "normal" ? "normal" : "easy";
    const rng = typeof random === "function" ? random : Math.random;
    const palette = pick(PALETTES, rng);
    const symbols = pick(SYMBOL_SETS, rng);
    const pattern = pick(TARGET_PATTERNS[level], rng);
    const tiles = createTiles(level, palette, symbols);
    const target = pattern.map((tileIndex) => tiles[tileIndex].id);
    const initial = scramble(target, level, rng);

    return {
      difficulty: level,
      gridSize: level === "easy" ? 2 : 3,
      paletteName: palette.name,
      tiles,
      target,
      initial,
      current: initial.slice(),
      history: []
    };
  }

  function swap(puzzle, first, second) {
    if (!puzzle || first === second) return false;
    if (first < 0 || second < 0 || first >= puzzle.current.length || second >= puzzle.current.length) return false;
    puzzle.history.push(puzzle.current.slice());
    [puzzle.current[first], puzzle.current[second]] = [puzzle.current[second], puzzle.current[first]];
    return true;
  }

  function undo(puzzle) {
    if (!puzzle || puzzle.history.length === 0) return false;
    puzzle.current = puzzle.history.pop();
    return true;
  }

  function reset(puzzle) {
    if (!puzzle) return false;
    puzzle.current = puzzle.initial.slice();
    puzzle.history = [];
    return true;
  }

  function isSolved(puzzle) {
    return Boolean(puzzle && arraysEqual(puzzle.current, puzzle.target));
  }

  function getHintPair(puzzle) {
    if (!puzzle || isSolved(puzzle)) return null;
    const wrongIndex = puzzle.current.findIndex((tileId, index) => tileId !== puzzle.target[index]);
    if (wrongIndex < 0) return null;
    const matchingIndex = puzzle.current.indexOf(puzzle.target[wrongIndex]);
    return matchingIndex >= 0 ? [wrongIndex, matchingIndex] : null;
  }

  function tileById(puzzle, id) {
    return puzzle.tiles.find((tile) => tile.id === id) || null;
  }

  return {
    PALETTES,
    SYMBOL_SETS,
    TARGET_PATTERNS,
    createPuzzle,
    swap,
    undo,
    reset,
    isSolved,
    getHintPair,
    tileById,
    arraysEqual
  };
});
