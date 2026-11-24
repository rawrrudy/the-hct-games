import { NextResponse, connection } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

interface ArchiveEntry {
  date: string;
  file: string;
  title: string;
  available: boolean;
}

export async function GET() {
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

    const availablePuzzles = puzzles
      .filter((puzzle) => puzzle.available)
      .sort((a, b) => b.date.localeCompare(a.date));

    return NextResponse.json({
      success: true,
      puzzles: availablePuzzles,
    });
  } catch (error) {
    console.error("Crossword archive error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load crossword archive.",
      },
      { status: 500 }
    );
  }
}