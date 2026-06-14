# Who, What, Where? — Product Documentation

## Overview

Who, What, Where? is a mobile-first multiplayer deduction game, a digital reimagining of the classic board game. Two players compete head-to-head, taking turns asking yes/no questions to identify their opponent's secret character from a shared board. The game supports custom character packs, real-time multiplayer, and a free/pro subscription model.

**Platform:** iOS & Android (React Native / Expo)  
**Backend:** Supabase (PostgreSQL, Auth, Realtime, Storage)  
**Payments:** RevenueCat

---

## Table of Contents

1. [Gameplay](#gameplay)
2. [Screens & Navigation](#screens--navigation)
3. [Character Packs](#character-packs)
4. [Custom Characters & Pack Builder](#custom-characters--pack-builder)
5. [Subscription Tiers](#subscription-tiers)
6. [User Accounts](#user-accounts)
7. [Real-Time Multiplayer](#real-time-multiplayer)
8. [Data Model](#data-model)

---

## Gameplay

### Game Flow

1. **Host creates a game** — selects a character pack and board size (4–36 characters), receives a 6-character join code.
2. **Guest joins** — enters the 6-character code on the Join screen.
3. **Character selection** — both players independently choose their secret character from the shared pool. Neither player can see the other's pick.
4. **Gameplay loop** — players alternate turns:
   - Tap characters to eliminate those that don't match.
   - Ask the opponent a yes/no question about their character.
   - End their turn to pass play to the opponent.
   - When confident, make a guess by selecting a character from the board.
5. **Win condition** — correctly guess the opponent's secret character before they guess yours.

### Board Sizes

| Size | Characters |
|------|-----------|
| 4    | 4         |
| 9    | 9         |
| 12   | 12        |
| 16   | 16        |
| 24   | 24        |
| 32   | 32        |
| 36   | 36        |

### Session Rules

- Sessions expire after **2 hours** of inactivity.
- The host always takes the first turn.
- A wrong guess flips the turn to the opponent — the game continues.
- Stats (games played, games won, win rate) are tracked per user.

---

## Screens & Navigation

### Authentication (`/(auth)`)

| Screen | Description |
|--------|-------------|
| Welcome | Entry point with options to Create Account, Sign In, or Play as Guest |
| Sign Up | Email, display name, and password (8-character minimum) registration |
| Sign In | Email and password login |

### Main Tabs (`/(tabs)`)

#### Home
- **Host Game** — configure and create a new session
- **Join Game** — enter a 6-character code to join
- **Stats panel** — games played, games won, win rate

#### Packs
- **My Characters** — grid of user-created custom characters; tap to delete
- **My Packs** — user-built packs with share codes; create new packs (Pro)
- **All Packs** — browse system packs; each pack shows a Pro badge when `requires_premium` is set

#### Profile
- Player avatar (initials-based), display name, plan badge
- Stats summary
- Menu: Upgrade to Pro, Notifications, Help & FAQ, Privacy Policy, Sign Out

### Game Screens (`/(game)`)

| Screen | Description |
|--------|-------------|
| Setup | Host selects pack + board size; Guest inputs join code |
| Lobby | Host sees join code; both wait for opponent to connect |
| Character Select | Each player picks their secret character privately |
| Board | Main game view — character grid, elimination, question/answer, end turn, guess |
| Paywall | Pro subscription upsell screen |

---

## Character Packs

Six system packs are available, one per category. All are currently free; the schema supports per-pack premium gating via `character_packs.requires_premium` for future packs.

| Pack | Characters |
|------|-----------|
| The Summer I Turned Pretty | 14 — Belly, Conrad, Jeremiah, … |
| Off Campus | 12 — Briar U hockey players & their crew |
| Heated Rivalry | 10 — Shane, Ilya, & the rest of the cast |
| K-Pop Idols | 26 — members of the biggest groups |
| Taylor Swift Songs | 26 — songs across the catalog |
| Landmarks | 14 — iconic places around the world |

Each character has a `name`, a `slug` (kebab-case, unique within its category), and an `image_url` pointing at an asset in the `character-images` Supabase Storage bucket. Source of truth for system content is `data/categories.json` + `data/characters/<categoryId>.json`; see CLAUDE.md "Updating seed content" for the workflow.

---

## Custom Characters & Pack Builder

### Custom Characters (All Users)

- Upload photos from the device photo library
- Name each character
- **Free plan:** up to 12 custom characters total
- **Pro plan:** unlimited uploads (up to 20 at once via batch picker)
- Images stored in Supabase Storage under `custom/{userId}/`
- Characters can be deleted (removes both the database record and stored image)

### Pack Builder (Pro Only)

- Select characters from any system category
- Choose up to 24 characters to include in the pack
- Name the pack and pick 4 preview images
- A unique 6-character **share code** is auto-generated
- Share the code with anyone — they can join games using your pack
- Manage and delete packs from My Packs

---

## Subscription Tiers

### Free Plan

- Access to every system pack that isn't `requires_premium=true` — at launch, all 6 system packs are free
- Up to 12 custom characters (see `FREE_CUSTOM_CHARACTER_LIMIT` in `src/constants/config.ts`)
- Unlimited game plays using free packs
- Player stats

### Pro Plan

| Billing | Price |
|---------|-------|
| Monthly | $4.99/month |
| Annual  | $29.99/year (40% savings) |

**Pro includes everything in Free, plus:**

- Premium system packs (none gated at launch — schema supports `requires_premium=true` per pack)
- Unlimited custom character uploads
- Pack Builder — create, name, and share custom packs
- Future pack categories that ship as premium

Subscriptions auto-renew; users can cancel via device Settings. Managed via RevenueCat.

---

## User Accounts

### Authentication Methods

| Method | Description |
|--------|-------------|
| Email/Password | Full account with stats tracking and premium access |
| Guest (Anonymous) | No registration required; limited features |

### Account Details

- Display name set at registration
- Profile auto-created on signup
- Session persisted securely on device with auto-refresh
- `is_premium` flag synced with RevenueCat subscription status

---

## Real-Time Multiplayer

Game state is synchronized via **Supabase Realtime** (Postgres Changes) with a **3-second polling fallback**.

### Channels

| Channel | Purpose |
|---------|---------|
| `lobby:{sessionId}` | Waiting room — detects when guest joins |
| `select:{sessionId}` | Character selection — detects when both players are ready |
| `game:{sessionId}` | Active gameplay — syncs turn changes, eliminations, guesses |

### State Machine

```
waiting → selecting → active → finished
                              ↘ abandoned
```

Transitions are server-enforced. The `check_both_characters_selected` database trigger automatically advances the session from `selecting` to `active` once both characters are set.

### Guess Validation

Guesses are processed by a server-side RPC function (`submit_guess`) that:
1. Verifies it is the calling player's turn
2. Logs the move to `game_moves`
3. On correct guess: updates win/loss stats for both players, sets winner, marks session finished
4. On wrong guess: flips `current_turn` to opponent and continues the session

---

## Data Model

### Core Tables

#### `profiles`
Extends Supabase Auth users.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK, matches auth.users |
| display_name | TEXT | Set at registration |
| avatar_url | TEXT | Optional |
| is_premium | BOOLEAN | Synced from RevenueCat |
| rc_customer_id | TEXT | RevenueCat ID |
| games_played | INTEGER | Incremented on game end |
| games_won | INTEGER | Incremented on correct guess |

#### `characters`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| category_id | TEXT | FK → categories |
| creator_id | UUID | NULL for system characters; user UUID for customs |
| name | TEXT | |
| slug | TEXT | Kebab-case identifier; UNIQUE per `(category_id, slug)`. For customs the slug = `id::text`. |
| image_url | TEXT | Nullable; public URL in `character-images` bucket |
| is_active | BOOLEAN | Soft-hide flag — `getCharactersByCategory` filters to `true` |

#### `character_packs`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| name | TEXT | |
| share_code | TEXT | Unique, 6-char |
| creator_id | UUID | NULL for system packs |
| is_system | BOOLEAN | |
| requires_premium | BOOLEAN | |
| character_ids | UUID[] | Ordered list |
| preview_image_urls | TEXT[] | Up to 4 |

#### `game_sessions`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| join_code | TEXT | Unique, 6-char |
| host_id / guest_id | UUID | FK → profiles |
| pack_id | UUID | FK → character_packs; `ON DELETE SET NULL` |
| status | TEXT | `waiting` `selecting` `active` `finished` `abandoned` |
| host_character_id / guest_character_id | UUID | Secret characters; both FKs are `ON DELETE SET NULL` so deleting a character won't block — in-flight games degrade gracefully |
| current_turn | TEXT | `host` or `guest` |
| winner | TEXT | `host`, `guest`, or NULL |
| character_pool | UUID[] | Shuffled per session |
| host_eliminated / guest_eliminated | UUID[] | Per-player eliminations |
| turn_count | INTEGER | |
| expires_at | TIMESTAMPTZ | 2-hour TTL |

#### `game_moves`
Append-only event log.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| session_id | UUID | FK → game_sessions |
| player_role | TEXT | `host` or `guest` |
| move_type | TEXT | `eliminate` `guess` `answer_yes` `answer_no` |
| payload | JSONB | Move-specific data |

#### `categories`
System-managed list of character categories (e.g., `summer-i-turned-pretty`, `kpop-idols`, `landmarks`). The reserved `custom` row holds user-generated characters and is never touched by the seed script.

---

---

## Development Environment

### Overview

Two development modes are available depending on the testing target:

| Mode | Command | Device | Supabase |
|---|---|---|---|
| Simulator | `npx expo start` | iOS Simulator (press `i`) | Local CLI (`127.0.0.1:54331`) |
| Physical device | `npx expo start --tunnel` | iPhone via Expo Go | Production |

### Local Supabase CLI Setup

The project runs a full local Supabase stack via Docker for Simulator-based development. This keeps the production database clean during active development.

**Prerequisites:** Docker Desktop running, Supabase CLI installed (`brew install supabase/tap/supabase`)

**Ports** (offset from defaults to avoid conflict with other local Supabase projects):

| Service | Port |
|---|---|
| API / REST | 54331 |
| Database | 54332 |
| Studio | 54333 |
| Inbucket (email) | 54334 |
| Analytics | 54337 |

**Local Studio:** [http://127.0.0.1:54333](http://127.0.0.1:54333)

### Environment Files

| File | Loaded when | Supabase target |
|---|---|---|
| `.env.development.local` | `npx expo start` (dev mode) | Local CLI |
| `.env.local` | Always (prod fallback) | Production |
| `.env` | Always (base) | Production |

`.env.development.local` overrides `.env.local` in development mode. Both files are gitignored.

### Daily Commands

```bash
# Start local dev stack
supabase start

# Stop local dev stack
supabase stop

# Reset local DB (re-runs all migrations + seeds)
supabase db reset

# Push a new migration to production
supabase db push

# Create a new migration file
supabase migration new <name>

# Check local service URLs and keys
supabase status
```

### Seed Data

Categories, packs, and characters are seeded via `npm run seed` from the `data/` directory — `supabase db reset` only handles migrations (the `config.toml` `sql_paths` list is empty by design).

| Path | Role |
|---|---|
| `data/categories.json` | Source of truth: one entry per category with its pack metadata (`packShareCode`, `requiresPremium`, etc.) |
| `data/characters/<categoryId>.json` | Per-category list of `{ slug, name }` entries |
| `data/characters/images/<categoryId>/<slug>.<ext>` | Optional local image file (`jpg`, `jpeg`, `png`, `webp`, `avif`); missing files fall back to a `placehold.co` placeholder |

Workflow:

```bash
# Apply migrations to local CLI
supabase db reset

# Dry-run (default) — prints a per-category diff, exits without writing
npm run seed

# Apply
npm run seed -- --apply

# Scope a run to one category while iterating
npm run seed -- --category landmarks --apply

# Same flow against prod (reads .env.local instead of .env.development.local)
npm run seed:prod
npm run seed:prod -- --apply
```

Sync logic (all idempotent): upserts categories, packs, and characters from JSON; hard-deletes system content removed from JSON (and its `character-images` storage object). Always preserves the `custom` category and any row with `creator_id IS NOT NULL`. See CLAUDE.md "Updating seed content" for the team workflow.

### Physical Device Notes

`npx expo start --tunnel` routes the JS bundle through ngrok (requires `@expo/ngrok` dev dependency, already installed). The device connects to production Supabase directly — no local stack involved.

`127.0.0.1` is unreachable from a physical device; the Simulator works because it shares the Mac's loopback interface. Multiple active VPN tunnels (`utun` interfaces) prevent reliable LAN routing to local services on physical devices in this environment.

*Last updated: May 2026*
