import { useState } from "react";
import BoardComponent from "./components/Board";
import { generateBoard } from "./lib/generateBoard";
import { Board, PlayerRole } from "./types";

function App() {
  const [board, setBoard] = useState<Board>(generateBoard());
  const [playerRole, setPlayerRole] = useState<PlayerRole>("spymaster");
  const [currentTurn, setCurrentTurn] = useState<PlayerRole>("spymaster");
  const [highlighted, setHighlighted] = useState<{ row: number; col: number } | null>(null);

  function revealRandomBlue(board: Board) {
    const unrevealedBlues = [];
    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[r].length; c++) {
        const tile = board[r][c];
        if (tile.team === "blue" && !tile.revealed) {
          unrevealedBlues.push({ row: r, col: c });
        }
      }
    }
  
    if (unrevealedBlues.length > 0) {
      const choice = unrevealedBlues[Math.floor(Math.random() * unrevealedBlues.length)];
      board[choice.row][choice.col].revealed = true;
      board[choice.row][choice.col].revealedBy = "ai";
    }
  }
  
  const handleTileClick = (row: number, col: number) => {
    setBoard(prevBoard => {
      const newBoard = prevBoard.map(row => row.map(tile => ({ ...tile })));
      const tile = newBoard[row][col];
  
      if (currentTurn !== "operative" || playerRole !== "operative") {
        // Still allow peeking during spymaster turn
        if (tile.revealed) {
          // Toggle peek
          tile.peeked = !tile.peeked;
          setHighlighted(null);
        }
        return newBoard;
      }
  
      if (!tile.revealed) {
        if (highlighted && highlighted.row === row && highlighted.col === col) {
          // Confirm guess (reveal)
          tile.revealed = true;
          tile.revealedBy = "operative";
          tile.peeked = false;
          tile.lockedPeek = false;
          setHighlighted(null);
  
          if (tile.team === "red") {
            // Correct guess, continue turn
            // No action needed
          } else if (tile.team === "blue" || tile.team === "white") {
            // Mistake, end turn after this click
            setCurrentTurn("spymaster");
            revealRandomBlue(newBoard);
          } else if (tile.team === "black") {
            // Assassin hit - game over logic (we'll expand later)
            alert("Game Over! You hit the assassin!");
            setCurrentTurn("spymaster"); // Freeze game basically for now
          }
        } else {
          // Highlight this tile
          setHighlighted({ row, col });
        }
      } else {
        // Already revealed tile → allow peek
        tile.peeked = !tile.peeked;
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
      <BoardComponent board={board} playerRole={playerRole} onTileClick={handleTileClick} onTileDoubleClick={handleTileDoubleClick} highlighted={highlighted} />
    </div>

  );
}

export default App;
