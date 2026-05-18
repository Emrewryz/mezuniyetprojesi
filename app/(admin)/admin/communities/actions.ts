"use server";

import { supabase } from '@/lib/supabase';import { revalidatePath } from "next/cache";

export async function toggleVerified(communityId: string, current: boolean) {

  const { error } = await supabase
    .from("communities")
    .update({ is_verified: !current, updated_at: new Date().toISOString() })
    .eq("id", communityId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/communities");
  return { success: true };
}

export async function togglePro(communityId: string, current: boolean) {

  const { error } = await supabase
    .from("communities")
    .update({ is_pro: !current, updated_at: new Date().toISOString() })
    .eq("id", communityId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/communities");
  return { success: true };
}

export async function deleteCommunity(communityId: string) {

  const { error } = await supabase
    .from("communities")
    .delete()
    .eq("id", communityId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/communities");
  return { success: true };
}