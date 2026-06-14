"use server";

import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getMatches, getStandings } from "@/lib/football-data";
import {
  DRAW_PICK_ID,
  GROUP_LETTERS,
  encodeGroupPositionId,
  isGroupFinished,
  isPredictable,
  type PredictionRow,
} from "@/lib/predictions";

const USERNAME_COOKIE = "userName";

export async function getMyPredictions(): Promise<PredictionRow[]> {
  const cookieStore = await cookies();
  const username = cookieStore.get(USERNAME_COOKIE)?.value;
  if (!username) return [];

  const { data, error } = await supabaseAdmin
    .from("predictions")
    .select("match_id, stage, predicted_team_id")
    .eq("username", username);

  if (error || !data) return [];
  return data;
}

// For each match, how many visitors picked each team (or a draw). Used to
// show the community prediction split on the home page.
export async function getPredictionCounts(
  matchIds: number[]
): Promise<Map<number, Map<number, number>>> {
  const counts = new Map<number, Map<number, number>>();
  if (matchIds.length === 0) return counts;

  const { data, error } = await supabaseAdmin
    .from("predictions")
    .select("match_id, predicted_team_id")
    .in("match_id", matchIds);

  if (error || !data) return counts;

  for (const row of data) {
    const matchCounts = counts.get(row.match_id) ?? new Map<number, number>();
    matchCounts.set(
      row.predicted_team_id,
      (matchCounts.get(row.predicted_team_id) ?? 0) + 1
    );
    counts.set(row.match_id, matchCounts);
  }
  return counts;
}

export async function savePrediction(
  matchId: number,
  teamId: number,
  stage: string
) {
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
  if (!match || !isPredictable(match)) {
    return { success: false, error: "This match can no longer be predicted." };
  }
  if (teamId === DRAW_PICK_ID) {
    if (match.stage !== "GROUP_STAGE") {
      return { success: false, error: "A draw isn't possible at this stage." };
    }
  } else if (match.homeTeam.id !== teamId && match.awayTeam.id !== teamId) {
    return { success: false, error: "Invalid team for this match." };
  }

  const { data: existing } = await supabaseAdmin
    .from("predictions")
    .select("id")
    .eq("username", username)
    .eq("match_id", matchId)
    .maybeSingle();

  if (existing) {
    return { success: false, error: "You've already locked in your pick for this match." };
  }

  const { error } = await supabaseAdmin.from("predictions").insert({
    username,
    match_id: matchId,
    stage,
    predicted_team_id: teamId,
  });

  if (error) {
    return { success: false, error: "Something went wrong. Try again." };
  }

  return { success: true };
}

// Locks a pick for which team will finish 1st or 2nd in a group, i.e. which
// team will fill a "Group X" slot in the Round of 32 bracket.
export async function saveGroupPositionPrediction(
  group: string,
  position: 1 | 2,
  teamId: number
) {
  const cookieStore = await cookies();
  const username = cookieStore.get(USERNAME_COOKIE)?.value;
  if (!username) {
    return { success: false, error: "Set a username first." };
  }

  if (!GROUP_LETTERS.includes(group) || (position !== 1 && position !== 2)) {
    return { success: false, error: "Invalid group slot." };
  }

  let matches;
  try {
    matches = await getMatches();
  } catch {
    return { success: false, error: "Could not verify standings. Try again." };
  }

  if (isGroupFinished(matches, group)) {
    return { success: false, error: "This group's standings are final." };
  }

  let standings;
  try {
    standings = await getStandings();
  } catch {
    return { success: false, error: "Could not verify standings. Try again." };
  }

  const table = standings.find((g) => g.group === `Group ${group}`)?.table;
  if (!table?.some((row) => row.team.id === teamId)) {
    return { success: false, error: "Invalid team for this group." };
  }

  const matchId = encodeGroupPositionId(group, position);

  const { data: existing } = await supabaseAdmin
    .from("predictions")
    .select("id")
    .eq("username", username)
    .eq("match_id", matchId)
    .maybeSingle();

  if (existing) {
    return { success: false, error: "You've already locked in your pick for this slot." };
  }

  const { error } = await supabaseAdmin.from("predictions").insert({
    username,
    match_id: matchId,
    stage: "GROUP_POSITION",
    predicted_team_id: teamId,
  });

  if (error) {
    return { success: false, error: "Something went wrong. Try again." };
  }

  return { success: true };
}
