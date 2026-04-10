# Requirements Document

## Introduction

This document defines the requirements for the Fantasy RPG Companion server-side backend. The server is a standalone Node.js project that provides a RESTful API and WebSocket layer for the mobile app, centralizing data persistence, enabling real-time multiplayer, and handling authentication. The architecture supports multiple TTRPG game systems through a plugin-based registry with flexible JSONB schemas.

## Glossary

- **Server**: The standalone Node.js backend application
- **API**: The RESTful HTTP interface exposed by the Server
- **Auth_Middleware**: The authentication and authorization layer handling JWT tokens and session management
- **User_Controller**: The route handler managing user profile operations
- **Character_Controller**: The route handler managing character sheet CRUD operations
- **Game_Controller**: The route handler managing game/campaign lifecycle and membership
- **Game_System_Controller**: The route handler managing the game system registry
- **Friend_Controller**: The route handler managing friend relationships and requests
- **Room_Manager**: The WebSocket component managing real-time game room connections and broadcasting
- **Game_System_Registry**: The plugin-based registry that stores and serves game system definitions
- **System_Validator**: The component that validates character data against a game system's schema
- **Character**: A game character record with system-agnostic core fields and system-specific JSONB data
- **Game**: A campaign/session record associated with a specific game system
- **Game_System**: A registered TTRPG system definition containing character schema, validation rules, and dice configuration
- **system_data**: The JSONB field on a Character containing all game-system-specific attributes

## Requirements

### Requirement 1: User Registration and Authentication

**User Story:** As a player, I want to register and log in to the server, so that my data is persisted centrally and I can access it from any device.

#### Acceptance Criteria

1. WHEN a user submits valid registration data (email, username, password, phoneNumber), THE Auth_Middleware SHALL create a new user record with a bcrypt-hashed password and return a JWT token and user object
2. WHEN a user submits valid login credentials (email, password), THE Auth_Middleware SHALL verify the password against the stored hash and return a JWT token and user object
3. WHEN a request includes a valid JWT token in the Authorization header, THE Auth_Middleware SHALL extract the userId and username and attach them to the request context
4. WHEN a JWT access token expires, THE Auth_Middleware SHALL allow the client to obtain a new access token using a valid refresh token
5. WHEN a user logs out, THE Auth_Middleware SHALL invalidate the session in Redis so the token cannot be reused
6. IF a request includes an invalid or expired token, THEN THE Auth_Middleware SHALL respond with HTTP 401 Unauthorized
7. IF a user submits registration data with an email that already exists, THEN THE Auth_Middleware SHALL respond with HTTP 409 Conflict
8. THE Auth_Middleware SHALL enforce rate limiting of 5 attempts per minute on authentication endpoints

### Requirement 2: User Profile Management

**User Story:** As a player, I want to view and update my profile, so that other players can identify me and I can manage my account.

#### Acceptance Criteria

1. WHEN an authenticated user requests their profile (GET /api/users/me), THE User_Controller SHALL return the full user object excluding the password hash
2. WHEN an authenticated user updates their profile (PUT /api/users/me), THE User_Controller SHALL update only the provided fields and return the updated user object
3. WHEN an authenticated user deletes their account (DELETE /api/users/me), THE User_Controller SHALL remove the user record and cascade-delete all associated characters, game memberships, and friend records
4. WHEN a user searches for other users (GET /api/users/search?q=), THE User_Controller SHALL return matching public user profiles based on username or email
5. THE User_Controller SHALL validate that usernames are 3-30 characters and contain only alphanumeric characters and underscores
6. THE User_Controller SHALL validate that email addresses conform to a standard email format

### Requirement 3: Character Sheet Management

**User Story:** As a player, I want to create, view, edit, and delete characters for any supported game system, so that I can manage my character sheets on the server.

#### Acceptance Criteria

