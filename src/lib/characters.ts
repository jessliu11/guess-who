import { supabase } from './supabase';
import type { Character } from '../types/game.types';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function fetchImageBuffer(uri: string): Promise<ArrayBuffer> {
  // arraybuffer is reliably serialized by React Native's networking stack;
  // Blob responses can upload as 0 bytes when passed through the Supabase client.
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response as ArrayBuffer);
    xhr.onerror = () => reject(new Error('Failed to read image file'));
    xhr.responseType = 'arraybuffer';
    xhr.open('GET', uri);
    xhr.send();
  });
}

export async function getMyCustomCharacters(userId: string): Promise<Character[]> {
  const { data, error } = await supabase
    .from('characters')
    .select()
    .eq('creator_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Character[];
}

export async function createCustomCharacter(
  userId: string,
  name: string,
  imageUri: string,
): Promise<Character> {
  const characterId = generateUUID();
  const storagePath = `custom/${userId}/${characterId}.jpg`;

  // Explicitly load the session so the token is ready in memory before
  // calling the storage client (avoids the AsyncStorage async-load race).
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated. Please sign in again.');

  const buffer = await fetchImageBuffer(imageUri);

  // Now that the session is cached in memory, the storage client picks it up
  // immediately — no race condition.
  const { error: storageError } = await supabase.storage
    .from('character-images')
    .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true });

  if (storageError) {
    throw new Error(storageError.message);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('character-images')
    .getPublicUrl(storagePath);

  // Insert character row
  const { data, error } = await supabase
    .from('characters')
    .insert({
      id: characterId,
      category_id: 'custom',
      creator_id: userId,
      name: name.trim(),
      image_url: publicUrl,
      tier: 'standard',
      is_active: true,
      sort_order: 0,
      attributes: {
        gender: 'non-binary',
        hair_color: 'black',
        hair_length: 'medium',
        age_group: 'middle-aged',
        nationality: 'Custom',
        facial_hair: false,
        glasses: false,
      },
    })
    .select()
    .single();

  if (error) {
    // Clean up orphaned storage file on DB failure
    await supabase.storage.from('character-images').remove([storagePath]);
    throw new Error(error.message);
  }

  return data as Character;
}

export async function deleteCustomCharacter(
  characterId: string,
  userId: string,
): Promise<void> {
  // Delete storage file (best-effort — don't block on error)
  await supabase.storage
    .from('character-images')
    .remove([`custom/${userId}/${characterId}.jpg`]);

  const { error } = await supabase
    .from('characters')
    .delete()
    .eq('id', characterId)
    .eq('creator_id', userId);

  if (error) throw error;
}
