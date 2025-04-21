// src/types.ts
export type Team = "red" | "blue" | "white" | "black";

export type RevealedBy = "operative" | "ai" | null;

export type Tile = {
  word: string;
  team: Team;
  revealed: boolean;
  revealedBy: RevealedBy;
  peeked: boolean;
  lockedPeek: boolean;
  adjacentReds: number;
  adjacentBlues: number;
  markedBySpymaster: boolean;
  highlightedByOperative: boolean;
};

export type Board = Tile[][];

export type PlayerRole = "spymaster" | "operative";
