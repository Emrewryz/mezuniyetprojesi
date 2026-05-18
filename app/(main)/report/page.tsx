import { supabase } from "@/lib/supabase";
import ReportForm from "@/components/report/ReportForm";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Şikayet Bildir — EtkinRota",
};

type SearchParams = Promise<{
  type?: string;
  id?: string;
}>;

type SubjectPreview = {
  title: string;
  subtitle?: string;
  avatar?: string | null;
};

const VALID_TYPES = ["event", "user", "community", "comment"];

async function fetchSubjectPreview(
  type: string,
  id: string
): Promise<SubjectPreview | null> {
  if (type === "event") {
    const { data } = await supabase
      .from("events")
      .select("title, location, cover_image_url")
      .eq("id", id)
      .single();
    if (!data) return null;
    return {
      title: data.title,
      subtitle: data.location,
      avatar: data.cover_image_url,
    };
  }

  if (type === "community") {
    const { data } = await supabase
      .from("communities")
      .select("name, city, avatar_url")
      .eq("id", id)
      .single();
    if (!data) return null;
    return {
      title: data.name,
      subtitle: data.city ?? undefined,
      avatar: data.avatar_url,
    };
  }

  if (type === "user") {
    const { data } = await supabase
      .from("profiles")
      .select("display_name, first_name, last_name, avatar_url, city")
      .eq("id", id)
      .single();
    if (!data) return null;
    const name =
      data.display_name ||
      [data.first_name, data.last_name].filter(Boolean).join(" ") ||
      "İsimsiz Kullanıcı";
    return { title: name, subtitle: data.city ?? undefined, avatar: data.avatar_url };
  }

  return null;
}

export default async function ReportPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { type = "", id = "" } = await searchParams;


  if (!type || !id || !VALID_TYPES.includes(type)) {
    redirect("/dashboard");
  }

  const preview = await fetchSubjectPreview(type, id);

  return (
    <ReportForm
      reportedType={type as "event" | "user" | "community" | "comment"}
      reportedId={id}
      preview={preview}
    />
  );
}