"use server";

import { createSupabaseServerClient } from "@/lib/supabase-server";
import { cookies } from "next/headers";

export type ReportType = "event" | "user" | "community" | "comment";

export async function submitReport(formData: {
  reported_type: ReportType;
  reported_id: string;
  reason: string;
}) {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Bu işlem için giriş yapmanız gerekiyor." };
  }

  if (!formData.reason || formData.reason.trim().length < 10) {
    return { success: false, error: "Şikayet sebebi en az 10 karakter olmalıdır." };
  }

  if (!formData.reported_id || !formData.reported_type) {
    return { success: false, error: "Geçersiz şikayet hedefi." };
  }

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    reported_type: formData.reported_type,
    reported_id: formData.reported_id,
    reason: formData.reason.trim(),
    status: "pending",
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}