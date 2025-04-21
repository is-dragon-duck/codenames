import TileComponent from "./Tile";
import { Board, PlayerRole } from "../types";

type BoardProps = {
  board: Board;
  playerRole: PlayerRole;
  onTileClick: (row: number, col: number) => void;
  onTileDoubleClick: (row: number, col: number) => void;
};

export default function BoardComponent({ board, playerRole, onTileClick, onTileDoubleClick }: BoardProps) {
  return (
    <div className="grid grid-cols-6 gap-2 p-4">
      {board.map((row, rowIdx) =>
        row.map((tile, colIdx) => (
          <TileComponent
            key={`${rowIdx}-${colIdx}`}
            tile={tile}
            playerRole={playerRole}
            onClick={() => onTileClick(rowIdx, colIdx)}
            onDoubleClick={() => onTileDoubleClick(rowIdx, colIdx)}
          />
        ))
      )}
    </div>
  );
}
