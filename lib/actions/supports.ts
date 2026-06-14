"use server";

import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getMatches } from "@/lib/football-data";

const USERNAME_COOKIE = "userName";

export interface SupportRow {
  match_id: number;
  supported_team_id: number;
}

export async function getMySupports(): Promise<SupportRow[]> {
  const cookieStore = await cookies();
  const username = cookieStore.get(USERNAME_COOKIE)?.value;
  if (!username) return [];

  const { data, error } = await supabaseAdmin
    .from("supports")
    .select("match_id, supported_team_id")
    .eq("username", username);

  if (error || !data) return [];
  return data;
}

// For each match, how many visitors are supporting each team. Used to show
// the community support split on the home page.
export async function getSupportCounts(
  matchIds: number[]
): Promise<Map<number, Map<number, number>>> {
  const counts = new Map<number, Map<number, number>>();
  if (matchIds.length === 0) return counts;

  const { data, error } = await supabaseAdmin
    .from("supports")
    .select("match_id, supported_team_id")
    .in("match_id", matchIds);

  if (error || !data) return counts;

  for (const row of data) {
    const matchCounts = counts.get(row.match_id) ?? new Map<number, number>();
    matchCounts.set(
      row.supported_team_id,
      (matchCounts.get(row.supported_team_id) ?? 0) + 1
    );
    counts.set(row.match_id, matchCounts);
  }
  return counts;
}

export async function saveSupport(matchId: number, teamId: number) {
  const cookieStore = await cookies();
  const username = cookieStore.get(USERNAME_COOKIE)?.value;
  if (!username) {
    return { success: false, error: "Set a username first." };
  }

  let matches;
  try {
    matches = await getMatches();
  } catch {
    return { success: false, error: "Could not verify match data. Try again." };
  }

  const match = matches.find((m) => m.id === matchId);
  if (!match) {
    return { success: false, error: "Match not found." };
  }
  if (match.homeTeam.id !== teamId && match.awayTeam.id !== teamId) {
    return { success: false, error: "Invalid team for this match." };
  }

  const { data: existing } = await supabaseAdmin
    .from("supports")
    .select("id")
    .eq("username", username)
    .eq("match_id", matchId)
    .maybeSingle();

  if (existing) {
    return { success: false, error: "You're already supporting a team for this match." };
  }

  const { error } = await supabaseAdmin.from("supports").insert({
    username,
    match_id: matchId,
    supported_team_id: teamId,
  });

  if (error) {
    return { success: false, error: "Something went wrong. Try again." };
  }

  return { success: true };
}
