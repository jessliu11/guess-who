export type PlayerRole = 'host' | 'guest';

export type SessionStatus =
  | 'waiting'
  | 'selecting'
  | 'active'
  | 'finished'
  | 'abandoned';

export type MoveType =
  | 'eliminate'
  | 'guess'
  | 'answer_yes'
  | 'answer_no';

export interface Character {
  id: string;
  category_id: string;
  creator_id?: string;
  name: string;
  slug: string;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface CharacterPack {
  id: string;
  name: string;
  description?: string;
  share_code: string;
  creator_id?: string;
  category_id?: string;
  is_system: boolean;
  requires_premium: boolean;
  character_ids: string[];
  preview_image_urls: string[];
  created_at: string;
  updated_at: string;
}

export interface GameSession {
  id: string;
  join_code: string;
  host_id: string;
  guest_id?: string;
  pack_id?: string;
  status: SessionStatus;
  host_character_id?: string;
  guest_character_id?: string;
  current_turn?: PlayerRole;
  winner?: PlayerRole;
  character_pool: string[];
  host_eliminated: string[];
  guest_eliminated: string[];
  turn_count: number;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export interface GameMove {
  id: string;
  session_id: string;
  player_role: PlayerRole;
  move_type: MoveType;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface Profile {
  id: string;
  display_name: string;
  avatar_url?: string;
  is_premium: boolean;
  rc_customer_id?: string;
  games_played: number;
  games_won: number;
  created_at: string;
  updated_at: string;
}
