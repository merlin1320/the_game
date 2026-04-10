# Implementation Plan: Server-Side Setup

## Overview

Build a standalone Node.js/TypeScript server with Express, PostgreSQL, Redis, and Socket.io. The server provides REST APIs for user auth, character management, game systems, games, and friends, plus a WebSocket layer for real-time game rooms. The architecture is game-system agnostic, using JSONB schemas and a plugin-based game system registry.

## Tasks

- [ ] 1. Project scaffolding and configuration
  - [ ] 1.1 Initialize the server project with package.json, tsconfig.json, and install core dependencies (express, pg, ioredis, socket.io, jsonwebtoken, bcrypt, zod, ajv, helmet, cors, dotenv, uuid)
    - Create `fantasy-rpg-server/` directory structure per the design: `src/config/`, `src/middleware/`, `src/controllers/`, `src/services/`, `src/models/`, `src/game-systems/`, `src/websocket/`, `src/validators/`, `src/types/`, `migrations/`, `seeds/game-systems/`, `tests/unit/`, `tests/integration/`, `tests/properties/`
    - Add dev dependencies: typescript, ts-node, jest, ts-jest, supertest, fast-check, @types/\*
    - Configure tsconfig.json with strict mode, ES module output, path aliases
    - _Requirements: 9.5, 10.3, 10.4_

  - [ ] 1.2 Create environment configuration and database/Redis connection modules
    - Create `src/config/env.ts` loading .env variables (DB host/port/name, Redis URL, JWT secrets, bcrypt cost factor, port)
    - Create `src/config/database.ts` with pg Pool (10-20 connections per Requirement 9.5)
    - Create `src/config/redis.ts` with ioredis client
    - Create `.env.example` with all required variables
    - _Requirements: 9.5, 9.6_

  - [ ] 1.3 Create the Express app entry point with middleware stack
    - Create `src/app.ts` with Express setup: helmet, cors (whitelist), JSON body parser, rate limiter setup
    - Create `src/server.ts` as the startup entry point (listen on port, connect DB, connect Redis)
    - Wire global error handler middleware
    - _Requirements: 8.1, 8.4, 10.3, 10.4_

- [ ] 2. Shared types, error handling, and validation infrastructure
  - [ ] 2.1 Define TypeScript interfaces and types
    - Create `src/types/index.ts` with interfaces: User, Character, Game, GamePlayer, GameSystem, Friend, GameMessage, GameInvite, DmTransferRequest, Attachment, SheetAttachment, ErrorResponse, DiceRoll
    - Define enums: Visibility, GameStatus, FriendStatus, FriendDirection, MessageType, PlayerRole, InviteStatus
    - _Requirements: 8.1_

  - [ ] 2.2 Implement standard error response handler and custom error classes
    - Create `src/middleware/errorHandler.ts` returning `{ status, error, message, details }` format
    - Create `src/utils/errors.ts` with custom error classes: ValidationError (422), NotFoundError (404), UnauthorizedError (401), ForbiddenError (403), ConflictError (409)
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ] 2.3 Implement input validation and sanitization middleware
    - Create `src/middleware/validate.ts` using Zod for request body/params/query validation
    - Create `src/utils/sanitize.ts` for HTML/XSS sanitization of user input
    - _Requirements: 8.2, 8.4, 10.5_

  - [ ]\* 2.4 Write property test for standard error response format
    - **Property 26: Standard error response format**
    - **Validates: Requirements 8.1, 8.2**

  - [ ]\* 2.5 Write property test for input sanitization
    - **Property 30: Input sanitization**
    - **Validates: Requirements 8.4, 10.5**

- [ ] 3. Database migrations and seed data
  - [ ] 3.1 Create database migration files for all tables
    - Create migrations for: `game_systems`, `users`, `characters`, `games`, `game_players`, `game_invites`, `dm_transfer_requests`, `messages`, `friends`, `attachments`, `sheet_attachments`
    - Include indexes: `messages(game_id, created_at)`, `characters(user_id, game_system_id)`, `games(game_system_id, visibility, status)`
    - Include all foreign keys, unique constraints, and enum types
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ] 3.2 Create seed data for built-in game systems
    - Create `seeds/game-systems/dnd-5e.json` with full character_schema, validation_rules, stat_definitions, dice_config per design examples
    - Create `seeds/game-systems/coc-7e.json` with Call of Cthulhu 7e system definition
    - Create seed runner script to insert game system records
    - _Requirements: 4.1, 4.2_