1. WHEN an authenticated user requests their characters (GET /api/characters), THE Character_Controller SHALL return all characters owned by that user
2. WHEN an authenticated user requests characters filtered by game system (GET /api/characters?game_system_id=:sysId), THE Character_Controller SHALL return only characters belonging to the specified game system
3. WHEN an authenticated user creates a character (POST /api/characters) with a valid game_system_id and system_data, THE Character_Controller SHALL create the character record and return it
4. WHEN an authenticated user updates a character (PUT /api/characters/:id), THE Character_Controller SHALL validate the updated system_data against the game system's character_schema and save the changes
5. WHEN an authenticated user deletes a character (DELETE /api/characters/:id), THE Character_Controller SHALL remove the character and its associated sheet attachments
6. IF a user attempts to create or update a character with system_data that does not conform to the game system's character_schema, THEN THE System_Validator SHALL reject the request with HTTP 422 and field-level error details
7. IF a user attempts to create a character referencing an inactive or nonexistent game system, THEN THE Character_Controller SHALL respond with HTTP 422 Unprocessable Entity
8. WHEN a user imports a character via PDF (POST /api/characters/:id/import), THE Character_Controller SHALL parse the PDF in a system-aware manner and populate the character's system_data
9. IF a user attempts to access or modify a character they do not own, THEN THE Character_Controller SHALL respond with HTTP 403 Forbidden

### Requirement 4: Game System Registry

**User Story:** As a player, I want to browse available game systems and see their schemas, so that I can create characters and games for any supported TTRPG.

#### Acceptance Criteria

1. WHEN a user requests the list of game systems (GET /api/game-systems), THE Game_System_Controller SHALL return all active game system records
2. WHEN a user requests a specific game system (GET /api/game-systems/:id), THE Game_System_Controller SHALL return the full system definition including character_schema, validation_rules, stat_definitions, and dice_config
3. WHEN a user requests a system's character schema (GET /api/game-systems/:id/schema), THE Game_System_Controller SHALL return the character_schema JSONB for that system
4. WHEN an admin registers a new game system (POST /api/game-systems), THE Game_System_Controller SHALL validate that the slug is unique and lowercase kebab-case, and that character_schema is valid JSON Schema
5. WHEN an admin updates a game system (PUT /api/game-systems/:id), THE Game_System_Controller SHALL update the definition and increment the version tracking
6. WHEN an admin changes a game system's status (PUT /api/game-systems/:id/status), THE Game_System_Controller SHALL activate or deactivate the system
7. THE Game_System_Registry SHALL ensure at least one game system remains active at all times
8. THE Server SHALL cache game system definitions in Redis with a long TTL and invalidate the cache when an admin updates a system definition

### Requirement 5: Game and Campaign Management

**User Story:** As a player or DM, I want to create, browse, and manage games tied to a specific game system, so that I can organize campaigns and play sessions.

#### Acceptance Criteria

