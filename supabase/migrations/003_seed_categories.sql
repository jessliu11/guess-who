-- =============================================
-- Migration 003: Seed Categories
-- =============================================

INSERT INTO categories (id, label, description, sort_order) VALUES
  ('athletes',    'Athletes',             'Sports stars from around the world',      1),
  ('actors',      'Actors',               'Hollywood & TV legends',                  2),
  ('singers',     'Singers',              'Pop, hip-hop, and beyond',                3),
  ('politicians', 'Politicians',          'World leaders & power players',           4),
  ('fictional',   'Fictional Characters', 'Iconic movie & TV characters',            5),
  ('cartoons',    'Cartoon Characters',   'Beloved animated icons',                  6),
  ('celebrities', 'Celebrities',          'Pop culture royalty',                     7),
  ('influencers', 'Influencers',          'YouTube, TikTok & Instagram stars',       8)
ON CONFLICT (id) DO NOTHING;
