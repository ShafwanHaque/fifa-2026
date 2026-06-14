import Link from "next/link";
import { cookies } from "next/headers";
import { Home, MapPin, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserHeaderActions } from "@/components/user-header-actions";
import { getLeaderboard } from "@/lib/actions/leaderboard";
import { cn } from "@/lib/utils";

const MEDALS = ["🥇", "🥈", "🥉"];

export default async function LeaderboardPage() {
  const cookieStore = await cookies();
  const userName = cookieStore.get("userName")?.value;

  const leaderboard = await getLeaderboard();
  const myRank = leaderboard.findIndex((entry) => entry.username === userName);

  return (
    <main className="flex-1 px-4 py-10 sm:py-16">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              FIFA World Cup 2026
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">Leaderboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Everyone starts with 50 points. Correct predictions add points,
              wrong ones cost points — climb the ranks before the final.
            </p>
          </div>
          <UserHeaderActions />
        </header>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-auto flex-1 justify-between rounded-xl px-4 py-3"
          >
            <Link href="/">
              <span className="flex items-center gap-2.5">
                <Home className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">Back to Home</span>
              </span>
            </Link>
          </Button>
          {myRank !== -1 && (
            <Button
              asChild
              variant="secondary"
              size="lg"
              className="h-auto flex-1 justify-between rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-amber-100 hover:bg-amber-500/15"
            >
              <a href="#my-position">
                <span className="flex items-center gap-2.5">
                  <MapPin className="size-4 text-amber-400" />
                  <span className="text-sm font-medium">Your position</span>
                </span>
                <span className="font-semibold tabular-nums">
                  #{myRank + 1}
                </span>
              </a>
            </Button>
          )}
        </div>

        <Card className="gap-0.5 px-2 py-2">
          {leaderboard.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No players yet — set a username to be the first on the board.
            </p>
          ) : (
            leaderboard.map((entry, i) => {
              const isMe = entry.username === userName;
              return (
                <div
                  key={entry.username}
                  id={isMe ? "my-position" : undefined}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-sm",
                    isMe && "scroll-mt-24 bg-amber-500/10 ring-1 ring-amber-500/20"
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center text-sm font-semibold tabular-nums text-muted-foreground">
                      {MEDALS[i] ?? i + 1}
                    </span>
                    <span
                      className={cn(
                        "truncate font-medium",
                        isMe && "text-amber-100"
                      )}
                    >
                      {entry.username}
                      {isMe && " (you)"}
                    </span>
                  </div>
                  <span className="flex shrink-0 items-center gap-1.5 font-semibold tabular-nums">
                    <Trophy className="size-3.5 text-amber-400" />
                    {entry.score} pts
                  </span>
                </div>
              );
            })
          )}
        </Card>
      </div>
    </main>
  );
}
