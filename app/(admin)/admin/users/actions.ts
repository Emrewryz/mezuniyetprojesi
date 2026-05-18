"use server";

import { supabase } from '@/lib/supabase';import { revalidatePath } from "next/cache";

export type UserRole = "participant" | "organizer" | "admin";

export async function updateUserRole(userId: string, newRole: UserRole) {

  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export async function deleteUser(userId: string) {

  // Soft-delete via role demotion or actual deletion depending on policy
  // Here we just remove the user's profile data for safety
  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: "[Silindi]",
      last_name: "",
      display_name: "[Silindi]",
      bio: null,
      avatar_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/users");
  return { success: true };
}