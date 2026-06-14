"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Lock, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type BracketMatch, type BracketSlot } from "@/lib/world-cup-data";
import type { StandingsGroup, StandingTeam } from "@/lib/football-data";
import { saveGroupPositionPrediction } from "@/lib/actions/predictions";
import {
  encodeGroupPositionId,
  getGroupPositionTeamId,
  POINTS_BY_STAGE,
} from "@/lib/predictions";
import { cn } from "@/lib/utils";

const GROUP_POSITION_POINTS = POINTS_BY_STAGE.GROUP_POSITION;

// Colors cycle for the community-prediction ratio bar, one per team in a group.
const RATIO_COLORS = [
  "bg-violet-500",
  "bg-fuchsia-500",
  "bg-amber-500",
  "bg-sky-500",
];

function PredictionRatioBar({
  teams,
  counts,
}: {
  teams: StandingTeam["team"][];
  counts?: Map<number, number>;
}) {
  const total = teams.reduce((sum, t) => sum + (counts?.get(t.id) ?? 0), 0);

  if (total === 0) {
    return <p className="text-[10px] text-muted-foreground">No community picks yet</p>;
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex h-1.5 overflow-hidden rounded-full bg-muted">
        {teams.map((team, i) => {
          const count = counts?.get(team.id) ?? 0;
          if (count === 0) return null;
          return (
            <div
              key={team.id}
              className={RATIO_COLORS[i % RATIO_COLORS.length]}
              style={{ width: `${(count / total) * 100}%` }}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
        {teams.map((team, i) => {
          const count = counts?.get(team.id) ?? 0;
          if (count === 0) return null;
          return (
            <span key={team.id} className="flex items-center gap-1">
              <span className={cn("size-1.5 rounded-full", RATIO_COLORS[i % RATIO_COLORS.length])} />
              {team.shortName} {Math.round((count / total) * 100)}%
            </span>
          );
        })}
      </div>
    </div>
  );
}

type SlotStatus = "predicted" | "correct" | "incorrect";

export function SlotRow({
  slot,
  status,
}: {
  slot: BracketSlot;
  status?: SlotStatus;
}) {
  return (
    <div className="flex items-center justify-between gap-2 px-2.5 py-1">
      <span className="truncate font-medium">{slot.label}</span>
      <span className="flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground">
        {status === "predicted" && <Lock className="size-3" />}
        {status === "correct" && <Check className="size-3 text-emerald-400" />}
        {status === "incorrect" && <X className="size-3 text-destructive" />}
        {slot.sub}
      </span>
    </div>
  );
}

type SlotSource =
  | { type: "group"; letter: string; position: 0 | 1 }
  | { type: "third" };

function slotSource(slot: BracketSlot): SlotSource {
  if (slot.label.startsWith("Group ")) {
    return {
      type: "group",
      letter: slot.label.slice("Group ".length),
      position: slot.sub === "1st" ? 0 : 1,
    };
  }
  return { type: "third" };
}

function GroupPositionPicker({
  letter,
  position,
  positionLabel,
  teams,
  userName,
  finished,
  myPick,
  actualTeamId,
  counts,
}: {
  letter: string;
  position: 1 | 2;
  positionLabel: string;
  teams: StandingTeam["team"][];
  userName?: string;
  finished: boolean;
  myPick?: number;
  actualTeamId: number | null;
  counts?: Map<number, number>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const locked = myPick != null || finished;
  const ratioBar = <PredictionRatioBar teams={teams} counts={counts} />;

  if (!userName) {
    return (
      <div className="flex flex-col gap-1">
        <p className="text-[11px] text-muted-foreground">
          Set a username to predict who finishes {positionLabel}.
        </p>
        {ratioBar}
      </div>
    );
  }

  function handlePick(teamId: number) {
    setError(null);
    startTransition(async () => {
      const result = await saveGroupPositionPrediction(letter, position, teamId);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <p className="text-[10px] font-medium text-muted-foreground">
        {locked
          ? `Your pick for ${positionLabel}`
          : `Predict who finishes ${positionLabel} (+${GROUP_POSITION_POINTS.correct} / ${GROUP_POSITION_POINTS.incorrect})`}
      </p>
      <div className="flex flex-wrap gap-1">
        {teams.map((team) => {
          const selected = myPick === team.id;
          const correct = finished && selected && actualTeamId === team.id;
          const incorrect = finished && selected && actualTeamId !== team.id;
          return (
            <button
              key={team.id}
              type="button"
              disabled={locked || isPending}
              onClick={() => handlePick(team.id)}
              className={cn(
                "flex items-center gap-1 rounded-md border px-1.5 py-1 text-[11px] font-medium transition-colors",
                selected
                  ? "border-primary bg-primary/10"
                  : "border-transparent bg-muted/50 text-muted-foreground",
                !locked && "cursor-pointer hover:border-foreground/20 hover:text-foreground",
                locked && "cursor-not-allowed opacity-90"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={team.crest} alt="" className="size-3.5 shrink-0" />
              <span className="truncate">{team.shortName}</span>
              {selected && !finished && <Lock className="size-3 shrink-0" />}
              {correct && <Check className="size-3 shrink-0 text-emerald-400" />}
              {incorrect && <X className="size-3 shrink-0 text-destructive" />}
            </button>
          );
        })}
      </div>
      {error && <p className="text-[10px] text-destructive">{error}</p>}
      {ratioBar}
    </div>
  );
}

function GroupCard({
  letter,
  position,
  standings,
  userName,
  finished,
  myPick,
  groupPositionCounts,
}: {
  letter: string;
  position: 0 | 1;
  standings: StandingsGroup[];
  userName?: string;
  finished: boolean;
  myPick?: number;
  groupPositionCounts: Map<number, Map<number, number>>;
}) {
  const table = standings.find((g) => g.group === `Group ${letter}`)?.table;
  const predictionPosition: 1 | 2 = position === 0 ? 1 : 2;

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-semibold text-muted-foreground">
        Group {letter}
      </p>
      {table && table.length > 0 ? (
        <>
          <ul className="flex flex-col gap-1">
            {table.map((row, i) => (
              <li
                key={row.team.id}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1 text-sm",
                  i === position
                    ? "bg-primary/10 font-medium"
                    : "text-muted-foreground"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={row.team.crest} alt="" className="h-4 w-4 shrink-0" />
                <span className="truncate">{row.team.shortName}</span>
                {i === position && (
                  <Badge variant="secondary" className="ml-auto">
                    {position === 0 ? "1st" : "2nd"}
                  </Badge>
                )}
              </li>
            ))}
          </ul>
          <GroupPositionPicker
            letter={letter}
            position={predictionPosition}
            positionLabel={position === 0 ? "1st" : "2nd"}
            teams={table.map((row) => row.team)}
            userName={userName}
            finished={finished}
            myPick={myPick}
            actualTeamId={finished ? table[predictionPosition - 1]?.team.id ?? null : null}
            counts={groupPositionCounts.get(encodeGroupPositionId(letter, predictionPosition))}
          />
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Standings unavailable.
        </p>
      )}
    </div>
  );
}

function ThirdPlaceCard({ standings }: { standings: StandingsGroup[] }) {
  const thirds = standings
    .filter((g) => g.table.length >= 3)
    .map((g) => ({ group: g.group, team: g.table[2] }));

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-semibold text-muted-foreground">
        Best 3rd-placed candidates
      </p>
      {thirds.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {thirds.map(({ group, team }) => (
            <li
              key={team.team.id}
              className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-muted-foreground"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={team.team.crest} alt="" className="h-4 w-4 shrink-0" />
              <span className="truncate">{team.team.shortName}</span>
              <span className="ml-auto shrink-0 text-[10px]">{group}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          Standings unavailable.
        </p>
      )}
    </div>
  );
}

function slotStatus(
  source: SlotSource,
  standings: StandingsGroup[],
  finishedGroups: string[],
  myGroupPicks: Record<string, number>
): SlotStatus | undefined {
  if (source.type !== "group") return undefined;
  const position: 1 | 2 = source.position === 0 ? 1 : 2;
  const myPick = myGroupPicks[`${source.letter}-${position}`];
  if (myPick == null) return undefined;
  if (!finishedGroups.includes(source.letter)) return "predicted";
  const actualTeamId = getGroupPositionTeamId(standings, source.letter, position);
  if (actualTeamId == null) return "predicted";
  return actualTeamId === myPick ? "correct" : "incorrect";
}

function describeSlot(source: SlotSource): string {
  if (source.type === "group") {
    return `Group ${source.letter} ${source.position === 0 ? "1st" : "2nd"}`;
  }
  return "one of the best 3rd-placed teams";
}

export function BracketMatchButton({
  match,
  standings,
  userName,
  finishedGroups,
  myGroupPicks,
  groupPositionCounts,
}: {
  match: BracketMatch;
  standings: StandingsGroup[];
  userName?: string;
  finishedGroups: string[];
  myGroupPicks: Record<string, number>;
  groupPositionCounts: Map<number, Map<number, number>>;
}) {
  const [open, setOpen] = useState(false);
  const home = slotSource(match.home);
  const away = slotSource(match.away);
  const bothThird = home.type === "third" && away.type === "third";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-full w-full cursor-pointer flex-col justify-center divide-y divide-border rounded-md bg-card text-xs ring-1 ring-foreground/10 transition-colors hover:ring-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <SlotRow
          slot={match.home}
          status={slotStatus(home, standings, finishedGroups, myGroupPicks)}
        />
        <SlotRow
          slot={match.away}
          status={slotStatus(away, standings, finishedGroups, myGroupPicks)}
        />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Round of 32 &middot; Match {match.id}</DialogTitle>
            <DialogDescription>
              {bothThird
                ? "Two of the best 3rd-placed teams."
                : `${describeSlot(home)} vs ${describeSlot(away)}.`}{" "}
              The actual matchup will be confirmed once the group stage
              concludes.
            </DialogDescription>
          </DialogHeader>
          {bothThird ? (
            <ThirdPlaceCard standings={standings} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {home.type === "group" ? (
                <GroupCard
                  letter={home.letter}
                  position={home.position}
                  standings={standings}
                  userName={userName}
                  finished={finishedGroups.includes(home.letter)}
                  myPick={myGroupPicks[`${home.letter}-${home.position === 0 ? 1 : 2}`]}
                  groupPositionCounts={groupPositionCounts}
                />
              ) : (
                <ThirdPlaceCard standings={standings} />
              )}
              {away.type === "group" ? (
                <GroupCard
                  letter={away.letter}
                  position={away.position}
                  standings={standings}
                  userName={userName}
                  finished={finishedGroups.includes(away.letter)}
                  myPick={myGroupPicks[`${away.letter}-${away.position === 0 ? 1 : 2}`]}
                  groupPositionCounts={groupPositionCounts}
                />
              ) : (
                <ThirdPlaceCard standings={standings} />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
