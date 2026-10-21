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

    const words = [
      ...new Set(
        fs
          .readFileSync(filePath, "utf8")
          .split(/\s+/)
          .map((word) => word.trim().toUpperCase())
          .filter((word) => /^[A-Z]{5}$/.test(word))
      ),
    ].sort();

    if (words.length === 0) {
      return NextResponse.json(
        { error: "No valid words found" },
        { status: 500 }
      );
    }

    const date = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    const hash = createHash("sha256")
      .update(`hct-wordle-${date}`)
      .digest();

    const index = hash.readUInt32BE(0) % words.length;

    return NextResponse.json(
      { date },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to select today's word" },
      { status: 500 }
    );
  }
}