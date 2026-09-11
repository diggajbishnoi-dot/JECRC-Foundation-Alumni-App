# Alumni Networking App — Backend

An enterprise, LinkedIn-style backend for college alumni networking with WhatsApp/Signal-style **End-to-End Encrypted (E2E)** real-time messaging, built for cross-platform **Flutter** mobile apps (iOS & Android).

---

## 1. Tech Stack

- **Runtime**: Node.js (v20+) with TypeScript
- **Framework**: NestJS (Modular Architecture, Guards, Interceptors, Pipes)
- **Database**: PostgreSQL with Prisma ORM
- **In-Memory Cache & Presence**: Redis (with automatic in-memory fallback for local dev)
- **Real-Time Gateway**: Socket.io (`/chat` namespace, JWT handshake auth)
- **End-to-End Encryption**: Zero-knowledge architecture using X25519 key exchange + XSalsa20-Poly1305 / AES-256-GCM
- **File Storage**: AWS S3 adapter for profile pictures and post attachments
- **Push Notifications**: Firebase Cloud Messaging (FCM) multi-device delivery
- **Auth**: JWT access tokens (15m) + refresh tokens (7d) with rotation; SMS/Email 6-digit OTP
- **API Docs**: Swagger UI at `/api/docs`
- **Containerization**: Docker & Docker Compose (API + PostgreSQL + Redis)

---

## 2. Key Architectural Guarantees

### A. One-Time Registration OTP → Direct Password Login Forever
1. **Registration (`POST /auth/register`)**:
   - Accepts either `email` or `mobile` (or both).
   - Generates a 6-digit OTP code, hashes it using bcrypt, and dispatches via SMS (Twilio/MSG91) or Email (SMTP).
2. **Verification (`POST /auth/verify-otp`)**:
   - Validates OTP code, marks `User.isVerified = true`, and deletes the OTP record.
   - Automatically issues JWT access + refresh tokens (instant auto-login).
3. **Subsequent Logins (`POST /auth/login`)**:
   - Verified users log in directly with `emailOrMobile` + `password`.
   - **NO OTP is ever triggered for regular logins** (same friction-free UX as WhatsApp/Instagram).
   - OTP is only used for `POST /auth/forgot-password` / `reset-password`.

---

### B. WhatsApp/Signal-Style End-to-End Encryption (E2E)

```
[Mobile Device A (Sender)]                          [NestJS Server]                      [Mobile Device B (Receiver)]
          │                                                │                                          │
 1. Generate X25519 Keys                                   │                                  1. Generate X25519 Keys
    (Private key STAYS on device)                          │                                     (Private key STAYS on device)
 2. Upload public key ──────────────────────────────> Store publicKey <───────────────────────── Upload public key
          │                                                │                                          │
          │ 3. Fetch B's public key                        │                                          │
          │ <──────────────────────────────────────────────┤                                          │
          │                                                │                                          │
 4. Derive Shared Secret (ECDH X25519)                     │                                          │
 5. Encrypt plaintext -> { ciphertext, nonce }             │                                          │
 6. Send { receiverId, ciphertext, nonce } ──────────────> │                                          │
                                                           │ (Zero Knowledge: Cannot decrypt)         │
                                                           │ 7. Relays { ciphertext, nonce } ───────> │
                                                           │                                          │ 8. Derive Shared Secret
                                                           │                                          │ 9. Decrypt to plaintext locally
```

#### Zero-Knowledge Server Rules:
- **Private keys NEVER touch the server**: Generated locally on Flutter device via `libsodium` / `cryptography`.
- **Ciphertext only**: `messages.encryptedContent` and `messages.nonce` only store encrypted bytes.
- **Privacy-safe Push Notifications**: If the recipient is offline, the FCM notification displays only: `"New message from {Sender Name}"`. It **never** contains message text or ciphertext.
- **Automated tests** enforce that no logger, database column, or notification payload ever receives plaintext.

---

## 3. Real-Time Socket.io Gateway Reference

Connect to namespace: `http://localhost:3000/chat`

### Handshake Authentication
Pass the JWT access token in the socket handshake:
```json
{
  "auth": {
    "token": "Bearer <JWT_ACCESS_TOKEN>"
  }
}
```

### Event Contracts

| Event | Direction | Payload | Description |
|---|---|---|---|
| `sendMessage` | Client → Server | `{"receiverId": "uuid", "encryptedContent": "b64...", "nonce": "b64..."}` | Send E2E encrypted message to accepted connection |
| `newMessage` | Server → Client | `{"id": "uuid", "senderId": "uuid", "encryptedContent": "b64...", "nonce": "b64...", "status": "SENT"}` | Pushed to receiver's socket room |
| `messageDelivered`| Client → Server | `{"messageId": "uuid"}` | Client acknowledges message reached device |
| `messageRead` | Client → Server | `{"messageId": "uuid"}` | Client marks message as viewed |
| `messageStatusUpdate`| Server → Client | `{"messageId": "uuid", "status": "DELIVERED" \| "READ"}` | Double tick updates pushed back to sender |
| `typing` | Client → Server | `{"receiverId": "uuid"}` | Live typing notification (ephemeral, not in DB) |
| `userTyping` | Server → Client | `{"senderId": "uuid"}` | Relayed to recipient |
| `stopTyping` | Client → Server | `{"receiverId": "uuid"}` | Live stop typing notification |
| `userStoppedTyping` | Server → Client| `{"senderId": "uuid"}` | Relayed to recipient (auto-cleared after 5s) |