- [ ] 4. Authentication middleware and auth routes
  - [ ] 4.1 Implement auth middleware (JWT validation, session management)
    - Create `src/middleware/auth.ts` with `authenticate` middleware: extract Bearer token, verify JWT, attach userId/username to req context
    - Implement Redis session check for token revocation
    - Return 401 for invalid/expired/revoked tokens
    - _Requirements: 1.3, 1.6, 10.2_

  - [ ] 4.2 Implement auth service and controller (register, login, refresh, logout)
    - Create `src/services/authService.ts` with register (bcrypt hash, create user, generate tokens), login (verify password, generate tokens), refreshToken, logout (invalidate in Redis)
    - Create `src/controllers/authController.ts` with routes: POST /api/auth/register, POST /api/auth/login, POST /api/auth/refresh, POST /api/auth/logout
    - Create `src/validators/authValidators.ts` with Zod schemas for registration and login payloads
    - Implement rate limiting (5 attempts/min) on auth endpoints
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.7, 1.8, 10.1_

  - [ ]\* 4.3 Write property test for auth round-trip
    - **Property 1: Auth round-trip**
    - **Validates: Requirements 1.1, 1.2, 1.3**

  - [ ]\* 4.4 Write property test for token validation correctness
    - **Property 2: Token validation correctness**
    - **Validates: Requirements 1.3, 1.6**

  - [ ]\* 4.5 Write property test for password hashing
    - **Property 28: Password hashing with bcrypt**
    - **Validates: Requirement 10.1**

  - [ ]\* 4.6 Write property test for JWT token expiry compliance
    - **Property 29: JWT token expiry compliance**
    - **Validates: Requirement 10.2**

- [ ] 5. User controller and service
  - [ ] 5.1 Implement user model, service, and controller
    - Create `src/models/userModel.ts` with DB queries: findById, findByEmail, update, delete (cascade), search
    - Create `src/services/userService.ts` with getProfile (exclude password_hash), updateProfile (partial update), deleteAccount (cascade delete characters, game memberships, friends), searchUsers
    - Create `src/controllers/userController.ts` with routes: GET /api/users/me, PUT /api/users/me, DELETE /api/users/me, GET /api/users/search, GET /api/users/:id
    - Create `src/validators/userValidators.ts` with Zod schemas enforcing username (3-30 chars, alphanumeric + underscores) and email format validation
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ]\* 5.2 Write property test for profile excludes password hash
    - **Property 3: Profile excludes password hash**
    - **Validates: Requirement 2.1**

  - [ ]\* 5.3 Write property test for partial profile update
    - **Property 4: Partial profile update preserves unmodified fields**
    - **Validates: Requirement 2.2**

  - [ ]\* 5.4 Write property test for user input validation
    - **Property 5: User input validation**
    - **Validates: Requirements 2.5, 2.6**

  - [ ]\* 5.5 Write property test for user search
    - **Property 6: User search returns matching results**
    - **Validates: Requirement 2.4**

- [ ] 6. Checkpoint - Core infrastructure and auth
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Game system registry
  - [ ] 7.1 Implement game system model, service, and controller
    - Create `src/models/gameSystemModel.ts` with DB queries: findAll (active only), findById, findBySlug, create, update, updateStatus
    - Create `src/game-systems/schemaValidator.ts` using ajv to validate system_data against a game system's character_schema
    - Create `src/game-systems/registry.ts` with caching layer (Redis with long TTL, invalidate on update)
    - Create `src/services/gameSystemService.ts` with listActive, getById, getSchema, register (validate slug uniqueness + kebab-case, validate character_schema is valid JSON Schema), update (increment version), changeStatus (enforce at least one active)
    - Create `src/controllers/gameSystemController.ts` with routes: GET /api/game-systems, GET /api/game-systems/:id, GET /api/game-systems/:id/schema, GET /api/game-systems/:id/rules, POST /api/game-systems, PUT /api/game-systems/:id, PUT /api/game-systems/:id/status
    - Create `src/validators/gameSystemValidators.ts` with Zod schemas
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [ ]\* 7.2 Write property test for game system list returns only active systems
    - **Property 11: Game system list returns only active systems**
    - **Validates: Requirement 4.1**

  - [ ]\* 7.3 Write property test for game system registration round-trip
    - **Property 12: Game system registration round-trip**
    - **Validates: Requirement 4.2**

  - [ ]\* 7.4 Write property test for game system slug validation
    - **Property 13: Game system slug uniqueness and format validation**
    - **Validates: Requirement 4.4**

  - [ ]\* 7.5 Write property test for at least one active game system invariant
    - **Property 14: At least one active game system invariant**
    - **Validates: Requirement 4.7**

