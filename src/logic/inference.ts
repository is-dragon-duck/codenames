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
  
            const adjCoords = getAdjacentCoords(r, c);
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
  
    // Clone the board
    const workingBoard: InferenceTile[][] = board.map(row =>
      row.map(tile => ({
        possibleColors: [...tile.possibleColors],
        redAdjacencies: tile.redAdjacencies,
        blueAdjacencies: tile.blueAdjacencies
      }))
    );
  
    // Assign assumed color
    workingBoard[row][col].possibleColors = [assumedColor];
  
    // Count how many colors are already assigned
    let assignedRed = 0;
    let assignedBlue = 0;
    let assignedOther = 0;
  
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const tile = workingBoard[r][c];
        if (tile.possibleColors.length === 1) {
          if (tile.possibleColors[0] === "red") assignedRed++;
          if (tile.possibleColors[0] === "blue") assignedBlue++;
          if (tile.possibleColors[0] === "other") assignedOther++;
        }
      }
    }
  
    // Figure out how many we still need
    const remainingRed = globalRed - assignedRed;
    const remainingBlue = globalBlue - assignedBlue;
    const remainingOther = globalOther - assignedOther;
  
    // Build color pool
    const colorPool: PossibleColor[] = [];
    for (let i = 0; i < remainingRed; i++) colorPool.push("red");
    for (let i = 0; i < remainingBlue; i++) colorPool.push("blue");
    for (let i = 0; i < remainingOther; i++) colorPool.push("other");
  
    // Find unassigned cells
    const unassignedCoords: [number, number][] = [];
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        if (workingBoard[r][c].possibleColors.length > 1) {
          unassignedCoords.push([r, c]);
        }
      }
    }
  
    if (colorPool.length !== unassignedCoords.length) {
      // Mismatch! Impossible.
      return false;
    }
  
    // Shuffle colorPool randomly
    shuffleArray(colorPool);
  
    // Assign randomly
    for (let i = 0; i < unassignedCoords.length; i++) {
      const [r, c] = unassignedCoords[i];
      workingBoard[r][c].possibleColors = [colorPool[i]];
    }
  
    // Check for violations
    const violations = countViolations(workingBoard);
  
    return violations === 0;
  }
  
  function shuffleArray<T>(arr: T[]) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  
  function countViolations(board: InferenceTile[][]): number {
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
  
        if (tile.redAdjacencies !== null || tile.blueAdjacencies !== null) {
          const adjCoords = getAdjacentCoords(r, c);
  
          let redCount = 0;
          let blueCount = 0;
  
          for (const [nr, nc] of adjCoords) {
            const adjTile = board[nr][nc];
            if (adjTile.possibleColors.length === 1) {
              if (adjTile.possibleColors[0] === "red") redCount++;
              if (adjTile.possibleColors[0] === "blue") blueCount++;
            }
          }
  
          if (tile.redAdjacencies !== null) {
            violations += Math.abs(redCount - tile.redAdjacencies);
          }
  
          if (tile.blueAdjacencies !== null) {
            violations += Math.abs(blueCount - tile.blueAdjacencies);
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
  