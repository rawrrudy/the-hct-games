export type Direction = "across" | "down";

export interface CrosswordClue {
  direction: Direction;
  number: number;
  row: number;
  col: number;
  clue: string;
  answer: string;
}

export interface CrosswordPuzzle {
  title: string;
  author: string;
  editor: string;
  date: string;
  rows: number;
  cols: number;
  grid: string[][];
  across: CrosswordClue[];
  down: CrosswordClue[];
}

function parseClueLine(line: string) {
  const match = line.match(/^([AD])(\d+)\.\s*(.*?)\s*~\s*([A-Z]+)$/);

  if (!match) return null;

  return {
    direction: match[1] === "A" ? "across" as const : "down" as const,
    number: Number(match[2]),
    clue: match[3].trim(),
    answer: match[4].trim(),
  };
}

export function parseCrossword(source: string): CrosswordPuzzle {
  const lines = source.replace(/\r/g, "").split("\n");

  const title = lines[0]?.replace("Title:", "").trim() ?? "";
  const author = lines[1]?.replace("Author:", "").trim() ?? "";
  const editor = lines[2]?.replace("Editor:", "").trim() ?? "";
  const date = lines[3]?.replace("Date:", "").trim() ?? "";

  const gridStart = lines.findIndex(
    (line, index) => index > 3 && /^[A-Z#]+$/.test(line.trim())
  );

  if (gridStart === -1) {
    throw new Error("Could not find crossword grid.");
  }

  const gridLines: string[] = [];

  for (let i = gridStart; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!/^[A-Z#]+$/.test(line)) break;

    gridLines.push(line);
  }

  if (gridLines.length === 0) {
    throw new Error("Crossword grid is empty.");
  }

  const cols = gridLines[0].length;

  if (!gridLines.every((line) => line.length === cols)) {
    throw new Error("Crossword grid rows have inconsistent lengths.");
  }

  const grid = gridLines.map((line) => line.split(""));
  const rows = grid.length;

  const clueLines = lines
    .slice(gridStart + rows)
    .map((line) => parseClueLine(line.trim()))
    .filter((clue): clue is NonNullable<typeof clue> => clue !== null);

  const across: CrosswordClue[] = [];
  const down: CrosswordClue[] = [];

  const isWhite = (row: number, col: number) =>
    row >= 0 &&
    row < rows &&
    col >= 0 &&
    col < cols &&
    grid[row][col] !== "#";

  let number = 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (!isWhite(row, col)) continue;

      const startsAcross =
        col === 0 || !isWhite(row, col - 1);

      const startsDown =
        row === 0 || !isWhite(row - 1, col);

      if (!startsAcross && !startsDown) continue;

      number++;

      if (startsAcross) {
        const clue = clueLines.find(
          (item) =>
            item.direction === "across" &&
            item.number === number
        );

        if (clue) {
          across.push({
            direction: "across",
            number,
            row,
            col,
            clue: clue.clue,
            answer: clue.answer,
          });
        }
      }

      if (startsDown) {
        const clue = clueLines.find(
          (item) =>
            item.direction === "down" &&
            item.number === number
        );

        if (clue) {
          down.push({
            direction: "down",
            number,
            row,
            col,
            clue: clue.clue,
            answer: clue.answer,
          });
        }
      }
    }
  }

  for (const clue of [...across, ...down]) {
    const dr = clue.direction === "down" ? 1 : 0;
    const dc = clue.direction === "across" ? 1 : 0;

    for (let i = 0; i < clue.answer.length; i++) {
      const row = clue.row + dr * i;
      const col = clue.col + dc * i;

      if (!isWhite(row, col) || grid[row][col] !== clue.answer[i]) {
        throw new Error(
          `Answer mismatch for ${clue.direction} ${clue.number}.`
        );
      }
    }
  }

  return {
    title,
    author,
    editor,
    date,
    rows,
    cols,
    grid,
    across,
    down,
  };
}