- [ ] 8. Character controller and service
  - [ ] 8.1 Implement character model, service, and controller
    - Create `src/models/characterModel.ts` with DB queries: findByUserId, findByUserIdAndSystem, findById, create, update, delete
    - Create `src/services/characterService.ts` with listCharacters (scoped to user, optional system filter), getCharacter (ownership check), createCharacter (validate game_system_id is active, validate system_data against schema), updateCharacter (validate system_data), deleteCharacter (cascade sheet_attachments), importFromPdf
    - Create `src/controllers/characterController.ts` with routes: GET /api/characters, GET /api/characters/:id, POST /api/characters, PUT /api/characters/:id, DELETE /api/characters/:id, POST /api/characters/:id/import, POST /api/characters/:id/validate
    - Create `src/validators/characterValidators.ts` with Zod schemas
    - Enforce 403 for accessing characters not owned by the user
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_

  - [ ]\* 8.2 Write property test for character ownership scoping
    - **Property 7: Character ownership scoping**
    - **Validates: Requirements 3.1, 3.9**

  - [ ]\* 8.3 Write property test for character system filter correctness
    - **Property 8: Character system filter correctness**
    - **Validates: Requirement 3.2**

  - [ ]\* 8.4 Write property test for character system_data schema validation
    - **Property 9: Character system_data schema validation**
    - **Validates: Requirements 3.4, 3.6**

  - [ ]\* 8.5 Write property test for character creation round-trip
    - **Property 10: Character creation round-trip**
    - **Validates: Requirement 3.3**

- [ ] 9. Game controller and service
  - [ ] 9.1 Implement game model, service, and controller
    - Create `src/models/gameModel.ts` with DB queries: findByUserId, browse (visibility filtering with friend check), findById, create, update, delete, addPlayer, removePlayer, getPlayerCount
    - Create `src/models/gamePlayerModel.ts` with DB queries for game_players join table
    - Create `src/models/gameInviteModel.ts` with DB queries for invitations
    - Create `src/models/dmTransferModel.ts` with DB queries for DM transfer requests
    - Create `src/services/gameService.ts` with createGame (set creator as DM), listUserGames, browseGames (visibility + system filter), joinGame (enforce max_players), leaveGame, invitePlayer, respondToInvite, assignCharacter (enforce system match), transferDm, updateGame (DM/creator auth check)
    - Create `src/controllers/gameController.ts` with all routes per design interface
    - Create `src/validators/gameValidators.ts` with Zod schemas (max_players 2-12)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11, 5.12, 5.13_

  - [ ]\* 9.2 Write property test for game creator is assigned as DM
    - **Property 15: Game creator is assigned as DM**
    - **Validates: Requirement 5.1**

  - [ ]\* 9.3 Write property test for player count never exceeds max_players
    - **Property 16: Player count never exceeds max_players**
    - **Validates: Requirements 5.5, 5.6**

  - [ ]\* 9.4 Write property test for character-game system consistency
    - **Property 17: Character-game system consistency**
    - **Validates: Requirements 5.7, 5.8**

  - [ ]\* 9.5 Write property test for game visibility filtering
    - **Property 18: Game visibility filtering**
    - **Validates: Requirement 5.3**

  - [ ]\* 9.6 Write property test for game settings authorization
    - **Property 19: Game settings authorization**
    - **Validates: Requirement 5.13**

  - [ ]\* 9.7 Write property test for max_players validation
    - **Property 20: max_players validation**
    - **Validates: Requirement 5.12**

