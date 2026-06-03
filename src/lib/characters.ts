import { supabase } from './supabase';
import type { Session } from '@supabase/supabase-js';
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
    xhr.timeout = 30_000;
    xhr.ontimeout = () => reject(new Error('Image read timed out'));
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
  imageUri: string | null,
  preloadedSession?: Session | null,
): Promise<Character> {
  const characterId = generateUUID();
  const storagePath = `custom/${userId}/${characterId}.jpg`;

  const session =
    preloadedSession ??
    // Explicitly load the session so the token is ready in memory before
    // calling the storage client (avoids the AsyncStorage async-load race).
    (await supabase.auth.getSession()).data.session;
  if (!session) throw new Error('Not authenticated. Please sign in again.');

  let imageUrl: string | null = null;
  let uploadedStoragePath: string | null = null;

  if (imageUri) {
    const buffer = await fetchImageBuffer(imageUri);

    // Retry storage upload — safe because upsert:true makes repeated attempts idempotent.
    let storageError: { message: string } | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const { error } = await supabase.storage
        .from('character-images')
        .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true });
      if (!error) { storageError = null; break; }
      storageError = error;
      if (attempt < 2) await new Promise(r => setTimeout(r, 600 * (attempt + 1)));
    }
    if (storageError) throw new Error(storageError.message);

    uploadedStoragePath = storagePath;
    imageUrl = supabase.storage
      .from('character-images')
      .getPublicUrl(storagePath).data.publicUrl;
  }

  // Insert character row
  const { data, error } = await supabase
    .from('characters')
    .insert({
      id: characterId,
      category_id: 'custom',
      creator_id: userId,
      name: name.trim(),
      image_url: imageUrl,
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
    if (uploadedStoragePath) {
      await supabase.storage.from('character-images').remove([uploadedStoragePath]);
    }
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
