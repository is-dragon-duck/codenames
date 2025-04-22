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
export function inferProvableBlueTiles(board: InferenceTile[][]): [number, number][] {
  const narrowedBoard = narrowColors(board);

  // TODO: implement hypothetical testing and constraint checking here

  const provableBlue: [number, number][] = [];

  // Basic placeholder: find tiles where only possible color is blue
  for (let r = 0; r < narrowedBoard.length; r++) {
    for (let c = 0; c < narrowedBoard[r].length; c++) {
      const tile = narrowedBoard[r][c];
      if (tile.possibleColors.length === 1 && tile.possibleColors[0] === "blue") {
        provableBlue.push([r, c]);
      }
    }
  }

  return provableBlue;
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
