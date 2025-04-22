import { describe, it, expect } from "vitest";
import { inferProvableBlueTiles } from "./inference";

import type { InferenceTile } from "./inference";

describe("inferProvableBlueTiles", () => {
  it("finds a simple provable blue", () => {
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

    const result = inferProvableBlueTiles(board);

    console.log(result);

    expect(result.length).toEqual(2);
    expect(result).toContainEqual([0, 1]);
    expect(result).toContainEqual([1, 0]);
  });
});
