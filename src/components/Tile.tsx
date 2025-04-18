type TileProps = {
  word: string;
};

export default function Tile({ word }: TileProps) {
  return (
    <div className="border p-4 flex justify-center items-center text-center min-h-[80px]">
      {word}
    </div>
  );
}
