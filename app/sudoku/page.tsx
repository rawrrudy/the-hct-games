
"use client";

import { useEffect, useState } from "react";

type Board = number[][];
type Notes = Set<string>;

const PUZZLE: Board = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9],
];

function key(row: number, col: number) {
  return `${row}-${col}`;
}

function isValid(board: Board, row: number, col: number, value: number) {
  for (let i = 0; i < 9; i++) {
    if (i !== col && board[row][i] === value) return false;
    if (i !== row && board[i][col] === value) return false;
  }

  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;

  for (let r = startRow; r < startRow + 3; r++) {
    for (let c = startCol; c < startCol + 3; c++) {
      if ((r !== row || c !== col) && board[r][c] === value) {
        return false;
      }
    }
  }

  return true;
}

function isSolved(board: Board) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0 || !isValid(board, r, c, board[r][c])) {
        return false;
      }
    }
  }
  return true;
}

export default function SudokuPage() {
  const [board, setBoard] = useState<Board>(
    PUZZLE.map((row) => [...row])
  );
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [notes, setNotes] = useState<Notes>(new Set());
  const [notesMode, setNotesMode] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [message, setMessage] = useState("Fill every row, column, and box.");
  const [startedAt, setStartedAt] = useState(Date.now());
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [startedAt]);

  const complete = isSolved(board);

  function formatTime(total: number) {
    const minutes = Math.floor(total / 60).toString().padStart(2, "0");
    const seconds = (total % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function enterNumber(value: number) {
    if (!selected || complete) return;

    const [row, col] = selected;

    if (PUZZLE[row][col] !== 0) {
      setMessage("That number is part of the original puzzle.");
      return;
    }

    const cellKey = key(row, col);

    if (notesMode) {
      setNotes((current) => {
        const next = new Set(current);
        const noteKey = `${cellKey}:${value}`;

        if (next.has(noteKey)) next.delete(noteKey);
        else next.add(noteKey);

        return next;
      });
      return;
    }

    const next = board.map((r) => [...r]);
    next[row][col] = value;

    if (!isValid(next, row, col, value)) {
      setMistakes((current) => current + 1);
      setMessage("That number conflicts with its row, column, or box.");
      return;
    }

    setBoard(next);
    setNotes((current) => {
      const updated = new Set(current);
      for (let n = 1; n <= 9; n++) {
        updated.delete(`${cellKey}:${n}`);
      }
      return updated;
    });
    setMessage("Nice move!");

    if (isSolved(next)) {
      setMessage("Puzzle complete! YOU ABSOLUTE LEGEND!");
    }
  }

  function eraseCell() {
    if (!selected || complete) return;

    const [row, col] = selected;
    if (PUZZLE[row][col] !== 0) return;

    const next = board.map((r) => [...r]);
    next[row][col] = 0;
    setBoard(next);

    setNotes((current) => {
      const updated = new Set(current);
      for (let n = 1; n <= 9; n++) {
        updated.delete(`${key(row, col)}:${n}`);
      }
      return updated;
    });
    setMessage("Cell cleared.");
  }

  function resetPuzzle() {
    setBoard(PUZZLE.map((row) => [...row]));
    setSelected(null);
    setNotes(new Set());
    setNotesMode(false);
    setMistakes(0);
    setSeconds(0);
    setStartedAt(Date.now());
    setMessage("Fresh start. You've got this!");
  }

  const selectedValue = selected
    ? board[selected[0]][selected[1]]
    : 0;

  return (
    <main className="min-h-screen bg-[#FAF9F6] px-3 py-6 text-[#24241F] sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-6 flex items-center justify-between border-b border-[#E8E5DE] pb-4">
          <a href="/" className="text-sm font-semibold hover:underline">
            ← HCT Games
          </a>
          <h1 className="text-xl font-extrabold tracking-tight">Sudoku</h1>
          <span className="w-[76px]" />
        </header>

        <section className="mb-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#77766F]">
            HCT Sudoku
          </p>
          <h2 className="mt-2 text-2xl font-bold">A little number therapy.</h2>
          <p className="mt-2 text-sm text-[#77766F]">
            Fill the grid so each row, column, and 3×3 box contains 1–9.
          </p>
        </section>

        <section className="mb-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-[#F2F0E9] p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#77766F]">
              Time
            </p>
            <p className="mt-1 text-lg font-extrabold tabular-nums">
              {formatTime(seconds)}
            </p>
          </div>
          <div className="rounded-xl bg-[#F2F0E9] p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#77766F]">
              Mistakes
            </p>
            <p className="mt-1 text-lg font-extrabold">{mistakes}</p>
          </div>
          <div className="rounded-xl bg-[#F2F0E9] p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#77766F]">
              Filled
            </p>
            <p className="mt-1 text-lg font-extrabold">
              {board.flat().filter(Boolean).length}/81
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border-2 border-[#24241F] bg-white">
          <div className="grid grid-cols-9">
            {board.flatMap((row, rowIndex) =>
              row.map((value, colIndex) => {
                const fixed = PUZZLE[rowIndex][colIndex] !== 0;
                const isSelected =
                  selected?.[0] === rowIndex && selected?.[1] === colIndex;
                const sameValue =
                  selectedValue !== 0 && value === selectedValue;
                const sameRow = selected?.[0] === rowIndex;
                const sameCol = selected?.[1] === colIndex;
                const sameBox =
                  selected &&
                  Math.floor(selected[0] / 3) === Math.floor(rowIndex / 3) &&
                  Math.floor(selected[1] / 3) === Math.floor(colIndex / 3);

                const conflict =
                  value !== 0 &&
                  !isValid(board, rowIndex, colIndex, value);

                const cellNotes = Array.from({ length: 9 }, (_, i) => i + 1)
                  .filter((n) => notes.has(`${key(rowIndex, colIndex)}:${n}`));

                return (
                  <button
                    key={key(rowIndex, colIndex)}
                    type="button"
                    onClick={() => setSelected([rowIndex, colIndex])}
                    aria-label={`Row ${rowIndex + 1}, column ${colIndex + 1}, ${value || "empty"}`}
                    className={`relative flex aspect-square min-w-0 items-center justify-center border-r border-b border-[#E5E2DA] text-base sm:text-xl ${
                      colIndex === 2 || colIndex === 5
                        ? "border-r-2 border-r-[#24241F]"
                        : ""
                    } ${
                      rowIndex === 2 || rowIndex === 5
                        ? "border-b-2 border-b-[#24241F]"
                        : ""
                    } ${
                      isSelected
                        ? "bg-[#F4D66D]"
                        : sameValue
                          ? "bg-[#F7EBC0]"
                          : sameRow || sameCol || sameBox
                            ? "bg-[#F2F0E9]"
                            : "bg-white"
                    } ${
                      fixed
                        ? "font-extrabold"
                        : "font-medium text-[#3974D6]"
                    } ${conflict ? "text-red-600" : ""}`}
                  >
                    {value || (
                      <span className="grid h-full w-full grid-cols-3 grid-rows-3 p-0.5 text-[8px] text-[#77766F] sm:text-[10px]">
                        {cellNotes.map((n) => (
                          <span key={n}>{n}</span>
                        ))}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </section>

        <p className="mt-3 min-h-6 text-center text-sm font-semibold" aria-live="polite">
          {complete ? "Puzzle complete! LET'S GOOOO!" : message}
        </p>

        <section className="mt-4 rounded-2xl border border-[#E8E5DE] bg-white p-4">
          <div className="grid grid-cols-9 gap-1.5">
            {Array.from({ length: 9 }, (_, i) => i + 1).map((number) => (
              <button
                key={number}
                type="button"
                onClick={() => enterNumber(number)}
                className="rounded-lg bg-[#E9E7DC] py-3 text-lg font-bold transition hover:bg-[#DAD6C7] active:scale-95"
              >
                {number}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setNotesMode((current) => !current)}
              className={`rounded-full border px-3 py-2 text-sm font-semibold ${
                notesMode
                  ? "border-[#24241F] bg-[#24241F] text-white"
                  : "border-[#E8E5DE] hover:bg-[#FAF9F6]"
              }`}
            >
              {notesMode ? "Notes: On" : "Notes"}
            </button>
            <button
              type="button"
              onClick={eraseCell}
              className="rounded-full border border-[#E8E5DE] px-3 py-2 text-sm font-semibold hover:bg-[#FAF9F6]"
            >
              Erase
            </button>
            <button
              type="button"
              onClick={resetPuzzle}
              className="rounded-full border border-[#E8E5DE] px-3 py-2 text-sm font-semibold hover:bg-[#FAF9F6]"
            >
              Restart
            </button>
          </div>
        </section>

        <p className="mt-4 text-center text-xs text-[#77766F]">
          Select a cell, then enter a number. Notes mode lets you pencil in
          candidates.
        </p>
      </div>
    </main>
  );
}
