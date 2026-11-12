
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { readFileSync } from "fs";
import path from "path";

type Difficulty = "easy" | "medium" | "hard";
type Board = number[][];

type Puzzle = {
  id: string;
  puzzle: string;
  rating: string;
};

const puzzleCache = new Map<Difficulty, Puzzle[]>();

function getPuzzles(difficulty: Difficulty): Puzzle[] {
  const cached = puzzleCache.get(difficulty);
  if (cached) return cached;

  const filePath = path.join(
    process.cwd(),
    "data",
    "sudoku",
    `${difficulty}.txt`
  );

  const contents = readFileSync(filePath, "utf-8");

  const puzzles = contents
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const parts = line.trim().split(/\s+/);

      return {
        id: parts[0],
        puzzle: parts[1],
        rating: parts[2],
      };
    })
    .filter(
      (item) =>
        item.id &&
        item.puzzle &&
        item.puzzle.length === 81 &&
        /^\d{81}$/.test(item.puzzle) &&
        item.rating
    );

  if (puzzles.length === 0) {
    throw new Error(`No valid puzzles found in ${difficulty}.txt`);
  }

  puzzleCache.set(difficulty, puzzles);
  return puzzles;
}

function solveSudoku(board: Board): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] !== 0) continue;

      for (let num = 1; num <= 9; num++) {
        if (!isValid(board, row, col, num)) continue;

        board[row][col] = num;

        if (solveSudoku(board)) return true;

        board[row][col] = 0;
      }

      return false;
    }
  }

  return true;
}

function isValid(
  board: Board,
  row: number,
  col: number,
  num: number
): boolean {
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num) return false;
    if (board[i][col] === num) return false;
  }

  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;

  for (let r = startRow; r < startRow + 3; r++) {
    for (let c = startCol; c < startCol + 3; c++) {
      if (board[r][c] === num) return false;
    }
  }

  return true;
}

function getIndiaDate(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value;

  return `${get("year")}-${get("month")}-${get("day")}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const difficulty = (
      searchParams.get("difficulty") || "easy"
    ).toLowerCase() as Difficulty;

    const allowedDifficulties: Difficulty[] = [
      "easy",
      "medium",
      "hard",
    ];

    if (!allowedDifficulties.includes(difficulty)) {
      return NextResponse.json(
        { error: "Invalid difficulty." },
        { status: 400 }
      );
    }

    const date = searchParams.get("date") || getIndiaDate();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "Invalid date. Use YYYY-MM-DD." },
        { status: 400 }
      );
    }

    const puzzles = getPuzzles(difficulty);

    const hash = createHash("sha256")
      .update(`${date}-${difficulty}`)
      .digest("hex");

    const index = Number(BigInt(`0x${hash.slice(0, 12)}`) % BigInt(puzzles.length));

    const selected = puzzles[index];

    const puzzleBoard: Board = Array.from(
      { length: 9 },
      (_, row) =>
        Array.from(
          { length: 9 },
          (_, col) => Number(selected.puzzle[row * 9 + col])
        )
    );

    const solutionBoard = puzzleBoard.map((row) => [...row]);

    if (!solveSudoku(solutionBoard)) {
      throw new Error(`Could not solve puzzle ${selected.id}`);
    }

    return NextResponse.json({
      date,
      difficulty,
      puzzleId: selected.id,
      rating: selected.rating,
      puzzle: puzzleBoard,
      solution: solutionBoard,
    });
  } catch (error) {
    console.error("Sudoku API error:", error);

    return NextResponse.json(
      { error: "Failed to load Sudoku puzzle." },
      { status: 500 }
    );
  }
}
