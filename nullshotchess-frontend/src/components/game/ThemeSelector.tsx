import { ChessTheme } from "@/pages/Arena";

interface ThemeSelectorProps {
  selected: ChessTheme;
  onSelect: (theme: ChessTheme) => void;
}

const ThemeSelector = ({ selected, onSelect }: ThemeSelectorProps) => {
  const themes: {
    value: ChessTheme;
    label: string;
    preview: string;
    accent: string;
  }[] = [
    {
      value: "classic",
      label: "Classic Wood",
      preview: "#8B4513",
      accent: "#D2691E",
    },
    {
      value: "marble",
      label: "Marble Palace",
      preview: "#F5F5DC",
      accent: "#C0C0C0",
    },
    {
      value: "mystic",
      label: "Mystic Forest",
      preview: "#0B3D0B",
      accent: "#228B22",
    },
    {
      value: "gold",
      label: "Gold Empire",
      preview: "#B8860B",
      accent: "#FFD700",
    },
    {
      value: "sapphire",
      label: "Sapphire Ocean",
      preview: "#0F52BA",
      accent: "#4169E1",
    },
    {
      value: "jade",
      label: "Jade Temple",
      preview: "#00A86B",
      accent: "#50C878",
    },
    {
      value: "ruby",
      label: "Ruby Throne",
      preview: "#9B111E",
      accent: "#E0115F",
    },
    {
      value: "obsidian",
      label: "Obsidian Night",
      preview: "#0A0A0A",
      accent: "#2F4F4F",
    },
    {
      value: "pearl",
      label: "Pearl Dream",
      preview: "#F0EAD6",
      accent: "#FFDAB9",
    },
    {
      value: "emerald",
      label: "Emerald Crown",
      preview: "#046307",
      accent: "#50C878",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 py-5">
      {themes.map((theme) => (
        <button
          key={theme.value}
          onClick={() => onSelect(theme.value)}
          className={`p-4 rounded-xl border-2 transition-all card-3d ${
            selected === theme.value
              ? "border-accent shadow-glow-emerald"
              : "border-border hover:border-accent/50"
          }`}
        >
          <div
            className="w-full h-10 md:h-20 rounded-lg mb-3 relative"
            style={{
              background: `linear-gradient(135deg, ${theme.preview} 0%, ${theme.accent} 100%)`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          </div>
          <div className="text-sm font-medium text-center">{theme.label}</div>
        </button>
      ))}
    </div>
  );
};

export default ThemeSelector;
