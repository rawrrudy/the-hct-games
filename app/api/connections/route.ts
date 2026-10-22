import { group } from "console";
import { NextResponse } from "next/server";

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

const ARCHIVE_URL =
  "https://raw.githubusercontent.com/Eyefyre/NYT-Connections-Answers/main/connections.json";

export async function GET(request: Request) {
  try {
    const response = await fetch(ARCHIVE_URL, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`GitHub returned ${response.status}`);
    }

    const puzzles: ArchivePuzzle[] = await response.json();

    if (!Array.isArray(puzzles) || puzzles.length === 0) {
      throw new Error("The archive is empty or invalid.");
    }

    const url = new URL(request.url);

    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    const requestedDate = url.searchParams.get("date") ?? today;

    const puzzle = puzzles.find(
      (item) => item.date === requestedDate
    );

    if (!puzzle) {
      return NextResponse.json(
        {
          error: `No Connections puzzle is availalable for ${requestedDate}`,
          requestedDate,
        },
        { status: 404 }
      );
    }

    if (
      !Array.isArray(puzzle.answers) ||
      puzzle.answers.length !== 4 ||
      puzzle.answers.some(
        (group) =>
          !Array.isArray(group.members) ||
        group.members.length !== 4
      )
    ) {
        throw new Error("The selected puzzle has an invalid structure.");
    }

    return NextResponse.json(
      {
        id: puzzle.id,
        date: puzzle.date,
        groups: puzzle.answers.map((answer) => ({
          name: answer.group,
          words: answer.members,
          level: answer.level,
        })),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Connections archive error:", error);

    return NextResponse.json(
      { error: "Unable to fetch the Connections archive from GitHub." },
      { status: 502 }
    );
  }
}