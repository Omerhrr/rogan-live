# 🎬 Rogan Live v3.2-web2.5-final

A monetized live streaming platform with a dual-layer economy (Web2 identity + Web3 value settlement).

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (Vue 3)                   │
│  Vuetify + TailwindCSS + Pinia + Vue Router 4       │
│  hls.js (LL-HLS) + Socket.io-client                 │
│  Mobile-first: TikTok-style vertical feed            │
├─────────────────────────────────────────────────────┤
│                   BACKEND (FastAPI)                   │
│  SQLAlchemy + Redis + SlowAPI + Pydantic             │
│  JWT Auth + WebSocket (Redis PubSub)                 │
├─────────────────────────────────────────────────────┤
│                INFRASTRUCTURE (Production)            │
│  Contabo VPS + MediaMTX + Cloudflare CDN             │
│  PostgreSQL + Redis + SQLite (dev)                   │
└─────────────────────────────────────────────────────┘
```

## Economy Model

```
ROGAN (on-chain settlement)  ←→  TK (off-chain internal currency)
         1 ROGAN = 1 TK (fixed peg, MVP)

Flow:
  1. User deposits ROGAN → System mints TK
  2. User spends TK on gifts, DMs, subscriptions
  3. Creator receives TK (minus 10% platform fee)
  4. Creator withdraws TK → System burns TK → Sends ROGAN (minus 2% fee)
```

## Quick Start

### Backend (FastAPI)

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Seed database with test data
python seed.py

# Start development server
uvicorn app.main:app --reload --port 8000

# API docs available at http://localhost:8000/docs
```

### Frontend (Vue 3)

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Creator | creator1-5@rogan.live | password123 |
| User | user1-10@rogan.live | password123 |

## API Endpoints

### Auth
- `POST /api/v1/auth/register` — Register with email/username/password
- `POST /api/v1/auth/login` — Login with email/password → JWT token
- `POST /api/v1/auth/google` — Google OAuth login
- `GET /api/v1/auth/me` — Get current user (Bearer token required)

### Streams
- `GET /api/v1/streams/live` — Get live streams (paginated)
- `POST /api/v1/streams/` — Create stream (auth required)
- `GET /api/v1/streams/{id}` — Get stream details
- `POST /api/v1/streams/{id}/go-live` — Start streaming (creator only)
- `POST /api/v1/streams/{id}/end` — End stream

### Gifts
- `POST /api/v1/gifts/send` — Send gift (rate limited: 10/sec)
- `GET /api/v1/gifts/stream/{id}` — Stream gift history
- `GET /api/v1/gifts/stats/{creator_id}` — Creator gift statistics

### Wallet & Economy
- `GET /api/v1/wallet/` — Wallet info + TK balance
- `POST /api/v1/wallet/link` — Link Web3 wallet address
- `POST /api/v1/wallet/deposit` — Deposit ROGAN → mint TK
- `POST /api/v1/wallet/withdraw` — Withdraw: burn TK → send ROGAN
- `GET /api/v1/wallet/transactions` — Transaction history (paginated)

### Direct Messages
- `POST /api/v1/dm/send` — Send DM (rate limited: 5/sec, paid or free)
- `GET /api/v1/dm/conversations` — List conversations
- `GET /api/v1/dm/messages/{partner_id}` — Message history
- `POST /api/v1/dm/read/{id}` — Mark as read

### Notifications
- `GET /api/v1/notifications/` — List notifications
- `GET /api/v1/notifications/unread-count` — Unread count
- `POST /api/v1/notifications/{id}/read` — Mark as read

### Creator
- `GET /api/v1/creators/{id}/profile` — Creator profile + stats
- `GET /api/v1/creators/{id}/earnings` — Earnings breakdown
- `GET /api/v1/creators/dashboard` — Full creator dashboard (creator only)

### WebSocket
- `WS /ws/{stream_id}/{user_id}` — Real-time: chat, gifts, viewer updates

## Database Schema

### Core Tables
- **users** — Web2 identity (email, username, password_hash, google_id, role)
- **wallets** — Web3 wallet linking (optional, user_id → wallet_address)
- **transactions** — Double-entry ledger (immutable, audit-safe)
- **streams** — Live stream records
- **gifts** — Gift records with type, amount, references
- **direct_messages** — DMs with paid/free tiers
- **subscriptions** — Creator subscriptions
- **notifications** — Push notifications
- **service_listings** — Creator service marketplace
- **task_requests** — Task marketplace
- **reports** — Moderation reports

### Ledger Design
- Balance is **derived** from transactions (sum received - sum sent)
- No direct balance mutation — fully audit-safe
- System user "SYSTEM" handles deposits/withdrawals
- Every gift creates 3 entries: debit sender, credit creator (90%), platform fee (10%)

## Gift Types & Pricing

| Gift | TK Price | Icon |
|------|----------|------|
| Rose | 1 TK | 🌹 |
| Heart | 5 TK | ❤️ |
| Diamond | 10 TK | 💎 |
| Rocket | 50 TK | 🚀 |
| Crown | 100 TK | 👑 |

