/**
 * Character Seed Script
 *
 * Fetches Wikipedia thumbnail images for each character, uploads to Supabase Storage,
 * inserts rows into the `characters` table, and updates system pack `character_ids`.
 *
 * Usage:
 *   npx tsx scripts/seed-characters.ts
 *
 * Prerequisites:
 *   - Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 *   - Run Supabase migrations 001-004 first
 *   - npm install tsx dotenv @supabase/supabase-js node-fetch
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface CharacterSeed {
  slug: string;
  name: string;
  tier: 'standard' | 'extended';
  wikipedia?: string;
  image_note?: string;
  attributes: Record<string, unknown>;
}

const CATEGORY_FILES: { categoryId: string; file: string; standardPackCode: string; extendedPackCode: string }[] = [
  { categoryId: 'athletes',    file: 'athletes.json',    standardPackCode: 'ATH-ST', extendedPackCode: 'ATH-EX' },
  { categoryId: 'actors',      file: 'actors.json',      standardPackCode: 'ACT-ST', extendedPackCode: 'ACT-EX' },
  { categoryId: 'singers',     file: 'singers.json',     standardPackCode: 'SNG-ST', extendedPackCode: 'SNG-EX' },
  { categoryId: 'politicians', file: 'politicians.json', standardPackCode: 'POL-ST', extendedPackCode: 'POL-EX' },
  { categoryId: 'fictional',   file: 'fictional.json',   standardPackCode: 'FIC-ST', extendedPackCode: 'FIC-EX' },
  { categoryId: 'cartoons',    file: 'cartoons.json',    standardPackCode: 'CAR-ST', extendedPackCode: 'CAR-EX' },
  { categoryId: 'celebrities', file: 'celebrities.json', standardPackCode: 'CEL-ST', extendedPackCode: 'CEL-EX' },
  { categoryId: 'influencers', file: 'influencers.json', standardPackCode: 'INF-ST', extendedPackCode: 'INF-EX' },
];

async function fetchWikipediaImageUrl(title: string): Promise<string | null> {
  return new Promise((resolve) => {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    https.get(url, { headers: { 'User-Agent': 'GuessWhoApp/1.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json?.thumbnail?.source ?? json?.originalimage?.source ?? null);
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function downloadBuffer(url: string): Promise<Buffer | null> {
  return new Promise((resolve) => {
    https.get(
      url,
      {
        headers: {
          // Wikimedia requires a descriptive User-Agent with contact info
          'User-Agent': 'GuessWhoApp/1.0 (character-image-seed; https://github.com/your-repo)',
          'Accept': 'image/*',
        },
      },
      (res) => {
        if (res.statusCode !== 200) {
          console.warn(`    Image download returned HTTP ${res.statusCode}`);
          res.resume(); // drain so socket is reused
          resolve(null);
          return;
        }
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          // Reject tiny responses — real images are always > 2KB
          if (buf.length < 2000) {
            console.warn(`    Rejecting download (only ${buf.length} bytes — likely an error page)`);
            resolve(null);
            return;
          }
          // Reject responses that start with ASCII text (HTML/JSON error pages)
          const header = buf.slice(0, 4);
          const isJpeg = header[0] === 0xff && header[1] === 0xd8;
          const isPng  = header[0] === 0x89 && header[1] === 0x50;
          const isWebp = buf.slice(0, 4).toString('ascii') === 'RIFF';
          if (!isJpeg && !isPng && !isWebp) {
            console.warn(`    Rejecting download (not a recognised image format)`);
            resolve(null);
            return;
          }
          resolve(buf);
        });
      },
    ).on('error', () => resolve(null));
  });
}

async function uploadToStorage(
  buffer: Buffer,
  fileName: string,
  contentType: string,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('character-images')
    .upload(`characters/${fileName}`, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    console.warn(`  Storage upload error for ${fileName}:`, error.message);
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('character-images')
    .getPublicUrl(`characters/${fileName}`);

  return publicUrl;
}

async function seedCategory(categoryId: string, characters: CharacterSeed[]) {
  console.log(`\n📦 Seeding ${categoryId} (${characters.length} characters)...`);
  const insertedIds: { id: string; tier: string }[] = [];

  for (const char of characters) {
    console.log(`  → ${char.name}`);

    let imageUrl = `https://placehold.co/300x300?text=${encodeURIComponent(char.name)}`;

    // Try to fetch Wikipedia image
    if (char.wikipedia) {
      const wikiUrl = await fetchWikipediaImageUrl(char.wikipedia);
      if (wikiUrl) {
        const rawExt = wikiUrl.split('.').pop()?.split('?')[0]?.toLowerCase() ?? 'jpg';
        const ext = rawExt === 'jpg' ? 'jpg' : rawExt;
        const mimeType = rawExt === 'jpg' || rawExt === 'jpeg' ? 'image/jpeg'
          : rawExt === 'png' ? 'image/png'
          : rawExt === 'webp' ? 'image/webp'
          : 'image/jpeg';
        const buffer = await downloadBuffer(wikiUrl);
        if (buffer) {
          const uploaded = await uploadToStorage(buffer, `${char.slug}.${ext}`, mimeType);
          if (uploaded) imageUrl = uploaded;
          else imageUrl = wikiUrl; // fallback to original URL
        } else {
          imageUrl = wikiUrl;
        }
      }
    }

    // Check if already exists
    const { data: existing } = await supabase
      .from('characters')
      .select('id')
      .eq('category_id', categoryId)
      .eq('name', char.name)
      .maybeSingle();

    if (existing) {
      // Update image_url in case it changed
      await supabase.from('characters').update({ image_url: imageUrl }).eq('id', existing.id);
      insertedIds.push({ id: existing.id, tier: char.tier });
      console.log(`    ✓ Updated (existing)`);
      continue;
    }

    const { data, error } = await supabase
      .from('characters')
      .insert({
        category_id: categoryId,
        name: char.name,
        image_url: imageUrl,
        tier: char.tier,
        attributes: char.attributes,
        is_active: true,
        sort_order: insertedIds.length,
      })
      .select('id')
      .single();

    if (error) {
      console.warn(`    ✗ Error: ${error.message}`);
    } else if (data) {
      insertedIds.push({ id: data.id, tier: char.tier });
      console.log(`    ✓ Inserted`);
    }

    // Small delay to be respectful to Wikipedia API
    await new Promise((r) => setTimeout(r, 300));
  }

  return insertedIds;
}

async function updateSystemPack(
  shareCode: string,
  characterIds: string[],
  previewUrls: string[],
) {
  const { error } = await supabase
    .from('character_packs')
    .update({
      character_ids: characterIds,
      preview_image_urls: previewUrls.slice(0, 4),
    })
    .eq('share_code', shareCode);

  if (error) {
    console.warn(`  Failed to update pack ${shareCode}:`, error.message);
  } else {
    console.log(`  Updated pack ${shareCode} with ${characterIds.length} characters`);
  }
}

async function main() {
  console.log('🌱 Starting character seed...\n');

  // Ensure storage bucket exists
  const { error: bucketError } = await supabase.storage.createBucket('character-images', {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024, // 5MB
  });
  if (bucketError && !bucketError.message.includes('already exists')) {
    console.warn('Bucket creation warning:', bucketError.message);
  }

  for (const { categoryId, file, standardPackCode, extendedPackCode } of CATEGORY_FILES) {
    const filePath = path.join(__dirname, '..', 'data', 'characters', file);
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  File not found: ${filePath}`);
      continue;
    }

    const characters: CharacterSeed[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const results = await seedCategory(categoryId, characters);

    // Separate standard vs extended
    const standardIds = results.filter((r) => r.tier === 'standard').map((r) => r.id);
    const allIds = results.map((r) => r.id);

    // Fetch preview image URLs for each pack
    const getPreviewUrls = async (ids: string[]) => {
      const { data } = await supabase
        .from('characters')
        .select('image_url')
        .in('id', ids.slice(0, 4));
      return (data ?? []).map((c: { image_url: string }) => c.image_url);
    };

    await updateSystemPack(standardPackCode, standardIds, await getPreviewUrls(standardIds));
    await updateSystemPack(extendedPackCode, allIds, await getPreviewUrls(allIds));
  }

  console.log('\n✅ Seed complete!');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
