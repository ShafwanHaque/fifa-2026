import { redis } from "@/lib/redis";

const BASE_URL = "https://api.football-data.org/v4";
const STANDINGS_CACHE_KEY = "wc2026:standings";
const STANDINGS_CACHE_TTL_SECONDS = 60;
const MATCHES_CACHE_KEY = "wc2026:matches";
const MATCHES_CACHE_TTL_SECONDS = 60;

export interface StandingTeam {
  position: number;
  team: {
    id: number;
    name: string;
    shortName: string;
    crest: string;
  };
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface StandingsGroup {
  group: string;
  table: StandingTeam[];
}

interface FootballDataStandingsResponse {
  standings: {
    stage: string;
    type: string;
    group: string;
    table: StandingTeam[];
  }[];
}

// Live group-stage standings, cached briefly in Redis to stay within the
// football-data.org free-tier rate limit (10 requests/minute).
export async function getStandings(): Promise<StandingsGroup[]> {
  const cached = await redis.get<StandingsGroup[]>(STANDINGS_CACHE_KEY);
  if (cached) return cached;

  const res = await fetch(`${BASE_URL}/competitions/WC/standings`, {
    headers: { "X-Auth-Token": process.env.FOOTBALL_DATA_API_TOKEN! },
  });

  if (!res.ok) {
    throw new Error(`football-data.org standings request failed: ${res.status}`);
  }

  const data: FootballDataStandingsResponse = await res.json();

  const groups: StandingsGroup[] = data.standings
    .filter((standing) => standing.type === "TOTAL")
    .map((standing) => ({ group: standing.group, table: standing.table }))
    .sort((a, b) => a.group.localeCompare(b.group));

  await redis.set(STANDINGS_CACHE_KEY, groups, { ex: STANDINGS_CACHE_TTL_SECONDS });
  return groups;
}

export interface MatchTeam {
  id: number | null;
  name: string | null;
  shortName: string | null;
  crest: string | null;
}

export interface Match {
  id: number;
  utcDate: string;
  status: string;
  stage: string;
  group: string | null;
  matchday: number | null;
  homeTeam: MatchTeam;
  awayTeam: MatchTeam;
  score: {
    fullTime: { home: number | null; away: number | null };
  };
}

const KNOCKOUT_STAGE_LABELS: Record<string, string> = {
  LAST_32: "Round of 32",
  LAST_16: "Round of 16",
  QUARTER_FINALS: "Quarter-finals",
  SEMI_FINALS: "Semi-finals",
  THIRD_PLACE: "Third-place Playoff",
  FINAL: "Final",
};

export const KNOCKOUT_STAGES = Object.entries(KNOCKOUT_STAGE_LABELS).map(
  ([stage, label]) => ({ stage, label })
);

// Human-readable label for a match, e.g. "Group A · Matchday 2" or "Quarter-finals".
export function getMatchLabel(match: Match): string {
  if (match.stage === "GROUP_STAGE" && match.group) {
    const group = match.group.replace("GROUP_", "Group ");
    return match.matchday ? `${group} · Matchday ${match.matchday}` : group;
  }
  return KNOCKOUT_STAGE_LABELS[match.stage] ?? match.stage;
}

interface FootballDataMatchesResponse {
  matches: Match[];
}

// All World Cup 2026 fixtures (group stage + knockout), cached briefly in
// Redis to stay within the football-data.org free-tier rate limit.
export async function getMatches(): Promise<Match[]> {
  const cached = await redis.get<Match[]>(MATCHES_CACHE_KEY);
  if (cached) return cached;

  const res = await fetch(`${BASE_URL}/competitions/WC/matches`, {
    headers: { "X-Auth-Token": process.env.FOOTBALL_DATA_API_TOKEN! },
  });

  if (!res.ok) {
    throw new Error(`football-data.org matches request failed: ${res.status}`);
  }

  const data: FootballDataMatchesResponse = await res.json();

  await redis.set(MATCHES_CACHE_KEY, data.matches, { ex: MATCHES_CACHE_TTL_SECONDS });
  return data.matches;
}
