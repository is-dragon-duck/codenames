import Board from "./components/Board";

function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold my-4">Mines Variant</h1>
      <Board />
    </div>
  );
}

export default App;
