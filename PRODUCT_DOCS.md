# Guess Who — Product Documentation

## Overview

Guess Who is a mobile-first multiplayer deduction game, a digital reimagining of the classic board game. Two players compete head-to-head, taking turns asking yes/no questions to identify their opponent's secret character from a shared board. The game supports custom character packs, real-time multiplayer, and a free/pro subscription model.

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
- **All Packs** — browse all system packs with Free/Pro tier badges

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

Eight system packs are available. Three are free; five require a Pro subscription.

| Pack | Tier | Characters |
|------|------|-----------|
| Celebrities | Free | Pop culture icons |
| Fictional Characters | Free | Movie & TV characters |
| Cartoons | Free | Animated icons |
| Athletes | Pro | Sports stars |
| Actors | Pro | Hollywood legends |
| Singers | Pro | Musicians |
| Politicians | Pro | World leaders |
| Influencers | Pro | Social media personalities |

Each pack includes a **standard tier** of ~24 characters, plus an **extended tier** of 20–24 additional characters available to Pro users.

Characters have structured attributes used for gameplay questions:

- Gender
- Hair color & length
- Age group
- Nationality
- Facial hair
- Glasses
- Notable features

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

- Select characters from any of the 8 system categories
- Choose 20–24 characters to include in the pack
- Name the pack and pick 4 preview images
- A unique 6-character **share code** is auto-generated
- Share the code with anyone — they can join games using your pack
- Manage and delete packs from My Packs

---

## Subscription Tiers

### Free Plan

- Access to 3 character packs (Celebrities, Fictional Characters, Cartoons)
- Up to 12 custom characters
- Unlimited game plays using free packs
- Player stats

### Pro Plan

| Billing | Price |
|---------|-------|
| Monthly | $4.99/month |
| Annual  | $29.99/year (40% savings) |

**Pro includes everything in Free, plus:**

- All 8 character packs unlocked
- Extended character tiers in every pack
- Unlimited custom character uploads
- Pack Builder — create, name, and share custom packs
- Future pack categories automatically included

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
| creator_id | UUID | NULL for system characters |
| name | TEXT | |
| image_url | TEXT | |
| attributes | JSONB | Gameplay question metadata |
| tier | TEXT | `standard` or `extended` |

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
| pack_id | UUID | FK → character_packs |
| status | TEXT | `waiting` `selecting` `active` `finished` `abandoned` |
| host_character_id / guest_character_id | UUID | Secret characters |
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
System-managed list of character categories (e.g., `celebrities`, `actors`, `singers`).

---

*Last updated: April 2026*
