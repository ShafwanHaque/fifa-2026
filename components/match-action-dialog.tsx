"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Equal, Heart, Lock, Target } from "lucide-react";
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
import { saveSupport } from "@/lib/actions/supports";
import { DRAW_PICK_ID } from "@/lib/predictions";
import { cn } from "@/lib/utils";
import type { Match, MatchTeam } from "@/lib/football-data";

const COPY = {
  prediction: {
    trigger: "Make prediction",
    pickedPrefix: "Predicted",
    icon: Target,
    title: "Pick the winner",
    description: "Call the winner of this match. One pick per match.",
    accent:
      "border-violet-500/30 bg-violet-500/10 text-violet-100 hover:bg-violet-500/20",
    iconAccent: "text-violet-400",
  },
  support: {
    trigger: "Do support",
    pickedPrefix: "Supporting",
    icon: Heart,
    title: "Show your support",
    description: "Pick the team you're cheering for. One pick per match.",
    accent:
      "border-rose-500/30 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20",
    iconAccent: "text-rose-400",
  },
} as const;

const PICKED_ACCENT =
  "border-emerald-500/30 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20";
const PICKED_ICON_ACCENT = "text-emerald-400";

interface MatchActionDialogProps {
  match: Match;
  userName?: string;
  type: "prediction" | "support";
  pickedTeamId: number | null;
}

export function MatchActionDialog({
  match,
  userName,
  type,
  pickedTeamId,
}: MatchActionDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [usernameValue, setUsernameValue] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [pickError, setPickError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const copy = COPY[type];
  const Icon = copy.icon;

  const showDrawOption = type === "prediction" && match.stage === "GROUP_STAGE";
  const hasPick = pickedTeamId != null;
  const pickedDraw = pickedTeamId === DRAW_PICK_ID;
  const pickedTeam =
    pickedTeamId != null && pickedTeamId === match.homeTeam.id
      ? match.homeTeam
      : pickedTeamId != null && pickedTeamId === match.awayTeam.id
        ? match.awayTeam
        : null;
  const pickedLabel = pickedDraw ? "Draw" : pickedTeam?.shortName ?? "TBD";

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

  function handlePick(teamId: number) {
    setPickError(null);
    startTransition(async () => {
      const result =
        type === "prediction"
          ? await savePrediction(match.id, teamId, match.stage)
          : await saveSupport(match.id, teamId);
      if (result.success) {
        router.refresh();
      } else {
        setPickError(result.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className={cn(
            "h-auto flex-1 gap-1.5 border text-xs font-medium",
            hasPick ? PICKED_ACCENT : copy.accent
          )}
        >
          <Icon className={cn("size-3.5", hasPick ? PICKED_ICON_ACCENT : copy.iconAccent)} />
          {hasPick ? `${copy.pickedPrefix}: ${pickedLabel}` : copy.trigger}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        {!userName ? (
          <form onSubmit={handleUsernameSubmit} className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Set a username to continue.
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
          <div className="flex flex-col gap-3">
            {pickError && <p className="text-sm text-destructive">{pickError}</p>}

            {hasPick ? (
              <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm">
                <Lock className="size-3.5 shrink-0 text-muted-foreground" />
                {copy.pickedPrefix} {pickedLabel}. Locked in.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <TeamPickButton
                  team={match.homeTeam}
                  disabled={isPending || match.homeTeam.id == null}
                  onClick={() => {
                    if (match.homeTeam.id != null) handlePick(match.homeTeam.id);
                  }}
                />
                {showDrawOption && (
                  <DrawPickButton
                    disabled={isPending}
                    onClick={() => handlePick(DRAW_PICK_ID)}
                  />
                )}
                <TeamPickButton
                  team={match.awayTeam}
                  disabled={isPending || match.awayTeam.id == null}
                  onClick={() => {
                    if (match.awayTeam.id != null) handlePick(match.awayTeam.id);
                  }}
                />
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DrawPickButton({
  disabled,
  onClick,
}: {
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center justify-center gap-2 rounded-md border border-transparent bg-muted/50 px-3 py-2 text-sm font-medium transition-colors",
        !disabled && "cursor-pointer hover:border-foreground/20 hover:bg-muted",
        disabled && "cursor-not-allowed opacity-70"
      )}
    >
      <Equal className="size-4" />
      <span>Draw</span>
    </button>
  );
}

function TeamPickButton({
  team,
  disabled,
  onClick,
}: {
  team: MatchTeam;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-2 rounded-md border border-transparent bg-muted/50 px-3 py-2 text-sm font-medium transition-colors",
        !disabled && "cursor-pointer hover:border-foreground/20 hover:bg-muted",
        disabled && "cursor-not-allowed opacity-70"
      )}
    >
      {team.crest && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={team.crest} alt="" className="size-5" />
      )}
      <span>{team.shortName ?? team.name ?? "TBD"}</span>
    </button>
  );
}
