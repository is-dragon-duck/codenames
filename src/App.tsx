import { useState } from "react";
import BoardComponent from "./components/Board";
import { generateBoard } from "./lib/generateBoard";
import { Board, PlayerRole } from "./types";

function App() {
  const [board, setBoard] = useState<Board>(generateBoard());
  const [playerRole, setPlayerRole] = useState<PlayerRole>("spymaster");

  const handleTileClick = (row: number, col: number) => {
    if (playerRole !== "operative") return; // Only operative can click for now

    setBoard(prevBoard => {
      const newBoard = prevBoard.map(row => row.map(tile => ({ ...tile }))); // Deep copy
      const tile = newBoard[row][col];
      if (!tile.revealed) {
        tile.revealed = true;
        tile.revealedBy = "operative";
      }
      return newBoard;
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold my-4">Mines Variant</h1>
      <button
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
        onClick={() =>
          setPlayerRole(prev => (prev === "spymaster" ? "operative" : "spymaster"))
        }
      >
        Switch Role ({playerRole})
      </button>
      <BoardComponent board={board} playerRole={playerRole} onTileClick={handleTileClick} />
    </div>
  );
}

export default App;
