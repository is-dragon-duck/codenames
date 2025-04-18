import { useState } from "react";
import BoardComponent from "./components/Board";
import { generateBoard } from "./lib/generateBoard";
import { Board, PlayerRole } from "./types";

function App() {
  const [board, setBoard] = useState<Board>(generateBoard());
  const [playerRole, setPlayerRole] = useState<PlayerRole>("spymaster");
  const [currentTurn, setCurrentTurn] = useState<PlayerRole>("spymaster");

  const handleTileClick = (row: number, col: number) => {
    setBoard(prevBoard => {
      const newBoard = prevBoard.map(row => row.map(tile => ({ ...tile })));
      const tile = newBoard[row][col];
  
      if (!tile.revealed) {
        if (playerRole === "operative") {
          tile.revealed = true;
          tile.revealedBy = "operative";
        }
      } else if (!tile.peeked) {
        tile.peeked = true;
        tile.lockedPeek = false;
  
        setTimeout(() => {
          setBoard(currentBoard => {
            const updated = currentBoard.map(row => row.map(t => ({ ...t })));
            const t = updated[row][col];
            if (t.peeked && !t.lockedPeek) {
              t.peeked = false;
            }
            return updated;
          });
        }, 3000);
      } else if (tile.peeked && tile.lockedPeek) {
        tile.peeked = false;
        tile.lockedPeek = false;
      }
  
      return newBoard;
    });
  };
  
  const handleTileDoubleClick = (row: number, col: number) => {
    setBoard(prevBoard => {
      const newBoard = prevBoard.map(row => row.map(tile => ({ ...tile })));
      const tile = newBoard[row][col];
  
      if (tile.revealed) {
        tile.peeked = true;
        tile.lockedPeek = true;
      }
  
      return newBoard;
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold my-2">Mines Variant</h1>

      {/* New Game Button */}
      <button
        className="mb-4 px-4 py-2 bg-green-500 text-white rounded"
        onClick={() => {
          setBoard(generateBoard());
          setCurrentTurn("spymaster"); // we'll add this state soon
        }}
      >
        New Game
      </button>

      {/* Player Role Display */}
      <div className="text-lg font-semibold mb-2">
        {playerRole === "spymaster" ? "Spymaster View" : "Operative View"}
      </div>

      <div className="text-md mb-2">
        {currentTurn === "spymaster" ? "Spymaster's Turn" : "Operative's Turn"}
      </div>

      {/* Role Switch Button */}
      <button
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
        onClick={() =>
          setPlayerRole(prev => (prev === "spymaster" ? "operative" : "spymaster"))
        }
      >
        Switch to {playerRole === "spymaster" ? "Operative" : "Spymaster"}
      </button>

      {/* Show Submit button during Spymaster turn */}
      {currentTurn === "spymaster" && (
        <button
          className="mb-4 px-4 py-2 bg-red-500 text-white rounded"
          onClick={() => setCurrentTurn("operative")}
        >
          Submit Clue (End Turn)
        </button>
      )}

      {/* Board goes here */}
      <BoardComponent board={board} playerRole={playerRole} onTileClick={handleTileClick} onTileDoubleClick={handleTileDoubleClick} />
    </div>

  );
}

export default App;
