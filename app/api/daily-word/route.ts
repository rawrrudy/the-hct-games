import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

export async function GET() {
  try {
    const filePath = path.join(
      process.cwd(),
      "data",
      "valid-words.txt"
    );

    const words = fs
      .readFileSync(filePath, "utf8")
      .split(/\s+/)
      .map((word) => word.trim().toUpperCase())
      .filter((word) => /^[A-Z]{5}$/.test(word));

    const uniqueWords = [...new Set(words)].sort();

    if (uniqueWords.length === 0) {
      return NextResponse.json(
        { error: "No valid words found." },
        { status: 500 }
      );
    }

    const date = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });

    const hash = createHash("sha256")
      .update(`hct-wordle-${date}`)
      .digest();

    const index = hash.readUint32BE(0) % uniqueWords.length;
    const answer = uniqueWords[index];

    return NextResponse.json(
      { answer, date },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to select today's word." },
      { status: 500 }
    );
  }
}