import { GameMode } from "@/pages/Arena";
import { Users, Bot } from "lucide-react";

interface GameModeSelectorProps {
  selected: GameMode;
  onSelect: (mode: GameMode) => void;
}

const GameModeSelector = ({ selected, onSelect }: GameModeSelectorProps) => {
  const modes = [
    {
      value: "human" as GameMode,
      label: "VS Another Player",
      description:
        "Local multiplayer - Play against a friend on the same device",
      icon: <Users className="w-12 h-12" />,
    },
    {
      value: "ai" as GameMode,
      label: "VS NullShot AI",
      description: "Challenge our AI agent powered by MCP technology",
      icon: <Bot className="w-12 h-12" />,
    },
  ];

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {modes.map((mode) => (
        <button
          key={mode.value}
          onClick={() => onSelect(mode.value)}
          className={`p-8 rounded-xl border-2 transition-all text-left card-3d ${
            selected === mode.value
              ? "border-accent bg-accent/10 shadow-glow-emerald"
              : "border-border hover:border-accent/50 bg-card"
          }`}
        >
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
            <div
              className={`${
                selected === mode.value
                  ? "text-accent"
                  : "text-muted-foreground"
              }`}
            >
              {mode.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-base md:text-xl font-semibold mb-2">
                {mode.label}
              </h3>
              <p className="text-sm text-muted-foreground">
                {mode.description}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default GameModeSelector;
