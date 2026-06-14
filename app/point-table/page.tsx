import Link from "next/link";
import { ArrowRight, Home, Network } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LocalDate } from "@/components/local-date";
import { UserHeaderActions } from "@/components/user-header-actions";
import { getStandings, getMatches, type StandingsGroup, type Match } from "@/lib/football-data";

const MATCH_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
};

export default async function PointTablePage() {
  let standings: StandingsGroup[] | null = null;
  try {
    standings = await getStandings();
  } catch {
    standings = null;
  }

  let results: Match[] = [];
  try {
    const matches = await getMatches();
    results = matches
      .filter((match) => match.stage === "GROUP_STAGE" && match.status === "FINISHED")
      .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime());
  } catch {
    results = [];
  }

  return (
    <main className="flex-1 px-4 py-10 sm:py-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              FIFA World Cup 2026
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Group Stage
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              48 teams compete across 12 groups. The top two teams from each
              group, plus the 8 best third-placed teams, advance to the Round
              of 32.
            </p>
          </div>
          <UserHeaderActions />
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
            className="h-auto w-full justify-between rounded-xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sky-100 hover:bg-sky-500/15 sm:w-auto"
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

        {standings && standings.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {standings.map((group) => (
              <Card key={group.group} className="gap-2 px-3">
                <span className="text-xs font-semibold text-muted-foreground">
                  {group.group}
                </span>
                <ul className="flex flex-col gap-1.5">
                  {group.table.map((row, i) => (
                    <li
                      key={row.team.id}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={row.team.crest}
                          alt=""
                          className="h-4 w-4 shrink-0"
                        />
                        <span
                          className={`truncate ${
                            i < 2 ? "font-medium" : "text-muted-foreground"
                          }`}
                        >
                          {row.team.shortName}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                        <span className="tabular-nums">
                          {row.playedGames}P
                        </span>
                        <span className="tabular-nums font-medium text-foreground">
                          {row.points}pts
                        </span>
                        {i < 2 && (
                          <Badge variant="secondary" className="text-[10px]">
                            {i + 1}
                          </Badge>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="items-center px-4 py-8 text-center">
            <p className="text-sm font-medium">Standings unavailable</p>
            <p className="text-xs text-muted-foreground">
              We couldn&apos;t load live group stage standings right now.
              Please check back later.
            </p>
          </Card>
        )}

        {results.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold tracking-tight">
              Latest Results
            </h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((match) => (
                <Card
                  key={match.id}
                  className="flex-row items-center justify-between gap-2 px-3 py-2.5 text-sm"
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={match.homeTeam.crest ?? undefined}
                        alt=""
                        className="h-4 w-4 shrink-0"
                      />
                      <span className="truncate">{match.homeTeam.shortName}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={match.awayTeam.crest ?? undefined}
                        alt=""
                        className="h-4 w-4 shrink-0"
                      />
                      <span className="truncate">{match.awayTeam.shortName}</span>
                    </span>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                    <span className="font-semibold tabular-nums">
                      {match.score.fullTime.home} - {match.score.fullTime.away}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {match.group?.replace("GROUP_", "Group ")} ·{" "}
                      <LocalDate date={match.utcDate} options={MATCH_DATE_OPTIONS} />
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
