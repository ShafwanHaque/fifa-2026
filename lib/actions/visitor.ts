"use server";

import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/server";

const USERNAME_COOKIE = "userName";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 400; // 400 days — the maximum lifetime browsers allow

export async function claimUserName(username: string) {
  const trimmed = username.trim();

  if (!trimmed) {
    return { success: false, error: "Please enter a name." };
  }

  const { data: existing } = await supabaseAdmin
    .from("visitors")
    .select("id")
    .ilike("username", trimmed)
    .maybeSingle();

  if (existing) {
    return { success: false, error: "That name is already taken." };
  }

  const { error } = await supabaseAdmin
    .from("visitors")
    .insert({ username: trimmed });

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "That name is already taken." };
    }
    return { success: false, error: "Something went wrong. Please try again." };
  }

  const cookieStore = await cookies();
  cookieStore.set(USERNAME_COOKIE, trimmed, {
    maxAge: COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
  });

  return { success: true };
}
