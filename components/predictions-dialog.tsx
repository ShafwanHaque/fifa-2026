"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Lock, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { claimUserName } from "@/lib/actions/visitor";
import { savePrediction } from "@/lib/actions/predictions";
import { cn } from "@/lib/utils";
import type { MatchTeam } from "@/lib/football-data";

export interface StagePrediction {
  id: number;
  homeTeam: MatchTeam;
  awayTeam: MatchTeam;
  predictedTeamId: number | null;
  predictable: boolean;
  result: "correct" | "incorrect" | null;
  pointsAwarded: number | null;
}

export interface PredictionStage {
  stage: string;
  label: string;
  points: { correct: number; incorrect: number };
  matches: StagePrediction[];
}

interface PredictionsDialogProps {
  userName?: string;
  totalScore: number;
  stages: PredictionStage[];
}

export function PredictionsDialog({
  userName,
  totalScore,
  stages,
}: PredictionsDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [usernameValue, setUsernameValue] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [pickError, setPickError] = useState<string | null>(null);
  const [savingMatchId, setSavingMatchId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleUsernameSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUsernameError(null);
    startTransition(async () => {
      const result = await claimUserName(usernameValue);
      if (result.success) {
        router.refresh();
      } else {
        setUsernameError(result.error ?? "Something went wrong.");
      }
    });
  }

  function handlePick(matchId: number, teamId: number, stage: string) {
    setPickError(null);
    setSavingMatchId(matchId);
    startTransition(async () => {
      const result = await savePrediction(matchId, teamId, stage);
      if (result.success) {
        router.refresh();
      } else {
        setPickError(result.error ?? "Something went wrong.");
      }
      setSavingMatchId(null);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          size="lg"
          className="h-auto justify-center gap-2.5 rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-violet-100 hover:bg-violet-500/15"
        >
          <Sparkles className="size-4 text-violet-400" />
          <span className="text-sm font-medium">
            {userName ? `Predictions · ${totalScore} pts` : "Make Your Predictions"}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Knockout Predictions</DialogTitle>
          <DialogDescription>
            Your picks are valuable to us — call the winner of each match
            before kickoff and climb the leaderboard.
          </DialogDescription>
        </DialogHeader>

        {!userName ? (
          <form onSubmit={handleUsernameSubmit} className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Set a username to start predicting.
            </p>
            <Input
              value={usernameValue}
              onChange={(e) => setUsernameValue(e.target.value)}
              placeholder="e.g. Skidoo"
              maxLength={32}
              aria-invalid={!!usernameError}
              autoFocus
            />
            {usernameError && (
              <p className="text-sm text-destructive">{usernameError}</p>
            )}
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save username"}
            </Button>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-1.5">
              {stages.map(({ stage, label, points }) => (
                <Badge key={stage} variant="outline" className="font-normal">
                  {label}: +{points.correct} / {points.incorrect}
                </Badge>
              ))}
            </div>

            {pickError && (
              <p className="text-sm text-destructive">{pickError}</p>
            )}

            {stages.map((stageGroup) => {
              const anyPredictable = stageGroup.matches.some(
                (m) => m.predictable
              );
              const anyPicked = stageGroup.matches.some(
                (m) => m.predictedTeamId !== null
              );

              return (
                <section key={stageGroup.stage} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">
                      {stageGroup.label}
                    </h3>
                    <span className="text-[10px] text-muted-foreground">
                      +{stageGroup.points.correct} / {stageGroup.points.incorrect} pts
                    </span>
                  </div>

                  {!anyPredictable && !anyPicked ? (
                    <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                      <Lock className="size-3.5 shrink-0" />
                      Matchups not yet determined — check back once the
                      previous round concludes.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {stageGroup.matches.map((match) => (
                        <MatchPredictionRow
                          key={match.id}
                          match={match}
                          stage={stageGroup.stage}
                          saving={savingMatchId === match.id}
                          onPick={handlePick}
                        />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MatchPredictionRow({
  match,
  stage,
  saving,
  onPick,
}: {
  match: StagePrediction;
  stage: string;
  saving: boolean;
  onPick: (matchId: number, teamId: number, stage: string) => void;
}) {
  const hasPick = match.predictedTeamId != null;
  const locked = !match.predictable || hasPick;

  return (
    <div className="flex items-center gap-2 rounded-md bg-card px-2.5 py-1.5 ring-1 ring-foreground/10">
      <TeamPickButton
        team={match.homeTeam}
        selected={
          match.homeTeam.id != null && match.predictedTeamId === match.homeTeam.id
        }
        disabled={locked || saving || match.homeTeam.id == null}
        onClick={() => {
          if (match.homeTeam.id != null) onPick(match.id, match.homeTeam.id, stage);
        }}
      />
      <span className="shrink-0 text-[10px] text-muted-foreground">vs</span>
      <TeamPickButton
        team={match.awayTeam}
        selected={
          match.awayTeam.id != null && match.predictedTeamId === match.awayTeam.id
        }
        disabled={locked || saving || match.awayTeam.id == null}
        onClick={() => {
          if (match.awayTeam.id != null) onPick(match.id, match.awayTeam.id, stage);
        }}
      />
      {hasPick && match.result == null && (
        <Lock className="size-3.5 shrink-0 text-muted-foreground" />
      )}
      {match.result && match.pointsAwarded != null && (
        <span
          className={cn(
            "flex shrink-0 items-center gap-1 text-xs font-semibold",
            match.result === "correct" ? "text-emerald-400" : "text-destructive"
          )}
        >
          {match.result === "correct" ? (
            <Check className="size-3.5" />
          ) : (
            <X className="size-3.5" />
          )}
          {match.pointsAwarded > 0 ? `+${match.pointsAwarded}` : match.pointsAwarded}
        </span>
      )}
    </div>
  );
}

function TeamPickButton({
  team,
  selected,
  disabled,
  onClick,
}: {
  team: MatchTeam;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex min-w-0 flex-1 items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
        selected
          ? "border-primary bg-primary/10 text-foreground"
          : "border-transparent bg-muted/50 text-muted-foreground",
        !disabled && "cursor-pointer hover:border-foreground/20 hover:text-foreground",
        disabled && "cursor-not-allowed opacity-70"
      )}
    >
      {team.crest && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={team.crest} alt="" className="size-4 shrink-0" />
      )}
      <span className="truncate">{team.shortName ?? "TBD"}</span>
    </button>
  );
}
