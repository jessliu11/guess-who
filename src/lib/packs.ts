import { supabase } from './supabase';
import { generateCode } from '../utils/joinCode';
import type { CharacterPack, Character } from '../types/game.types';

export async function getSystemPacks(): Promise<CharacterPack[]> {
  const { data, error } = await supabase
    .from('character_packs')
    .select()
    .eq('is_system', true)
    .order('created_at');
  if (error) throw error;
  return data as CharacterPack[];
}

export async function getPackById(packId: string): Promise<CharacterPack | null> {
  const { data } = await supabase
    .from('character_packs')
    .select()
    .eq('id', packId)
    .maybeSingle();
  return data as CharacterPack | null;
}

export async function getPackByCode(shareCode: string): Promise<CharacterPack | null> {
  const { data } = await supabase
    .from('character_packs')
    .select()
    .eq('share_code', shareCode.toUpperCase())
    .maybeSingle();
  return data as CharacterPack | null;
}

export async function getMyPacks(userId: string): Promise<CharacterPack[]> {
  const { data, error } = await supabase
    .from('character_packs')
    .select()
    .eq('creator_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as CharacterPack[];
}

export async function createPack(
  userId: string,
  name: string,
  characterIds: string[],
  previewImageUrls: string[],
): Promise<CharacterPack> {
  const share_code = generateCode(6);

  const { data, error } = await supabase
    .from('character_packs')
    .insert({
      name,
      share_code,
      creator_id: userId,
      is_system: false,
      requires_premium: true,
      character_ids: characterIds,
      preview_image_urls: previewImageUrls.slice(0, 4),
    })
    .select()
    .single();

  if (error) throw error;
  return data as CharacterPack;
}

export async function deletePack(packId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('character_packs')
    .delete()
    .eq('id', packId)
    .eq('creator_id', userId);
  if (error) throw error;
}

export async function getCharactersByCategory(
  categoryId: string,
  tier?: 'standard' | 'extended' | 'all',
): Promise<Character[]> {
  let query = supabase
    .from('characters')
    .select()
    .eq('category_id', categoryId)
    .eq('is_active', true)
    .order('sort_order');

  if (tier && tier !== 'all') {
    query = query.eq('tier', tier);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Character[];
}

export async function getCharactersByIds(ids: string[]): Promise<Character[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from('characters')
    .select()
    .in('id', ids);
  if (error) throw error;
  return data as Character[];
}
