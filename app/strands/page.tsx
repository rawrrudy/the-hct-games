
"use client";

import { useRef, useState } from "react";

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

function getPosition(cell: string): [number, number] {
  return cell.split("-").map(Number) as [number, number];
}

function areAdjacent(a: string, b: string) {
  const [r1, c1] = getPosition(a);
  const [r2, c2] = getPosition(b);

  return (
    Math.abs(r1 - r2) <= 1 &&
    Math.abs(c1 - c2) <= 1 &&
    (r1 !== r2 || c1 !== c2)
  );
}

export default function StrandsPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [found, setFound] = useState<string[]>([]);
  const [message, setMessage] = useState(
    "Drag across adjacent letters to find the dessert words!"
  );
  const [dragging, setDragging] = useState(false);

 
  const pathRef = useRef<string[]>([]);
  const draggingRef = useRef(false);

  function updatePath(path: string[]) {
    pathRef.current = path;
    setSelected(path);
  }

  function startSelection(cell: string) {
    if (found.length === ALL_WORDS.length) return;

    draggingRef.current = true;
    setDragging(true);
    updatePath([cell]);
    setMessage("Keep dragging across adjacent letters...");
  }

  function extendSelection(cell: string) {
    if (!draggingRef.current) return;

    const path = pathRef.current;
    const last = path[path.length - 1];

    
    if (cell === last) return;


    if (path.length > 1 && cell === path[path.length - 2]) {
      updatePath(path.slice(0, -1));
      return;
    }


    if (path.includes(cell) || !areAdjacent(last, cell)) return;

    updatePath([...path, cell]);
  }

  function finishSelection() {
    if (!draggingRef.current) return;

    draggingRef.current = false;
    setDragging(false);

    const word = pathRef.current
      .map((cell) => {
        const [row, col] = getPosition(cell);
        return GRID[row][col];
      })
      .join("");

    updatePath([]);

    if (!word) return;

    if (found.includes(word)) {
      setMessage("You've already found that word, silly!");
    } else if (ALL_WORDS.includes(word)) {
      setFound((current) => [...current, word]);

      setMessage(
        word === SPANGRAM
          ? "SPANGRAM FOUND! You're lowk cooking >:)"
          : `Nice! You found ${word}!`
      );
    } else {
      setMessage(
        "That is not a theme word. Try another!"
      );
    }
  }

  function cancelSelection() {
    draggingRef.current = false;
    setDragging(false);
    updatePath([]);
  }

  const selectedLetters = selected
    .map((cell) => {
      const [row, col] = getPosition(cell);
      return GRID[row][col];
    })
    .join("");

  const complete = ALL_WORDS.every((word) => found.includes(word));

  return (
    <main
      className="min-h-screen bg-[#FAF9F6] px-4 py-8 text-[#24241F]"
      onPointerUp={finishSelection}
      onPointerCancel={cancelSelection}
    >
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
          <div className="grid grid-cols-6 gap-1.5 touch-none select-none sm:gap-2">
            {GRID.flatMap((row, rowIndex) =>
              row.map((letter, colIndex) => {
                const cell = key(rowIndex, colIndex);
                const pathIndex = selected.indexOf(cell);
                const isSelected = pathIndex !== -1;
                const isFound = found.some((word) => {
                  return false;
                });

                return (
                  <button
                    key={cell}
                    type="button"
                    data-cell={cell}
                    aria-label={`Row ${rowIndex + 1}, column ${colIndex + 1}: ${letter}`}
                    aria-pressed={isSelected}
                    onPointerDown={(event) => {
                      if (event.button !== 0 && event.pointerType === "mouse") {
                        return;
                      }

                      event.preventDefault();
                      startSelection(cell);
                    }}
                    onPointerEnter={() => extendSelection(cell)}
                    className={`relative aspect-square rounded-full text-sm font-extrabold transition-colors sm:text-lg ${
                      isSelected
                        ? "bg-[#3974D6] text-white scale-105"
                        : isFound
                          ? "bg-[#F4D66D] text-[#24241F]"
                          : "bg-white text-[#24241F] hover:bg-[#D3DDF1]"
                    }`}
                  >
                    {letter}
                    {isSelected && (
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#24241F] text-[9px] text-white">
                        {pathIndex + 1}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="mb-2 min-h-7 text-center text-sm font-semibold" aria-live="polite">
          {complete
            ? "Puzzle complete! YAYAYAYAYAYAYAYAYAYA!!!!"
            : dragging
              ? selectedLetters
              : message}
        </div>

        <div className="mt-3 flex justify-center gap-3">
          <button
            type="button"
            onClick={cancelSelection}
            className="rounded-full border border-[#24241F] px-5 py-2 text-sm font-semibold hover:bg-[#E8E5DE]"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={finishSelection}
            disabled={selected.length === 0 || complete}
            className="rounded-full bg-[#24241F] px-6 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-40"
          >
            Submit word
          </button>
        </div>

        <p className="mt-3 text-center text-xs text-[#77766F]">
          Drag or swipe through neighbouring letters. Release to submit.
        </p>

        <section className="mt-8 border-t border-[#E8E5DE] pt-5">
          <h3 className="text-sm font-bold">
            Words found: {found.length}/{ALL_WORDS.length}
          </h3>

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
