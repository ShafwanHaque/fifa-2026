import type { Match } from "./football-data";

export const POINTS_BY_STAGE: Record<
  string,
  { correct: number; incorrect: number }
> = {
  GROUP_STAGE: { correct: 10, incorrect: -10 },
  LAST_32: { correct: 10, incorrect: -5 },
  LAST_16: { correct: 20, incorrect: -10 },
  QUARTER_FINALS: { correct: 40, incorrect: -40 },
  SEMI_FINALS: { correct: 80, incorrect: -80 },
  FINAL: { correct: 100, incorrect: -100 },
};

// Every visitor starts with this many points, before prediction results are applied.
export const STARTING_POINTS = 50;

export interface PredictionRow {
  match_id: number;
  stage: string;
  predicted_team_id: number;
}

// Sentinel stored in predicted_team_id for a "draw" pick. Negative so it can
// never collide with a real football-data.org team id.
export const DRAW_PICK_ID = -1;

// A match can be predicted once both sides are known and the result isn't
// in yet. Real teams only fill in a round's slots once the prior round's
// results are final, so this also gates predictions round by round.
export function isPredictable(match: Match): boolean {
  return (
    match.homeTeam.id != null &&
    match.awayTeam.id != null &&
    match.status !== "FINISHED"
  );
}

export function getWinnerTeamId(match: Match): number | null {
  if (match.score.winner === "HOME_TEAM") return match.homeTeam.id;
  if (match.score.winner === "AWAY_TEAM") return match.awayTeam.id;
  if (match.score.winner === "DRAW") return DRAW_PICK_ID;
  return null;
}

export function computeScore(
  predictions: PredictionRow[],
  matches: Match[]
): number {
  const matchById = new Map(matches.map((m) => [m.id, m]));
  let total = STARTING_POINTS;
  for (const p of predictions) {
    const match = matchById.get(p.match_id);
    if (!match || match.status !== "FINISHED") continue;
    const winnerId = getWinnerTeamId(match);
    if (winnerId == null) continue;
    const points = POINTS_BY_STAGE[p.stage];
    if (!points) continue;
    total += winnerId === p.predicted_team_id ? points.correct : points.incorrect;
  }
  return total;
}
