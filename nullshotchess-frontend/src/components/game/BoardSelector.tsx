import { BoardDesign } from "@/pages/Arena";

interface BoardSelectorProps {
  selected: BoardDesign;
  onSelect: (board: BoardDesign) => void;
}

const BoardSelector = ({ selected, onSelect }: BoardSelectorProps) => {
  const boards: {
    value: BoardDesign;
    label: string;
    light: string;
    dark: string;
  }[] = [
    {
      value: "walnut",
      label: "Dark Walnut",
      light: "#C19A6B",
      dark: "#654321",
    },
    { value: "oak", label: "Light Oak", light: "#F5DEB3", dark: "#D2B48C" },
    {
      value: "marble",
      label: "Black Marble",
      light: "#E8E8E8",
      dark: "#1A1A1A",
    },
    { value: "jade", label: "Green Jade", light: "#A8E6CF", dark: "#00563F" },
    { value: "lapis", label: "Blue Lapis", light: "#87CEEB", dark: "#191970" },
    {
      value: "mahogany",
      label: "Rich Mahogany",
      light: "#CD5C5C",
      dark: "#420420",
    },
    { value: "ebony", label: "Pure Ebony", light: "#696969", dark: "#0A0A0A" },
    { value: "bamboo", label: "Bamboo", light: "#E3DAC9", dark: "#6B8E23" },
    { value: "rosewood", label: "Rosewood", light: "#B87333", dark: "#3B0918" },
    { value: "onyx", label: "Onyx Stone", light: "#DCDCDC", dark: "#353839" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {boards.map((board) => (
        <button
          key={board.value}
          onClick={() => onSelect(board.value)}
          className={`p-4 rounded-xl border-2 transition-all card-3d ${
            selected === board.value
              ? "border-accent shadow-glow-emerald"
              : "border-border hover:border-accent/50"
          }`}
        >
          {/* Checkerboard preview */}
          <div className="w-full h-14 md:h-20 rounded-lg mb-3 grid grid-cols-4 grid-rows-4 overflow-hidden">
            {Array.from({ length: 16 }).map((_, i) => {
              const row = Math.floor(i / 4);
              const col = i % 4;
              const isLight = (row + col) % 2 === 0;
              return (
                <div
                  key={i}
                  style={{
                    backgroundColor: isLight ? board.light : board.dark,
                  }}
                />
              );
            })}
          </div>
          <div className="text-sm font-medium text-center">{board.label}</div>
        </button>
      ))}
    </div>
  );
};

export default BoardSelector;
