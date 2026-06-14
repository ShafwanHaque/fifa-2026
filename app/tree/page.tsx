import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowRight, Home, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LocalDate } from "@/components/local-date";
import {
  PredictionsDialog,
  type PredictionStage,
} from "@/components/predictions-dialog";
import {
  round32,
  round16,
  quarterFinals,
  semiFinals,
  final,
  type BracketMatch,
  type BracketSlot,
} from "@/lib/world-cup-data";
import { getMatches, KNOCKOUT_STAGES, type Match } from "@/lib/football-data";
import { getMyPredictions } from "@/lib/actions/predictions";
import {
  computeScore,
  getWinnerTeamId,
  isPredictable,
  POINTS_BY_STAGE,
} from "@/lib/predictions";

const MATCH_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
};

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

function MatchRow({ match }: { match: Match }) {
  const isFinished = match.status === "FINISHED";

  return (
    <div className="flex items-center justify-between gap-2 rounded-md bg-card px-2.5 py-1.5 text-xs ring-1 ring-foreground/10">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate font-medium">
          {match.homeTeam.shortName ?? "TBD"}
        </span>
        <span className="truncate font-medium">
          {match.awayTeam.shortName ?? "TBD"}
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5 text-right text-muted-foreground">
        {isFinished ? (
          <span className="font-semibold tabular-nums text-foreground">
            {match.score.fullTime.home} - {match.score.fullTime.away}
          </span>
        ) : (
          <span className="tabular-nums">
            <LocalDate date={match.utcDate} options={MATCH_DATE_OPTIONS} />
          </span>
        )}
      </div>
    </div>
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

export default async function TreePage() {
  const cookieStore = await cookies();
  const userName = cookieStore.get("userName")?.value;

  let knockoutMatches: Match[] = [];
  try {
    const matches = await getMatches();
    knockoutMatches = matches.sort(
      (a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime()
    );
  } catch {
    knockoutMatches = [];
  }

  const predictions = await getMyPredictions();
  const totalScore = computeScore(predictions, knockoutMatches);
  const predictionByMatchId = new Map(
    predictions.map((p) => [p.match_id, p])
  );

  const predictionStages: PredictionStage[] = KNOCKOUT_STAGES.filter(
    ({ stage }) => stage in POINTS_BY_STAGE
  ).map(({ stage, label }) => ({
    stage,
    label,
    points: POINTS_BY_STAGE[stage],
    matches: knockoutMatches
      .filter((m) => m.stage === stage)
      .map((m) => {
        const prediction = predictionByMatchId.get(m.id);
        const winnerId = getWinnerTeamId(m);
        const result =
          m.status === "FINISHED" && prediction
            ? winnerId === prediction.predicted_team_id
              ? ("correct" as const)
              : ("incorrect" as const)
            : null;
        const pointsAwarded = result ? POINTS_BY_STAGE[stage][result] : null;

        return {
          id: m.id,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          predictedTeamId: prediction?.predicted_team_id ?? null,
          predictable: isPredictable(m),
          result,
          pointsAwarded,
        };
      }),
  }));

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

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-auto justify-between rounded-xl px-4 py-3"
          >
            <Link href="/">
              <span className="flex items-center gap-2.5">
                <Home className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">Back to Home</span>
              </span>
            </Link>
          </Button>
          <Button
            asChild
            variant="secondary"
            size="lg"
            className="h-auto w-full justify-between rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-amber-100 hover:bg-amber-500/15 sm:w-auto"
          >
            <Link href="/point-table">
              <span className="flex items-center gap-2.5">
                <Trophy className="size-4 text-amber-400" />
                <span className="text-sm font-medium">
                  View group stage standings
                </span>
              </span>
              <ArrowRight className="size-4 text-amber-400 transition-transform group-hover/button:translate-x-1" />
            </Link>
          </Button>
        </div>

        <Card className="flex-col items-start gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">
              🔮 Predict the knockout bracket
            </p>
            <p className="text-xs text-muted-foreground">
              Your picks are valuable to us — call the winner of each match
              before kickoff and climb the leaderboard.
            </p>
          </div>
          <PredictionsDialog
            userName={userName}
            totalScore={totalScore}
            stages={predictionStages}
          />
        </Card>

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

        {knockoutMatches.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold tracking-tight">
              Knockout Schedule
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {KNOCKOUT_STAGES.map(({ stage, label }) => {
                const matches = knockoutMatches.filter((m) => m.stage === stage);
                if (matches.length === 0) return null;

                return (
                  <div key={stage} className="flex flex-col gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {label}
                    </span>
                    <div className="flex flex-col gap-1.5">
                      {matches.map((match) => (
                        <MatchRow key={match.id} match={match} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
