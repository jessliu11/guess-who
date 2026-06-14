/**
 * Seed Sync Script
 *
 * Single source of truth for app-provided content:
 *   data/categories.json
 *   data/characters/<categoryId>.json
 *   data/characters/images/<categoryId>/<slug>.{jpg|png|webp}
 *
 * Usage:
 *   npm run seed                  # dry-run against local CLI (.env.development.local)
 *   npm run seed -- --apply       # write changes
 *   npm run seed -- --category id # scope to one category
 *   npm run seed:prod             # dry-run against prod (.env.local)
 *   npm run seed:prod -- --apply  # write to prod (confirm with user first!)
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the env file.
 * Override the env file with the ENV_FILE env var (see seed:prod).
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// -- CLI args ---------------------------------------------------------------

const APPLY = process.argv.includes('--apply');
const CATEGORY_FILTER = (() => {
  const i = process.argv.indexOf('--category');
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
})();

const ENV_FILE = process.env.ENV_FILE || '.env.development.local';
dotenv.config({ path: ENV_FILE });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(`✗ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in ${ENV_FILE}`);
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// -- Paths ------------------------------------------------------------------

const DATA_DIR = path.join(__dirname, '..', 'data');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');
const CHARS_DIR = path.join(DATA_DIR, 'characters');
const IMAGES_DIR = path.join(CHARS_DIR, 'images');
const BUCKET = 'character-images';
const IMG_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'avif'] as const;
const PROTECTED_CATEGORY = 'custom'; // user-generated content lives here — never delete

// -- Types ------------------------------------------------------------------

interface CategorySpec {
  id: string;
  label: string;
  description: string;
  emoji: string;
  sortOrder: number;
  packShareCode: string;
  packName: string;
  requiresPremium: boolean;
}

interface CharacterSpec {
  slug: string;
  name: string;
}

interface DbCategory { id: string; label: string; description: string; sort_order: number }
interface DbCharacter { id: string; category_id: string; slug: string; name: string; image_url: string | null }
interface DbPack {
  id: string;
  share_code: string;
  name: string;
  category_id: string | null;
  requires_premium: boolean;
  character_ids: string[];
  preview_image_urls: string[];
  is_system: boolean;
}

// -- Helpers ----------------------------------------------------------------

const placeholderUrl = (name: string) => `https://placehold.co/300x300?text=${encodeURIComponent(name)}`;

function findImageFile(categoryId: string, slug: string): { absPath: string; ext: string } | null {
  for (const ext of IMG_EXTS) {
    const p = path.join(IMAGES_DIR, categoryId, `${slug}.${ext}`);
    if (fs.existsSync(p)) return { absPath: p, ext };
  }
  return null;
}

function mime(ext: string): string {
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'avif') return 'image/avif';
  return 'image/jpeg';
}

async function uploadImage(categoryId: string, slug: string, absPath: string, ext: string): Promise<string> {
  const buffer = fs.readFileSync(absPath);
  const remotePath = `characters/${categoryId}/${slug}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(remotePath, buffer, { contentType: mime(ext), upsert: true });
  if (error) throw new Error(`Storage upload failed for ${remotePath}: ${error.message}`);
  return supabase.storage.from(BUCKET).getPublicUrl(remotePath).data.publicUrl;
}

async function removeStorageObject(publicUrl: string | null) {
  if (!publicUrl) return;
  const marker = `/object/public/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return; // not one of ours (e.g., placeholder)
  const key = publicUrl.slice(idx + marker.length);
  const { error } = await supabase.storage.from(BUCKET).remove([key]);
  if (error) console.warn(`  ! Failed to remove ${key}: ${error.message}`);
}

// -- Load & validate JSON ---------------------------------------------------

function loadCategories(): CategorySpec[] {
  const raw = JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf-8')) as CategorySpec[];
  const ids = new Set<string>();
  const codes = new Set<string>();
  for (const c of raw) {
    if (c.id === PROTECTED_CATEGORY) {
      throw new Error(`data/categories.json must not declare the "${PROTECTED_CATEGORY}" category — it's user-content only`);
    }
    if (ids.has(c.id)) throw new Error(`Duplicate category id: ${c.id}`);
    if (codes.has(c.packShareCode)) throw new Error(`Duplicate pack share code: ${c.packShareCode}`);
    ids.add(c.id);
    codes.add(c.packShareCode);
  }
  return raw;
}

function loadCharacters(categoryId: string): CharacterSpec[] {
  const file = path.join(CHARS_DIR, `${categoryId}.json`);
  if (!fs.existsSync(file)) {
    console.warn(`  ! No character file at ${path.relative(process.cwd(), file)} — treating as empty`);
    return [];
  }
  const raw = JSON.parse(fs.readFileSync(file, 'utf-8')) as CharacterSpec[];
  const slugs = new Set<string>();
  for (const c of raw) {
    if (!c.slug || !c.name) throw new Error(`${file}: every entry needs slug + name`);
    if (slugs.has(c.slug)) throw new Error(`${file}: duplicate slug "${c.slug}"`);
    slugs.add(c.slug);
  }
  return raw;
}

// -- Diff helpers -----------------------------------------------------------

type Diff<T> = { add: T[]; update: T[]; remove: T[] };

const fmt = <T>(d: Diff<T>) => `+${d.add.length} added, ~${d.update.length} changed, -${d.remove.length} removed`;

// -- Main -------------------------------------------------------------------

async function main() {
  console.log(`\n${APPLY ? '🌱 APPLYING' : '🔍 Dry run'} against ${SUPABASE_URL}${CATEGORY_FILTER ? ` (category: ${CATEGORY_FILTER})` : ''}\n`);

  // Load JSON
  const jsonCategories = loadCategories().filter(c => !CATEGORY_FILTER || c.id === CATEGORY_FILTER);
  const jsonByCategory = new Map<string, CharacterSpec[]>();
  for (const c of jsonCategories) jsonByCategory.set(c.id, loadCharacters(c.id));

  // Load DB
  const { data: dbCategoriesRaw, error: e1 } = await supabase.from('categories').select('*');
  if (e1) throw e1;
  const dbCategories = (dbCategoriesRaw as DbCategory[]).filter(c => c.id !== PROTECTED_CATEGORY);

  const { data: dbCharsRaw, error: e2 } = await supabase
    .from('characters')
    .select('id, category_id, slug, name, image_url, creator_id');
  if (e2) throw e2;
  const dbChars = (dbCharsRaw as (DbCharacter & { creator_id: string | null })[])
    .filter(c => c.creator_id === null); // ignore user-generated

  const { data: dbPacksRaw, error: e3 } = await supabase
    .from('character_packs')
    .select('id, share_code, name, category_id, requires_premium, character_ids, preview_image_urls, is_system');
  if (e3) throw e3;
  const dbPacks = (dbPacksRaw as DbPack[]).filter(p => p.is_system);

  // Apply scoping: when --category is set, ignore DB rows outside the scope.
  const dbCategoriesScoped = CATEGORY_FILTER ? dbCategories.filter(c => c.id === CATEGORY_FILTER) : dbCategories;
  const dbCharsScoped = CATEGORY_FILTER ? dbChars.filter(c => c.category_id === CATEGORY_FILTER) : dbChars;
  const dbPacksScoped = CATEGORY_FILTER
    ? dbPacks.filter(p => p.category_id === CATEGORY_FILTER || jsonCategories.some(c => c.packShareCode === p.share_code))
    : dbPacks;

  // ----- Resolve image URLs per character ---------------------------------

  const missingImages: { category: string; slug: string }[] = [];
  const resolvedImageUrl = new Map<string, string>(); // key: `${categoryId}|${slug}` -> url
  const localImagePath = new Map<string, { absPath: string; ext: string }>();

  for (const cat of jsonCategories) {
    for (const ch of jsonByCategory.get(cat.id) || []) {
      const local = findImageFile(cat.id, ch.slug);
      const key = `${cat.id}|${ch.slug}`;
      if (local) {
        localImagePath.set(key, local);
        // Use the final public URL we will end up writing once uploaded
        resolvedImageUrl.set(key, supabase.storage.from(BUCKET).getPublicUrl(`characters/${cat.id}/${ch.slug}.${local.ext}`).data.publicUrl);
      } else {
        missingImages.push({ category: cat.id, slug: ch.slug });
        resolvedImageUrl.set(key, placeholderUrl(ch.name));
      }
    }
  }

  // ----- Diff categories --------------------------------------------------

  const jsonCatById = new Map(jsonCategories.map(c => [c.id, c]));
  const dbCatById = new Map(dbCategoriesScoped.map(c => [c.id, c]));

  const catDiff: Diff<CategorySpec> = { add: [], update: [], remove: [] };
  for (const c of jsonCategories) {
    const ex = dbCatById.get(c.id);
    if (!ex) catDiff.add.push(c);
    else if (ex.label !== c.label || (ex.description || '') !== c.description || ex.sort_order !== c.sortOrder) catDiff.update.push(c);
  }
  // Don't remove categories outside the filter scope when scoping
  if (!CATEGORY_FILTER) {
    for (const c of dbCategories) if (!jsonCatById.has(c.id)) catDiff.remove.push(c as unknown as CategorySpec);
  }

  // ----- Diff packs -------------------------------------------------------

  const jsonPackByCode = new Map(jsonCategories.map(c => [c.packShareCode, c]));
  const dbPackByCode = new Map(dbPacksScoped.map(p => [p.share_code, p]));

  const packDiff: Diff<CategorySpec | DbPack> = { add: [], update: [], remove: [] };
  for (const c of jsonCategories) {
    const ex = dbPackByCode.get(c.packShareCode);
    if (!ex) packDiff.add.push(c);
    else if (ex.name !== c.packName || ex.category_id !== c.id || ex.requires_premium !== c.requiresPremium) packDiff.update.push(c);
  }
  if (!CATEGORY_FILTER) {
    for (const p of dbPacks) if (!jsonPackByCode.has(p.share_code)) packDiff.remove.push(p);
  }

  // ----- Diff characters per category -------------------------------------

  type CharDiff = { categoryId: string; add: CharacterSpec[]; update: { spec: CharacterSpec; existing: DbCharacter }[]; remove: DbCharacter[] };
  const charDiffs: CharDiff[] = [];

  for (const cat of jsonCategories) {
    const specs = jsonByCategory.get(cat.id) || [];
    const existing = dbCharsScoped.filter(c => c.category_id === cat.id);
    const existingBySlug = new Map(existing.map(c => [c.slug, c]));
    const d: CharDiff = { categoryId: cat.id, add: [], update: [], remove: [] };
    for (const spec of specs) {
      const ex = existingBySlug.get(spec.slug);
      const newUrl = resolvedImageUrl.get(`${cat.id}|${spec.slug}`)!;
      if (!ex) d.add.push(spec);
      else if (ex.name !== spec.name || (ex.image_url || '') !== newUrl) d.update.push({ spec, existing: ex });
    }
    const jsonSlugs = new Set(specs.map(s => s.slug));
    for (const c of existing) if (!jsonSlugs.has(c.slug)) d.remove.push(c);
    charDiffs.push(d);
  }

  // Removals of characters in categories that are being removed entirely
  const removedSystemCharsInDroppedCategories = !CATEGORY_FILTER
    ? dbChars.filter(c => !jsonCatById.has(c.category_id))
    : [];

  // ----- Print diff -------------------------------------------------------

  console.log('Categories:  ' + fmt(catDiff));
  if (catDiff.add.length) console.log('  + ' + catDiff.add.map(c => c.id).join(', '));
  if (catDiff.update.length) console.log('  ~ ' + catDiff.update.map(c => c.id).join(', '));
  if (catDiff.remove.length) console.log('  - ' + catDiff.remove.map(c => c.id).join(', '));

  console.log('Packs:       ' + fmt(packDiff));
  if (packDiff.add.length) console.log('  + ' + packDiff.add.map(c => (c as CategorySpec).packShareCode).join(', '));
  if (packDiff.update.length) console.log('  ~ ' + packDiff.update.map(c => (c as CategorySpec).packShareCode).join(', '));
  if (packDiff.remove.length) console.log('  - ' + packDiff.remove.map(p => (p as DbPack).share_code).join(', '));

  let totalAdd = 0, totalUpdate = 0, totalRemove = 0;
  for (const d of charDiffs) {
    totalAdd += d.add.length; totalUpdate += d.update.length; totalRemove += d.remove.length;
    if (d.add.length + d.update.length + d.remove.length === 0) continue;
    console.log(`Characters (${d.categoryId}):  +${d.add.length}, ~${d.update.length}, -${d.remove.length}`);
    if (d.add.length) console.log('    + ' + d.add.map(c => c.slug).join(', '));
    if (d.update.length) console.log('    ~ ' + d.update.map(c => c.spec.slug).join(', '));
    if (d.remove.length) console.log('    - ' + d.remove.map(c => c.slug).join(', '));
  }
  if (removedSystemCharsInDroppedCategories.length) {
    console.log(`Characters (in dropped categories):  -${removedSystemCharsInDroppedCategories.length}`);
    console.log('    - ' + removedSystemCharsInDroppedCategories.map(c => `${c.category_id}/${c.slug || c.name}`).join(', '));
  }
  console.log(`\nTotal characters: +${totalAdd} added, ~${totalUpdate} changed, -${totalRemove + removedSystemCharsInDroppedCategories.length} removed`);

  if (missingImages.length) {
    console.log(`\n⚠️  ${missingImages.length} characters have no local image (will use placeholder):`);
    for (const m of missingImages.slice(0, 20)) console.log(`    ${m.category}/${m.slug}`);
    if (missingImages.length > 20) console.log(`    … and ${missingImages.length - 20} more`);
  }

  if (!APPLY) {
    console.log('\nDry run only. Re-run with --apply to write.\n');
    return;
  }

  // ====== APPLY ===========================================================

  console.log('\n--- Applying changes ---\n');

  // 1. Delete obsolete system characters (in dropped categories AND in retained categories)
  const removedCharIds = [
    ...removedSystemCharsInDroppedCategories.map(c => c.id),
    ...charDiffs.flatMap(d => d.remove.map(c => c.id)),
  ];
  const removedCharImageUrls = [
    ...removedSystemCharsInDroppedCategories.map(c => c.image_url),
    ...charDiffs.flatMap(d => d.remove.map(c => c.image_url)),
  ];
  if (removedCharIds.length) {
    const { error } = await supabase.from('characters').delete().in('id', removedCharIds);
    if (error) throw new Error(`Failed to delete characters: ${error.message}`);
    console.log(`  ✓ Deleted ${removedCharIds.length} character row(s)`);
    for (const url of removedCharImageUrls) await removeStorageObject(url);
  }

  // 2. Delete obsolete system packs
  if (packDiff.remove.length) {
    const codes = packDiff.remove.map(p => (p as DbPack).share_code);
    const { error } = await supabase.from('character_packs').delete().in('share_code', codes).eq('is_system', true);
    if (error) throw new Error(`Failed to delete packs: ${error.message}`);
    console.log(`  ✓ Deleted ${codes.length} system pack(s): ${codes.join(', ')}`);
  }

  // 3. Delete obsolete categories
  if (catDiff.remove.length) {
    const ids = catDiff.remove.map(c => c.id);
    const { error } = await supabase.from('categories').delete().in('id', ids);
    if (error) throw new Error(`Failed to delete categories: ${error.message}`);
    console.log(`  ✓ Deleted ${ids.length} categor${ids.length === 1 ? 'y' : 'ies'}: ${ids.join(', ')}`);
  }

  // 4. Upsert categories
  if (catDiff.add.length || catDiff.update.length) {
    const rows = [...catDiff.add, ...catDiff.update].map(c => ({
      id: c.id, label: c.label, description: c.description, sort_order: c.sortOrder,
    }));
    const { error } = await supabase.from('categories').upsert(rows, { onConflict: 'id' });
    if (error) throw new Error(`Failed to upsert categories: ${error.message}`);
    console.log(`  ✓ Upserted ${rows.length} categor${rows.length === 1 ? 'y' : 'ies'}`);
  }

  // 5. Upsert system packs (create with empty character_ids; we'll fill in step 7)
  if (packDiff.add.length || packDiff.update.length) {
    for (const c of [...packDiff.add, ...packDiff.update] as CategorySpec[]) {
      const { error } = await supabase.from('character_packs').upsert(
        {
          share_code: c.packShareCode,
          name: c.packName,
          category_id: c.id,
          requires_premium: c.requiresPremium,
          is_system: true,
        },
        { onConflict: 'share_code' },
      );
      if (error) throw new Error(`Failed to upsert pack ${c.packShareCode}: ${error.message}`);
    }
    console.log(`  ✓ Upserted ${packDiff.add.length + packDiff.update.length} system pack(s)`);
  }

  // 6. Upload images and upsert characters
  for (const cat of jsonCategories) {
    const specs = jsonByCategory.get(cat.id) || [];
    if (!specs.length) continue;
    const rows: { category_id: string; slug: string; name: string; image_url: string }[] = [];
    for (const spec of specs) {
      const key = `${cat.id}|${spec.slug}`;
      const local = localImagePath.get(key);
      let url = resolvedImageUrl.get(key)!;
      if (local) url = await uploadImage(cat.id, spec.slug, local.absPath, local.ext);
      rows.push({ category_id: cat.id, slug: spec.slug, name: spec.name, image_url: url });
    }
    const { error } = await supabase.from('characters').upsert(rows, { onConflict: 'category_id,slug' });
    if (error) throw new Error(`Failed to upsert characters for ${cat.id}: ${error.message}`);
    console.log(`  ✓ Upserted ${rows.length} character(s) in ${cat.id}${localImagePath.size ? '' : ' (placeholder images)'}`);
  }

  // 7. Refresh pack character_ids and preview_image_urls
  for (const cat of jsonCategories) {
    const { data: chars, error: e } = await supabase
      .from('characters')
      .select('id, image_url, sort_order')
      .eq('category_id', cat.id)
      .is('creator_id', null)
      .order('sort_order');
    if (e) throw e;
    const ids = (chars || []).map(c => c.id);
    const previews = (chars || []).slice(0, 4).map(c => c.image_url).filter(Boolean);
    const { error: updErr } = await supabase
      .from('character_packs')
      .update({ character_ids: ids, preview_image_urls: previews })
      .eq('share_code', cat.packShareCode);
    if (updErr) throw new Error(`Failed to refresh pack ${cat.packShareCode}: ${updErr.message}`);
  }
  console.log(`  ✓ Refreshed pack character_ids and previews`);

  console.log('\n✅ Done.\n');
}

main().catch((err) => {
  console.error('\n✗ Seed failed:', err.message || err);
  process.exit(1);
});
