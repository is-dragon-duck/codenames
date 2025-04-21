import { useState } from "react";
import { useEffect } from "react";
import BoardComponent from "./components/Board";
import { generateBoard } from "./lib/generateBoard";
import { Board, PlayerRole } from "./types";

function App() {
  const [board, setBoard] = useState<Board>(generateBoard());
  const [playerRole, setPlayerRole] = useState<PlayerRole>("spymaster");
  const [currentTurn, setCurrentTurn] = useState<PlayerRole>("spymaster");
  // const [highlighted, setHighlighted] = useState<{ row: number; col: number } | null>(null);
  const [clueWord, setClueWord] = useState<string>("");
  const [clueNumber, setClueNumber] = useState<string>("0"); // can be "0", "∞", "1"..."9"

  const markedCount = countMarkedTiles(board);
  const clueOptions = markedCount > 0
    ? ["0", "∞", markedCount.toString()]
    : ["0", "∞", 1];
  
  useEffect(() => {
    const markedCount = countMarkedTiles(board);
    const validOptions = markedCount > 0
      ? ["0", "∞", markedCount.toString()]
      : ["0", "∞", "1"];
  
    if (clueNumber === "0" || clueNumber === "∞") {
      if (!validOptions.includes(clueNumber)) {
        setClueNumber("0"); // fallback if somehow broken (shouldn't happen)
      }
    } else {
      // Previous choice was "number" → always update to current markedCount
      setClueNumber(markedCount > 0 ? markedCount.toString() : "1");
    }
  }, [board]);

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

  function countMarkedTiles(board: Board) {
    let count = 0;
    for (const row of board) {
      for (const tile of row) {
        if (tile.markedBySpymaster) count++;
      }
    }
    return count;
  }  
  
  function handleTileClick(row: number, col: number) {
    setBoard(prevBoard => {
      const newBoard = prevBoard.map(row => row.map(tile => ({ ...tile })));
      const tile = newBoard[row][col];
  
      if (tile.revealed) {
        // Revealed tile → Peek toggle
        tile.peeked = !tile.peeked;
        if (tile.peeked && !tile.lockedPeek) {
          setTimeout(() => {
            setBoard(current => {
              const updated = current.map(r => r.map(t => ({ ...t })));
              const t = updated[row][col];
              if (t.peeked && !t.lockedPeek) {
                t.peeked = false;
              }
              return updated;
            });
          }, 3000);
        }
        return newBoard;
      }
  
      if (currentTurn === "spymaster" && playerRole === "spymaster") {
        // Spymaster selecting clue targets
        tile.markedBySpymaster = !tile.markedBySpymaster;
      } else if (currentTurn === "operative" && playerRole === "operative") {

        if (tile.highlightedByOperative) {
          // Confirm guess
          tile.revealed = true;
          tile.revealedBy = "operative";
          tile.peeked = false;
          tile.lockedPeek = false;
          tile.highlightedByOperative = false;

          newBoard.forEach(row => row.forEach(t => t.highlightedByOperative = false));
    
          if (tile.team === "red") {
            // Correct guess → keep playing
            // No action needed
          } else if (tile.team === "blue" || tile.team === "white") {
            // Mistake → end turn
            endOperativeTurn(newBoard);
          } else if (tile.team === "black") {
            // Assassin hit → end game
            alert("Game Over! You hit the assassin!");
            return newBoard;
          }
        } else {
          // Highlight this tile
          newBoard.forEach(row => row.forEach(t => t.highlightedByOperative = false));
          tile.highlightedByOperative = true;
        }
      }
  
      return newBoard;
    });
  };

  function anyMarkedTileIsWrong(board: Board) {
    for (const row of board) {
      for (const tile of row) {
        if (tile.markedBySpymaster && tile.team !== "red") {
          return true;
        }
      }
    }
    return false;
  }

  function handleTileDoubleClick(row: number, col: number) {
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

  function endOperativeTurn(board: Board) {
    revealRandomBlue(board);
    setBoard(board);
    setCurrentTurn("spymaster");
  }
    
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
        <div className="flex flex-col items-center mb-4 gap-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Enter clue"
              value={clueWord}
              onChange={e => setClueWord(e.target.value)}
              className="px-2 py-1 rounded border"
            />
            <select
              value={clueNumber}
              onChange={e => setClueNumber(e.target.value)}
              className="px-2 py-1 rounded border"
            >
              {clueOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Keep the same Submit button for now */}
          <button
            className="px-4 py-2 bg-red-500 text-white rounded"
            onClick={() => {
              if (anyMarkedTileIsWrong(board)) {
                if (!confirm("You have selected one or more tiles that aren't yours. Are you sure you want to submit this clue?")) {
                  return; // Cancel submit
                }
              }
            
              setBoard(prevBoard => prevBoard.map(row => row.map(tile => ({ ...tile, markedBySpymaster: false }))));
              setCurrentTurn("operative");
            }}
          >
            Submit Clue (End Turn)
          </button>
        </div>
      )}

      {currentTurn === "operative" && clueWord && (
        <div className="mb-4 text-center">
          <div className="text-lg font-bold">Clue:</div>
          <div className="text-xl">{clueWord} ({clueNumber})</div>
        </div>
      )}

      {/* Board goes here */}
      <BoardComponent board={board} playerRole={playerRole} onTileClick={handleTileClick} onTileDoubleClick={handleTileDoubleClick} />
    </div>

  );
}

export default App;
