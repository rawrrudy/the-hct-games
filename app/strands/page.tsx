"use client";

import { useState } from "react";

const GRID = [
  ["B", "R", "E", "A", "D", "S"],
  ["C", "A", "K", "E", "T", "O"],
  ["O", "O", "K", "I", "E", "C"],
  ["P", "I", "E", "R", "S", "H"],
  ["T", "A", "R", "T", "S", "E"],
  ["D", "O", "N", "U", "T", "S"],
];

const WORDS = ["BREAD", "CAKE", "COOKIE", "PIE", "TART", "DONUT"];
const SPANGRAM = "DESSERTS";
const ALL_WORDS = [...WORDS, SPANGRAM];

function key(row: number, col: number) {
  return `${row}-${col}`;
}

export default function StrandsPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [found, setFound] = useState<string[]>([]);
  const [message, setMessage] = useState("Find the dessert themed words!");

  const selectedLetters = selected
    .map((cell) => {
      const [row, col] = cell.split("-").map(Number);
      return GRID[row][col];
    })
    .join("");

  function toggleCell(row: number,  col: number) {
    const cell = key(row, col);

    setSelected((current) => {
      if (current.includes(cell)) {
        return current.filter((item) => item !== cell);
      }

      return [...current, cell];
    });
  }

  function submitWord() {
    const word = selectedLetters;

    if (ALL_WORDS.includes(word) && !found.includes(word)) {
      setFound((current) => [...current, word]);
      setMessage(
        word === SPANGRAM
          ? "SPANGRAM FOUND! youre lowk cooking >:)"
          : `Nice! You found ${word}`
      );
    } else if (found.includes(word)) {
      setMessage("You've already found that word, silly!");
    } else {
      setMessage("That was a clever guess but it's not a theme word :(((");
    }

    setSelected([]);
  }

  const complete = ALL_WORDS.every((word) => found.includes(word));

  return (
    <main className="min-h-screen bg-[#FAF9F6] px-4 py-8 text-[#24241F]">
      <div className="mx-auto w-full max-w-lg">
        <header className="mb-8 flex items-center justify-between border-b border-[#E8E5DE] pb-4">
          <a href="/" className="text-sm font-semibold hover:underline">
            ← HCT Games
          </a>
          <h1 className="text-xl font-extrabold tracking-tight">Strands</h1>
          <span className="w-[76px]" />
        </header>

        <section className="mb-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#77766F]">
            HCT Strands
          </p>
          <h2 className="mt-2 text-2xl font-bold">Something sweet</h2>
          <p className="mt-2 text-sm text-[#77766F]">
            Find the words connected by today's theme!
          </p>
        </section>

        <div className="mb-5 rounded-2xl bg-[#E4E9F4] p-3 sm:p-5">
          <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
            {GRID.flatMap((row, rowIndex) =>
              row.map((letter, colIndex) => {
                const cell = key(rowIndex, colIndex);
                const isSelected = selected.includes(cell);

                return (
                  <button
                    key={cell}
                    type="button"
                    onClick={() => toggleCell(rowIndex, colIndex)}
                    aria-pressed={isSelected}
                    className={`aspect-square rounded-full text-sm font-extrabold transition sm:text-lg ${
                      isSelected
                        ? "bg-[#3974D6] text-white"
                        : "bg-white text-[#24241F] hover:bg-[#D3DDF1]"
                    }`}
                  >
                    {letter}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <p className="min-h-12 text-center text-sm font-medium" aria-live="polite">
          {complete ? "Puzzle complete! YAYAYAYAYAYAYAYAYAYA!!!!" : message}
        </p>

        <div className="mt-2 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => setSelected([])}
            className="rounded-full border border-[#24241F] px-5 py-2 text-sm font-semibold hover:bg-[#E8E5DE]"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={submitWord}
            disabled={selected.length === 0 || complete}
            className="rounded-fullbg-[#24241F] px-6 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-40"
          >
            Submit Word
          </button>
        </div>

        <section className="mt-8 border-t border-[#E8E5DE] pt-5">
          <h3 className="text-sm font-bold">Words found: {found.length}/{ALL_WORDS.length}</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {found.map((word) => (
              <span
                key={word}
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  word === SPANGRAM
                    ? "bg-[#F4D66D] text-[#24241F]"
                    : "bg-[#DCE6F8] text-[#24241F]"
                }`}
              >
                {word}
              </span>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}