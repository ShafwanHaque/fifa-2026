import Link from "next/link";
import {
  round32,
  round16,
  quarterFinals,
  semiFinals,
  final,
  type BracketMatch,
  type BracketSlot,
} from "@/lib/world-cup-data";

const TOTAL_HEIGHT = 1024;
const CARD_HEIGHT = 50;
const CARD_WIDTH = 176;
const CONNECTOR_WIDTH = 28;
const CHAMPION_WIDTH = 160;

const rounds: { name: string; matches: BracketMatch[] }[] = [
  { name: "Round of 32", matches: round32 },
  { name: "Round of 16", matches: round16 },
  { name: "Quarter-finals", matches: quarterFinals },
  { name: "Semi-finals", matches: semiFinals },
  { name: "Final", matches: final },
];

function SlotRow({ slot }: { slot: BracketSlot }) {
  return (
    <div className="flex items-center justify-between gap-2 px-2.5 py-1">
      <span className="truncate font-medium">{slot.label}</span>
      <span className="shrink-0 text-[10px] text-muted-foreground">
        {slot.sub}
      </span>
    </div>
  );
}

function RoundColumn({ matches }: { matches: BracketMatch[] }) {
  const slot = TOTAL_HEIGHT / matches.length;
  return (
    <div
      className="relative shrink-0"
      style={{ width: CARD_WIDTH, height: TOTAL_HEIGHT }}
    >
      {matches.map((match, i) => (
        <div
          key={match.id}
          className="absolute flex flex-col justify-center divide-y divide-border rounded-md bg-card text-xs ring-1 ring-foreground/10"
          style={{
            top: slot * (i + 0.5) - CARD_HEIGHT / 2,
            height: CARD_HEIGHT,
            width: CARD_WIDTH,
          }}
        >
          <SlotRow slot={match.home} />
          <SlotRow slot={match.away} />
        </div>
      ))}
    </div>
  );
}

function Connector({ feederCount }: { feederCount: number }) {
  const center = TOTAL_HEIGHT / 2;
  const half = CONNECTOR_WIDTH / 2;

  // A single feeder (the Final) connects to the Champion with a straight line.
  if (feederCount === 1) {
    return (
      <svg
        className="shrink-0 text-border"
        width={CONNECTOR_WIDTH}
        height={TOTAL_HEIGHT}
        stroke="currentColor"
        fill="none"
      >
        <line x1={0} y1={center} x2={CONNECTOR_WIDTH} y2={center} />
      </svg>
    );
  }

  const slot = TOTAL_HEIGHT / feederCount;
  const pairs = Array.from({ length: feederCount / 2 }, (_, j) => {
    const c1 = slot * (2 * j + 0.5);
    const c2 = slot * (2 * j + 1.5);
    return { c1, c2, mid: (c1 + c2) / 2 };
  });

  return (
    <svg
      className="shrink-0 text-border"
      width={CONNECTOR_WIDTH}
      height={TOTAL_HEIGHT}
      stroke="currentColor"
      fill="none"
    >
      {pairs.map((p, j) => (
        <g key={j}>
          <line x1={0} y1={p.c1} x2={half} y2={p.c1} />
          <line x1={0} y1={p.c2} x2={half} y2={p.c2} />
          <line x1={half} y1={p.c1} x2={half} y2={p.c2} />
          <line x1={half} y1={p.mid} x2={CONNECTOR_WIDTH} y2={p.mid} />
        </g>
      ))}
    </svg>
  );
}

function ChampionBox() {
  const center = TOTAL_HEIGHT / 2;
  return (
    <div
      className="relative shrink-0"
      style={{ width: CHAMPION_WIDTH, height: TOTAL_HEIGHT }}
    >
      <div
        className="absolute flex flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border bg-card text-center text-xs"
        style={{
          top: center - CARD_HEIGHT / 2,
          height: CARD_HEIGHT,
          width: CHAMPION_WIDTH,
        }}
      >
        <span className="text-lg leading-none">🏆</span>
        <span className="font-medium">Champion</span>
      </div>
    </div>
  );
}

export default function TreePage() {
  return (
    <main className="flex-1 px-4 py-10 sm:py-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header>
          <p className="text-sm font-medium text-muted-foreground">
            FIFA World Cup 2026
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Knockout Stage Bracket
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            48 teams compete across 12 groups. The top two teams from each
            group, plus the 8 best third-placed teams, advance to the Round
            of 32.
          </p>
        </header>

        <Link
          href="/point-table"
          className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          View group stage standings →
        </Link>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold tracking-tight">
            Knockout Tree
          </h2>
          <p className="text-xs text-muted-foreground xl:hidden">
            Scroll horizontally to see the full bracket →
          </p>
          <div className="overflow-x-auto pb-4">
            <div className="inline-flex flex-col gap-3">
              <div className="flex items-center">
                {rounds.map((round) => (
                  <div key={round.name} className="contents">
                    <div
                      className="shrink-0 text-center text-xs font-medium text-muted-foreground"
                      style={{ width: CARD_WIDTH }}
                    >
                      {round.name}
                    </div>
                    <div
                      className="shrink-0"
                      style={{ width: CONNECTOR_WIDTH }}
                    />
                  </div>
                ))}
                <div
                  className="shrink-0 text-center text-xs font-medium text-muted-foreground"
                  style={{ width: CHAMPION_WIDTH }}
                >
                  Champion
                </div>
              </div>
              <div className="flex items-start">
                {rounds.map((round) => (
                  <div key={round.name} className="contents">
                    <RoundColumn matches={round.matches} />
                    <Connector feederCount={round.matches.length} />
                  </div>
                ))}
                <ChampionBox />
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Knockout matchups will be confirmed once the group stage
            concludes.
          </p>
        </section>
      </div>
    </main>
  );
}
