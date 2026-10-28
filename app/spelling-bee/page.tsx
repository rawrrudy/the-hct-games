
"use client";

import { useEffect, useState } from "react";

type Puzzle = {
  printDate: string;
  center: string;
  outer: string[];
  words: string[];
  pangrams: string[];
};

const POSITIONS = [
  { x: 0, y: -1 },
  { x: 1, y: -0.5 },
  { x: 1, y: 0.5 },
  { x: 0, y: 1 },
  { x: -1, y: 0.5 },
  { x: -1, y: -0.5 },
];

function scoreWord(word: string, pangrams: string[]) {
  if (word.length < 4) return 0;
  if (pangrams.includes(word)) return word.length + 7;
  return word.length === 4 ? 1 : word.length;
}

export default function SpellingBeePage() {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [error, setError] = useState("");
  const [input, setInput] = useState("");
  const [found, setFound] = useState<string[]>([]);
  const [message, setMessage] = useState("Loading today's hive...");
  const [shuffle, setShuffle] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadPuzzle() {
      try {
        const response = await fetch("/api/spelling-bee", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Today's puzzle could not be loaded.");
        }

        const data: Puzzle = await response.json();

        if (
          !data.center ||
          !Array.isArray(data.outer) ||
          data.outer.length !== 6 ||
          !Array.isArray(data.words) ||
          !Array.isArray(data.pangrams)
        ) {
          throw new Error("The puzzle data is incomplete.");
        }

        if (!cancelled) {
          setPuzzle(data);
          setMessage("Make words using the seven letters!");
        }
      } catch {
        if (!cancelled) {
          setError(
            "Couldn't load today's puzzle. Please refresh and try again."
          );
        }
      }
    }

    loadPuzzle();

    return () => {
      cancelled = true;
    };
  }, []);

  const score = puzzle
    ? found.reduce(
        (total, word) => total + scoreWord(word, puzzle.pangrams),
        0
      )
    : 0;

  const possibleScore = puzzle
    ? puzzle.words.reduce(
        (total, word) => total + scoreWord(word, puzzle.pangrams),
        0
      )
    : 0;

  const pangramFound = !!puzzle &&
    found.some((word) => puzzle.pangrams.includes(word));

  const shuffledOuter = puzzle
    ? puzzle.outer.map((_, index) => {
        const offset = shuffle % 6;
        return puzzle.outer[(index + offset) % 6];
      })
    : [];

  function submitWord() {
    if (!puzzle) return;

    const word = input.trim().toUpperCase();
    const allowedLetters = new Set([puzzle.center, ...puzzle.outer]);

    if (word.length < 4) {
      setMessage("Words must have at least four letters.");
    } else if (!word.includes(puzzle.center)) {
      setMessage(
        `Every word must contain the center letter ${puzzle.center}!`
      );
    } else if (![...word].every((letter) => allowedLetters.has(letter))) {
      setMessage("That word uses a letter outside today's hive.");
    } else if (found.includes(word)) {
      setMessage("You already found that word, silly!");
    } else if (!puzzle.words.includes(word)) {
      setMessage("Not in today's word list! Try another.");
    } else {
      setFound((current) => [...current, word]);
      setMessage(
        puzzle.pangrams.includes(word)
          ? "PANGRAM! You used all seven letters!"
          : `Nice! +${scoreWord(word, puzzle.pangrams)} points.`
      );
      setInput("");
    }
  }

  function addLetter(letter: string) {
    setInput((current) => current + letter);
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#FAF9F6] px-4 py-8 text-[#24241F]">
        <div className="mx-auto max-w-lg">
          <header className="mb-8 border-b border-[#E8E5DE] pb-4">
            <a href="/" className="text-sm font-semibold hover:underline">
              ← HCT Games
            </a>
          </header>
          <p role="alert" className="text-center text-sm font-semibold">
            {error}
          </p>
        </div>
      </main>
    );
  }

  if (!puzzle) {
    return (
      <main className="min-h-screen bg-[#FAF9F6] px-4 py-8 text-[#24241F]">
        <div className="mx-auto max-w-lg text-center">
          <a href="/" className="text-sm font-semibold hover:underline">
            ← HCT Games
          </a>
          <p className="mt-12 text-sm text-[#77766F]">
            Loading today's hive...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF9F6] px-4 py-8 text-[#24241F]">
      <div className="mx-auto w-full max-w-lg">
        <header className="mb-8 flex items-center justify-between border-b border-[#E8E5DE] pb-4">
          <a href="/" className="text-sm font-semibold hover:underline">
            ← HCT Games
          </a>
          <h1 className="text-xl font-semibold tracking-tight">
            Spelling Bee
          </h1>
          <span className="w-[76px]" />
        </header>

        <section className="mb-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#77766F]">
            HCT Spelling Bee · {puzzle.printDate}
          </p>
          <h2 className="mt-2 text-2xl font-bold">
            Make words using the given letters!
          </h2>
          <p className="mt-2 text-sm text-[#77766F]">
            Use the seven letters. Every word must contain the center letter.
          </p>
        </section>

        <div className="mb-5 rounded-2xl border border-[#E8E5DE] bg-white p-5">
          <div className="relative mx-auto h-[290px] w-[290px] max-w-full">
            {POSITIONS.map((position, index) => {
              const letter = shuffledOuter[index];

              return (
                <button
                  key={`${letter}-${index}`}
                  type="button"
                  onClick={() => addLetter(letter)}
                  style={{
                    left: `calc(50% + ${position.x * 84}px - 34px)`,
                    top: `calc(50% + ${position.y * 84}px - 34px)`,
                  }}
                  className="absolute flex h-[68px] w-[68px] items-center justify-center bg-[#E9E7DC] text-xl font-extrabold transition hover:bg-[#DAD6C7] active:scale-95"
                  aria-label={`Add letter ${letter}`}
                >
                  {letter}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => addLetter(puzzle.center)}
              className="absolute left-1/2 top-1/2 flex h-[76px] w-[76px] -translate-x-1/2 -translate-y-1/2 items-center justify-center bg-[#F2D66D] text-2xl font-extrabold transition hover:bg-[#E9C94E] active:scale-95"
              aria-label={`Add center letter ${puzzle.center}`}
            >
              {puzzle.center}
            </button>
          </div>

          <div className="mt-4 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => setInput((current) => current.slice(0, -1))}
              className="rounded-full border border-[#E8E5DE] px-4 py-2 text-sm font-semibold hover:bg-[#FAF9F6]"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => setInput("")}
              className="rounded-full border border-[#E8E5DE] px-4 py-2 text-sm font-semibold hover:bg-[#FAF9F6]"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setShuffle((current) => current + 1)}
              className="rounded-full border border-[#E8E5DE] px-4 py-2 text-sm font-semibold hover:bg-[#FAF9F6]"
            >
              Shuffle
            </button>
          </div>
        </div>

        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            submitWord();
          }}
        >
          <input
            value={input}
            onChange={(event) =>
              setInput(event.target.value.toUpperCase())
            }
            placeholder="Type a word..."
            autoComplete="off"
            className="min-w-0 flex-1 rounded-xl border border-[#E8E5DE] bg-white px-4 py-3 text-sm font-semibold uppercase outline-none focus:border-[#A49C83]"
            aria-label="Enter a word"
          />
          <button
            type="submit"
            className="rounded-xl bg-[#24241F] px-5 py-3 text-sm font-semibold text-white hover:bg-black"
          >
            Enter
          </button>
        </form>

        <p
          className="mt-3 min-h-6 text-center text-sm font-semibold"
          aria-live="polite"
        >
          {message}
        </p>

        <section className="mt-5 rounded-2xl bg-[#F2F0E9] p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#77766F]">
                Your score
              </p>
              <p className="mt-1 text-3xl font-extrabold tabular-nums">
                {score}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-[#77766F]">
                Words found
              </p>
              <p className="mt-1 text-xl font-bold">
                {found.length}/{puzzle.words.length}
              </p>
            </div>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#DDD9CC]">
            <div
              className="h-full rounded-full bg-[#B5A36B] transition-all"
              style={{
                width: `${Math.min(
                  100,
                  (score / Math.max(1, possibleScore)) * 100
                )}%`,
              }}
            />
          </div>

          <p className="mt-3 text-sm text-[#77766F]">
            {pangramFound
              ? "Pangram found! Excellent work."
              : "Find a pangram to earn bonus points."}
          </p>
        </section>

        <section className="mt-8 border-t border-[#E8E5DE] pt-5">
          <h3 className="text-sm font-bold">Words found</h3>
          {found.length === 0 ? (
            <p className="mt-3 text-sm text-[#77766F]">
              Your discovered words will appear here.
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {found.map((word) => (
                <span
                  key={word}
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    puzzle.pangrams.includes(word)
                      ? "bg-[#F4D66D]"
                      : "bg-[#E9E7DC]"
                  }`}
                >
                  {word}
                </span>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
