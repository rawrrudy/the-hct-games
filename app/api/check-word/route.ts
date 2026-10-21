import { NextResponse } from "next/server";
import { WORDS } from "@/app/wordle/words";

export async function POST(request: Request) {
  try {
    const { word } = await request.json();

    if (typeof word !== "string" || !/^[a-zA-Z]{5}$/.test(word)) {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({
      valid: WORDS.has(word.toUpperCase()),
    });
  } catch {
    return NextResponse.json({ valid: false }, {status: 400});
  }
}