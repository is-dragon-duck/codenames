// src/components/Board.tsx
import TileComponent from "./Tile";
import { Board, PlayerRole } from "../types";

type BoardProps = {
  board: Board;
  playerRole: PlayerRole;
};

export default function BoardComponent({ board, playerRole }: BoardProps) {
  return (
    <div className="grid grid-cols-6 gap-2 p-4">
      {board.flat().map((tile, idx) => (
        <TileComponent key={idx} tile={tile} playerRole={playerRole} />
      ))}
    </div>
  );
}