1. WHEN an authenticated user creates a game (POST /api/games) with a valid game_system_id, THE Game_Controller SHALL create the game record with the creator as dungeon master and return the game object
2. WHEN an authenticated user requests their games (GET /api/games), THE Game_Controller SHALL return all games where the user is a player or dungeon master
3. WHEN a user browses public games (GET /api/games/browse), THE Game_Controller SHALL return games with visibility "public" or "friends_only" (for the user's friends), excluding "private" games
4. WHEN a user browses games filtered by system (GET /api/games/browse?game_system_id=:sysId), THE Game_Controller SHALL return only games belonging to the specified game system
5. WHEN a player joins a game (POST /api/games/:id/join), THE Game_Controller SHALL add the player to the game if the current player count is below max_players
6. IF a player attempts to join a game that has reached max_players, THEN THE Game_Controller SHALL respond with HTTP 409 Conflict and the message "Game is full"
7. WHEN a player assigns a character to a game, THE Game_Controller SHALL verify that the character's game_system_id matches the game's game_system_id
8. IF a player assigns a character whose game_system_id does not match the game's game_system_id, THEN THE Game_Controller SHALL respond with HTTP 409 Conflict and the message "Character system does not match game system"
9. WHEN a DM invites a player to a game (POST /api/games/:id/invite), THE Game_Controller SHALL create a pending invitation record
10. WHEN an invited player accepts or declines (PUT /api/games/:id/invite/:uid), THE Game_Controller SHALL update the invitation status accordingly
11. WHEN a DM initiates a DM transfer (POST /api/games/:id/dm-transfer), THE Game_Controller SHALL create a pending transfer request to the target user
12. THE Game_Controller SHALL validate that max_players is between 2 and 12
13. IF a non-DM and non-creator user attempts to update game settings, THEN THE Game_Controller SHALL respond with HTTP 403 Forbidden

### Requirement 6: Friend System

**User Story:** As a player, I want to manage a friends list, so that I can easily find and invite friends to games.

#### Acceptance Criteria

1. WHEN an authenticated user sends a friend request (POST /api/friends/request), THE Friend_Controller SHALL create a friend record with status "pending" and direction "outgoing" for the sender, and a corresponding record with direction "incoming" for the recipient
2. WHEN a user views pending friend requests (GET /api/friends/requests), THE Friend_Controller SHALL return all friend records with status "pending" and direction "incoming"
3. WHEN a user accepts a friend request (PUT /api/friends/:id/accept), THE Friend_Controller SHALL update both friend records to status "accepted"
4. WHEN a user denies a friend request (PUT /api/friends/:id/deny), THE Friend_Controller SHALL update the friend record status to "denied"
5. WHEN a user removes a friend (DELETE /api/friends/:id), THE Friend_Controller SHALL remove both directional friend records
6. WHEN a user views their friends list (GET /api/friends), THE Friend_Controller SHALL return all accepted friend records including shared game information

### Requirement 7: Real-Time Game Room Communication

**User Story:** As a player in an active game, I want real-time chat, dice rolls, and scene updates, so that the game session feels interactive and immediate.

#### Acceptance Criteria

1. WHEN a player connects to a game room via WebSocket with a valid JWT token and gameId, THE Room_Manager SHALL authenticate the connection, add the player to the room, and emit a "room:joined" event with the current player list
2. WHEN a player disconnects from a game room, THE Room_Manager SHALL remove the player from the room presence in Redis and emit a "player:disconnected" event to remaining players
3. WHEN a player sends a chat message, THE Room_Manager SHALL persist the message to the database and broadcast a "message:new" event to all players in the room
4. WHEN a player performs a dice roll with diceType, count, and modifier, THE Room_Manager SHALL generate random results, persist the roll as a message, and broadcast a "dice:result" event to all players in the room
5. WHEN a DM sends a scene update, THE Room_Manager SHALL update the game's current_scene and broadcast a "scene:updated" event to all players in the room
6. IF a non-DM player attempts to send a scene update, THEN THE Room_Manager SHALL reject the request and not broadcast the event
7. WHEN a WebSocket connection is lost, THE Server SHALL support client auto-reconnect with exponential backoff, and the client SHALL re-fetch missed messages via the REST API on reconnect
8. THE Room_Manager SHALL track connected players per game room using Redis to support horizontal scaling across multiple server instances
9. THE Room_Manager SHALL use Redis pub/sub to broadcast messages across multiple server instances so all connected players receive events regardless of which instance they are connected to

### Requirement 8: Data Validation and Error Handling

**User Story:** As a developer, I want consistent validation and error responses, so that the mobile app can handle errors predictably.

#### Acceptance Criteria

1. THE Server SHALL return all errors in a standard format containing status (HTTP code), error (error type string), message (human-readable), and details (nullable field-level errors)
2. WHEN a request body fails validation, THE Server SHALL respond with HTTP 422 Unprocessable Entity and include field-level error details in the response
3. WHEN a requested resource does not exist, THE Server SHALL respond with HTTP 404 Not Found
4. THE Server SHALL validate and sanitize all input to prevent SQL injection and cross-site scripting attacks
5. THE Server SHALL enforce rate limiting of 30 messages per minute on chat message sending

### Requirement 9: Data Persistence and Performance

**User Story:** As a player, I want fast and reliable data access, so that the app feels responsive even with large game histories.

#### Acceptance Criteria

1. THE Server SHALL paginate message history at 50 messages per page to avoid loading entire game chat histories
2. THE Server SHALL maintain a database index on messages(game_id, created_at) for efficient paginated message retrieval
3. THE Server SHALL maintain a database index on characters(user_id, game_system_id) for efficient filtered character listing
4. THE Server SHALL maintain a database index on games(game_system_id, visibility, status) for efficient game browsing and filtering
5. THE Server SHALL use connection pooling for PostgreSQL with 10-20 connections
6. THE Server SHALL store session data in Redis so that API server instances remain stateless and horizontally scalable

### Requirement 10: Security

**User Story:** As a player, I want my data and credentials to be secure, so that my account and personal information are protected.

#### Acceptance Criteria

1. THE Server SHALL hash all passwords using bcrypt with a cost factor of 12
2. THE Server SHALL issue JWT access tokens with a 15-minute expiry and refresh tokens with a 7-day expiry
3. THE Server SHALL enforce HTTPS for all API communication and WSS for all WebSocket connections
4. THE Server SHALL implement CORS with a whitelist restricted to the mobile app's origin
5. THE Server SHALL sanitize chat message content to prevent stored cross-site scripting
6. THE Server SHALL store file attachments with signed URLs rather than direct filesystem paths
7. WHEN a user accesses a resource, THE Server SHALL verify that the user owns or has permission to access that resource before returning data
