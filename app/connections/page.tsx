
"use client";

import { useState } from "react";

const INITIAL_WORDS = [
  "APPLE", "MERCURY", "BASS", "JUPITER",
  "ORANGE", "PIANO", "PEAR", "TRUMPET",
  "MARS", "DRUM", "PLUM", "VENUS",
  "GUITAR", "BANANA", "CHERRY", "FLUTE",
];

export default function ConnectionsPage() {
  const [words, setWords] = useState(INITIAL_WORDS);
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  function toggleWord(word: string) {
    setMessage("");

    setSelected((current) => {
      if (current.includes(word)) {
        return current.filter((item) => item !== word);
      }

      if (current.length === 4) return current;

      return [...current, word];
    });
  }

  function shuffleWords() {
    setWords((current) => {
      const shuffled = [...current];

      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      return shuffled;
    });

    setSelected([]);
    setMessage("");
  }

  function submitGuess() {
    if (selected.length !== 4) {
      setMessage("Select four words first.");
      return;
    }

    setMessage("Game logic is coming next!");
  }

  return (
    <main className="min-h-screen bg-[#f8f8f6] px-4 py-8 text-[#121212]">
      <div className="mx-auto w-full max-w-[520px]">
        <header className="mb-8 flex items-center justify-between border-b-2 border-black pb-4">
          <a
            href="/"
            className="text-sm font-semibold hover:underline"
          >
            ← HCT Games
          </a>

          <h1 className="text-xl font-extrabold tracking-tight">
            Connections
          </h1>

          <div className="w-[76px]" />
        </header>

        <section className="mb-6 text-center">
          <h2 className="text-lg font-bold">
            Create four groups of four!
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            Find the connections between the words.
          </p>
        </section>

        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          {words.map((word) => {
            const isSelected = selected.includes(word);

            return (
              <button
                key={word}
                type="button"
                onClick={() => toggleWord(word)}
                aria-pressed={isSelected}
                className={`flex aspect-[1.05] min-w-0 items-center justify-center rounded-md px-1 text-[11px] font-extrabold transition-colors sm:text-sm ${
                  isSelected
                    ? "bg-[#5a594e] text-white"
                    : "bg-[#eae9e2] text-[#121212] hover:bg-[#deddd5]"
                }`}
              >
                {word}
              </button>
            );
          })}
        </div>

        <div className="mt-5 min-h-6 text-center text-sm font-medium">
          {message}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={shuffleWords}
            className="rounded-full border border-black px-4 py-2 text-sm font-semibold hover:bg-neutral-200"
          >
            Shuffle
          </button>

          <button
            type="button"
            onClick={() => {
              setSelected([]);
              setMessage("");
            }}
            className="rounded-full border border-black px-4 py-2 text-sm font-semibold hover:bg-neutral-200"
          >
            Deselect all
          </button>

          <button
            type="button"
            onClick={submitGuess}
            disabled={selected.length !== 4}
            className="rounded-full bg-black px-6 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-35"
          >
            Submit
          </button>
        </div>
      </div>
    </main>
  );
}
