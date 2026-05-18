"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

// Her fonksiyonun kendi içinde cookies() ile güncel server client oluşturmasını sağlıyoruz
async function getAdminClient() {
  const cookieStore = await cookies();
  return createSupabaseServerClient(cookieStore);
}

export async function resolveReport(reportId: string, adminNote?: string) {
  const supabase = await getAdminClient();
  
  const { error } = await supabase
    .from("reports")
    .update({ status: "resolved", admin_note: adminNote ?? null })
    .eq("id", reportId);

  if (error) return { success: false, error: error.message };
  
  revalidatePath("/admin/reports");
  return { success: true };
}

export async function markReviewed(reportId: string) {
  const supabase = await getAdminClient();

  const { error } = await supabase
    .from("reports")
    .update({ status: "reviewed" })
    .eq("id", reportId);

  if (error) return { success: false, error: error.message };
  
  revalidatePath("/admin/reports");
  return { success: true };
}

export async function deleteReport(reportId: string) {
  const supabase = await getAdminClient();

  const { error } = await supabase
    .from("reports")
    .delete()
    .eq("id", reportId);

  if (error) return { success: false, error: error.message };
  
  revalidatePath("/admin/reports");
  return { success: true };
}