// src/types.ts
export type Team = "red" | "blue" | "white" | "black";

export type RevealedBy = "operative" | "ai" | null;

export type Tile = {
  word: string;
  team: Team;
  revealed: boolean;
  revealedBy: RevealedBy;
  peeked: boolean;
  adjacentReds: number;
  adjacentBlues: number;
};

export type Board = Tile[][];

export type PlayerRole = "spymaster" | "operative";
