
"use client";

import { useCallback, useEffect, useState } from "react";

type TileState = "correct" | "present" | "absent" | "empty";
type GuessResult = Exclude<TileState, "empty">;

type GuessFeedback = {
  word: string;
  states: GuessResult[];
};

type SavedProgress = {
  guesses: GuessFeedback[];
  finished: boolean;
  message: string;
};

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

function isValidProgress(value: unknown): value is SavedProgress {
  if (!value || typeof value !== "object") return false;

  const progress = value as Partial<SavedProgress>;

  if (
    !Array.isArray(progress.guesses) ||
    progress.guesses.length > 6 ||
    typeof progress.finished !== "boolean" ||
    typeof progress.message !== "string"
  ) {
    return false;
  }

  return progress.guesses.every((guess) => {
    if (!guess || typeof guess.word !== "string") return false;
    if (!/^[A-Z]{5}$/.test(guess.word)) return false;
    if (!Array.isArray(guess.states) || guess.states.length !== 5) {
      return false;
    }

    return guess.states.every(
      (state) =>
        state === "correct" ||
        state === "present" ||
        state === "absent"
    );
  });
}

export default function WordlePage() {
  const [guesses, setGuesses] = useState<GuessFeedback[]>([]);
  const [current, setCurrent] = useState("");
  const [message, setMessage] = useState("");
  const [finished, setFinished] = useState(false);
  const [checking, setChecking] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [dailyDate, setDailyDate] = useState("");

  // Load today's saved game.
  useEffect(() => {
    let cancelled = false;

    async function loadProgress() {
      try {
        const response = await fetch("/api/daily-word", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Could not load today's puzzle");
        }

        const data: { date: string } = await response.json();

        if (cancelled) return;

        setDailyDate(data.date);

        const saved = localStorage.getItem(
          `hct-wordle-${data.date}`
        );

        if (saved) {
          try {
            const progress: unknown = JSON.parse(saved);

            if (isValidProgress(progress)) {
              setGuesses(progress.guesses);
              setFinished(progress.finished);
              setMessage(progress.message);
            }
          } catch {
            localStorage.removeItem(`hct-wordle-${data.date}`);
          }
        }
      } catch {
        if (!cancelled) {
          setMessage("Couldn't load today's puzzle. Refresh to retry.");
        }
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    void loadProgress();

    return () => {
      cancelled = true;
    };
  }, []);

  // Save progress whenever the game changes.
  useEffect(() => {
    if (!loaded || !dailyDate) return;

    const progress: SavedProgress = {
      guesses,
      finished,
      message,
    };

    try {
      localStorage.setItem(
        `hct-wordle-${dailyDate}`,
        JSON.stringify(progress)
      );
    } catch {
      // The game can continue if browser storage is unavailable.
    }
  }, [guesses, finished, message, loaded, dailyDate]);

  const submitGuess = useCallback(async () => {
    if (!loaded || finished || checking) return;

    if (current.length !== 5) {
      setMessage("Not enough letters");
      return;
    }

    const guess = current;

    setChecking(true);
    setMessage("");

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

      const data: {
        valid: boolean;
        states?: GuessResult[];
        won?: boolean;
        answer?: string;
      } = await response.json();

      if (
        !data.valid ||
        !data.states ||
        data.states.length !== 5 ||
        !data.states.every(
          (state) =>
            state === "correct" ||
            state === "present" ||
            state === "absent"
        )
      ) {
        setMessage("Not in word list");
        return;
      }

      const next: GuessFeedback[] = [
        ...guesses,
        { word: guess, states: data.states },
      ];

      setGuesses(next);
      setCurrent("");

      if (data.won) {
        setFinished(true);
        setMessage("Splendid!");
      } else if (next.length === 6) {
        setFinished(true);
        setMessage(`The word was ${data.answer ?? "unknown"}`);
      } else {
        setMessage("");
      }
    } catch {
      setMessage("Couldn't check word. Try again.");
    } finally {
      setChecking(false);
    }
  }, [current, finished, checking, loaded, guesses]);

  const handleKey = useCallback(
    (key: string) => {
      if (!loaded || finished || checking) return;

      if (key === "ENTER") {
        void submitGuess();
      } else if (key === "BACKSPACE") {
        setCurrent((value) => value.slice(0, -1));
        setMessage("");
      } else if (/^[A-Z]$/.test(key) && current.length < 5) {
        setCurrent((value) => value + key);
        setMessage("");
      }
    },
    [current, finished, checking, loaded, submitGuess]
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.ctrlKey ||
        event.altKey ||
        event.metaKey ||
        event.repeat
      ) {
        return;
      }

      if (/^[a-zA-Z]$/.test(event.key)) {
        handleKey(event.key.toUpperCase());
      } else if (event.key === "Enter") {
        handleKey("ENTER");
      } else if (event.key === "Backspace") {
        handleKey("BACKSPACE");
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [handleKey]);

  const keyboardStates: Record<string, TileState> = {};

  guesses.forEach(({ word, states }) => {
    states.forEach((state, index) => {
      const letter = word[index];
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
            setMessage(
              finished
                ? message
                : "Your daily puzzle can't be restarted."
            );
          }}
          disabled={!loaded || checking}
          className="text-sm text-[#D7DADC] hover:text-white disabled:opacity-50"
        >
          Restart
        </button>
      </header>

      <section className="mx-auto flex max-w-lg flex-col items-center px-3 pb-6 pt-6">
        <div className="grid w-full max-w-[350px] grid-cols-5 gap-[5px]">
          {Array.from({ length: 6 }).map((_, row) => {
            const submitted = guesses[row];
            const letters =
              submitted?.word ??
              (row === guesses.length && !finished ? current : "");

            return Array.from({ length: 5 }).map((_, col) => {
              const letter = letters[col] ?? "";
              const state: TileState = submitted
                ? submitted.states[col]
                : "empty";

              return (
                <div
                  key={`${row}-${col}`}
                  className={`flex aspect-square items-center justify-center border-2 text-2xl font-bold uppercase sm:text-3xl ${tileColors[state]} ${
                    submitted && row === guesses.length - 1
                      ? "hct-tile-flip"
                      : ""
                  }`}
                  style={
                    submitted && row === guesses.length - 1
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

        <p
          aria-live="polite"
          className="mt-4 h-6 text-center text-sm font-semibold"
        >
          {message}
        </p>

        <div className="mt-4 flex w-full flex-col gap-2">
          {keyboardRows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center gap-1.5">
              {row.map((key) => {
                const special =
                  key === "ENTER" || key === "BACKSPACE";
                const state = keyboardStates[key];

                return (
                  <button
                    key={key}
                    onClick={() => handleKey(key)}
                    disabled={!loaded || finished || checking}
                    aria-label={
                      key === "BACKSPACE" ? "Backspace" : key
                    }
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
          <p className="mt-6 text-sm text-[#D7DADC]">
            Come back tomorrow for a new wordle :P
          </p>
        )}
      </section>
    </main>
  );
}
