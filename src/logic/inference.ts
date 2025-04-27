export type PossibleColor = "red" | "blue" | "other";

export type InferenceTile = {
  possibleColors: PossibleColor[];
  redAdjacencies: number | null;
  blueAdjacencies: number | null;
};

function narrowColors(board: InferenceTile[][]): InferenceTile[][] {
    const height = board.length;
    const width = board[0].length;
  
    const narrowedBoard = board.map(row => row.map(tile => ({ ...tile, possibleColors: [...tile.possibleColors] })));
  
    function countColorPossibility(tile: InferenceTile, color: PossibleColor) {
      return tile.possibleColors.includes(color);
    }
  
    function isForcedColor(tile: InferenceTile, color: PossibleColor) {
      return tile.possibleColors.length === 1 && tile.possibleColors[0] === color;
    }
  
    let changed = true;
    while (changed) {
      changed = false;
  
      for (let r = 0; r < height; r++) {
        for (let c = 0; c < width; c++) {
          const tile = narrowedBoard[r][c];
  
          const clues: { color: PossibleColor; count: number | null }[] = [
            { color: "red", count: tile.redAdjacencies },
            { color: "blue", count: tile.blueAdjacencies }
          ];
  
          for (const { color, count } of clues) {
            if (count === null) continue;
  
            const adjCoords = getAdjacentCoords(height, width, r, c);
            const adjacentTiles = adjCoords.map(([nr, nc]) => narrowedBoard[nr][nc]);
  
            const possible = adjacentTiles.filter(t => countColorPossibility(t, color));
            const forced = adjacentTiles.filter(t => isForcedColor(t, color));
  
            if (possible.length === count) {
              for (const t of possible) {
                if (t.possibleColors.length !== 1 || t.possibleColors[0] !== color) {
                  t.possibleColors = [color];
                  changed = true;
                }
              }
            }
  
            if (forced.length === count) {
              for (const t of adjacentTiles) {
                if (!isForcedColor(t, color) && t.possibleColors.includes(color)) {
                  t.possibleColors = t.possibleColors.filter(c => c !== color);
                  changed = true;
                }
              }
            }
          }
        }
      }
    }
  
    return narrowedBoard;
}
  

/**
 * Core inference function.
 * Returns list of coordinates [row, col] that are provably blue.
 */
export function inferProvableBlueTiles(board: InferenceTile[][], counts: GlobalCounts): [number, number][] {
    const height = board.length;
    const width = board[0].length;
  
    let workingBoard = board.map(row => row.map(tile => ({
      possibleColors: [...tile.possibleColors],
      redAdjacencies: tile.redAdjacencies,
      blueAdjacencies: tile.blueAdjacencies
    })));
  
    let changed = true;
    while (changed) {
      changed = false;
  
      const narrowed1 = narrowColors(workingBoard);
      console.log("Before1:", JSON.stringify(workingBoard));
      console.log("After1:", JSON.stringify(narrowed1));
      let equalFirstPass = boardsEqual(narrowed1, workingBoard);
      console.log("Equal1:", equalFirstPass);
      
      if (!boardsEqual(narrowed1, workingBoard)) {
        workingBoard = narrowed1;
        changed = true;
      }

      const narrowed2 = narrowColorsBySearch(workingBoard, counts);

      console.log("Before2:", JSON.stringify(workingBoard));
      console.log("After2:", JSON.stringify(narrowed2));
      let equalSecondPass = boardsEqual(narrowed2, workingBoard);
      console.log("Equal2:", equalSecondPass);
      
      if (!boardsEqual(narrowed2, workingBoard)) {
        workingBoard = narrowed2;
        changed = true;
      }
    }
  
    const provableBlue: [number, number][] = [];
  
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const tile = workingBoard[r][c];
        if (tile.possibleColors.length === 1 && tile.possibleColors[0] === "blue") {
          provableBlue.push([r, c]);
        }
      }
    }
  
    return provableBlue;
  }

  function boardsEqual(a: InferenceTile[][], b: InferenceTile[][]): boolean {
    for (let r = 0; r < a.length; r++) {
      for (let c = 0; c < a[r].length; c++) {
        const ac = [...a[r][c].possibleColors].sort().join(",");
        const bc = [...b[r][c].possibleColors].sort().join(",");
  
        if (ac !== bc) return false;
      }
    }
    return true;
  }
  

import type { Tile } from "../types"; // (wherever your Tile type lives)

export function toInferenceBoard(board: Tile[][]): InferenceTile[][] {
  const height = board.length;
  const width = board[0].length;

  const inferenceBoard: InferenceTile[][] = [];

  for (let r = 0; r < height; r++) {
    const row: InferenceTile[] = [];
    for (let c = 0; c < width; c++) {
      const tile = board[r][c];
      const possibleColors: PossibleColor[] = [];

      if (!tile.revealed) {
        // unrevealed tiles
        possibleColors.push("red", "blue", "other");
      } else {
        // revealed tiles
        if (tile.team === "red") {
          possibleColors.push("red");
        } else if (tile.team === "blue") {
          possibleColors.push("blue");
        } else {
          possibleColors.push("other");
        }
      }

      row.push({
        possibleColors,
        redAdjacencies: tile.revealed && tile.revealedBy === "operative" ? tile.adjacentReds : null,
        blueAdjacencies: tile.revealed && tile.revealedBy === "ai" ? tile.adjacentBlues : null
      });
    }
    inferenceBoard.push(row);
  }

  return inferenceBoard;
}

