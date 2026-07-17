export interface Game {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  status: "live" | "coming-soon" | "beta";
  playRoute: string | null;
  emoji: string;
  accentFrom: string;
  accentTo: string;
  modes: GameMode[];
  settings: GameSetting[];
}

export interface GameMode {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface GameSetting {
  id: string;
  label: string;
  options: string[];
  default: string;
}

export const games: Game[] = [
  {
    id: "geokurdistan",
    name: "GeoKurdistan",
    tagline: "Explore the Kurdistan Region",
    description:
      "Explore real landmarks across Erbil, Sulaymaniyah, Duhok and beyond using street-level imagery. Drop a pin and see how close you get.",
    category: "Geography",
    status: "live",
    playRoute: "/play/geokurdistan",
    emoji: "🗺️",
    accentFrom: "#7c3aed",
    accentTo: "#059669",
    modes: [
      {
        id: "offline",
        name: "Play Offline",
        description: "Just you, practice and explore at your own pace.",
        icon: "👤",
      },
      {
        id: "public",
        name: "Play Public",
        description: "Join a public matchmaking lobby and compete globally.",
        icon: "🌍",
      },
      {
        id: "private",
        name: "Create Private Room",
        description: "Play exclusively with your friends via a secret room code.",
        icon: "🔒",
      },
    ],
    settings: [
      {
        id: "rounds",
        label: "Rounds",
        options: ["5", "10", "25"],
        default: "5",
      },
      {
        id: "region",
        label: "Region",
        options: ["All Kurdistan", "Erbil Only", "Sulaymaniyah Only"],
        default: "All Kurdistan",
      },
    ],
  },
  {
    id: "triviabazaar",
    name: "TriviaBazaar",
    tagline: "Kurdistan Culture & History Quiz",
    description:
      "Test your knowledge of Kurdish history, culture, food, and traditions across timed trivia rounds.",
    category: "Trivia",
    status: "coming-soon",
    playRoute: null,
    emoji: "🧠",
    accentFrom: "#1d4ed8",
    accentTo: "#7c3aed",
    modes: [],
    settings: [],
  },
  {
    id: "flagrush",
    name: "Flag Rush",
    tagline: "Identify world flags in 3 seconds",
    description:
      "How fast can you name a flag? Race against the clock in this rapid-fire global flag identification challenge.",
    category: "Speed",
    status: "coming-soon",
    playRoute: null,
    emoji: "🏁",
    accentFrom: "#b45309",
    accentTo: "#dc2626",
    modes: [],
    settings: [],
  },
  {
    id: "wordkurd",
    name: "WordKurd",
    tagline: "Kurdish word guessing game",
    description:
      "Guess the hidden Kurdish word in 6 tries. A Wordle-inspired challenge in Sorani and Badini.",
    category: "Word",
    status: "coming-soon",
    playRoute: null,
    emoji: "🔤",
    accentFrom: "#065f46",
    accentTo: "#0891b2",
    modes: [],
    settings: [],
  },
];

export function getGameById(id: string): Game | undefined {
  return games.find((g) => g.id === id);
}
