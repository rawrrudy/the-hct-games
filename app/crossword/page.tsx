
"use client";

import { useEffect, useMemo, useState } from "react";

type Direction = "across" | "down";

interface CrosswordClue {
  direction: Direction;
  number: number;
  row: number;
  col: number;
  clue: string;
  answer: string;
}

interface CrosswordArchiveEntry {
  date: string;
  file: string;
  title: string;
  available: boolean;
}

interface CrosswordArchiveResponse {
  success: boolean;
  puzzles: CrosswordArchiveEntry[];
}

interface CrosswordPuzzle {
  success: boolean;
  title: string;
  date: string;
  dimensions: string;
  grid: string[][];
  acrossCount: number;
  downCount: number;
  totalClues: number;
  across: CrosswordClue[];
  down: CrosswordClue[];
}

export default function CrosswordPage() {
  const [puzzle, setPuzzle] = useState<CrosswordPuzzle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [direction, setDirection] = useState<Direction>("across");
  const [activeClue, setActiveClue] = useState<CrosswordClue | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [entries, setEntries] = useState<Record<string, string>>({});
  const [checkedCells, setCheckedCells] = useState<
    Record<string, boolean>
  >({});
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completionTime, setCompletionTime] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);

  const [archive, setArchive] = useState<CrosswordArchiveEntry[]>([]);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  const availableDates = useMemo(
    () => new Set(archive.map((puzzle) => puzzle.date)),
    [archive]
  );

  const calendarYear = calendarMonth.getFullYear();
  const calendarMonthIndex = calendarMonth.getMonth();

  const daysInMonth = new Date(
    calendarYear,
    calendarMonthIndex + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    calendarYear,
    calendarMonthIndex,
    1
  ).getDay();

  const monthName = calendarMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  async function loadPuzzle(date?: string) {
    setLoading(true);
    setError("");

    setProgressLoaded(false);
    setEntries({});
    setCheckedCells({});
    setIsCompleted(false);
    setCompletionTime(null);
    setStartTime(null);
    setActiveClue(null);
    setSelectedCell(null);

    try {
      const url = date
        ? `/api/crossword?date=${date}`
        : "/api/crossword";

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to load crossword puzzle.");
      }

      const data: CrosswordPuzzle = await response.json();

      if (!data.success) {
        throw new Error("The crossword puzzle could not be loaded.");
      }

      setPuzzle(data);

      if (data.across.length > 0) {
        setActiveClue(data.across[0]);
        setSelectedCell({
          row: data.across[0].row,
          col: data.across[0].col,
        });
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPuzzle();
  }, []);

  useEffect(() => {
    async function loadArchive() {
      try {
        const response = await fetch("/api/crossword/archive");

        if (!response.ok) {
          throw new Error("Failed to load crossword archive.");
        }

        const data: CrosswordArchiveResponse = await response.json();

        if (!data.success) {
          throw new Error("Could not load crossword archive.");
        }

        setArchive(data.puzzles);
      } catch (error) {
        console.error("Crossword archive error:", error);
      }
    }

    loadArchive();
  }, []);

  useEffect(() => {
    if (!puzzle) return;

    try {
      const savedProgress = localStorage.getItem(
        `hct-crossword-${puzzle.date}`
      );

      if (savedProgress) {
        const parsed = JSON.parse(savedProgress);

        if (
          parsed &&
          typeof parsed === "object" &&
          !Array.isArray(parsed) &&
          parsed.entries &&
          typeof parsed.entries === "object" &&
          !Array.isArray(parsed.entries)
        ) {
          setEntries(parsed.entries);
        }
      }
    } catch (error) {
      console.error("Could not load crossword progress:", error);
    } finally {
      setProgressLoaded(true);
    }
  }, [puzzle]);

  useEffect(() => {
    if (!puzzle || !progressLoaded) return;

    localStorage.setItem(
      `hct-crossword-${puzzle.date}`,
      JSON.stringify({
        entries,
      })
    );
  }, [entries, puzzle, progressLoaded])

  const clues = useMemo(() => {
    if (!puzzle) return [];
    return direction === "across" ? puzzle.across : puzzle.down;
  }, [puzzle, direction]);

  const activeCells = useMemo(() => {
    if (!activeClue) return [];

    const cells: { row: number; col: number }[] = [];

    for (let i = 0; i < activeClue.answer.length; i++) {
      cells.push({
        row:
          activeClue.row +
          (activeClue.direction === "down" ? i : 0),
        col:
          activeClue.col +
          (activeClue.direction === "across" ? i : 0),
      });
    }  

    return cells;
  }, [activeClue]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!activeClue || !selectedCell) return;

      const currentIndex = activeCells.findIndex(
        (cell) =>
          cell.row === selectedCell.row &&
          cell.col === selectedCell.col
      );

      if (currentIndex === -1) return;

      const currentKey = `${selectedCell.row}-${selectedCell.col}`;

      if (/^[a-zA-Z]$/.test(event.key)) {
        event.preventDefault();

        setStartTime((previous) => previous ?? Date.now());

        setEntries((previous) => ({
          ...previous,
          [currentKey]: event.key.toUpperCase(),
        }));

        setCheckedCells((previous) => {
          const updated = { ...previous };
          delete updated[currentKey];
          return updated;
        });

        const nextCell = activeCells[currentIndex + 1];

        if (nextCell) {
          setSelectedCell(nextCell);
        }

        return;
      }

      if (event.key === "Backspace") {
        event.preventDefault();

        if (entries[currentKey]) {
          setEntries((previous) => {
            const updated = { ...previous };
            delete updated[currentKey];
            return updated;
          });

          setCheckedCells((previous) => {
            const updated = { ...previous };
            delete updated[currentKey];
            return updated;
          });
        } else if (currentIndex > 0) {
          const previousCell = activeCells[currentIndex - 1];
          const previousKey = `${previousCell.row}-${previousCell.col}`;

          setEntries((previous) => {
            const updated = { ...previous };
            delete updated[previousKey];
            return updated;
          });

          setSelectedCell(previousCell);
        }

        return;
      }

      if (
        event.key === "ArrowRight" ||
        event.key === "ArrowLeft" ||
        event.key === "ArrowDown" ||
        event.key === "ArrowUp"
      ) {
        event.preventDefault();

        const nextIndex =
          event.key === "ArrowRight" || event.key === "ArrowDown"
            ? currentIndex + 1
            : currentIndex - 1;

        if (activeCells[nextIndex]) {
          setSelectedCell(activeCells[nextIndex]);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeClue, selectedCell, activeCells, entries]);

  const clueNumbers = useMemo(() => {
    if (!puzzle) return new Map<string, number>();

    const numbers = new Map<string, number>();

    [...puzzle.across, ...puzzle.down].forEach((clue) => {
      numbers.set(`${clue.row}-${clue.col}`, clue.number);
    });

    return numbers;
  }, [puzzle]);

  function selectCell(row: number, col: number) {
    if (!puzzle) return;

    const candidates = [...puzzle.across, ...puzzle.down].filter((clue) => {
      const length = clue.answer.length;

      if (clue.direction === "across") {
        return (
          row === clue.row &&
          col >= clue.col &&
          col < clue.col + length
        );
      }

      return (
        col === clue.col &&
        row >= clue.row &&
        row < clue.row + length
      );
    });

    if (candidates.length === 0) return;

    const preferred = candidates.find(
      (clue) => clue.direction === direction
    );

    const chosen = preferred ?? candidates[0];

    setDirection(chosen.direction);
    setActiveClue(chosen);
    setSelectedCell({ row, col });
  }

  function selectClue(clue: CrosswordClue) {
    setDirection(clue.direction);
    setActiveClue(clue);
    setSelectedCell({
      row: clue.row,
      col: clue.col,
    });
  }

  function checkAnswers() {
    if (!puzzle) return;

    const incorrect: Record<string, boolean> = {};

    for (const clue of [...puzzle.across, ...puzzle.down]) {
      const dr = clue.direction === "down" ? 1 : 0;
      const dc = clue.direction === "across" ? 1 : 0;

      for (let i = 0; i < clue.answer.length; i++) {
        const row = clue.row + dr * i;
        const col = clue.col + dc * i;
        const key = `${row}-${col}`;

        const enteredLetter = entries[key];

        if (!enteredLetter) continue;

        if (enteredLetter !== clue.answer[i]) {
          incorrect[key] = true;
        }
      }
    }

    setCheckedCells(incorrect);
  }

  function toggleDirection() {
    if (!puzzle || !selectedCell) return;

    const nextDirection: Direction =
      direction === "across" ? "down" : "across";

    const candidates =
      nextDirection === "across" ? puzzle.across : puzzle.down;

    const matching = candidates.find((clue) => {
      const length = clue.answer.length;

      if (nextDirection === "across") {
        return (
          selectedCell.row === clue.row &&
          selectedCell.col >= clue.col &&
          selectedCell.col < clue.col + length
        );
      }

      return (
        selectedCell.col === clue.col &&
        selectedCell.row >= clue.row &&
        selectedCell.row < clue.row + length
      );
    });

    if (matching) {
      setDirection(nextDirection);
      setActiveClue(matching);
    }
  }

  useEffect(() => {
    if (!puzzle || !progressLoaded || isCompleted) return;

    const allCorrect = puzzle.grid.every((row, rowIndex) =>
      row.every((cell, colIndex) => {
        if (cell === "#") return true;

        const key = `${rowIndex}-${colIndex}`;
        const enteredLetter = entries[key];

        return enteredLetter === cell;
      })
    );

    if (allCorrect) {
      const endTime = Date.now();

      setIsCompleted(true);

      if (startTime !== null) {
        setCompletionTime(Math.floor((endTime - startTime) / 1000));
      }
    }
  }, [puzzle, entries, progressLoaded, isCompleted, startTime]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
        <p className="text-sm text-[#777]">Loading crossword...</p>
      </main>
    );
  }

  if (isCompleted) {
    const minutes = Math.floor((completionTime ?? 0) / 60);
    const seconds = (completionTime ?? 0) % 60;

    return (
      <main className="min-h-screen bg-[#faf9f6] flex items-center justify-center px-5">
        <div className="max-w-full text-center bg-white border border-[#e8e5df] rounded-2xl p-10 shadow-sm">
          <div className="text-5xl mb-6">YAYAYAYAYAYAYAY</div>

          <p className="text-xs uppercase tracking-[0.2em] text-[#a58b4c] mb-3">
            Crossword solved!
          </p>

          <h1 className="text-3xl font-semibold tracking-tight mb-3">
            Congratulations!
          </h1>

          <p className="text-sm text-[#888] mb-8">
            You've SUCCESSFULLY completed the crossword!! 
          </p>

          <div className="bg-[#faf9f6] rounded-xl p-5 mb-8">
            <p className="text-xs uppercase tracking-widest text-[#999] mb-2">
              Your completion time
            </p>

            <p className="text-3xl font-semibold tabular-nums">
              {minutes}:{String(seconds).padStart(2, "0")}
            </p>
          </div>

          <p className="text-sm text-[#888] mb-7">
            {puzzle?.title}
          </p>

          <a
            href="/"
            className="inline-block w-full rounded-lg bg-[#292929] text-white py-3 text-sm font-medium hover:bg-[#444] transition"
          >
            Back to HCT Games
          </a>
        </div>
      </main>
    );
  }

  if (error || !puzzle) {
    return (
      <main className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
        <p className="text-sm text-red-500">
          {error || "Unable to load puzzle."}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf9f6] text-[#252525] px-5 py-8 sm:px-8">
      <div className="max-w-6xl mx-auto">

        <header className="mb-8">
          <a
            href="/"
            className="text-sm text-[#888] hover:text-[#252525] transition"
          >
            ← The HCT Games
          </a>

          <div className="mt-6 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
                Crossword
              </h1>
              <p className="text-sm text-[#888] mt-2">
                {puzzle.title}
              </p>
            </div>

            <div className="hidden sm:block text-right">
              <p className="text-xs text-[#999] uppercase tracking-widest">
                Puzzle date
              </p>
              <p className="text-sm font-medium mt-1">
                {puzzle.date}
              </p>
            </div>

            <button
              onClick={() => setArchiveOpen((previous) => !previous)}
              className="shrink-0 px-4 py-2 border border-[#e8e5df] rounded-lg text-sm font-medium hover:bg-[#f0eee8] transition"
            >
              {archiveOpen ? "Close Archive" : "Puzzle Archive"}
            </button>
          </div>
        </header>

        {archiveOpen && (
          <section className="mb-8 p-5 sm:p-6 bg-white border border-[#e8e5df] rounded-xl">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() =>
                  setCalendarMonth(
                    new Date(calendarYear, calendarMonthIndex - 1, 1)
                  )
                }
                className="px-3 py-2 rounded-md hover:bg-[#f0eee8] transition"
                aria-label="Previous month"
              >
                ←
              </button>

              <h2 className="text-lg font-semibold">
                {monthName}
              </h2>

              <button
                onClick={() =>
                  setCalendarMonth(
                    new Date(calendarYear, calendarMonthIndex + 1, 1)
                  )
                }
                className="px-3 py-2 rounded-md hover:bg-[#f0eee8] transition"
                aria-label="Next month"
              >
                →
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-3 text-center">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                (day) => (
                  <div
                    key={day}
                    className="text-xs text-[#999] font-medium"
                  >
                    {day}
                  </div>
                )
              )}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                <div key={`empty-${index}`} />
              ))}

              {Array.from({ length: daysInMonth }, (_, index) => index + 1).map(
                (day) => {
                  const date = `${calendarYear}-${String(
                    calendarMonthIndex + 1
                  ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

                  const hasPuzzle = availableDates.has(date);
                  const isSelected = puzzle.date === date;

                  return (
                    <button
                      key={date}
                      disabled={!hasPuzzle}
                      onClick={() => {
                        loadPuzzle(date);
                        setArchiveOpen(false);
                      }}
                      className={`
                        aspect-square rounded-lg text-sm font-medium
                        transition
                        ${
                          isSelected
                            ? "bg-[#292929] text-white"
                            : hasPuzzle
                              ? "bg-[#eee8d8] text-[#252525] hover:bg-[#e7c878]"
                              : "text-[#ccc] cursor-not-allowed"
                        }
                      `}
                    >
                      {day}
                    </button>
                  );
                }
              )}
            </div>

            <div className="flex items-center gap-2 mt-5 text-xs text-[#999]">
              <span className="w-3 h-3 rounded-sm bg-[#eee8d8]" />
              Available puzzles
            </div>
          </section>
        )}

        <div className="border-t border-[#e8e5df] mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-8 lg:gap-12">

          <section className="w-full">
            <div className="w-full max-w-[620px] mx-auto">
              <div
                className="grid gap-[2px] bg-[#292929] border-2 border-[#292929] w-full"
                style={{
                  gridTemplateColumns: `repeat(${puzzle.grid[0].length}, minmax(0, 1fr))`,
                }}
              >
                {puzzle.grid.map((row, rowIndex) =>
                  row.map((cell, colIndex) => {
                    const isBlack = cell === "#";

                    const isActive = activeCells.some(
                      (position) =>
                        position.row === rowIndex &&
                        position.col === colIndex
                    );

                    const isSelected =
                      selectedCell?.row === rowIndex &&
                      selectedCell?.col === colIndex;

                    const number = clueNumbers.get(
                      `${rowIndex}-${colIndex}`
                    );

                    return (
                      <button
                        key={`${rowIndex}-${colIndex}`}
                        type="button"
                        disabled={isBlack}
                        onClick={() => selectCell(rowIndex, colIndex)}
                        className={`
                          relative aspect-square min-w-0
                          flex items-center justify-center
                          transition-colors duration-100
                          ${
                            isBlack
                              ? "bg-[#292929] cursor-default"
                              : checkedCells[`${rowIndex}-${colIndex}`]
                                ? "bg-red-500 text-white"
                                : isSelected
                                  ? "bg-[#e7c878]"
                                  : isActive
                                    ? "bg-[#f2e5bd]"
                                    : "bg-white"
                          }
                          ${
                            !isBlack
                              ? "hover:bg-[#eee1bd] cursor-pointer"
                              : ""
                          }
                        `}
                        aria-label={
                          isBlack
                            ? "Black square"
                            : `Row ${rowIndex + 1}, column ${colIndex + 1}`
                        }
                      >
                        {!isBlack && number && (
                          <span className="absolute top-[2px] left-[3px] text-[clamp(5px,0.9vw,10px)] leading-none font-medium text-[#444]">
                            {number}
                          </span>
                        )}

                        {!isBlack && (
                          <span className="text-[clamp(12px,2vw,25px)] font-semibold text-[#252525]">
                            {entries[`${rowIndex}-${colIndex}`] ?? ""}
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              <p className="text-xs text-[#999] mt-3 text-center">
                Select a square to choose a clue. Select it again to switch direction.
              </p>
            </div>
          </section>

          <aside className="w-full">
            <div className="flex items-center gap-2 border-b border-[#e8e5df] pb-3">
              <button
                onClick={() => {
                  setDirection("across");
                  const first = puzzle.across[0];
                  if (first) selectClue(first);
                }}
                className={`px-4 py-2 text-sm rounded-md transition ${
                  direction === "across"
                    ? "bg-[#292929] text-white"
                    : "text-[#777] hover:bg-[#eeece6]"
                }`}
              >
                Across
              </button>

              <button
                onClick={() => {
                  setDirection("down");
                  const first = puzzle.down[0];
                  if (first) selectClue(first);
                }}
                className={`px-4 py-2 text-sm rounded-md transition ${
                  direction === "down"
                    ? "bg-[#292929] text-white"
                    : "text-[#777] hover:bg-[#eeece6]"
                }`}
              >
                Down
              </button>

              <span className="ml-auto text-xs text-[#999]">
                {clues.length} clues
              </span>
            </div>

            <div className="flex justify-end py-3">
              <button
                onClick={checkAnswers}
                className="px-5 py-2 rounded-md bg-[#292929] text-white text-sm font-medium hover:bg-[#444] transition"
              >
                Check answers
              </button>
            </div>

            <div className="py-5 border-b border-[#e8e5df] min-h-[110px]">
              <p className="text-[11px] uppercase tracking-widest text-[#999] mb-2">
                {direction} clue
              </p>

              {activeClue ? (
                <>
                  <p className="text-lg font-medium leading-snug">
                    <span className="text-[#a58b4c] mr-2">
                      {activeClue.number}.
                    </span>
                    {activeClue.clue}
                  </p>
                  <p className="text-xs text-[#aaa] mt-2">
                    {activeClue.answer.length} letters
                  </p>
                </>
              ) : (
                <p className="text-sm text-[#999]">
                  Select a clue to begin.
                </p>
              )}
            </div>

            <div className="max-h-[480px] overflow-y-auto py-3">
              {clues.map((clue) => {
                const isCurrent =
                  activeClue?.number === clue.number &&
                  activeClue?.direction === clue.direction;

                return (
                  <button
                    key={`${clue.direction}-${clue.number}`}
                    onClick={() => selectClue(clue)}
                    className={`w-full text-left flex gap-3 px-3 py-3 rounded-md transition ${
                      isCurrent
                        ? "bg-[#eee8d8]"
                        : "hover:bg-[#f0eee8]"
                    }`}
                  >
                    <span
                      className={`text-sm font-semibold min-w-6 ${
                        isCurrent ? "text-[#a58b4c]" : "text-[#888]"
                      }`}
                    >
                      {clue.number}.
                    </span>

                    <span className="text-sm leading-relaxed">
                      {clue.clue}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>
        </div>

        <footer className="border-t border-[#e8e5df] mt-12 pt-5 flex items-center justify-between text-xs text-[#aaa]">
          <span>The HCT Games</span>
          <span>
            {puzzle.grid.length} x {puzzle.grid[0].length}
          </span>
        </footer>
      </div>
    </main>
  );
}
