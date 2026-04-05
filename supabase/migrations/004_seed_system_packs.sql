-- =============================================
-- Migration 004: Seed System Packs
-- Placeholder — run AFTER seed-characters script
-- populates the characters table.
-- This migration creates the system pack rows
-- with empty character_ids; the seed script
-- updates them with real UUIDs.
-- =============================================

-- Standard packs (free)
INSERT INTO character_packs (name, share_code, is_system, requires_premium, character_ids, preview_image_urls)
VALUES
  ('Athletes — Standard',             'ATH-ST', true, false, '{}', '{}'),
  ('Actors — Standard',               'ACT-ST', true, false, '{}', '{}'),
  ('Singers — Standard',              'SNG-ST', true, false, '{}', '{}'),
  ('Politicians — Standard',          'POL-ST', true, false, '{}', '{}'),
  ('Fictional Characters — Standard', 'FIC-ST', true, false, '{}', '{}'),
  ('Cartoon Characters — Standard',   'CAR-ST', true, false, '{}', '{}'),
  ('Celebrities — Standard',          'CEL-ST', true, false, '{}', '{}'),
  ('Influencers — Standard',          'INF-ST', true, false, '{}', '{}')
ON CONFLICT (share_code) DO NOTHING;

-- Extended packs (premium)
INSERT INTO character_packs (name, share_code, is_system, requires_premium, character_ids, preview_image_urls)
VALUES
  ('Athletes — Extended',             'ATH-EX', true, true, '{}', '{}'),
  ('Actors — Extended',               'ACT-EX', true, true, '{}', '{}'),
  ('Singers — Extended',              'SNG-EX', true, true, '{}', '{}'),
  ('Politicians — Extended',          'POL-EX', true, true, '{}', '{}'),
  ('Fictional Characters — Extended', 'FIC-EX', true, true, '{}', '{}'),
  ('Cartoon Characters — Extended',   'CAR-EX', true, true, '{}', '{}'),
  ('Celebrities — Extended',          'CEL-EX', true, true, '{}', '{}'),
  ('Influencers — Extended',          'INF-EX', true, true, '{}', '{}')
ON CONFLICT (share_code) DO NOTHING;