function canAssignAs(
    board: InferenceTile[][],
    row: number,
    col: number,
    assumedColor: PossibleColor,
    globalRed: number,
    globalBlue: number,
    globalOther: number
  ): boolean {
    const height = board.length;
    const width = board[0].length;
  
    // Step 1: Clone original board and set the hypothetical assignment
    const originalBoard = board.map(row =>
        row.map(tile => ({
          possibleColors: [...tile.possibleColors],
          redAdjacencies: tile.redAdjacencies,
          blueAdjacencies: tile.blueAdjacencies,
        }))
      );
    originalBoard[row][col].possibleColors = [assumedColor];

    const workingBoard = originalBoard.map(row =>
        row.map(tile => ({
            possibleColors: [...tile.possibleColors],
            redAdjacencies: tile.redAdjacencies,
            blueAdjacencies: tile.blueAdjacencies,
        }))
    );
      
    // Step 2: Assign the rest randomly
    const assignedCounts = { red: 0, blue: 0, other: 0 };
    const unassigned: [number, number][] = [];
  
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const tile = workingBoard[r][c];
        if (tile.possibleColors.length === 1) {
          if (tile.possibleColors[0] === "red") assignedCounts.red++;
          if (tile.possibleColors[0] === "blue") assignedCounts.blue++;
          if (tile.possibleColors[0] === "other") assignedCounts.other++;
        } else {
          unassigned.push([r, c]);
        }
      }
    }
  
    const colorPool: PossibleColor[] = [];
    for (let i = 0; i < globalRed - assignedCounts.red; i++) colorPool.push("red");
    for (let i = 0; i < globalBlue - assignedCounts.blue; i++) colorPool.push("blue");
    for (let i = 0; i < globalOther - assignedCounts.other; i++) colorPool.push("other");
  
    if (colorPool.length !== unassigned.length) return false;
  
    shuffleArray(colorPool);
  
    for (let i = 0; i < unassigned.length; i++) {
      const [r, c] = unassigned[i];
      workingBoard[r][c].possibleColors = [colorPool[i]];
    }
  
    let violations = countTotalViolations(workingBoard, originalBoard);
    if (violations === 0) return true;
  
    // Step 3: Hill climb
    for (let step = 0; step < 3000; step++) {
      const violators = findViolatorTiles(workingBoard, originalBoard);
  
      if (violators.length === 0) return true;
  
      const [r1, c1] = violators[Math.floor(Math.random() * violators.length)];
      const color1 = workingBoard[r1][c1].possibleColors[0];
  
      let bestViolations = violations;
      let bestSwap: [number, number] = [r1, c1];
      let tieCount = 0;
  
      for (let r2 = 0; r2 < height; r2++) {
        for (let c2 = 0; c2 < width; c2++) {
          if (r1 === r2 && c1 === c2) continue;
          if (originalBoard[r2][c2].possibleColors.length === 1) continue; // Can't swap into fixed tile
  
          const color2 = workingBoard[r2][c2].possibleColors[0];
          if (color1 === color2) continue;
  
          const tempBoard = workingBoard.map(row =>
            row.map(tile => ({ ...tile, possibleColors: [...tile.possibleColors] }))
          );
          tempBoard[r1][c1].possibleColors[0] = color2;
          tempBoard[r2][c2].possibleColors[0] = color1;
  
          const newViolations = countTotalViolations(tempBoard, originalBoard);
  
          if (newViolations < bestViolations) {
            bestViolations = newViolations;
            bestSwap = [r2, c2];
            tieCount = 0;
          } else if (newViolations === bestViolations) {
            tieCount++;
            if (Math.random() < 1.0 / (tieCount + 1)) {
              bestSwap = [r2, c2];
            }
          }
        }
      }
  
      const [rBest, cBest] = bestSwap;
  
      // Actually apply best swap
      const temp = workingBoard[r1][c1].possibleColors[0];
      workingBoard[r1][c1].possibleColors[0] = workingBoard[rBest][cBest].possibleColors[0];
      workingBoard[rBest][cBest].possibleColors[0] = temp;
  
      violations = countTotalViolations(workingBoard, originalBoard);
  
      if (violations === 0) return true;
    }
  
    return false;
  }
    
  function findViolatorTiles(board: InferenceTile[][], originalBoard: InferenceTile[][]): [number, number][] {
    const height = board.length;
    const width = board[0].length;
    const result = new Set<string>();
  
    function getAdjacentCoords(r: number, c: number): [number, number][] {
      const result: [number, number][] = [];
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < height && nc >= 0 && nc < width) {
            result.push([nr, nc]);
          }
        }
      }
      return result;
    }
  
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const tile = board[r][c];
        const originalTile = originalBoard[r][c];
  
        // (b) Color mismatch
        if (!originalTile.possibleColors.includes(tile.possibleColors[0])) {
          result.add(`${r},${c}`);
        }
  
        // (a) Clue mismatch adjacent tiles
        if (originalTile.redAdjacencies !== null || originalTile.blueAdjacencies !== null) {
          const adjacents = getAdjacentCoords(r, c);
          let redCount = 0;
          let blueCount = 0;
  
          for (const [ar, ac] of adjacents) {
            const adj = board[ar][ac];
            if (adj.possibleColors[0] === "red") redCount++;
            if (adj.possibleColors[0] === "blue") blueCount++;
          }
  
          if (originalTile.redAdjacencies !== null) {
            if (redCount > originalTile.redAdjacencies) {
              for (const [ar, ac] of adjacents) {
                if (board[ar][ac].possibleColors[0] === "red") {
                  result.add(`${ar},${ac}`);
                }
              }
            }
            if (redCount < originalTile.redAdjacencies) {
              for (const [ar, ac] of adjacents) {
                if (board[ar][ac].possibleColors[0] !== "red") {
                  result.add(`${ar},${ac}`);
                }
              }
            }
          }
  
          if (originalTile.blueAdjacencies !== null) {
            if (blueCount > originalTile.blueAdjacencies) {
              for (const [ar, ac] of adjacents) {
                if (board[ar][ac].possibleColors[0] === "blue") {
                  result.add(`${ar},${ac}`);
                }
              }
            }
            if (blueCount < originalTile.blueAdjacencies) {
              for (const [ar, ac] of adjacents) {
                if (board[ar][ac].possibleColors[0] !== "blue") {
                  result.add(`${ar},${ac}`);
                }
              }
            }
          }
        }
      }
    }
  
    // Filter out tiles that originally had only 1 possibility
    const final = Array.from(result)
      .map(s => s.split(",").map(Number) as [number, number])
      .filter(([r, c]) => originalBoard[r][c].possibleColors.length > 1);
  
    return final;
  }
  
  
  function shuffleArray<T>(arr: T[]) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  function getAdjacentCoords(height: number, width: number, r: number, c: number): [number, number][] {
    const result: [number, number][] = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < height && nc >= 0 && nc < width) {
          result.push([nr, nc]);
        }
      }
    }
    return result;
  }

  function countTotalViolations(board: InferenceTile[][], originalBoard: InferenceTile[][]): number {
    const height = board.length;
    const width = board[0].length;
    let violations = 0;
  
    function getAdjacentCoords(r: number, c: number): [number, number][] {
      const result: [number, number][] = [];
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < height && nc >= 0 && nc < width) {
            result.push([nr, nc]);
          }
        }
      }
      return result;
    }
  
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const tile = board[r][c];
        const originalTile = originalBoard[r][c];
  
        // (b) Color mismatch violation
        if (!originalTile.possibleColors.includes(tile.possibleColors[0])) {
          violations += 1;
        }
  
        // (a) Clue mismatch violations
        if (originalTile.redAdjacencies !== null || originalTile.blueAdjacencies !== null) {
          const adjacents = getAdjacentCoords(r, c);
          let redCount = 0;
          let blueCount = 0;
  
          for (const [ar, ac] of adjacents) {
            const adj = board[ar][ac];
            if (adj.possibleColors[0] === "red") redCount++;
            if (adj.possibleColors[0] === "blue") blueCount++;
          }
  
          if (originalTile.redAdjacencies !== null) {
            violations += Math.abs(redCount - originalTile.redAdjacencies);
          }
          if (originalTile.blueAdjacencies !== null) {
            violations += Math.abs(blueCount - originalTile.blueAdjacencies);
          }
        }
      }
    }
  
    return violations;
  }
  
  export type GlobalCounts = {
    red: number;
    blue: number;
    other: number;
  };
  
  function narrowColorsBySearch(board: InferenceTile[][], counts: GlobalCounts): InferenceTile[][] {
    const height = board.length;
    const width = board[0].length;
  
    const narrowedBoard = board.map(row => row.map(tile => ({
      possibleColors: [...tile.possibleColors],
      redAdjacencies: tile.redAdjacencies,
      blueAdjacencies: tile.blueAdjacencies
    })));
  
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const tile = narrowedBoard[r][c];
  
        if (tile.possibleColors.length <= 1) {
          continue; // Already forced, nothing to do
        }
  
        const newPossibleColors: PossibleColor[] = [];
  
        for (const color of tile.possibleColors) {
          const possible = canAssignAs(board, r, c, color, counts.red, counts.blue, counts.other);
          if (possible) {
            newPossibleColors.push(color);
          }
        }
  
        tile.possibleColors = newPossibleColors;
      }
    }
  
    return narrowedBoard;
  }
  