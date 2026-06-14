"use server";

import { supabaseAdmin } from "@/lib/supabase/server";
import { getMatches, getStandings, type Match, type StandingsGroup } from "@/lib/football-data";
import { computeScore, type PredictionRow } from "@/lib/predictions";

export interface LeaderboardEntry {
  username: string;
  score: number;
}

// Ranks every registered visitor by their prediction score (starting from
// STARTING_POINTS), highest first.
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data: visitors, error } = await supabaseAdmin
    .from("visitors")
    .select("username");

  if (error || !visitors) return [];

  const { data: predictions } = await supabaseAdmin
    .from("predictions")
    .select("username, match_id, stage, predicted_team_id");

  const predictionsByUser = new Map<string, PredictionRow[]>();
  for (const p of predictions ?? []) {
    const list = predictionsByUser.get(p.username) ?? [];
    list.push({
      match_id: p.match_id,
      stage: p.stage,
      predicted_team_id: p.predicted_team_id,
    });
    predictionsByUser.set(p.username, list);
  }

  let matches: Match[];
  try {
    matches = await getMatches();
  } catch {
    matches = [];
  }

  let standings: StandingsGroup[];
  try {
    standings = await getStandings();
  } catch {
    standings = [];
  }

  return visitors
    .map((v) => ({
      username: v.username,
      score: computeScore(predictionsByUser.get(v.username) ?? [], matches, standings),
    }))
    .sort((a, b) => b.score - a.score || a.username.localeCompare(b.username));
}
