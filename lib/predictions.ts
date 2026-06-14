import type { Match, StandingsGroup } from "./football-data";

export const POINTS_BY_STAGE: Record<
  string,
  { correct: number; incorrect: number }
> = {
  GROUP_STAGE: { correct: 10, incorrect: -10 },
  GROUP_POSITION: { correct: 10, incorrect: -5 },
  LAST_32: { correct: 10, incorrect: -5 },
  LAST_16: { correct: 20, incorrect: -10 },
  QUARTER_FINALS: { correct: 40, incorrect: -40 },
  SEMI_FINALS: { correct: 80, incorrect: -80 },
  FINAL: { correct: 100, incorrect: -100 },
};

// A-L, matching the 12 groups of the 2026 World Cup.
export const GROUP_LETTERS = "ABCDEFGHIJKL".split("");

// Predictions for "who finishes 1st/2nd in Group X" reuse the `predictions`
// table, which keys on a (username, match_id) pair. Real football-data.org
// match ids are positive, so encode these slots as small negative numbers:
// -11/-12 for Group A 1st/2nd, -21/-22 for Group B, ... -121/-122 for Group L.
export function encodeGroupPositionId(group: string, position: 1 | 2): number {
  const index = GROUP_LETTERS.indexOf(group);
  return -((index + 1) * 10 + position);
}

export function decodeGroupPositionId(
  id: number
): { group: string; position: 1 | 2 } | null {
  if (id >= 0) return null;
  const n = -id;
  const position = n % 10;
  const index = Math.floor(n / 10) - 1;
  if (position !== 1 && position !== 2) return null;
  if (index < 0 || index >= GROUP_LETTERS.length) return null;
  return { group: GROUP_LETTERS[index], position };
}

// A group's standings are final once every one of its group-stage matches
// has been played.
export function isGroupFinished(matches: Match[], group: string): boolean {
  const groupMatches = matches.filter(
    (m) => m.stage === "GROUP_STAGE" && m.group === `GROUP_${group}`
  );
  return (
    groupMatches.length > 0 &&
    groupMatches.every((m) => m.status === "FINISHED")
  );
}

// The team that actually finished in the given position (0-indexed table
// row), once standings are available.
export function getGroupPositionTeamId(
  standings: StandingsGroup[],
  group: string,
  position: 1 | 2
): number | null {
  const table = standings.find((g) => g.group === `Group ${group}`)?.table;
  return table?.[position - 1]?.team.id ?? null;
}

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
  matches: Match[],
  standings: StandingsGroup[] = []
): number {
  const matchById = new Map(matches.map((m) => [m.id, m]));
  let total = STARTING_POINTS;
  for (const p of predictions) {
    const points = POINTS_BY_STAGE[p.stage];
    if (!points) continue;

    if (p.stage === "GROUP_POSITION") {
      const slot = decodeGroupPositionId(p.match_id);
      if (!slot || !isGroupFinished(matches, slot.group)) continue;
      const actualTeamId = getGroupPositionTeamId(
        standings,
        slot.group,
        slot.position
      );
      if (actualTeamId == null) continue;
      total += actualTeamId === p.predicted_team_id ? points.correct : points.incorrect;
      continue;
    }

    const match = matchById.get(p.match_id);
    if (!match || match.status !== "FINISHED") continue;
    const winnerId = getWinnerTeamId(match);
    if (winnerId == null) continue;
    total += winnerId === p.predicted_team_id ? points.correct : points.incorrect;
  }
  return total;
}
