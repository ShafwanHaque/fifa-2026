"use server";

import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getMatches } from "@/lib/football-data";
import { isPredictable, type PredictionRow } from "@/lib/predictions";

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
  if (match.homeTeam.id !== teamId && match.awayTeam.id !== teamId) {
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
