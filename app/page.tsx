import Link from "next/link";
import { cookies } from "next/headers";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SetUsernameDialog } from "@/components/set-username-dialog";

type MatchStatus = "live" | "upcoming" | "finished";

interface Team {
  name: string;
  flag: string;
  score: number | null;
}

interface Match {
  id: number;
  stage: string;
  status: MatchStatus;
  time: string;
  home: Team;
  away: Team;
}

const matches: Match[] = [
  {
    id: 1,
    stage: "Group A · Matchday 2",
    status: "live",
    time: "67'",
    home: { name: "Argentina", flag: "🇦🇷", score: 2 },
    away: { name: "France", flag: "🇫🇷", score: 1 },
  },
  {
    id: 2,
    stage: "Group C · Matchday 2",
    status: "live",
    time: "23'",
    home: { name: "Brazil", flag: "🇧🇷", score: 0 },
    away: { name: "Germany", flag: "🇩🇪", score: 0 },
  },
  {
    id: 3,
    stage: "Group B · Matchday 1",
    status: "finished",
    time: "FT",
    home: { name: "Spain", flag: "🇪🇸", score: 3 },
    away: { name: "England", flag: "🇬🇧", score: 2 },
  },
  {
    id: 4,
    stage: "Group D · Matchday 1",
    status: "upcoming",
    time: "18:00",
    home: { name: "USA", flag: "🇺🇸", score: null },
    away: { name: "Mexico", flag: "🇲🇽", score: null },
  },
  {
    id: 5,
    stage: "Group D · Matchday 1",
    status: "upcoming",
    time: "21:00",
    home: { name: "Portugal", flag: "🇵🇹", score: null },
    away: { name: "Netherlands", flag: "🇳🇱", score: null },
  },
  {
    id: 6,
    stage: "Group A · Matchday 2",
    status: "finished",
    time: "FT",
    home: { name: "Japan", flag: "🇯🇵", score: 1 },
    away: { name: "Morocco", flag: "🇲🇦", score: 1 },
  },
];

function StatusBadge({ status, time }: { status: MatchStatus; time: string }) {
  if (status === "live") {
    return (
      <Badge variant="destructive" className="gap-1.5">
        <span className="size-1.5 animate-pulse rounded-full bg-destructive" />
        {time}
      </Badge>
    );
  }

  if (status === "finished") {
    return <Badge variant="secondary">{time}</Badge>;
  }

  return <Badge variant="outline">{time}</Badge>;
}

function TeamRow({ team }: { team: Team }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-xl leading-none">{team.flag}</span>
        <span className="font-medium">{team.name}</span>
      </div>
      <span className="text-lg font-semibold tabular-nums">
        {team.score === null ? "–" : team.score}
      </span>
    </div>
  );
}

export default async function Home() {
  const cookieStore = await cookies();
  const userName = cookieStore.get("userName")?.value;

  return (
    <main className="flex-1 px-4 py-10 sm:py-16">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              FIFA World Cup 2026
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Live Scores
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <SetUsernameDialog currentUserName={userName} />
            <Badge variant="destructive" className="gap-1.5">
              <span className="size-1.5 animate-pulse rounded-full bg-destructive" />
              Live
            </Badge>
          </div>
        </header>

        <div className="flex flex-wrap gap-4">
          <Link
            href="/point-table"
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            View group stage standings →
          </Link>
          <Link
            href="/tree"
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            View knockout stage bracket →
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          {matches.map((match) => (
            <Card key={match.id} className="gap-3 px-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {match.stage}
                </span>
                <StatusBadge status={match.status} time={match.time} />
              </div>
              <Separator />
              <div className="flex flex-col gap-2.5">
                <TeamRow team={match.home} />
                <TeamRow team={match.away} />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
