# Fantasy RPG Companion — Database Design Document

## 1. Overview
This document defines the database architecture for a tabletop RPG companion app built with React Native (Expo). The app allows users to create characters, host and join game sessions (campaigns), chat in game rooms, roll dice, and share file attachments — all in a D&D-style setting.

---

## 2. Tech Stack & Storage Strategy
- **Framework:** React Native with Expo
- **Local DB:** SQLite via `expo-sqlite` (schema defined in `src/database/db.ts`)
- **Runtime Storage:** AsyncStorage (`@react-native-async-storage`) for CRUD operations
- **IDs:** UUID strings (via `uuid` v4) for all entities
- **Language:** TypeScript — all entities have corresponding interfaces in `src/types/index.ts`

SQLite provides the relational schema and can be extended for complex queries. AsyncStorage is used for day-to-day reads/writes for simplicity and cross-platform compatibility.

---

## 3. Core Entities

### 3.1 users
Represents an app user (player or dungeon master).

| Column       | Type    | Constraints              |
|--------------|---------|--------------------------|
| id           | TEXT    | PK, UUID                 |
| username     | TEXT    | NOT NULL                 |
| email        | TEXT    | NOT NULL                 |
| phone_number | TEXT    | nullable                 |
| profile_pic  | TEXT    | nullable, URI string     |
| created_at   | TEXT    | NOT NULL, ISO 8601       |
| updated_at   | TEXT    | NOT NULL, ISO 8601       |

**TypeScript interface:** `User`

---

### 3.2 characters
A D&D-style player character owned by a user.

| Column     | Type    | Constraints                    |
|------------|---------|--------------------------------|
| id         | TEXT    | PK, UUID                       |
| user_id    | TEXT    | FK → users.id, NOT NULL        |
| name       | TEXT    | NOT NULL                       |
| race       | TEXT    | NOT NULL (e.g. Human, Elf)     |
| class      | TEXT    | NOT NULL (e.g. Fighter, Wizard)|
| level      | INTEGER | NOT NULL, DEFAULT 1            |
| stats      | TEXT    | NOT NULL, JSON string          |
| backstory  | TEXT    | nullable                       |
| avatar_url | TEXT    | nullable, URI string           |
| created_at | TEXT    | NOT NULL, ISO 8601             |
| updated_at | TEXT    | NOT NULL, ISO 8601             |

**Stats JSON shape** (`CharacterStats`):
```json
{
  "strength": 10,
  "dexterity": 10,
  "constitution": 10,
  "intelligence": 10,
  "wisdom": 10,
  "charisma": 10,
  "hitPoints": 10,
  "maxHitPoints": 10,
  "armorClass": 10
}
```

**Available races:** Human, Elf, Dwarf, Halfling, Gnome, Half-Elf, Half-Orc, Tiefling, Dragonborn
**Available classes:** Fighter, Wizard, Rogue, Cleric, Ranger, Paladin, Barbarian, Bard, Druid, Sorcerer, Warlock, Monk

**TypeScript interfaces:** `Character`, `CharacterStats`

---

### 3.3 games
A campaign / game session that players can join.

| Column           | Type    | Constraints                          |
|------------------|---------|--------------------------------------|
| id               | TEXT    | PK, UUID                             |
| name             | TEXT    | NOT NULL                             |
| description      | TEXT    | nullable                             |
| dungeon_master_id| TEXT    | NOT NULL, references a user          |
| player_ids       | TEXT    | NOT NULL, JSON array of user IDs     |
| status           | TEXT    | NOT NULL, DEFAULT 'waiting'          |
| max_players      | INTEGER | NOT NULL, DEFAULT 6                  |
| current_scene    | TEXT    | nullable, narrative text             |
| created_at       | TEXT    | NOT NULL, ISO 8601                   |
| updated_at       | TEXT    | NOT NULL, ISO 8601                   |

**Valid statuses:** `waiting`, `active`, `paused`, `completed`

**TypeScript interface:** `Game`

---

### 3.4 messages
Chat messages within a game room. Supports plain chat, dice rolls, action narration, and system messages.

| Column          | Type | Constraints                      |
|-----------------|------|----------------------------------|
| id              | TEXT | PK, UUID                         |
| game_id         | TEXT | FK → games.id, NOT NULL          |
| user_id         | TEXT | NOT NULL, references a user      |
| username        | TEXT | NOT NULL, denormalized for display|
| content         | TEXT | NOT NULL                         |
| type            | TEXT | NOT NULL, DEFAULT 'chat'         |
| dice_roll       | TEXT | nullable, JSON string            |
| file_attachment | TEXT | nullable, JSON string            |
| timestamp       | TEXT | NOT NULL, ISO 8601               |

**Valid message types:** `chat`, `dice`, `action`, `system`

**Dice roll JSON shape** (`DiceRoll`):
```json
{
  "diceType": "d20",
  "count": 2,
  "results": [14, 7],
  "total": 21,
  "modifier": 3,
  "finalTotal": 24
}
```
Supported dice: d4, d6, d8, d10, d12, d20, d100

