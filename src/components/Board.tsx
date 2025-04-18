import Tile from "./Tile";

const dummyWords = [
  "Sun", "Moon", "Star", "Sky",
  "Tree", "Rock", "River", "Ocean",
  "Fire", "Ice", "Wind", "Cloud",
  "Wolf", "Bear", "Eagle", "Fox"
];

export default function Board() {
  return (
    <div className="grid grid-cols-4 gap-2 p-4">
      {dummyWords.map((word, idx) => (
        <Tile key={idx} word={word} />
      ))}
    </div>
  );
}
