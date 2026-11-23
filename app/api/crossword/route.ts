import { NextResponse, NextRequest, connection } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { parseCrossword } from "@/lib/crossword/parser";

interface ArchiveEntry {
  date: string;
  file: string;
  title: string;
  available: boolean;
}

export async function GET(request: NextRequest) {
  await connection();

  try {
    const indexPath = path.join(
      process.cwd(),
      "data",
      "crossword",
      "index.json"
    );

    const indexData = JSON.parse(
      await readFile(indexPath, "utf-8")
    );

    const puzzles: ArchiveEntry[] = indexData.puzzles;

    const requestedDate = request.nextUrl.searchParams.get("date");

    const availablePuzzles = puzzles
      .filter((puzzle) => puzzle.available)
      .sort((a, b) => b.date.localeCompare(a.date));

    if (availablePuzzles.length === 0) {
      return NextResponse.json(
        { success: false, error: "No puzzles available." },
        { status: 404 }
      );
    }

    const selectedPuzzle = requestedDate
      ? availablePuzzles.find(
          (puzzle) => puzzle.date === requestedDate
        )
      : availablePuzzles[0];

    if (!selectedPuzzle) {
      return NextResponse.json(
        { success: false, error: "Puzzle not found for this date." },
        { status: 404 }
      );
    }

    const filePath = path.join(
      process.cwd(),
      "data",
      "crossword",
      "puzzles",
      selectedPuzzle.file
    );

    const source = await readFile(filePath, "utf-8");
    const puzzle = parseCrossword(source);

    return NextResponse.json({
      success: true,
      title: puzzle.title,
      date: puzzle.date,
      dimensions: `${puzzle.rows}x${puzzle.cols}`,
      grid: puzzle.grid,
      acrossCount: puzzle.across.length,
      downCount: puzzle.down.length,
      totalClues: puzzle.across.length + puzzle.down.length,
      across: puzzle.across,
      down: puzzle.down,
    });
  } catch (error) {
    console.error("Crossword API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load crossword puzzle.",
      },
      { status: 500 }
    );
  }
}