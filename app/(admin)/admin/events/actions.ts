"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function toggleEventStatus(
  eventId: string,
  currentStatus: string
) {
  const newStatus = currentStatus === "published" ? "draft" : "published";

  const { error } = await supabase
    .from("events")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", eventId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/events");
  return { success: true, newStatus };
}

export async function deleteEvent(eventId: string) {
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/events");
  return { success: true };
}