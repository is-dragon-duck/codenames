import { Board } from "../types";
import { inferProvableBlueTiles, toInferenceBoard } from "./inference";

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
  

//   function revealProvableBlues(board: Board) {
//     let changed = true;
  
//     while (changed) {
//       changed = false;
  
//       for (let row = 0; row < board.length; row++) {
//         for (let col = 0; col < board[row].length; col++) {
//           const tile = board[row][col];
//           if (!tile.revealed) continue;
  
//           const expectedBlues = tile.revealedBy === "ai" ? tile.adjacentBlues : tile.adjacentReds;
  
//           const adjacent = getAdjacentTiles(board, row, col);
//           const unrevealedAdjacents = adjacent.filter(t => !t.revealed);
//           const revealedBlueAdjacents = adjacent.filter(t => t.revealed && t.team === "blue");
  
//           const bluesFound = revealedBlueAdjacents.length;
//           const unrevealedCount = unrevealedAdjacents.length;
  
//           const remainingExpectedBlues = expectedBlues - bluesFound;
  
//           // ✅ Only safe to reveal if all unrevealed must be blue
//           if (remainingExpectedBlues > 0 && remainingExpectedBlues === unrevealedCount) {
//             for (const t of unrevealedAdjacents) {
//               if (!t.revealed && t.team === "blue") {
//                 t.revealed = true;
//                 t.revealedBy = "ai";
//                 changed = true;
//               }
//             }
//           }
//         }
//       }
//     }
//   }
    
//   function getAdjacentTiles(board: Board, row: number, col: number) {
//     const tiles = [];
//     for (let dr = -1; dr <= 1; dr++) {
//       for (let dc = -1; dc <= 1; dc++) {
//         if (dr === 0 && dc === 0) continue;
//         const r = row + dr;
//         const c = col + dc;
//         if (r >= 0 && r < board.length && c >= 0 && c < board[0].length) {
//           tiles.push(board[r][c]);
//         }
//       }
//     }
//     return tiles;
//   }

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
        let provableBlues1 = inferProvableBlueTiles(toInferenceBoard(board));
        for (const [r, c] of provableBlues1) {
            const tile = board[r][c];
            if (!tile.revealed) {
            tile.revealed = true;
            tile.revealedBy = "ai";
            }
            changed = true;
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
        let provableBlues2 = inferProvableBlueTiles(toInferenceBoard(board));
        for (const [r, c] of provableBlues2) {
            const tile = board[r][c];
            if (!tile.revealed) {
            tile.revealed = true;
            tile.revealedBy = "ai";
            }
            changed = true;
        }
    }
  
    result = checkVictoryOrDefeat(board);
    if (result) {
      return;
    }
  
    revealRandomWhite(board);
  }
  
  export { doAITurn };
