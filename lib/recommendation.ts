import { createBrowserClient } from '@supabase/ssr';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MatchType =
  | 'followed_community'
  | 'full'
  | 'city'
  | 'interest'
  | 'none';

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
  community_id: string | null;
  attendeesCount: number;
  relevanceScore: number;
  matchType: MatchType;
}

function getClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ─── Kişiselleştirilmiş (giriş yapmış kullanıcı) ─────────────────────────────

export async function getRecommendedEvents(userId: string): Promise<RecommendedEvent[]> {
  const supabase = getClient();

  const { data, error } = await supabase.rpc('get_personalized_events', {
    p_user_id: userId,
  });

  if (error) {
    console.error('[recommendation] RPC hatası:', error.message);
    // RPC başarısız olursa fallback
    return getPopularEvents();
  }

  return (data || []).map((row: any): RecommendedEvent => ({
    id:               row.id,
    title:            row.title,
    category:         row.category,
    location:         row.location,
    is_online:        row.is_online,
    is_paid:          row.is_paid,
    price:            row.price,
    start_at:         row.start_at,
    end_at:           row.end_at,
    cover_image_url:  row.cover_image_url,
    total_capacity:   row.total_capacity,
    tags:             row.tags || [],
    community_id:     row.community_id,
    attendeesCount:   Number(row.attendees_count) || 0,
    relevanceScore:   row.relevance_score || 0,
    matchType:        row.match_type || 'none',
  }));
}

// ─── Genel popüler (giriş yapmamış kullanıcı) ────────────────────────────────

export async function getPopularEvents(): Promise<RecommendedEvent[]> {
  const supabase = getClient();

  const { data, error } = await supabase.rpc('get_personalized_events', {
    p_user_id: null,
  });

  if (error) {
    console.error('[recommendation] getPopularEvents hatası:', error.message);
    return [];
  }

  return (data || []).map((row: any): RecommendedEvent => ({
    id:               row.id,
    title:            row.title,
    category:         row.category,
    location:         row.location,
    is_online:        row.is_online,
    is_paid:          row.is_paid,
    price:            row.price,
    start_at:         row.start_at,
    end_at:           row.end_at,
    cover_image_url:  row.cover_image_url,
    total_capacity:   row.total_capacity,
    tags:             row.tags || [],
    community_id:     row.community_id,
    attendeesCount:   Number(row.attendees_count) || 0,
    relevanceScore:   row.relevance_score || 0,
    matchType:        'none',
  }));
}