import { supabase } from './supabase';
import { generateCode } from '../utils/joinCode';
import { shuffled } from '../utils/shuffle';
import type { GameSession, CharacterPack } from '../types/game.types';

export async function createSession(
  hostId: string,
  packId: string | null,
  characterPool: string[],
  boardSize?: number,
): Promise<GameSession> {
  const join_code = generateCode(6);
  const pool = shuffled(characterPool);
  const finalPool = boardSize && boardSize < pool.length ? pool.slice(0, boardSize) : pool;

  const { data, error } = await supabase
    .from('game_sessions')
    .insert({
      join_code,
      host_id: hostId,
      ...(packId ? { pack_id: packId } : {}),
      character_pool: finalPool,
      status: 'waiting',
    })
    .select()
    .single();

  if (error) throw error;
  return data as GameSession;
}

export async function joinSession(
  guestId: string,
  joinCode: string,
): Promise<GameSession> {
  const { data: session, error: findError } = await supabase
    .from('game_sessions')
    .select()
    .eq('join_code', joinCode.toUpperCase())
    .eq('status', 'waiting')
    .single();

  if (findError || !session) throw new Error('Session not found or already started.');

  const { data, error } = await supabase
    .from('game_sessions')
    .update({ guest_id: guestId, status: 'selecting' })
    .eq('id', session.id)
    .select()
    .single();

  if (error) throw error;
  return data as GameSession;
}

export async function getSessionByJoinCode(joinCode: string): Promise<GameSession | null> {
  const { data } = await supabase
    .from('game_sessions')
    .select()
    .eq('join_code', joinCode.toUpperCase())
    .eq('status', 'waiting')
    .maybeSingle();
  return data as GameSession | null;
}

export async function getSessionById(sessionId: string): Promise<GameSession | null> {
  const { data } = await supabase
    .from('game_sessions')
    .select()
    .eq('id', sessionId)
    .maybeSingle();
  return data as GameSession | null;
}

export async function getSessionByPackCode(packCode: string): Promise<CharacterPack | null> {
  const { data } = await supabase
    .from('character_packs')
    .select()
    .eq('share_code', packCode.toUpperCase())
    .maybeSingle();
  return data as CharacterPack | null;
}

export async function setCharacter(
  sessionId: string,
  role: 'host' | 'guest',
  characterId: string,
): Promise<void> {
  const field = role === 'host' ? 'host_character_id' : 'guest_character_id';
  const { error } = await supabase
    .from('game_sessions')
    .update({ [field]: characterId })
    .eq('id', sessionId);
  if (error) throw error;
}

export async function endTurn(
  sessionId: string,
  role: 'host' | 'guest',
  eliminatedIds: string[],
  currentTurnCount: number,
): Promise<void> {
  const eliminatedField = role === 'host' ? 'host_eliminated' : 'guest_eliminated';
  const nextTurn = role === 'host' ? 'guest' : 'host';

  const { error } = await supabase
    .from('game_sessions')
    .update({
      [eliminatedField]: eliminatedIds,
      current_turn: nextTurn,
      turn_count: currentTurnCount + 1,
    })
    .eq('id', sessionId);

  if (error) throw error;
}

export async function submitGuess(
  sessionId: string,
  role: 'host' | 'guest',
  guessedCharacterId: string,
): Promise<GameSession> {
  const { data, error } = await supabase.rpc('submit_guess', {
    p_session_id: sessionId,
    p_player_role: role,
    p_guessed_character_id: guessedCharacterId,
  });
  if (error) throw error;
  return data as GameSession;
}

export async function abandonSession(sessionId: string): Promise<void> {
  const { error } = await supabase.rpc('abandon_session', { p_session_id: sessionId });
  if (error) throw error;
}
