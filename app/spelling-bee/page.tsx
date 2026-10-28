"use cient";

import { useState } from "react";

const PUZZLE = {
  center: "A",
  outer: ["C", "E", "L", "N", "R", "T"],
  words: [
    "ACRE", "ACNE", "ACRE", "ANTE", "AREA", "CANE", "CARE",
    "CART", "CATER", "CENT", "CLEAN", "CLEAR", "EARN", "EARNER",
    "EATER", "ELATE", "ENACT", "ENTER", "LACE", "LATER", "LATERAL",
    "LEARN", "LEAN", "LENT", "NEAR", "NEAT", "RACE", "RACER",
    "RANT", "RATE", "RATER", "REAL", "RENT", "TALENT", "TALC",
    "TEAR", "TERN", "TRACE", "TRANCE"
  ],
  pangrams: ["LATERAL"],
};

const LETTERS = [
  { letter: PUZZLE.outer[0], x: 0, y: -1 },
  { letter: PUZZLE.outer[1], x: 1, y: -0.5 },
  { letter: PUZZLE.outer[2], x: 1, y: 0.5 },
  { letter: PUZZLE.outer[3], x: 0, y: 1 },
  { letter: PUZZLE.outer[4], x: -1, y: 0.5 },
  { letter: PUZZLE.outer[5], x: -1, y: -0.5 },
];

function scoreWord(word: string) {
  if (word.length < 4) return 0;
  if (PUZZLE.pangrams.includes(word)) return word.length + 7;
  return word.length === 4 ? 1 : word.length;
}

export default function SpellingBeePage() {
  const [input, setInput] = useState("");
  const [found, setFound] = useState<string[]>([]);
  const [message, setMessage] = useState("Make words using the seven letters!");
  const [shuffle, setShuffle] = useState(0);

  const score = found.reduce((total, word) => total + scoreWord(word), 0);
  const possibleScore = PUZZLE.words.reduce(
    (total, word) => total + scoreWord(word),
    0
  );
  const pangramFound = found.some((word) => PUZZLE.pangrams.includes(word));

  function submitWord() {
    const word = input.toUpperCase().trim();
    const allowedLetters = new Set([PUZZLE.center, ...PUZZLE.outer]);

    if (word.length < 4) {
      setMessage("Words must have at least four letters.");
    } else if (!word.includes(PUZZLE.center)) {
      setMessage(`Every word must contain the center letter ${PUZZLE.center}!`);
    } else if (![...word].every((letter) => allowedLetters.has(letter))) {
      setMessage("That word uses a letter outside today's hive :(");
    } else if (found.includes(word)) {
      setMessage("You already found that word, silly!");
    } else if (!PUZZLE.words.includes(word)) {
      setMessage("Not in today's list! Try another.");
    } else {
      setFound((current) => [...current, word]);
      setMessage(
        PUZZLE.pangrams.includes(word)
          ? "PANGRAM! You used all seven letters!"
          : `Nice! +${scoreWord(word)} points.`
      );
      setInput("");
    }
  }

  function addLetter(letter: string) {
    setInput((current) => current + letter);
  }

  function shuffleLetters() {
    setShuffle((current) => current + 1);
  }

  const shuffledOuter = [...PUZZLE.outer];
  if (shuffle % 2 === 1) shuffledOuter.reverse();

  return (
    <main className="min-h-screen bg-[#FAF9F6] px-4 py-8 text-[#24241F]">
      <div className="mx-auto w-full max-w-lg">
        <header className="mb-8 flex items-center justify-between border-b border-[#E8E5DE] pb-4">
          <a href="/" className="text-sm font-semibold hover:underline">
            ← HCT Games
          </a>
          <h1 className="text-xl font-semibold tracking-tight">Spelling Bee</h1>
          <span className="w-[76px]" />
        </header>

        <section className="mb-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#77766F]">
            HCT Spelling Bee
          </p>
          <h2 className="mt-2 text-2xl font-bold">Make words using the given letters!</h2>
          <p className="mt-2 text-sm text-[#77766F]">
            Make sure to include at least one of the seven letters! Every word must contain the center letter.
          </p>
        </section>

        <div className="mb-5 rounded-2xl border border-[#E8E5DE] bg-white p-5">
          <div className="relative mx-auto h-[290px] w-[290px] max-w-full">
            {LETTERS.map((item, index) => {
              const letter = shuffledOuter[index] ?? item.letter;
              return (
                <button
                  key={`${item.letter}-${index}`}
                  type="button"
                  onClick={() => addLetter(letter)}
                  style={{
                    left: `calc(50% + ${item.x * 84}px - 34px)`,
                    top: `calc(50% + ${item.y * 84}px - 34px)`,
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
              onClick={() => addLetter(PUZZLE.center)}
              className="absolute left-1/2 top-1/2 flex h-[76px] w-[76px] -translate-x-1/2 -translate-y-1/2 items-center justify-center bg-[#F2D66D] text-2xl font-extrabold transition hover:bg-[#E9C94E] active:scale-95"
              aria-label={`Add center lette ${PUZZLE.center}`}
            >
              {PUZZLE.center}
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
              onClick={shuffleLetters}
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
            onChange={(event) => setInput(event.target.value.toUpperCase())}
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

        <p className="mt-3 min-h-6 text-center text-sm font-semibold" aria-live="polite">
          {message}
        </p>

        <section className="mt-5 rounded-2xl bg-[#F2F0E9] p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#77766F]">
                Your score
              </p>
              <p className="mt-1 text-3xl font-extrabold tabular-nums">{score}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-[#77766F]">
                Words found
              </p>
              <p className="mt-1 text-xl font-bold">
                {found.length}/{PUZZLE.words.length}
              </p>
            </div>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#DDD9CC]">
            <div
              className="h-full rounded-full bg-[#B5A36B] transition-all"
              style={{
                width: `${Math.min(100, (score / Math.max(1, possibleScore)) * 100)}%`,
              }}
            />
          </div>

          <p className="mt-3 text-sm text-[#77766F]">
            {pangramFound ? "Pangram found! Excellent work." : "Find a pangram to earn bonus points."}
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
                    PUZZLE.pangrams.includes(word)
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