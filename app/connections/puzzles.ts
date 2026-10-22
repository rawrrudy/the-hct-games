export type PuzzleCategory = {
  name: string;
  words: [string, string, string, string];
  difficulty: "yellow" | "green" | "blue" | "purple";
};

export type ConnectionsPuzzle = {
  id: string;
  date: string;
  groups: [
    PuzzleCategory,
    PuzzleCategory,
    PuzzleCategory,
    PuzzleCategory
  ];
};

export const PUZZLES: ConnectionsPuzzle[] = [
  {
    id: "hct-001",
    date: "2026-10-22",
    groups: [
      {
        name: "FRUITS",
        words: ["APPLE", "ORANGE", "PEAR", "PLUM"],
        difficulty: "yellow",
      },
      {
        name: "PLANETS",
        words: ["MERCURY", "JUPITER", "MARS", "VENUS"],
        difficulty: "green",
      },
      {
        name: "MUSICAL INSTRUMENTS",
        words: ["BASS", "PIANO", "TRUMPET", "DRUM"],
        difficulty: "blue",
      },
      {
        name: "WORDS THAT GO WITH 'GUITAR'",
        words: ["HERO", "SOLO", "STRING", "RIFF"],
        difficulty: "purple",
      },
    ],
  },
];