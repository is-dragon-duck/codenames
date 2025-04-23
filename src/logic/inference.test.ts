import { describe, it, expect } from "vitest";
import { inferProvableBlueTiles } from "./inference";

import type { InferenceTile, GlobalCounts } from "./inference";

describe("inferProvableBlueTiles", () => {
  it("finds a simple provable blue", () => {
    const globalCounts: GlobalCounts = {
        red: 1,
        blue: 2,
        other: 1
      };
    const board: InferenceTile[][] = [
      [
        { possibleColors: ["red"], redAdjacencies: null, blueAdjacencies: 2 },
        { possibleColors: ["red", "blue", "other"], redAdjacencies: null, blueAdjacencies: null },
      ],
      [
        { possibleColors: ["red", "blue", "other"], redAdjacencies: null, blueAdjacencies: null },
        { possibleColors: ["red", "other"], redAdjacencies: null, blueAdjacencies: null },
      ],
    ];

    const result = inferProvableBlueTiles(board, globalCounts);

    console.log(result);

    expect(result.length).toEqual(2);
    expect(result).toContainEqual([0, 1]);
    expect(result).toContainEqual([1, 0]);
  });
});
