import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { parseCrossword } from "@/lib/crossword/parser";

export async function GET() {
  try {
    const filePath = path.join(
      process.cwd(),
      "data",
      "crossword",
      "puzzles",
      "sample.xd"
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
    console.error("Crossword parser test failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error.",
      },
      { status: 500 }
    );
  }
}