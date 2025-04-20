import TileComponent from "./Tile";
import { Board, PlayerRole } from "../types";

type BoardProps = {
  board: Board;
  playerRole: PlayerRole;
  onTileClick: (row: number, col: number) => void;
  onTileDoubleClick: (row: number, col: number) => void;
  highlighted: { row: number; col: number } | null;
};

export default function BoardComponent({ board, playerRole, onTileClick, onTileDoubleClick, highlighted }: BoardProps) {
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
            isHighlighted={highlighted?.row === rowIdx && highlighted?.col === colIdx}
          />
        ))
      )}
    </div>
  );
}
