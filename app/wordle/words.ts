import fs from "node:fs";
import path from "node:path";

const filePath = path.join(
  process.cwd(),
  "data",
  "valid-words.txt"
);

const wordList = fs.readFileSync(filePath, "utf8");

export const WORDS = new Set(
  wordList
    .split(/\s+/)
    .map((word) => word.trim().toUpperCase())
    .filter((word) => /^[A-Z]{5}$/.test(word))
);