- [ ] 10. Checkpoint - REST API controllers complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Friend controller and service
  - [ ] 11.1 Implement friend model, service, and controller
    - Create `src/models/friendModel.ts` with DB queries: findByUserId (accepted), findPendingIncoming, create (both directions), updateStatus, deletePair
    - Create `src/services/friendService.ts` with sendRequest (create outgoing + incoming records), listFriends (accepted, include shared games), listPendingRequests (incoming only), acceptRequest (update both records), denyRequest, removeFriend (delete both records)
    - Create `src/controllers/friendController.ts` with routes: GET /api/friends, GET /api/friends/requests, POST /api/friends/request, PUT /api/friends/:id/accept, PUT /api/friends/:id/deny, DELETE /api/friends/:id
    - Create `src/validators/friendValidators.ts` with Zod schemas
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ]\* 11.2 Write property test for friend request symmetry
    - **Property 21: Friend request symmetry**
    - **Validates: Requirement 6.1**

  - [ ]\* 11.3 Write property test for friend acceptance updates both records
    - **Property 22: Friend acceptance updates both records**
    - **Validates: Requirement 6.3**

  - [ ]\* 11.4 Write property test for friend removal deletes both records
    - **Property 23: Friend removal deletes both records**
    - **Validates: Requirement 6.5**

  - [ ]\* 11.5 Write property test for pending requests filter correctness
    - **Property 24: Pending requests filter correctness**
    - **Validates: Requirement 6.2**

- [ ] 12. WebSocket room manager and real-time layer
  - [ ] 12.1 Set up Socket.io server with Redis adapter
    - Create `src/websocket/socketServer.ts` initializing Socket.io with `@socket.io/redis-adapter` for multi-instance pub/sub
    - Implement JWT authentication on WebSocket connection handshake
    - Wire Socket.io server into the Express HTTP server in `src/server.ts`
    - _Requirements: 7.1, 7.8, 7.9_

  - [ ] 12.2 Implement Room Manager with presence tracking and event handlers
    - Create `src/websocket/roomManager.ts` with: onConnect (authenticate, join room, emit "room:joined" with player list), onDisconnect (remove from Redis presence, emit "player:disconnected"), onMessage (persist to DB, broadcast "message:new"), onDiceRoll (generate results, persist, broadcast "dice:result"), onSceneUpdate (DM-only check, update game current_scene, broadcast "scene:updated"), getRoomPresence
    - Create `src/models/messageModel.ts` with DB queries: create, findByGameId (paginated, 50 per page, ordered by created_at)
    - Create `src/services/messageService.ts` with createMessage, getMessageHistory (paginated)
    - Track room presence in Redis per game room
    - Implement rate limiting on chat messages (30/min per Requirement 8.5)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.8, 7.9, 8.5_

  - [ ]\* 12.3 Write property test for dice roll bounds
    - **Property 25: Dice roll bounds**
    - **Validates: Requirement 7.4**

  - [ ]\* 12.4 Write property test for message pagination bound
    - **Property 27: Message pagination bound**
    - **Validates: Requirement 9.1**

- [ ] 13. Checkpoint - Full feature set complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Route wiring, authorization middleware, and final integration
  - [ ] 14.1 Wire all routes into the Express app and add authorization middleware
    - Create `src/routes/index.ts` aggregating all controller routes under `/api` prefix
    - Create `src/middleware/authorize.ts` with resource ownership checks (character owner, game DM/creator) returning 403 for unauthorized access
    - Wire all routes in `src/app.ts`: auth routes (public), all other routes (protected via auth middleware)
    - _Requirements: 3.9, 5.13, 10.7_

  - [ ]\* 14.2 Write property test for resource access authorization
    - **Property 31: Resource access authorization**
    - **Validates: Requirements 3.9, 5.13, 10.7**

  - [ ]\* 14.3 Write integration tests for end-to-end flows
    - Test auth flow: register → login → access protected route → refresh token → logout
    - Test character lifecycle: create → read → update → delete with system validation
    - Test game lifecycle: create → invite → join → assign character → play
    - Test WebSocket: connect → send message → dice roll → disconnect
    - _Requirements: 1.1-1.8, 3.1-3.9, 5.1-5.13, 7.1-7.9_

- [ ] 15. Final checkpoint - All tests pass and server is ready
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests use fast-check and validate correctness properties from the design document
- The server is a standalone project separate from the mobile app
- All code is TypeScript with strict mode enabled
- Checkpoints ensure incremental validation throughout implementation
