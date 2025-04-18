// src/components/Tile.tsx
import { Tile, PlayerRole } from "../types";

type TileProps = {
  tile: Tile;
  playerRole: PlayerRole;
};

export default function TileComponent({ tile, playerRole }: TileProps) {
  const showTeamColor = playerRole === "spymaster" || tile.revealed;

  let background = "bg-gray-300"; // fallback
  if (showTeamColor) {
    switch (tile.team) {
      case "red":
        background = "bg-red-400";
        break;
      case "blue":
        background = "bg-blue-400";
        break;
      case "white":
        background = "bg-gray-100";
        break;
      case "black":
        background = "bg-black text-white";
        break;
    }
  }
  
  const showWord = !tile.revealed || tile.peeked;

  const numberToShow =
    tile.revealedBy === "operative" ? tile.adjacentReds
    : tile.revealedBy === "ai" ? tile.adjacentBlues
    : null;

  return (
    <div className={`border p-2 flex flex-col justify-center items-center w-[90px] h-[60px] ${background}`}>
      {showWord && <div className="text-center">{tile.word}</div>}
      {tile.revealed && numberToShow !== null && (
        <div className="text-sm mt-1">{numberToShow}</div>
      )}
    </div>
  );
}
