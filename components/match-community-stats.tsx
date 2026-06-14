import { DRAW_PICK_ID } from "@/lib/predictions";
import { cn } from "@/lib/utils";
import type { Match } from "@/lib/football-data";

interface StatsSegment {
  label: string;
  count: number;
  colorClass: string;
}

interface MatchCommunityStatsProps {
  match: Match;
  predictionCounts?: Map<number, number>;
  supportCounts?: Map<number, number>;
}

export function MatchCommunityStats({
  match,
  predictionCounts,
  supportCounts,
}: MatchCommunityStatsProps) {
  if (match.homeTeam.id == null || match.awayTeam.id == null) return null;

  const homeLabel = match.homeTeam.shortName ?? "Home";
  const awayLabel = match.awayTeam.shortName ?? "Away";

  const predictionSegments: StatsSegment[] = [
    {
      label: homeLabel,
      count: predictionCounts?.get(match.homeTeam.id) ?? 0,
      colorClass: "bg-violet-500",
    },
    ...(match.stage === "GROUP_STAGE"
      ? [
          {
            label: "Draw",
            count: predictionCounts?.get(DRAW_PICK_ID) ?? 0,
            colorClass: "bg-slate-400",
          },
        ]
      : []),
    {
      label: awayLabel,
      count: predictionCounts?.get(match.awayTeam.id) ?? 0,
      colorClass: "bg-fuchsia-500",
    },
  ];

  const supportSegments: StatsSegment[] = [
    {
      label: homeLabel,
      count: supportCounts?.get(match.homeTeam.id) ?? 0,
      colorClass: "bg-rose-500",
    },
    {
      label: awayLabel,
      count: supportCounts?.get(match.awayTeam.id) ?? 0,
      colorClass: "bg-sky-500",
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      <StatsBar title="Predictions" segments={predictionSegments} />
      <StatsBar title="Support" segments={supportSegments} />
    </div>
  );
}

function StatsBar({ title, segments }: { title: string; segments: StatsSegment[] }) {
  const total = segments.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground">
        <span>{title}</span>
        {total > 0 && (
          <span>
            {total} {total === 1 ? "pick" : "picks"}
          </span>
        )}
      </div>
      {total > 0 ? (
        <>
          <div className="flex h-1.5 overflow-hidden rounded-full bg-muted">
            {segments.map(
              (segment) =>
                segment.count > 0 && (
                  <div
                    key={segment.label}
                    className={segment.colorClass}
                    style={{ width: `${(segment.count / total) * 100}%` }}
                  />
                )
            )}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
            {segments.map((segment) => (
              <span key={segment.label} className="flex items-center gap-1">
                <span className={cn("size-1.5 rounded-full", segment.colorClass)} />
                {segment.label} {Math.round((segment.count / total) * 100)}%
              </span>
            ))}
          </div>
        </>
      ) : (
        <p className="text-[10px] text-muted-foreground">No picks yet</p>
      )}
    </div>
  );
}
