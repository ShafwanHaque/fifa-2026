import Link from "next/link";
import { cookies } from "next/headers";
import { Crown, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SetUsernameDialog } from "@/components/set-username-dialog";
import { getMatches, getStandings, type Match, type StandingsGroup } from "@/lib/football-data";
import { getMyPredictions } from "@/lib/actions/predictions";
import { computeScore } from "@/lib/predictions";

// Points badge, username control, and leaderboard link shared across pages.
export async function UserHeaderActions() {
  const cookieStore = await cookies();
  const userName = cookieStore.get("userName")?.value;

  const predictions = await getMyPredictions();
  let matches: Match[] = [];
  try {
    matches = await getMatches();
  } catch {
    matches = [];
  }
  let standings: StandingsGroup[] = [];
  try {
    standings = await getStandings();
  } catch {
    standings = [];
  }
  const totalScore = computeScore(predictions, matches, standings);

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <Link href="/tree">
        <Badge
          variant="secondary"
          className="gap-1.5 border border-amber-500/20 bg-amber-500/10 text-amber-100 hover:bg-amber-500/15"
        >
          <Trophy className="size-3.5 text-amber-400" />
          {userName ? `${totalScore} pts` : "Earn points"}
        </Badge>
      </Link>
      <Link href="/leaderboard">
        <Badge
          variant="secondary"
          className="gap-1.5 border border-emerald-500/20 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/15"
        >
          <Crown className="size-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Leaderboard</span>
          <span className="sm:hidden">Board</span>
        </Badge>
      </Link>
      <SetUsernameDialog currentUserName={userName} />
    </div>
  );
}
