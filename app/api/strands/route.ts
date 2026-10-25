import { NextResponse } from "next/server";


export async function GET() {
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
  });

  const url = `https://www.nytimes.com/svc/strands/v2/${today}.json`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Today's Strands puzzle could not be loaded." },
        { status: response.status }
      );
    }

    const puzzle = await response.json();

    return NextResponse.json({
      printDate: puzzle.printDate,
      clue: puzzle.clue,
      startingBoard: puzzle.startingBoard,
      themeWords: puzzle.themeWords,
      spangram: puzzle.spangram,
      themeCoords: puzzle.themeCoords,
      spangramCoords: puzzle.spangramCoords,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not connect to the Strands puzzle source." },
      { status: 502 }
    );
  }
}
