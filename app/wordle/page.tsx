"use client";

import { useCallback, useEffect, useState } from "react";

const ANSWER = "LIGHT";
const WORDS = [
  "LIGHT", "APPLE", "BRAIN", "CHAIR", "DREAM",
  "FLAME", "GRAPE", "HOUSE", "MUSIC", "PLANT",
  "QUIET", "SMILE", "STONE", "TRAIN", "WATER",
  "CRANE", "SLATE", "TRACE", "STARE", "CLOUD",
];

type TileState = "correct" | "present" | "absent" | "empty";

function evaluateGuess(guess: string, answer: string): TileState[] {
  const states: TileState[] = Array(5).fill("absent");
  const remaining = answer.split("");

  for (let i = 0; i < 5; i++) {
    if (guess[i] === answer[i]) {
      states[i] = "correct";
      remaining[i] = "";
    }
  }

  for (let i = 0; i < 5; i++) {
    if (states[i] === "correct") continue;
    const index = remaining.indexOf(guess[i]);
    if (index !== -1) {
      states[i] = "present";
      remaining[index] = "";
    }
  }

  return states;
}

const tileColors: Record<TileState, string> = {
  empty: "border-[#3A3A3C] bg-transparent",
  correct: "border-[#538D4E] bg-[#538D4E]",
  present: "border-[#B59F3B] bg-[#B59F3B]",
  absent: "border-[#3A3A3C] bg-[#3A3A3C]",
};

const keyboardRows = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
];

export default function WordlePage() {
  const [guesses, setGuesses] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [message, setMessage] = useState("");
  const [finished, setFinished] = useState(false);

  const submitGuess = useCallback(async () => {
    if (finished) return;

    if (current.length !== 5) {
      setMessage("Not enough letters");
      return;
    }

    const guess = current;

    try {
      const response = await fetch("/api/check-word", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ word: guess }),
      });

      if (!response.ok) {
        setMessage("Couldn't check word. Try again.");
        return;
      }

      const data: { valid: boolean } = await response.json();

      if (!data.valid) {
        setMessage("Not in the word list.");
        return;
      }

      const next = [...guesses, guess];

      setGuesses(next);
      setCurrent("");
      setMessage("");

      if (guess === ANSWER) {
        setFinished(true);
        setMessage("Splendid!");
      } else if (next.length === 6) {
        setFinished(true);
        setMessage(`The word ws ${ANSWER}`);
      }
    } catch {
      setMessage("Couldn't check word. Try again.");
    }
  }, [current, finished, guesses]);

  const handleKey = useCallback((key: string) => {
    if (finished) return;

    if (key === "ENTER") {
      submitGuess();
    } else if (key === "BACKSPACE") {
      setCurrent((value) => value.slice(0, -1));
      setMessage("");
    } else if (/^[A-Z]$/.test(key) && current.length < 5) {
      setCurrent((value) => value + key);
      setMessage("");
    }
  }, [current, finished, submitGuess]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (/^[a-zA-Z]$/.test(event.key)) {
        handleKey(event.key.toUpperCase());
      } else if (event.key === "Enter") {
        handleKey("ENTER");
      } else if (event.key === "Backspace") {
        handleKey("BACKSPACE");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleKey]);

  const keyboardStates: Record<string, TileState> = {};

  guesses.forEach((guess) => {
    evaluateGuess(guess, ANSWER).forEach((state, index) => {
      const letter = guess[index];
      const previous = keyboardStates[letter];

      if (
        state === "correct" ||
        (state === "present" && previous !== "correct") ||
        (!previous && state === "absent")
      ) {
        keyboardStates[letter] = state;
      }
    });
  });

  return (
    <main className="min-h-screen bg-[#121213] text-white">
      <header className="mx-auto flex max-w-2xl items-center justify-between border-b border-[#3A3A3C] px-4 py-4">
        <a href="/" className="text-sm text-[#D7DADC] hover:text-white">
          ← All games
        </a>
        <h1 className="text-2xl font-bold tracking-tight">Wordle</h1>
        <button
          onClick={() => {
            setGuesses([]);
            setCurrent("");
            setMessage("");
            setFinished(false);
          }}
          className="text-sm text-[#D7DADC] hover:text-white"
        >
          Restart
        </button>
      </header>

      <section className="mx-auto flex max-w-lg flex-col items-center px-3 pb-6 pt-6">
        <div className="grid w-full max-w-[350px] grid-cols-5 gap-[5px]">
          {Array.from({ length: 6 }).map((_, row) => {
            const guess = guesses[row];
            const letters =
              guess ?? (row === guesses.length ? current : "");
            const states = guess
              ? evaluateGuess(guess, ANSWER)
              : [];

            return Array.from({ length: 5 }).map((_, col) => {
              const letter = letters[col] ?? "";
              const state = guess ? states[col] : "empty";

              return (
                <div
                  key={`${row}-${col}-${guesses.length}`}
                  className={`flex aspect-square items-center justify-center border-2 text-2xl font-bold uppercase sm:text-3xl ${tileColors[state]} ${
                    guess && row === guesses.length - 1
                      ? "hct-tile-flip"
                      : ""
                  }`}
                  style={
                    guess && row === guesses.length - 1
                      ? { animationDelay: `${col * 180}ms` }
                      : undefined
                  }
                >
                  {letter}
                </div>
              );
            });
          })}
        </div>

        <p aria-live="polite" className="mt-4 h-6 text-center text-sm font-semibold">
          {message}
        </p>

        <div className="mt-4 flex w-full flex-col gap-2">
          {keyboardRows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center gap-1.5">
              {row.map((key) => {
                const special = key === "ENTER" || key === "BACKSPACE";
                const state = keyboardStates[key];

                return (
                  <button
                    key={key}
                    onClick={() => handleKey(key)}
                    disabled={finished}
                    aria-label={key === "BACKSPACE" ? "Backspace" : key}
                    className={`h-[58px] rounded-[4px] text-sm font-bold transition-colors disabled:cursor-default ${
                      special
                        ? "px-2 text-[10px] sm:px-3 sm:text-xs"
                        : "min-w-0 flex-1"
                    } ${
                      state === "correct"
                        ? "bg-[#538D4E] text-white"
                        : state === "present"
                        ? "bg-[#B59F3B] text-white"
                        : state === "absent"
                        ? "bg-[#3A3A3C] text-white"
                        : "bg-[#818384] text-white hover:bg-[#929495]"
                    }`}
                  >
                    {key === "BACKSPACE" ? "⌫" : key}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {finished && (
          <button
            onClick={() => {
              setGuesses([]);
              setCurrent("");
              setMessage("");
              setFinished(false);
            }}
            className="mt-6 rounded-full bg-white px-6 py-3 text-sm font-bold text-black hover:bg-gray-200"
          >
            Play again
          </button>
        )}
      </section>
    </main>
  );
}