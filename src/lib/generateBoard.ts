// src/lib/generateBoard.ts
import { Board, Tile, Team } from "../types";

// You can later replace this with a bigger word bank
const WORD_BANK = [
  "Sun", "Moon", "Star", "Sky", "Tree", "Rock", "River", "Ocean",
  "Fire", "Ice", "Wind", "Cloud", "Wolf", "Bear", "Eagle", "Fox",
  "Gold", "Silver", "Knight", "Sword", "Shield", "Dragon", "Castle", "Wizard",
  "Bridge", "Mountain", "Valley", "Forest", "Desert", "Island", "Ship", "Storm",
  "Meadow", "Jungle", "Cave", "Meteor", "Comet", "Canyon", "Dune", "Harbor"
];

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateBoard(): Board {
  const shuffledWords = shuffle(WORD_BANK).slice(0, 30); // 6x5 = 30 tiles

  const teams: Team[] = [
    ...Array(12).fill("red"),
    ...Array(9).fill("blue"),
    ...Array(8).fill("white"),
    "black",
  ];

  const shuffledTeams = shuffle(teams);

  // Create flat array of Tiles first
  const flatTiles: Tile[] = shuffledWords.map((word, i) => ({
    word,
    team: shuffledTeams[i],
    revealed: false,
    revealedBy: null,
    peeked: false,
    adjacentReds: 0,   // we'll compute these next
    adjacentBlues: 0,
  }));

  // Reshape into 6x5 board
  const board: Board = [];
  for (let row = 0; row < 5; row++) {
    board.push(flatTiles.slice(row * 6, (row + 1) * 6));
  }

  // Compute adjacency
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 6; c++) {
      const tile = board[r][c];
      let reds = 0;
      let blues = 0;

      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < 5 && nc >= 0 && nc < 6) {
            const neighbor = board[nr][nc];
            if (neighbor.team === "red") reds++;
            if (neighbor.team === "blue") blues++;
          }
        }
      }

      tile.adjacentReds = reds;
      tile.adjacentBlues = blues;
    }
  }

  return board;
}
