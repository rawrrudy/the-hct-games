
"use client";

import { useEffect, useState } from "react";

type Board = number[][];
type Notes = Set<string>;
type Difficulty = "easy" | "medium" | "hard";

const DIFFICULTIES: {
  value: Difficulty;
  label: string;
  description: string;
}[] = [
  { value: "easy", label: "Easy", description: "A gentle warm-up" },
  { value: "medium", label: "Medium", description: "A little challenge" },
  { value: "hard", label: "Hard", description: "For the experts" },
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

function getTodayDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  return parts;
}

export default function SudokuPage() {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [puzzle, setPuzzle] = useState<Board | null>(null);
  const [solution, setSolution] = useState<Board | null>(null);
  const [board, setBoard] = useState<Board | null>(null);

  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [notes, setNotes] = useState<Notes>(new Set());
  const [notesMode, setNotesMode] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [message, setMessage] = useState("Fill every row, column, and box.");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [puzzleDate, setPuzzleDate] = useState<string | null>(null);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [archiveDate, setArchiveDate] = useState("");

  const complete = board ? isSolved(board) : false;

  useEffect(() => {
    if (!startedAt || complete) return;

    const timer = window.setInterval(() => {
      setSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [startedAt, complete]);

  useEffect(() => {
    if (
      !progressLoaded ||
      !difficulty ||
      !puzzleDate ||
      !puzzle ||
      !board ||
      startedAt === null
    ) {
      return;
    }

    const storageKey = `hct-sudoku-${puzzleDate}-${difficulty}`;

    const progress = {
      board,
      notes: Array.from(notes),
      mistakes,
      seconds,
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(progress));
    } catch (error) {
      console.error("Could not save Sudoku progress.", error);
    }
  }, [
    progressLoaded,
    difficulty,
    puzzleDate,
    puzzle,
    board,
    notes,
    mistakes,
    seconds,
    startedAt,
  ]);

  function formatTime(total: number) {
    const minutes = Math.floor(total / 60).toString().padStart(2, "0");
    const seconds = (total % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  async function loadPuzzle(
    selectedDifficulty: Difficulty,
    selectedDate?: string
  ) {
    setLoading(true);
    setError("");
    setProgressLoaded(false);

    try {
      const dateQuery = selectedDate
        ? `&date=${encodeURIComponent(selectedDate)}`
        : "";

      const response = await fetch(
        `/api/sudoku?difficulty=${selectedDifficulty}${dateQuery}`
      );

      if (!response.ok) {
        throw new Error("Could not load the Sudoku puzzle.");
      }

      const data = await response.json();

      const storageKey = `hct-sudoku-${data.date}-${selectedDifficulty}`;

      let saved: {
        board?: number[][];
        notes?: string[];
        mistakes?: number;
        seconds?: number;
      } | null = null;

      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) saved = JSON.parse(stored);
      } catch {
        localStorage.removeItem(storageKey);
      }

      const validSavedBoard = 
        Array.isArray(saved?.board) &&
        saved.board.length === 9 &&
        saved.board.every(
          (row) =>
            Array.isArray(row) &&
            row.length === 9 &&
            row.every(
              (cell) =>
                Number.isInteger(cell) && cell >= 0 && cell <= 9
            )
        );

      const restoreBoard = validSavedBoard
        ? saved!.board!.map((row) => [...row])
        : data.puzzle.map((row: number[]) => [...row]);

      const restoredNotes = Array.isArray(saved?.notes)
        ? saved!.notes!.filter((note) => typeof note === "string")
        : [];

      const restoreMistakes =
        Number.isInteger(saved?.mistakes) && saved!.mistakes! >= 0
          ? saved!.mistakes!
          : 0;

      const restoredSeconds =
        Number.isFinite(saved?.seconds) && saved!.seconds! >= 0
          ? saved!.seconds!
          : 0;

      setDifficulty(selectedDifficulty);
      setPuzzleDate(data.date);
      setPuzzle(data.puzzle);
      setSolution(data.solution);
      setBoard(restoreBoard);

      setSelected(null);
      setNotes(new Set(restoredNotes));
      setNotesMode(false);
      setMistakes(restoreMistakes);
      setSeconds(restoredSeconds);
      setStartedAt(Date.now() - restoredSeconds * 1000);

      setMessage(
        validSavedBoard
          ? "Welcome back! Your progress has been restored."
          : "Fill every row, column, and box!"
      );

      setProgressLoaded(true);
    } catch (err) {
      console.error(err)
      setError("Something went wrong loading the puzzle. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function enterNumber(value: number) {
    if (!selected || !board || !puzzle || !solution || complete) return;

    const [row, col] = selected;

    if (puzzle[row][col] !== 0) {
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

    if (value !== solution[row][col]) {
      setMistakes((current) => current + 1);
      setMessage("Not quite! Try another number.");
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
    if (!selected || !board || !puzzle || complete) return;

    const [row, col] = selected;
    if (puzzle[row][col] !== 0) return;

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
    if (!puzzle) return;

    setBoard(puzzle.map((row) => [...row]));
    setSelected(null);
    setNotes(new Set());
    setNotesMode(false);
    setMistakes(0);
    setSeconds(0);
    setStartedAt(Date.now());
    setMessage("Fresh start. You've got this!");
  }

  const selectedValue =
    selected && board ? board[selected[0]][selected[1]] : 0;

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
          <h2 className="mt-2 text-2xl font-bold">
            A little number therapy.
          </h2>
          <p className="mt-2 text-sm text-[#77766F]">
            Fill the grid so each row, column, and 3×3 box contains 1–9.
          </p>
        </section>

        {!difficulty ? (
          <section className="rounded-2xl border border-[#E8E5DE] bg-white p-5 sm:p-7">
            <h2 className="text-center text-xl font-bold">
              Choose your puzzle
            </h2>

            <p className="mt-2 text-center text-sm text-[#77766F]">
              Play today's puzzle or revisit an old favourite!
            </p>

            <div className="mt-6">
              <label
                htmlFor="archive-data"
                className="mb-2 block text-sm font-bold"
              >
                Select a date
              </label>

              <input
                id="archive-date"
                type="date"
                value={archiveDate}
                max={getTodayDate()}
                onChange={(event) => setArchiveDate(event.target.value)}
                className="w-full rounded-xl border border-[#E8E5DE] bg-[#FAF9F6] px-4 py-3 text-sm font-semibold outline-none focus:border-[#24241F]"
              />

              <p className="mt-2 text-xs text-[#77766F]">
                {archiveDate
                  ? `Browsing puzzles from ${archiveDate}`
                  : "Leave this empty to play today's puzzle."}
              </p>

              {archiveDate && (
                <button
                  type="button"
                  onClick={() => setArchiveDate("")}
                  className="mt-2 text-xs font-semibold underline"
                >
                  Clear date · Return to today
                </button>
              )}
            </div>

            <div className="mt-6">
              <p className="mb-3 text-sm font-bold">Choose difficulty</p>

              <div className="grid gap-3 sm:grid-cols-3">
                {DIFFICULTIES.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    disabled={loading}
                    onClick={() =>
                      loadPuzzle(item.value, archiveDate || undefined)
                    }
                    className="rounded-xl border border-[#E8E5DE] bg-[#FAF9F6] p-5 text-center transition hover:border-[#24241F] hover:bg-[#F2F0E9] disabled:opacity-50"
                  >
                    <span className="block text-lg font-extrabold">
                      {item.label}
                    </span>
                    <span className="mt-1 block text-xs text-[#77766F]">
                      {item.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {loading && (
              <p className="mt-5 text-center text-sm font-semibold">
                Loading your puzzle :P
              </p>
            )}

            {error && (
              <p className="mt-5 text-center text-sm font-semibold text-red-600">
                {error}
              </p>
            )}
          </section>
        ) : board && puzzle ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="w-fit  rounded-full bg-[#F2F0E9] px-4 py-2 text-sm font-bold capitalize">
                  {difficulty}
                </span>
                <span className="text-xs text-[#77766F]">
                  Puzzle date: {puzzleDate}
                  {puzzleDate === getTodayDate() ? " · Today" : " · Archive"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDifficulty(null);
                  setPuzzle(null);
                  setSolution(null);
                  setBoard(null);
                  setStartedAt(null);
                }}
                className="text-sm font-semibold text-[#77766F] hover:text-[#24241F] hover:underline"
              >
                Change difficulty
              </button>
            </div>

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
                    const fixed = puzzle[rowIndex][colIndex] !== 0;
                    const isSelected =
                      selected?.[0] === rowIndex &&
                      selected?.[1] === colIndex;
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

                    const cellNotes = Array.from(
                      { length: 9 },
                      (_, i) => i + 1
                    ).filter((n) =>
                      notes.has(`${key(rowIndex, colIndex)}:${n}`)
                    );

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

            <p
              className="mt-3 min-h-6 text-center text-sm font-semibold"
              aria-live="polite"
            >
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
          </>
        ) : null}
      </div>
    </main>
  );
}
