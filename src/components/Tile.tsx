import { Tile, PlayerRole } from "../types";

type TileProps = {
  tile: Tile;
  playerRole: PlayerRole;
  onClick: () => void;
  onDoubleClick: () => void;
  isHighlighted: boolean;
};

export default function TileComponent({ tile, playerRole, onClick, onDoubleClick, isHighlighted }: TileProps) {
  const showTeamColor = playerRole === "spymaster" || tile.revealed;

  let background = "bg-gray-300";
  if (showTeamColor) {
    if (tile.team === "red") background = "bg-red-400";
    else if (tile.team === "blue") background = "bg-blue-400";
    else if (tile.team === "white") background = "bg-gray-100";
    else if (tile.team === "black") background = "bg-black text-white";
  }

  const showWord = !tile.revealed || tile.peeked;

  const numberToShow =
    tile.revealedBy === "operative" ? tile.adjacentReds
    : tile.revealedBy === "ai" ? tile.adjacentBlues
    : null;

  return (
    <div
      className={`border p-2 flex flex-col justify-center items-center w-[90px] h-[60px] cursor-pointer ${background} ${
        isHighlighted ? "ring-4 ring-yellow-400" : ""
      }`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {showWord && <div className="text-center">{tile.word}</div>}
      {tile.revealed && numberToShow !== null && (
        <div className={`mt-1 px-2 py-1 rounded-full text-xs font-bold text-white ${
          tile.revealedBy === "operative" ? "bg-red-600" : "bg-blue-600"
        }`}>
          {numberToShow}
        </div>
      )}
    </div>
  );
}