---

## 4. API Endpoints Overview

Full interactive OpenAPI documentation available at: `http://localhost:3000/api/docs`

- **Auth**:
  - `POST /api/v1/auth/register` — Register student/alumni + send OTP
  - `POST /api/v1/auth/verify-otp` — Verify OTP once + auto-login
  - `POST /api/v1/auth/login` — Direct email/mobile + password login
  - `POST /api/v1/auth/refresh` — Rotate refresh token
  - `POST /api/v1/auth/resend-otp` — Resend expired OTP
  - `POST /api/v1/auth/forgot-password` & `POST /api/v1/auth/reset-password`
- **Users**:
  - `GET /api/v1/users/me` & `PATCH /api/v1/users/me`
  - `POST /api/v1/users/me/profile-picture` (S3 upload)
  - `POST /api/v1/users/me/public-key` & `GET /api/v1/users/:id/public-key`
  - `GET /api/v1/users/:id/presence` (Online status + Last seen)
  - `GET /api/v1/users/search` (Filter by branch, batch, company, city)
- **Connections (LinkedIn-style)**:
  - `POST /api/v1/connections/request`
  - `PATCH /api/v1/connections/:id/accept` & `PATCH /api/v1/connections/:id/reject`
  - `DELETE /api/v1/connections/:id`
  - `GET /api/v1/connections` (Accepted), `/pending`, `/sent`
- **Messages & Chat**:
  - `GET /api/v1/messages/:userId` (Paginated ciphertext history)
  - `PATCH /api/v1/messages/:userId/read` (Bulk mark conversation as read)
- **Posts & Jobs**:
  - `POST /api/v1/posts` (General, Job, or Internship)
  - `GET /api/v1/posts` (Paginated feed, filter by type/location)
  - `POST /api/v1/posts/:id/report`
- **Discussions (Forum)**:
  - `POST /api/v1/discussions` & `GET /api/v1/discussions`
  - `POST /api/v1/discussions/:id/replies`
  - `POST /api/v1/discussions/:id/upvote` & `POST /api/v1/discussions/:id/replies/:replyId/upvote`
- **Mentorship Matching**:
  - `POST /api/v1/mentorship/opt-in` (Alumni register as mentor with domains & capacity)
  - `GET /api/v1/mentorship/mentors` (Browse mentors)
  - `POST /api/v1/mentorship/request` (Student requests mentorship)
  - `PATCH /api/v1/mentorship/:id/accept` (Unlocks chat between mentor & mentee)
  - `PATCH /api/v1/mentorship/:id/complete` or `/end`
- **Affinity Groups**:
  - `POST /api/v1/groups` & `GET /api/v1/groups`
  - `GET /api/v1/groups/suggested` (Auto-matches batch and branch)
  - `POST /api/v1/groups/:id/join` & `DELETE /api/v1/groups/:id/leave`
  - `GET /api/v1/groups/:id/discussions` & `POST /api/v1/groups/:id/discussions`
- **Notifications**:
  - `GET /api/v1/notifications`, `PATCH /api/v1/notifications/:id/read`, `PATCH /api/v1/notifications/read-all`
  - `POST /api/v1/users/me/device-token` (Register FCM device token)
- **Admin**:
  - `GET /api/v1/admin/users/unverified` & `PATCH /api/v1/admin/users/:id/verify`
  - `DELETE /api/v1/admin/posts/:id`, `DELETE /api/v1/admin/discussions/:id`, `DELETE /api/v1/admin/groups/:id`
  - `GET /api/v1/admin/stats` (Community KPIs & counts)

---

## 5. Local Setup & Execution

### Option 1: Run with Docker Compose (Recommended)
```bash
docker-compose up --build
```
Spins up:
- NestJS API on `http://localhost:3000`
- PostgreSQL on port `5432`
- Redis on port `6379`

### Option 2: Run Locally with Node.js
1. Ensure dependencies are installed:
   ```bash
   npm install
   ```
2. Configure `.env` with your PostgreSQL database URL.
3. Generate Prisma client & apply database schema:
   ```bash
   npx prisma db push
   ```
4. Seed test data:
   ```bash
   npx ts-node prisma/seed.ts
   ```
5. Start development server:
   ```bash
   npm run start:dev
   ```

### Running Automated Tests
```bash
npm run test
```
All unit tests and zero-knowledge ciphertext invariant tests will execute.
