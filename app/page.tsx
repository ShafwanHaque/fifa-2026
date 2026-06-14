import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowRight, Network, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SetUsernameDialog } from "@/components/set-username-dialog";
import { LocalDate } from "@/components/local-date";
import { MatchActionDialog } from "@/components/match-action-dialog";
import { MatchCommunityStats } from "@/components/match-community-stats";
import {
  getMatches,
  getMatchLabel,
  type Match as LiveMatch,
  type MatchTeam,
} from "@/lib/football-data";
import { getMyPredictions, getPredictionCounts } from "@/lib/actions/predictions";
import { getMySupports, getSupportCounts } from "@/lib/actions/supports";
import { computeScore } from "@/lib/predictions";
import { formatLiveMinute } from "@/lib/utils";

const MATCH_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
};

type MatchStatus = "live" | "upcoming" | "finished";

interface Team {
  name: string;
  flag: string;
  score: number | null;
}

interface FallbackMatch {
  id: number;
  stage: string;
  status: MatchStatus;
  time: string;
  home: Team;
  away: Team;
}

const fallbackMatches: FallbackMatch[] = [
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

function LiveStatusBadge({ match }: { match: LiveMatch }) {
  if (match.status === "PAUSED") {
    return (
      <Badge variant="destructive" className="gap-1.5">
        <span className="size-1.5 animate-pulse rounded-full bg-destructive" />
        HT
      </Badge>
    );
  }

  if (match.status === "IN_PLAY") {
    return (
      <Badge variant="destructive" className="gap-1.5">
        <span className="size-1.5 animate-pulse rounded-full bg-destructive" />
        {formatLiveMinute(match.utcDate)}
      </Badge>
    );
  }

  if (match.status === "FINISHED") {
    return <Badge variant="secondary">FT</Badge>;
  }

  return (
    <Badge variant="outline">
      <LocalDate date={match.utcDate} options={MATCH_DATE_OPTIONS} />
    </Badge>
  );
}

function LiveTeamRow({ team, score }: { team: MatchTeam; score: number | null }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {team.crest && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={team.crest} alt="" className="h-6 w-6" />
        )}
        <span className="font-medium">{team.shortName ?? "TBD"}</span>
      </div>
      <span className="text-lg font-semibold tabular-nums">
        {score === null ? "–" : score}
      </span>
    </div>
  );
}

export default async function Home() {
  const cookieStore = await cookies();
  const userName = cookieStore.get("userName")?.value;

  let allMatches: LiveMatch[] = [];
  let liveMatches: LiveMatch[] = [];
  try {
    const all = await getMatches();
    allMatches = all;
    const inPlay = all.filter(
      (m) => m.status === "IN_PLAY" || m.status === "PAUSED"
    );
    const recent = all
      .filter((m) => m.status === "FINISHED")
      .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())
      .slice(0, 3);
    const upcoming = all
      .filter((m) => m.status === "SCHEDULED" || m.status === "TIMED")
      .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
      .slice(0, 3);
    liveMatches = [...inPlay, ...recent, ...upcoming];
  } catch {
    liveMatches = [];
  }

  const hasLiveMatch = liveMatches.some(
    (m) => m.status === "IN_PLAY" || m.status === "PAUSED"
  );

  const [predictions, supports] = await Promise.all([
    getMyPredictions(),
    getMySupports(),
  ]);
  const predictionByMatchId = new Map(
    predictions.map((p) => [p.match_id, p.predicted_team_id])
  );
  const supportByMatchId = new Map(
    supports.map((s) => [s.match_id, s.supported_team_id])
  );
  const totalScore = computeScore(predictions, allMatches);

  const actionableMatchIds = liveMatches
    .filter(
      (m) =>
        m.status !== "FINISHED" && m.homeTeam.id != null && m.awayTeam.id != null
    )
    .map((m) => m.id);

  const [predictionCounts, supportCounts] = await Promise.all([
    getPredictionCounts(actionableMatchIds),
    getSupportCounts(actionableMatchIds),
  ]);

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
            <Link href="/tree">
              <Badge
                variant="secondary"
                className="gap-1.5 border border-amber-500/20 bg-amber-500/10 text-amber-100 hover:bg-amber-500/15"
              >
                <Trophy className="size-3.5 text-amber-400" />
                {userName ? `${totalScore} pts` : "Earn points"}
              </Badge>
            </Link>
            <SetUsernameDialog currentUserName={userName} />
            {hasLiveMatch && (
              <Badge variant="destructive" className="gap-1.5">
                <span className="size-1.5 animate-pulse rounded-full bg-destructive" />
                Live
              </Badge>
            )}
          </div>
        </header>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            variant="secondary"
            size="lg"
            className="h-auto flex-1 justify-between rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-amber-100 hover:bg-amber-500/15"
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
          <Button
            asChild
            variant="secondary"
            size="lg"
            className="h-auto flex-1 justify-between rounded-xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sky-100 hover:bg-sky-500/15"
          >
            <Link href="/tree">
              <span className="flex items-center gap-2.5">
                <Network className="size-4 text-sky-400" />
                <span className="text-sm font-medium">
                  View knockout stage bracket
                </span>
              </span>
              <ArrowRight className="size-4 text-sky-400 transition-transform group-hover/button:translate-x-1" />
            </Link>
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          {liveMatches.length > 0
            ? liveMatches.map((match) => {
                const showActions =
                  match.status !== "FINISHED" &&
                  match.homeTeam.id != null &&
                  match.awayTeam.id != null;

                return (
                  <Card key={match.id} className="gap-3 px-4">
                    {(match.status === "IN_PLAY" || match.status === "PAUSED") && (
                      <div className="-mx-4 -mt-4 h-1 overflow-hidden bg-destructive/15">
                        <div className="h-full w-1/3 animate-live-bar bg-destructive" />
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {getMatchLabel(match)}
                      </span>
                      <LiveStatusBadge match={match} />
                    </div>
                    <Separator />
                    <div className="flex flex-col gap-2.5">
                      <LiveTeamRow
                        team={match.homeTeam}
                        score={match.score.fullTime.home}
                      />
                      <LiveTeamRow
                        team={match.awayTeam}
                        score={match.score.fullTime.away}
                      />
                    </div>
                    {showActions && (
                      <>
                        <Separator />
                        <div className="flex gap-2">
                          <MatchActionDialog
                            match={match}
                            userName={userName}
                            type="prediction"
                            pickedTeamId={predictionByMatchId.get(match.id) ?? null}
                          />
                          <MatchActionDialog
                            match={match}
                            userName={userName}
                            type="support"
                            pickedTeamId={supportByMatchId.get(match.id) ?? null}
                          />
                        </div>
                        <MatchCommunityStats
                          match={match}
                          predictionCounts={predictionCounts.get(match.id)}
                          supportCounts={supportCounts.get(match.id)}
                        />
                      </>
                    )}
                  </Card>
                );
              })
            : fallbackMatches.map((match) => (
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
