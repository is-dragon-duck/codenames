import { Board } from "../types";
import { inferProvableBlueTiles, toInferenceBoard } from "./inference";
import type { GlobalCounts } from "./inference";

const globalCounts: GlobalCounts = {
    red: 12,
    blue: 9,
    other: 9
  };

function revealRandomBlue(board: Board) {
    const candidates = board.flatMap(row => row.filter(tile => tile.team === "blue" && !tile.revealed));
    if (candidates.length > 0) {
      const tile = candidates[Math.floor(Math.random() * candidates.length)];
      tile.revealed = true;
      tile.revealedBy = "ai";
    }
  }
  
  function revealRandomWhite(board: Board) {
    const candidates = board.flatMap(row => row.filter(tile => tile.team === "white" && !tile.revealed));
    if (candidates.length > 0) {
      const tile = candidates[Math.floor(Math.random() * candidates.length)];
      tile.revealed = true;
      tile.revealedBy = "ai";
    }
  }

  export function checkVictoryOrDefeat(board: Board): "victory" | "defeat" | null {
    let allRedsRevealed = true;
    let allBluesRevealed = true;
  
    for (const row of board) {
      for (const tile of row) {
        if (tile.team === "red" && !tile.revealed) {
          allRedsRevealed = false;
        }
        if (tile.team === "blue" && !tile.revealed) {
          allBluesRevealed = false;
        }
      }
    }
  
    if (allRedsRevealed) {
      return "victory";
    } else if (allBluesRevealed) {
      return "defeat";
    } else {
      return null;
    }
  }
  
  
  function doAITurn(board: Board) {
    // First reveal provable blues
    let changed = true;
    while (changed) {
        changed = false;
        let provableBlues1 = inferProvableBlueTiles(toInferenceBoard(board), globalCounts);
        for (const [r, c] of provableBlues1) {
            const tile = board[r][c];
            if (!tile.revealed) {
                tile.revealed = true;
                tile.revealedBy = "ai";
                changed = true;
            }
        }
    }
  
    let result = checkVictoryOrDefeat(board);
    if (result) {
      // AI won — players lose
      return;
    }
  
    revealRandomBlue(board);
  
    result = checkVictoryOrDefeat(board);
    if (result) {
      return;
    }
  
    // After random blue, reveal more provable blues
    changed = true;
    while (changed) {
        changed = false;
        let provableBlues2 = inferProvableBlueTiles(toInferenceBoard(board), globalCounts);
        for (const [r, c] of provableBlues2) {
            const tile = board[r][c];
            if (!tile.revealed) {
                tile.revealed = true;
                tile.revealedBy = "ai";
                changed = true;
            }
        }
    }
  
    result = checkVictoryOrDefeat(board);
    if (result) {
      return;
    }
  
    revealRandomWhite(board);
  }
  
  export { doAITurn };
