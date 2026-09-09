"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const Logic = require("./logic.js");

function seededRandom(seed) {
  let value = seed >>> 0;
  return function () {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function solveUsingHints(puzzle) {
  let safety = 30;
  while (!Logic.isSolved(puzzle) && safety > 0) {
    const pair = Logic.getHintPair(puzzle);
    assert.ok(pair, "未完成ならヒントが得られる");
    assert.equal(Logic.swap(puzzle, pair[0], pair[1]), true);
    safety -= 1;
  }
  assert.ok(safety > 0, "有限回の入れ替えで解ける");
}

for (const difficulty of ["easy", "normal"]) {
  for (let seed = 1; seed <= 40; seed += 1) {
    const puzzle = Logic.createPuzzle(difficulty, seededRandom(seed));
    const expectedCount = difficulty === "easy" ? 4 : 9;
    assert.equal(puzzle.current.length, expectedCount);
    assert.equal(puzzle.target.length, expectedCount);
    assert.equal(new Set(puzzle.current).size, expectedCount, "タイルは重複しない");
    assert.equal(Logic.isSolved(puzzle), false, "最初から完成状態にはしない");
    solveUsingHints(puzzle);
    assert.equal(Logic.isSolved(puzzle), true);
  }
}

{
  const puzzle = Logic.createPuzzle("easy", seededRandom(99));
  const original = puzzle.current.slice();
  Logic.swap(puzzle, 0, 1);
  assert.notDeepEqual(puzzle.current, original);
  assert.equal(Logic.undo(puzzle), true);
  assert.deepEqual(puzzle.current, original, "1手戻すで直前の盤面へ戻る");
  Logic.swap(puzzle, 1, 2);
  assert.equal(Logic.reset(puzzle), true);
  assert.deepEqual(puzzle.current, puzzle.initial, "やり直しで初期盤面へ戻る");
  assert.equal(puzzle.history.length, 0);
}

{
  const session = Array.from({ length: 3 }, (_, index) => Logic.createPuzzle("normal", seededRandom(index + 200)));
  assert.equal(session.length, 3, "セッションは3問だけ生成する");
  session.forEach(solveUsingHints);
  assert.ok(session.every(Logic.isSolved), "3問すべて完了できる");
}

{
  const html = fs.readFileSync("index.html", "utf8");
  const app = fs.readFileSync("app.js", "utf8");
  const logic = fs.readFileSync("logic.js", "utf8");
  const gameRuntime = [app, logic].join("\n");
  assert.match(app, /TOTAL_ROUNDS = 3/, "1セッションは3問に固定する");
  assert.match(html, /styles\.css/);
  assert.doesNotMatch(gameRuntime, /https?:\/\/|fetch\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|setInterval/,
    "ゲーム本体に外部通信・継続記録・無限進行の仕組みを含めない");
  assert.equal((html.match(/<meta name="viewport"/g) || []).length, 1, "viewportは1つだけ置く");
  assert.equal((html.match(/<title>/g) || []).length, 1, "titleは1つだけ置く");
  assert.equal((html.match(/<script src="app\.js"><\/script>/g) || []).length, 1, "app.jsは1回だけ読み込む");
  assert.match(html, /<meta name="robots" content="index,follow">/, "一般公開型として検索を許可する");
  assert.match(html, /G-HE8F2XKJS6/, "共通のGA4測定IDを設定する");
  assert.match(html, /Google Analyticsを使用しています/, "GA4の外部送信について表示する");
  assert.match(html, /https:\/\/takoyaki-project\.github\.io\/totonoeru-puzzle\/ogp\.png/,
    "公開URLのOGP画像を設定する");
}

console.log("OK: 主要ロジック（80件の問題生成・入れ替え・ヒント・取り消し・やり直し・3問完了）");
