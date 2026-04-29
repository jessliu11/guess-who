-- Migration 011: Add category_id to character_packs
-- Allows reliable free-tier gating without relying on pack name strings.

ALTER TABLE character_packs ADD COLUMN IF NOT EXISTS category_id text;

-- Backfill existing system packs using their fixed share codes
UPDATE character_packs SET category_id = 'athletes'    WHERE share_code IN ('ATH-ST', 'ATH-EX');
UPDATE character_packs SET category_id = 'actors'      WHERE share_code IN ('ACT-ST', 'ACT-EX');
UPDATE character_packs SET category_id = 'singers'     WHERE share_code IN ('SNG-ST', 'SNG-EX');
UPDATE character_packs SET category_id = 'politicians' WHERE share_code IN ('POL-ST', 'POL-EX');
UPDATE character_packs SET category_id = 'fictional'   WHERE share_code IN ('FIC-ST', 'FIC-EX');
UPDATE character_packs SET category_id = 'cartoons'    WHERE share_code IN ('CAR-ST', 'CAR-EX');
UPDATE character_packs SET category_id = 'celebrities' WHERE share_code IN ('CEL-ST', 'CEL-EX');
UPDATE character_packs SET category_id = 'influencers' WHERE share_code IN ('INF-ST', 'INF-EX');
