import { createBrowserClient } from '@supabase/ssr';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface RecommendedEvent {
  id: string;
  title: string;
  category: string;
  location: string;
  is_online: boolean;
  is_paid: boolean;
  price: number;
  start_at: string;
  end_at: string;
  cover_image_url: string | null;
  total_capacity: number;
  tags: string[];
  attendeesCount: number;
  tier: 'A' | 'B' | 'C';
}

interface UserPrefs {
  city: string | null;
  preferences: string[] | null;
}

// ─── Supabase client (browser) ────────────────────────────────────────────────

function getClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const EVENT_SELECT = 'id,title,category,location,is_online,is_paid,price,start_at,end_at,cover_image_url,total_capacity,tags,event_attendees(count)';
const TIER_A_MIN = 3;
const TIER_B_MIN = 3;
const RESULT_LIMIT = 12;

function toEvent(row: any, tier: 'A' | 'B' | 'C'): RecommendedEvent {
  return {
    ...row,
    attendeesCount: row.event_attendees?.[0]?.count ?? 0,
    tier,
  };
}

// ─── Ana Fonksiyon ────────────────────────────────────────────────────────────

export async function getRecommendedEvents(userId: string): Promise<RecommendedEvent[]> {
  const supabase = getClient();
  const now = new Date().toISOString();

  // Kullanıcı tercihlerini çek
  const { data: profile } = await supabase
    .from('profiles')
    .select('city, preferences')
    .eq('id', userId)
    .single<UserPrefs>();

  const city = profile?.city?.trim() || null;
  const prefs = profile?.preferences?.length ? profile.preferences : null;

  // ── Tier A + B paralel sorgu ───────────────────────────────────────────────
  const baseQuery = () =>
    supabase
      .from('events')
      .select(EVENT_SELECT)
      .eq('status', 'published')
      .gte('end_at', now)
      .order('start_at', { ascending: true });

  const [tierAResult, tierBResult] = await Promise.all([
    // Tier A: şehir + kategori eşleşmesi
    city && prefs
      ? baseQuery()
          .ilike('location', `%${city}%`)
          .in('category', prefs)
          .limit(RESULT_LIMIT)
      : Promise.resolve({ data: [] }),

    // Tier B: sadece şehir
    city
      ? baseQuery()
          .ilike('location', `%${city}%`)
          .limit(RESULT_LIMIT)
      : Promise.resolve({ data: [] }),
  ]);

  const tierA = (tierAResult.data || []).map((r) => toEvent(r, 'A'));

  if (tierA.length >= TIER_A_MIN) return tierA;

  // Tier A yetersiz — Tier B'den Tier A'da olmayanları ekle
  const tierAIds = new Set(tierA.map((e) => e.id));
  const tierBExtra = (tierBResult.data || [])
    .filter((r: any) => !tierAIds.has(r.id))
    .map((r: any) => toEvent(r, 'B'));

  const combined = [...tierA, ...tierBExtra];

  if (combined.length >= TIER_B_MIN) return combined.slice(0, RESULT_LIMIT);

  // ── Tier C: genel popüler ──────────────────────────────────────────────────
  const combinedIds = new Set(combined.map((e) => e.id));

  const { data: tierCRaw } = await supabase
    .from('events')
    .select(EVENT_SELECT)
    .eq('status', 'published')
    .gte('end_at', now)
    .order('created_at', { ascending: false })
    .limit(30);

  const tierC = (tierCRaw || [])
    .filter((r: any) => !combinedIds.has(r.id))
    .map((r: any) => toEvent(r, 'C'))
    // Client-side sort by attendee count (Supabase ilişki üzerinden order desteklemiyor)
    .sort((a, b) => b.attendeesCount - a.attendeesCount)
    .slice(0, RESULT_LIMIT - combined.length);

  return [...combined, ...tierC].slice(0, RESULT_LIMIT);
}

// ─── Kullanım kolaylığı: auth olmadan genel popüler ───────────────────────────

export async function getPopularEvents(): Promise<RecommendedEvent[]> {
  const supabase = getClient();
  const now = new Date().toISOString();

  const { data } = await supabase
    .from('events')
    .select(EVENT_SELECT)
    .eq('status', 'published')
    .gte('end_at', now)
    .order('created_at', { ascending: false })
    .limit(12);

  return (data || [])
    .map((r: any) => toEvent(r, 'C'))
    .sort((a, b) => b.attendeesCount - a.attendeesCount);
}