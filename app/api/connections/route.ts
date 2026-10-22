
import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";


type ArchiveGroup = {
  level: number;
  group: string;
  members: string[];
};

type ArchivePuzzle = {
  id: number;
  date: string;
  answers: ArchiveGroup[];
};

export async function GET(request: Request) {
  try {
    const filePath = path.join(
      process.cwd(),
      "data",
      "connections.json"
    );

    const file = await readFile(filePath, "utf8");
    const puzzles: ArchivePuzzle[] = JSON.parse(file);

    const url = new URL(request.url);
    const requestedDate = url.searchParams.get("date");

    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    const targetDate = requestedDate ?? today;
    const puzzle = puzzles.find((item) => item.date === targetDate);

    if (!puzzle) {
      return NextResponse.json(
        { error: "No puzzle found for this date." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: puzzle.id,
      date: puzzle.date,
      groups: puzzle.answers.map((answer) => ({
        name: answer.group,
        words: answer.members,
        level: answer.level,
      })),
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to load the puzzle archive." },
      { status: 500 }
    );
  }
}
