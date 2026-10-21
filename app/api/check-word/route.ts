import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { WORDS } from "@/app/wordle/words";

type TileState = "correct" | "present" | "absent";

function getDailyAnswer() {
  const words = [...WORDS].sort();

  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const hash = createHash("sha256")
    .update(`hct-wordle-${date}`)
    .digest();

  return words[hash.readUInt32BE(0) % words.length];
}

function evaluateGuess(guess: string, answer: string): TileState[] {
  const states: TileState[] = Array(5).fill("absent");
  const remaining = answer.split("");

  for (let i = 0; i < 5; i++) {
    if (guess[i] === answer[i]) {
      states[i] === "correct";
      remaining[i] = "";
    }
  }

  for (let i = 0; i < 5; i++) {
    if (states[i] === "correct") continue;

    const index = remaining.indexOf(guess[i]);

    if (index !== -1) {
      states[i] = "present";
      remaining[index] = "";
    }
  }

  return states;
}

export async function POST(request: Request) {
  try {
    const { word } = await request.json();

    if (typeof word !== "string" || !/^[a-zA-Z]{5}$/.test(word)) {
      return NextResponse.json({ valid: false });
    }

    const guess = word.toUpperCase();

    if (!WORDS.has(guess)) {
      return NextResponse.json({ valid: false });
    }

    const answer = getDailyAnswer();
    const states = evaluateGuess(guess, answer);

    return NextResponse.json({
      valid: true,
      states,
      won: guess === answer,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to check guess." },
      { status: 500 }
    );
  }
}