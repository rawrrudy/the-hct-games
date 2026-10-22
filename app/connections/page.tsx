
"use client";

import { useEffect, useState } from "react";

type PuzzleCategory = {
  name: string;
  words: string[];
  level: number;
};

type PuzzleResponse = {
  id: number;
  date: string;
  groups: PuzzleCategory[];
};

const LEVEL_COLORS = [
  { color: "#f9df6d", textColor: "#121212" },
  { color: "#a0c35a", textColor: "#121212" },
  { color: "#b0c4ef", textColor: "#121212" },
  { color: "#ba81c5", textColor: "#ffffff" },
];

function shuffle<T>(items: T[]): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function getIndiaDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

export default function ConnectionsPage() {
  const [puzzle, setPuzzle] = useState<PuzzleResponse | null>(null);
  const [words, setWords] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [solved, setSolved] = useState<PuzzleCategory[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [message, setMessage] = useState("Loading today's puzzle...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadPuzzle() {
      setLoading(true);

      try {
        const response = await fetch("/api/connections", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Today's puzzle is unavailable.");
        }

        const data: PuzzleResponse = await response.json();

        if (
          !Array.isArray(data.groups) ||
          data.groups.length !== 4 ||
          data.groups.some(
            (group) =>
              !Array.isArray(group.words) ||
              group.words.length !== 4
          )
        ) {
          throw new Error("The puzzle data is invalid.");
        }

        const allWords = data.groups.flatMap((group) => group.words);

        if (new Set(allWords).size !== 16) {
          throw new Error("This puzzle contains duplicate words.");
        }

        if (!cancelled) {
          setPuzzle(data);
          setWords(shuffle(allWords));
          setMessage("");
        }
      } catch {
        if (!cancelled) {
          setMessage(
            "Couldn't load a puzzle. Please check your connection and try refreshing."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPuzzle();

    return () => {
      cancelled = true;
    };
  }, []);

  const gameOver =
    solved.length === 4 || mistakes >= 4;

  function toggleWord(word: string) {
    if (
      gameOver ||
      loading ||
      solved.some((group) => group.words.includes(word))
    ) {
      return;
    }

    setMessage("");

    setSelected((current) => {
      if (current.includes(word)) {
        return current.filter((item) => item !== word);
      }

      if (current.length >= 4) return current;

      return [...current, word];
    });
  }

  function shuffleWords() {
    if (gameOver || loading) return;
    setWords((current) => shuffle(current));
  }

  function submitGuess() {
    if (!puzzle || selected.length !== 4 || gameOver) return;

    const category = puzzle.groups.find(
      (group) =>
        group.words.every((word) => selected.includes(word)) &&
        selected.every((word) => group.words.includes(word))
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

    const oneAway = puzzle.groups.some((group) => {
      if (solved.includes(group)) return false;

      return (
        selected.filter((word) => group.words.includes(word)).length === 3
      );
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
    if (!puzzle) return;

    setWords(shuffle(puzzle.groups.flatMap((group) => group.words)));
    setSelected([]);
    setSolved([]);
    setMistakes(0);
    setMessage("");
  }

  const sortedSolved = [...solved].sort(
    (a, b) => a.level - b.level
  );

  if (loading || !puzzle) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f8f6] px-6 text-center text-[#121212]">
        <p className="max-w-md text-sm font-medium" aria-live="polite">
          {message}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f8f6] px-4 py-8 text-[#121212]">
      <div className="mx-auto w-full max-w-[520px]">
        <header className="mb-8 flex items-center justify-between border-b-2 border-black pb-4">
          <a href="/" className="text-sm font-semibold hover:underline">
            ← HCT Games
          </a>
          <h1 className="text-xl font-extrabold tracking-tight">
            Connections
          </h1>
          <div className="w-[76px]" />
        </header>

        <section className="mb-6 text-center">
          <h2 className="text-lg font-bold">Create four groups of four!</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Find the connections between the words.
          </p>
        </section>

        <div className="mb-3 space-y-2">
          {sortedSolved.map((group) => {
            const colors =
              LEVEL_COLORS[Math.min(Math.max(group.level, 0), 3)];

            return (
              <div
                key={group.name}
                className="flex min-h-[82px] flex-col items-center justify-center rounded-md px-3 py-3 text-center shadow-sm"
                style={{
                  backgroundColor: colors.color,
                  color: colors.textColor,
                }}
              >
                <p className="text-sm font-black tracking-wide">
                  {group.name}
                </p>
                <p className="mt-1 text-xs font-semibold">
                  {group.words.join(", ")}
                </p>
              </div>
            );
          })}
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
                  className={`flex aspect-square min-w-0 items-center justify-center rounded-md px-1 text-[10px] font-extrabold leading-tight transition-colors sm:text-sm ${
                    isSelected
                      ? "bg-[#5a594e] text-white"
                      : "bg-[#eae9e2] text-[#121212] hover:bg-[#deddd5]"
                  }`}
                >
                  <span className="break-words text-center">{word}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-5 min-h-6 text-center text-sm font-medium" aria-live="polite">
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
                {puzzle.groups
                  .filter((group) => !solved.includes(group))
                  .map((group) => {
                    const colors =
                      LEVEL_COLORS[Math.min(Math.max(group.level, 0), 3)];

                    return (
                      <div
                        key={group.name}
                        className="rounded-md px-3 py-2 text-sm font-bold"
                        style={{
                          backgroundColor: colors.color,
                          color: colors.textColor,
                        }}
                      >
                        {group.name}: {group.words.join(", ")}
                      </div>
                    );
                  })}
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