## Rate Limiting (SlowAPI)

| Endpoint | Limit |
|----------|-------|
| Gifts | 10/second per user |
| DMs | 5/second per user |
| Auth | 5/minute per IP |

## Production Deployment

### Swap SQLite → PostgreSQL
```python
# backend/app/config.py
DATABASE_URL: str = "postgresql://user:pass@localhost:5432/rogan_live"
```

### Enable Redis
```python
# backend/app/config.py
REDIS_ENABLED: bool = True
REDIS_URL: str = "redis://localhost:6379/0"
```

### MediaMTX Configuration
- Public streams: RTMP → LL-HLS → Cloudflare CDN
- Private streams: WebRTC via MediaMTX
- Guest streams: WebRTC multi-peer (max 5)

## Project Structure

```
rogan-live/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── config.py            # Settings (pydantic)
│   │   ├── database.py          # SQLAlchemy setup
│   │   ├── schemas.py           # Pydantic request/response models
│   │   ├── models/
│   │   │   └── models.py        # SQLAlchemy ORM models
│   │   ├── routes/
│   │   │   ├── auth.py          # Auth endpoints
│   │   │   ├── streams.py       # Stream endpoints
│   │   │   ├── gifts.py         # Gift endpoints
│   │   │   ├── wallet.py        # Wallet endpoints
│   │   │   ├── dm.py            # DM endpoints
│   │   │   ├── notifications.py # Notification endpoints
│   │   │   └── creators.py      # Creator endpoints
│   │   ├── services/
│   │   │   ├── auth_service.py  # JWT + bcrypt + Google OAuth
│   │   │   ├── economy_service.py # TK/ROGAN conversion + fees
│   │   │   ├── ledger_service.py  # Double-entry ledger
│   │   │   ├── wallet_service.py  # Deposit/withdraw
│   │   │   ├── gift_service.py     # Gift sending + stats
│   │   │   ├── stream_service.py   # Stream lifecycle
│   │   │   ├── dm_service.py       # Direct messages
│   │   │   └── notification_service.py # Notifications
│   │   ├── websocket/
│   │   │   └── handler.py       # WebSocket connection manager
│   │   └── utils/
│   │       └── redis_client.py  # Redis/in-memory fallback
│   ├── seed.py                  # Database seeder
│   ├── test_integration.py      # Integration test
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── main.ts              # Vue app entry
    │   ├── App.vue              # Root component
    │   ├── plugins/
    │   │   └── vuetify.ts       # Vuetify 3 dark theme
    │   ├── router/
    │   │   └── index.ts         # Vue Router (10 routes)
    │   ├── stores/              # Pinia stores
    │   │   ├── auth.ts          # Auth state
    │   │   ├── feed.ts          # Stream feed state
    │   │   ├── wallet.ts        # Wallet state
    │   │   ├── chat.ts          # Chat + WS state
    │   │   ├── dm.ts            # DM state
    │   │   └── notifications.ts # Notification state
    │   ├── services/            # API + WebSocket
    │   │   ├── api.ts           # Axios instance
    │   │   ├── auth.ts          # Auth API
    │   │   ├── streams.ts       # Stream API
    │   │   ├── gifts.ts         # Gift API
    │   │   ├── wallet.ts        # Wallet API
    │   │   ├── dm.ts            # DM API
    │   │   ├── notifications.ts # Notification API
    │   │   └── websocket.ts     # Socket.io client
    │   ├── types/
    │   │   └── index.ts         # TypeScript interfaces
    │   ├── views/               # Page views
    │   │   ├── auth/            # Login, Register
    │   │   ├── feed/            # TikTok-style FeedView
    │   │   ├── live/            # LiveRoomView
    │   │   ├── wallet/          # WalletView
    │   │   ├── dashboard/       # CreatorDashboardView
    │   │   ├── dm/              # DMListView, DMConversationView
    │   │   ├── profile/         # ProfileView
    │   │   └── notifications/   # NotificationsView
    │   ├── components/          # Reusable components
    │   │   ├── common/          # AppHeader, AppBottomNav, GiftAnimation
    │   │   ├── feed/            # StreamCard, StreamOverlay
    │   │   ├── live/            # ChatPanel, GiftPanel, GiftOverlay
    │   │   ├── wallet/          # DepositDialog, WithdrawDialog, TransactionList
    │   │   └── creator/         # EarningsChart, GiftBreakdown
    │   └── assets/
    │       └── main.css         # TailwindCSS + global styles
    ├── vite.config.ts
    ├── tailwind.config.cjs
    └── package.json
```

## Phase Roadmap

| Phase | Scope | Status |
|-------|-------|--------|
| **Phase 1** | Core streaming + gifting + ledger + Web2 auth | ✅ Complete |
| **Phase 2** | Private shows + DMs + tasks | ✅ Complete (API) |
| **Phase 3** | Subscriptions + marketplace + PK battles | 🔧 API Ready |
| **Phase 4** | Scale + moderation + recommendation engine | 📋 Planned |
