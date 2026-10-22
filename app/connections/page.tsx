"use client";

import { useState } from "react";
import { PUZZLES } from "./puzzles";

import type { PuzzleCategory } from "./puzzles";

const CATEGORIES: PuzzleCategory[] = PUZZLES[0].groups;

const INITIAL_WORDS = PUZZLES[0].groups.flatMap(
  (group) => group.words
);

type SolvedGroup = PuzzleCategory;

const DIFFICULTY_COLORS = {
  yellow: { color: "#f9df6d", textColor: "#121212" },
  green: { color: "#a0c35a", textColor: "#121212" },
  blue: { color: "#b0c4ef", textColor: "#121212" },
  purple: { color: "#ba81c5", textColor: "#121212" },
};

export default function ConnectionsPage() {
  const [words, setWords] = useState(() =>
  [...INITIAL_WORDS].sort(() => Math.random() - 0.5)
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [solved, setSolved] = useState<SolvedGroup[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [message, setMessage] = useState("");

  const gameOver = solved.length === CATEGORIES.length || mistakes >= 4;

  function toggleWord(word: string) {
    if (gameOver || solved.some((group) => group.words.includes(word))) {
      return;
    }

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
    if (gameOver) return;

    setWords((current) => {
      const shuffled = [...current];

      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      return shuffled;
    });
  }

  function submitGuess() {
    if (selected.length !== 4 || gameOver) return;

    const category = CATEGORIES.find(
      (item) =>
        item.words.every((word) => selected.includes(word)) &&
        selected.every((word) => item.words.includes(word))
    );

    if (category) {
      setSolved((current) => [...current, category]);
      setWords((current) =>
        current.filter((word) => !selected.includes(word))
      );
      setSelected([]);
      setMessage("Correct! Nice work.");
      return;
    }

    const oneAway = CATEGORIES.some((item) => {
      if (solved.includes(item)) return false;

      const matches = selected.filter((word) =>
        item.words.includes(word)
      );

      return matches.length === 3;
    });

    const nextMistakes = mistakes + 1;
    setMistakes(nextMistakes);
    setSelected([]);

    if (nextMistakes >= 4) {
      setMessage("Game over! No mistakes left.");
    } else if (oneAway) {
      setMessage("One away...");
    } else {
      setMessage("Not quite. Try again!");
    }
  }

  function restartGame() {
    setWords(INITIAL_WORDS);
    setSelected([]);
    setSolved([]);
    setMistakes(0);
    setMessage("");
  }

  const shuffledSolved = [...solved].sort(
    (a, b) => CATEGORIES.indexOf(a) - CATEGORIES.indexOf(b)
  );

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

        <div className="mb-3 space-y-2">
          {shuffledSolved.map((group) => (
            <div
              key={group.name}
              className="flex min-h-[82px] flex-col items-center justify-center rounded-md px-3 py-3 text-center shadow-sm"
              style={{
                backgroundColor: DIFFICULTY_COLORS[group.difficulty].color,
                color: DIFFICULTY_COLORS[group.difficulty].textColor,
              }}
            >
              <p className="text-sm font-black tracking-wide">
                {group.name}
              </p>
              <p className="mt-1 text-xs font-semibold">
                {group.words.join(", ")}
              </p>
            </div>
          ))}
        </div>

        {words.length > 0 && (
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {words.map((word) => {
              const isSelected = selected.includes(word);

              return (
                <button
                  key={word}
                  type="button"
                  onClick={() => toggleWord(word)}
                  aria-pressed={isSelected}
                  className={`flex aspect-square min-w-0 items-center justify-center rounded-md px-1 text-[10px] font-extrabold leading-tight tranisiton-colors sm:text-sm ${
                    isSelected
                      ? "bg-[#5a594e] text-white"
                      : "bg-[#eae9e2] text-[#121212] hover:bg-[#deddd5]"
                  }`}
                >
                  <span className="break-words text-center">
                    {word}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-5 text-center text-sm font-medium" aria-live="polite">
          {message || (gameOver ? "" : `${mistakes} / 4 mistakes`)}
        </div>

        {!gameOver && (
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
        )}

        {gameOver && (
          <div className="mt-6 text-center">
            <h3 className="text-lg font-extrabold">
              {solved.length === 4 ? "You solved it!" : "Better luck next time!"}
            </h3>

            <p className="mt-2 text-sm text-neutral-600">
              You found {solved.length} of 4 groups and made {mistakes} mistakes.
            </p>

            {solved.length !== 4 && (
              <div className="mt-4 space-y-2">
                {CATEGORIES.filter((category) => !solved.includes(category)).map(
                  (category) => (
                    <div
                      key={category.name}
                      className="rounded-md px-3 py-2 text-sm font-bold"
                      style={{
                        backgroundColor: DIFFICULTY_COLORS[category.difficulty].color,
                        color: DIFFICULTY_COLORS[category.difficulty].textColor,
                      }}
                    >
                      {category.name}: {category.words.join(", ")}
                    </div>
                  )
                )}
              </div>
            )}

            <button
              type="button"
              onClick={restartGame}
              className="mt-5 rounded-full bg-black px-6 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
            >
              Play again
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
