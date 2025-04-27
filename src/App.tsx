import { useState } from "react";
import { useEffect } from "react";
import BoardComponent from "./components/Board";
import { generateBoard } from "./lib/generateBoard";
import { Board, PlayerRole, LogEntry } from "./types";
import { doAITurn, checkVictoryOrDefeat } from "./logic/ai";
// import { useWebSocket } from "./hooks/useWebSocket";

function App() {
  const [board, setBoard] = useState<Board>(generateBoard());
  const [playerRole, setPlayerRole] = useState<PlayerRole>("spymaster");
  const [currentTurn, setCurrentTurn] = useState<PlayerRole>("spymaster");
  const [clueWord, setClueWord] = useState<string>("");
  const [clueNumber, setClueNumber] = useState<string>("0"); // can be "0", "∞", "1"..."9"
  const [gameLog, setGameLog] = useState<LogEntry[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [gameResult, setGameResult] = useState<"victory" | "defeat" | null>(null);
  
  const lastLog = gameLog[gameLog.length - 1];

  const markedCount = countMarkedTiles(board);
  const clueOptions = markedCount > 0
    ? ["0", "∞", markedCount.toString()]
    : ["0", "∞", 1];
  const { red, blue } = countRemainingTiles(board);
    

  // const { send } = useWebSocket(gameId, (incomingPayload) => {
  //   // incomingPayload is your new board state or full game state
  //   setBoard(incomingPayload.board);
  //   setCurrentTurn(incomingPayload.currentTurn);
  //   // any other things you need
  // });
    
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

  function countRemainingTiles(board: Board) {
    let red = 0;
    let blue = 0;
  
    for (const row of board) {
      for (const tile of row) {
        if (!tile.revealed) {
          if (tile.team === "red") red++;
          if (tile.team === "blue") blue++;
        }
      }
    }
  
    return { red, blue };
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
    if (gameOver) {
      return; // No actions after game ends
    }
    
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
          // TODO: somewhere in here is what we need to change, and probably need to do some refactoring
          // Confirm guess
          tile.revealed = true;
          tile.revealedBy = "operative";
          tile.peeked = false;
          tile.lockedPeek = false;
          tile.highlightedByOperative = false;

          const result = checkVictoryOrDefeat(newBoard);
          if (result) {
            setGameOver(true);
            setGameResult(result);
            return newBoard; // stop further processing
          }

          setGameLog(prev => {
            const newLog = [...prev];
            if (newLog.length > 0) {
              const lastEntry = newLog[newLog.length - 1];
              lastEntry.operativeGuesses.push({ word: tile.word, team: tile.team });
            }
            return newLog;
          });

          newBoard.forEach(row => row.forEach(t => t.highlightedByOperative = false));

          if (tile.team === "black") {
            setGameOver(true);
            setGameResult("defeat");
            return newBoard;
          }

          checkVictoryOrDefeat(newBoard);
    
          if (tile.team === "red") {
            // Correct guess → keep playing
            // No action needed
          } else if (tile.team === "blue" || tile.team === "white") {
            // Mistake → end turn
            endOperativeTurn(newBoard);
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
    doAITurn(board);

    const result = checkVictoryOrDefeat(board);
    if (result) {
      setGameOver(true);
      setGameResult(result);
    }

    setBoard(board);
    setCurrentTurn("spymaster");
  }

  function startNewGame() {
    setBoard(generateBoard());
    setCurrentTurn("spymaster");
    setClueWord("");
    setClueNumber("0");
    setGameLog([]);
    setGameOver(false);
    setGameResult(null);
  }  
    
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold my-2">Mines Variant</h1>

      {gameOver && (
        <div className="text-center text-3xl font-bold p-6">
          {gameResult === "victory" ? "🎉 Victory! You found all your words!" : "💀 Defeat! Better luck next time!"}
        </div>
      )}

      {/* New Game Button */}
      <button
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        onClick={startNewGame}
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

      {currentTurn === "operative" && playerRole === "operative" && (
        <div className="flex justify-center mt-4">
          <button
            className="px-6 py-3 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white text-lg font-semibold rounded-2xl shadow-md transition-all duration-200"
            onClick={() => endOperativeTurn(board)}
          >
            Pass Turn
          </button>
        </div>
      )}


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
            
              // Snapshot marked words
              const markedWords = board.flatMap(row =>
                row.filter(tile => tile.markedBySpymaster).map(tile => tile.word)
              );
            
              // Add new LogEntry
              setGameLog(prev => [
                ...prev,
                {
                  clueWord,
                  clueNumber,
                  markedWords,
                  operativeGuesses: []
                }
              ]);
            
              // Clear marked tiles
              setBoard(prevBoard => prevBoard.map(row => row.map(tile => ({ ...tile, markedBySpymaster: false }))));
            
              // Switch turn
              setCurrentTurn("operative");
            }}
          >
            Submit Clue (End Turn)
          </button>
        </div>
      )}

      {currentTurn === "operative" && lastLog && (
        <div className="mb-4 text-center">
          <div className="text-lg font-bold">Clue:</div>
          <div className="text-xl">{lastLog.clueWord} ({lastLog.clueNumber})</div>
        </div>
      )}

      <div className="mt-2 text-center">
        <div>Red tiles left: {red}</div>
        <div>Blue tiles left: {blue}</div>
      </div>

      {/* Board goes here */}
      <BoardComponent board={board} playerRole={playerRole} onTileClick={handleTileClick} onTileDoubleClick={handleTileDoubleClick} />
    </div>

  );
}

export default App;
