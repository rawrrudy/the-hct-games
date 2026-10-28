
import { NextResponse } from "next/server";

export async function GET() {
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
  });

  const url = `https://www.nytimes.com/svc/spelling-bee/v1/${today}.json`;

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
        { error: "Today's Spelling Bee puzzle could not be loaded." },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (
      !data.center_letter ||
      typeof data.outer_letters !== "string" ||
      !Array.isArray(data.answers) ||
      !Array.isArray(data.pangrams)
    ) {
      return NextResponse.json(
        { error: "The puzzle data has an unexpected format." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      printDate: data.print_date,
      center: data.center_letter.toUpperCase(),
      outer: data.outer_letters.toUpperCase().split(""),
      words: [...new Set(
        data.answers.map((word: string) => word.toUpperCase())
      )],
      pangrams: data.pangrams.map((word: string) => word.toUpperCase()),
    });
  } catch {
    return NextResponse.json(
      { error: "Could not connect to the puzzle source." },
      { status: 502 }
    );
  }
}