**File attachment JSON shape** (`FileAttachment`):
```json
{
  "id": "uuid",
  "name": "map.png",
  "uri": "file:///...",
  "type": "image/png",
  "size": 204800
}
```

**TypeScript interfaces:** `GameMessage`, `DiceRoll`, `FileAttachment`

---

### 3.5 attachments
Standalone file attachment records (maps, images, documents shared in sessions).

| Column     | Type    | Constraints              |
|------------|---------|--------------------------|
| id         | TEXT    | PK, UUID                 |
| game_id    | TEXT    | nullable, FK → games.id  |
| user_id    | TEXT    | NOT NULL                 |
| name       | TEXT    | NOT NULL                 |
| uri        | TEXT    | NOT NULL                 |
| type       | TEXT    | NOT NULL (MIME type)     |
| size       | INTEGER | NOT NULL (bytes)         |
| created_at | TEXT    | NOT NULL, ISO 8601       |

---

## 4. Entity Relationships

```
[Users]
   |
   |----< [Characters]        (one user has many characters)
   |
   |----< [Games]             (one user can DM many games)
   |       |
   |       |----< [Messages]  (one game has many messages)
   |       |
   |       |----< [Attachments] (one game has many attachments)
   |
   |----< [Attachments]       (one user uploads many attachments)
```

- A user appears in `games.player_ids` (JSON array) to represent membership.
- `games.dungeon_master_id` references the user who created/runs the game.
- `messages.username` is denormalized from `users.username` for fast chat rendering.

---

## 5. Data Access Patterns

### 5.1 Repository Layer
The app uses two repository modules over AsyncStorage:

**`userRepository.ts`** — current user session
- `saveCurrentUser(user)` / `getCurrentUser()` / `clearCurrentUser()`
- `updateCurrentUser(partialUpdates)`

**`gameRepository.ts`** — games, characters, messages
- `saveGame(game)` / `getGames()` / `deleteGame(id)`
- `saveCharacter(char)` / `getCharacters()` / `deleteCharacter(id)`
- `getMessages(gameId)` / `saveMessage(msg)`

### 5.2 AsyncStorage Keys
| Key Pattern                      | Data                    |
|----------------------------------|-------------------------|
| `@thegame:current_user`         | Single `User` object    |
| `@thegame:games`                | Array of `Game`         |
| `@thegame:characters`           | Array of `Character`    |
| `@thegame:messages:<gameId>`    | Array of `GameMessage`  |

### 5.3 Context Layer
`AppContext` loads the current user, their characters, and their games on startup. It filters characters by `userId` and games by membership (`playerIds` or `dungeonMasterId`).

---

## 6. Frontend Type Definitions

All types live in `src/types/index.ts`:

```ts
interface User {
  id: string;
  username: string;
  email: string;
  phoneNumber: string;
  profilePic: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Character {
  id: string;
  userId: string;
  name: string;
  race: string;
  class: string;
  level: number;
  stats: CharacterStats;
  backstory: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CharacterStats {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  hitPoints: number;
  maxHitPoints: number;
  armorClass: number;
}

interface Game {
  id: string;
  name: string;
  description: string;
  dungeonMasterId: string;
  playerIds: string[];
  status: 'waiting' | 'active' | 'paused' | 'completed';
  maxPlayers: number;
  currentScene: string;
  createdAt: string;
  updatedAt: string;
}

interface GameMessage {
  id: string;
  gameId: string;
  userId: string;
  username: string;
  content: string;
  type: 'chat' | 'dice' | 'action' | 'system';
  diceRoll?: DiceRoll;
  fileAttachment?: FileAttachment;
  timestamp: string;
}
```

---

## 7. Design Decisions & Notes

- **AsyncStorage over SQLite for CRUD:** Keeps things simple and cross-platform. SQLite schema exists as a foundation for when complex queries (joins, aggregations) are needed.
- **Denormalized `username` in messages:** Avoids a join on every chat message render. Acceptable trade-off since usernames change infrequently.
- **`player_ids` as JSON array:** Simplifies membership checks in the frontend (`includes()`). For a backend migration, this should become a join table (`game_players`).
- **Stats as JSON string:** Flexible for different RPG systems. Parsed client-side into `CharacterStats`.
- **All timestamps as ISO 8601 strings:** Consistent, sortable, timezone-aware.
- **UUIDs for all primary keys:** Ready for multiplayer/sync scenarios.

---

## 8. Future Enhancements
- **Backend sync:** Migrate to a server with real-time sync (e.g. Supabase, Firebase) for multiplayer across devices.
- **`game_players` join table:** Replace `player_ids` JSON array with a proper many-to-many relationship.
- **Character equipment/inventory:** Add items and inventory tables when gameplay features expand.
- **Campaign history/logs:** Persist game session summaries and adventure logs.
- **Dice roll statistics:** Track roll history per character for analytics.
- **Push notifications:** Alert players when it's their turn or a new session starts.

---

End of Document
