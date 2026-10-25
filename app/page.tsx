import Image from "next/image";

const games = [
  {
    number: "01",
    name: "Wordle",
    description: "Guess the 5-letter word with 6 chances.",
    color: "bg-[#E9E7DC]",
    icon: "/wordle.svg",
  },
  {
    number: "02",
    name: "Connections",
    description: "Group words that share a common thread.",
    color: "bg-[#E5E8DF]",
    icon: "/connections.svg",
  },
  {
    number: "03",
    name: "Strands",
    description: "Uncover hidden words and reveal the theme.",
    color: "bg-[#E9E2E8]",
    icon: "/strands.svg",
  },
  {
    number: "04",
    name: "Spelling Bee",
    description: "How many words can you make with 7 letters?",
    color: "bg-[#E6E8ED]",
  },
  {
    number: "05",
    name: "The Crossword",
    description: "Get clued in with wordplay every day.",
    color: "bg-[#E9E5DC]",
  },
  {
    number: "06",
    name: "The Mini Crossword",
    description: "Take a break from the news. Solve this bite-sized puzzle in just a few minutes.",
    color: "bg-[#E4E9E6]",
  },
  {
    number: "07",
    name: "Pips",
    description: "Place every domino in the right spot.",
    color: "bg-[#E9E2E8]",
  },
  {
    number: "08",
    name: "Letter Boxed",
    description: "Create words using letters around the square.",
    color: "bg-[#E5E8DF]",
  },
  {
    number: "09",
    name: "Tiles",
    description: "Match tiles to keep your chain going.",
    color: "bg-[#E6E8ED]",
  },
  {
    number: "10",
    name: "Sudoku",
    description: "Try this number game, minus the math.",
    color: "bg-[#E9E7DC]",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FAF9F6] text-[#24241F]">
      <header className="mx-auto flex max-w-6xl items-center justify-between border-b border-[#E8E5DE] px-6 py-4">
        <a href="/" aria-label="The HCT Games homepage">
          <Image
            src="/The%20HCT%20Games.png"
            alt="The HCT Games"
            width={320}
            height={160}
            priority
            className="h-40 w-auto object-contain sm:h-44"
          />
        </a>

        <span className="hidden text-sm text-[#858276] sm:block">
          The Hack Club Times Games :D
        </span>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-20 pt-10">
        <h1 className="mb-3 text-4xl font-medium tracking-tight sm:text-6xl">
          Choose a game to play :P
        </h1>

        <div className="mb-6 rounded-xl border border-[#E8E5DE] bg-[#F2F0E9] p-4 sm:p-5">
          <p className="text-sm font-semibold text-[#24241F]">
            A note to the reviewer!!!
          </p>

          <p className="mt-2 text-sm leading-6 text-[#77766F]">
            So, currently on The HCT Games, Wordle, Connections and Strands are fully playable! The reminaing placeholders are still in development!
            I'm submitting for review this early, as I have to get my invitation letter :P 
            Thank you and hope you have fun!!!
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <a
              key={game.number}
              href={
                game.name === "Wordle"
                  ? "/wordle"
                  : game.name === "Connections"
                    ? "/connections"
                    : game.name === "Strands"
                      ? "/strands"
                      : "#"
              }
              className="group block rounded-2xl border border-[#E8E5DE] bg-white p-5 transition duration-200 hover:-translate-y-1 hover:border-[#C8C3B7]"
            >
              <div 
                className={`mb-6 flex aspect-[2/1] items-center justify-center rounded-xl ${game.color}`}
              >
                {game.icon ? (
                  <img
                    src={game.icon}
                    alt={`${game.name} icon`}
                    className="h-32 w-32 object-contain transition-transform duration-200 group-hover:scale-105"
                  />
                ) : (
                  <span className="text-sm tracking-[0.3em] text-[#77766F]">
                    {game.number}
                  </span>
                )}
              </div>

              <h2 className="text-xl font-medium tracking-tight">
                {game.name}
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#77766F]">
                {game.description}
              </p>
            </a>
          ))}
        </div>

        <footer className="mt-16 border-t border-[#E8E5DE] pt-6 text-sm text-[#858276]">
          The HCT Games
        </footer>
      </section>
    </main>
  );
}