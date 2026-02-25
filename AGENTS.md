# Gameapy - Agent Quick Reference

**Version**: 6.1.0 | **Last Updated**: 2026-02-24 (Targeted Card Updates)

---

## Repository Structure

Gameapy is split into two separate GitHub repositories:

| Repo | URL | Purpose |
|------|-----|---------|
| **Backend** | https://github.com/NeuralRP/gameapy-backend | FastAPI server, database, LLM services, tests |
| **Web** | https://github.com/NeuralRP/gameapy-web | React frontend (Vite + TypeScript + Tailwind) |

### File Organization

```
gameapy-backend/          # Backend repo
├── app/
│   ├── api/              # FastAPI route handlers
│   ├── db/               # Database operations (database.py)
│   ├── services/         # LLM services (card_generator, guide_system, card_updater)
│   ├── models/           # Pydantic schemas
│   └── config/           # Core truths, persona configs
├── data/personas/        # Persona JSON definitions
├── tests/                # Pytest test suite
├── scripts/              # Utility scripts (seed_personas)
├── main.py               # FastAPI app entry point
├── requirements.txt      # Python dependencies
├── schema.sql            # Database schema
└── pytest.ini            # Test configuration

gameapy-web/              # Web frontend repo
├── src/
│   ├── components/      # React components (ui, counselor, shared)
│   ├── contexts/         # React Context (AppContext.tsx)
│   ├── screens/          # Screen components (CounselorSelection, ChatScreen, GuideScreen, CardInventoryModal)
│   ├── services/         # API client (api.ts)
│   ├── types/            # TypeScript types
│   └── utils/            # Utilities (constants.ts)
├── index.css             # Global styles + Tailwind v4
├── package.json          # Node dependencies
├── vite.config.ts        # Vite build config
├── vercel.json           # Vercel deployment config
└── .env.production       # Production environment variables
```

---

## Current Status

**Completed Backend**: Phases 1-6 (Personalities, Table, Cards, Wildcards, Trading, Images)
**Completed Frontend**: Phases 0-6 (Web MVP complete + deployed to Vercel)
**Latest Update**: Targeted Card Updates (2026-02-24) - Per-card LLM updates with focused questions per entity
**Production Deploy**: Backend on Railway, Frontend on Vercel
**Status**: Live at https://gameapy-web.vercel.app

### What's Working (Backend)
- **Card System**: self_cards, character_cards, world_events with pin/auto-update toggles
- **Card Generator**: Plain text → structured JSON (with fallback)
- **Pin System**: "Keep this in mind" cards always load in context
- **Auto-Update System**: Targeted per-card updates with separate LLM call per entity (self, character, world events)
- **Context Assembly**: Self + pinned + current + recent cards → prose for LLM
- **Streaming Chat**: SSE real-time responses with metadata
- **Evolution Features**: Personalities, Table, Universal Cards, Wildcards, Friends, Trading, Notifications, Images
- **Group Sessions**: Multi-user chat with friends, invite codes, WebSocket support
- **Auth System**: Login/register with JWT tokens
- **Schema Migrations**: Auto-apply on startup (001-026)

### What's Working (Frontend - Web MVP)
- **Phase 0 Complete**: React + Vite + TypeScript project initialized
- **Phase 1 Complete**: Personality selection screen
- **Phase 2 Complete**: Chat interface with real backend integration
- **Phase 3 Complete**: Card inventory modal with tabs, search, pin/auto-update
- **Phase 4 Complete**: Card detail view and inline editing with validation
- **Phase 5 Complete**: Polish & mobile optimization with animations and touch targets
- **Phase 6 Complete**: Testing, bug fixes, and Vercel deployment
- **Production Deploy**: https://gameapy-web.vercel.app
- **Game Table**: 3-slot table UI (center, far_left, far_right)
- **Card Hand**: Draggable cards at bottom of screen
- **Wildcard Button**: Draw random conversation prompts
- **Friends Screen**: Add/accept/decline friends
- **Notification Badge**: Unread count indicator
- **Login/Register Screens**: Auth with JWT tokens
- **Group Join Modal**: Join group sessions via invite code
- **Streaming Chat**: SSE-based real-time chat with smooth text rendering
- **Mobile Optimized**: WCAG-compliant touch targets, responsive layouts

---

## Project Vision

**Gameapy** is infrastructure for being known - an AI relationship that evolves with depth based on what you share.

Core philosophy:
1. **Cards Support Chat** (not vice versa) - Memory serves conversation
2. **Transparency Without Friction** - View/edit anytime, updates invisible
3. **User Sovereignty** - Per-card auto-update toggles, explicit consent for creation
4. **Organic Growth** - No forced phases, conversation follows user's lead

---

## Documentation Structure

### Core Documentation (ALWAYS KEEP UP TO DATE)

| File | Purpose | Audience | When to Update |
|------|---------|-----------|-----------------|
| **AGENTS.md** | LLM-optimized high-level overview | AI Agents (you!) | After each phase completion |
| **TECHNICAL.md** | Detailed technical breakdown | Developers | After each phase completion |
| **README.md** | Project overview for GitHub | Public/Users | Before GitHub release |
| **FLUTTER_UI_DEVELOPMENT_PLAN.md** | Flutter implementation plan | Mobile Developers | After Flutter development starts |

### Backend Documentation

| File | Purpose | Status |
|------|---------|--------|
| **API_EXAMPLES.md** | cURL examples for all API endpoints | Current, accurate |
| **SETUP.md** | Backend setup and installation guide | Current, accurate |

### Frontend Documentation

| File | Purpose | Status |
|------|---------|--------|
| **WEB_MVP_DEVELOPMENT_PLAN.md** | Web MVP implementation plan (6 phases, 15-20 hours) | Complete |
| **FLUTTER_UI_DEVELOPMENT_PLAN.md** | Flutter implementation plan (ARCHIVED - replaced by web MVP) | Historical reference |

### Historical/Archive Documentation

| File | Purpose | When Created |
|------|---------|--------------|
| **PIVOT_IMPLEMENTATION_COMPLETE.md** | Documents v3.0 → v3.1 pivot (removal of canon law, 3-phase onboarding) | 2026-02-08 |
| **PHASE7_TEST_FIXES_SUMMARY.md** | Documents journey to 100% test pass rate | 2026-02-08 |
| **TEST_INFRASTRUCTURE_COMPLETE.md** | Initial pytest infrastructure setup | 2026-02-08 |

---

## Documentation Update Guidelines

### ✅ When Completing a Phase

**DO NOT**: Create new markdown files (e.g., PHASE8_COMPLETION.md)

**DO**: Update existing documentation:
1. **AGENTS.md**: Update "Current Status", "Phase Status", add to "Critical Files"
2. **TECHNICAL.md**: Update "Completed Features" section, add new API endpoints
3. **README.md**: Update "Current Status" section, add to "Roadmap"

### 📋 Documentation Update Checklist

After completing any phase:

- [ ] Update AGENTS.md Phase Status table
- [ ] Update TECHNICAL.md with new features/APIs
- [ ] Update README.md status and roadmap
- [ ] Add any new critical files to AGENTS.md
- [ ] Test that all documentation is consistent

---

## Tech Stack

```
Backend: Python 3.11+, FastAPI
Database: PostgreSQL (keyword-only search, no embeddings)
LLM: OpenRouter API (Claude, GPT, etc.)

Frontend (Web MVP): React 19.2.0+, Vite 7.2.4+, TypeScript 5.9.3+, Tailwind CSS 4.1.18+
Mobile (Planned): Flutter (ARCHIVED - replaced by web MVP)
```

---

## Architecture

```
React Web App (Vite, Mobile-Optimized)
    ↓
FastAPI Backend
    ├─ Cards API (/api/v1/cards/*)
    ├─ Chat API (/api/v1/chat/*)
    ├─ Personalities API (/api/v1/personalities/*)
    ├─ Table API (/api/v1/table/*)
    ├─ Universal Cards API (/api/v1/universal-cards/*)
    ├─ Wildcards API (/api/v1/wildcards/*)
    ├─ Friends API (/api/v1/friends/*)
    ├─ Trading API (/api/v1/trading/*)
    ├─ Notifications API (/api/v1/notifications/*)
    ├─ Images API (/api/v1/images/*)
    ├─ Groups API (/api/v1/groups/*)
    ├─ Auth API (/auth/*)
    └─ Session Analyzer (/api/v1/sessions/{id}/analyze, /api/v1/sessions/{id}/targeted-updates)
    ↓
PostgreSQL Database
    ├─ self_cards, character_cards, world_events
    ├─ counselor_profiles (includes is_default, is_custom)
    ├─ universal_cards, card_hands, table_states
    ├─ wildcard_topics
    ├─ friendships, card_trades, traded_cards
    ├─ notifications
    ├─ group_sessions, group_messages
    └─ entity_mentions, sessions, messages
```

### Navigation Flow
```
Counselor Selection → Chat Screen
                        ↓
                Settings Button (⚙️) → Card Inventory Modal
                                            ↓
                        Self | Character | World Tabs
                                            ↓
                                    Card List → Card Detail (Edit Mode)

Chat Screen Header (counselor name) → CounselorInfoModal
```

---

## Key Design Patterns

### API Response Pattern
```python
class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None
```

### Database Pattern
Use context manager for connections:
```python
with self._get_connection() as conn:
    cursor = conn.execute("SELECT * FROM table WHERE id = ?", (id,))
    return dict(cursor.fetchone())
```

### LLM Integration
```python
response = await simple_llm_client.chat_completion(
    messages=messages,
    model="anthropic/claude-3-haiku",
    temperature=0.7
)
```

---

## Phase Status

| Phase | Status | Key Deliverables |
|-------|--------|------------------|
| 1 | ✅ | Personalities (renamed), Snow default, is_default flag |
| 2 | ✅ | Card Hand, Table UI, Universal Cards |
| 3 | ✅ | Roleplay Mode, Card Playing Mechanics |
| 4 | ✅ | Wildcards (30 prompts in 4 categories) |
| 5 | ✅ | Friends System, Card Trading, Notifications |
| 6 | ✅ | Image Generation (avatars, card visuals) |

### Frontend Phases (Web MVP)

| Phase | Status | Key Deliverables |
|-------|--------|------------------|
| | 0 | ✅ | Project Setup (React + Vite + Tailwind, GBA colors, VT323 font) |
| | 1 | ✅ | Personality Selection Screen |
| | 2 | ✅ | Chat Interface (UI complete, backend integration complete) |
| | 3 | ✅ | Card Inventory Modal (tabs, search, card list, pin/auto-update) |
| | 4 | ✅ | Card Editing (detail view, inline editing, validation) |
| | 5 | ✅ | Polish & Mobile Optimization (responsive, loading states, animations) |
| | 6 | ✅ | Testing, Bug Fixes, Vercel Deployment (production live) |

---

## Critical Files

### Frontend Core (Web MVP)

| File | Purpose |
|------|---------|
| `src/App.tsx` | Root component with routing |
| `src/contexts/AppContext.tsx` | Global state |
| `src/contexts/TableContext.tsx` | Table state management |
| `src/services/api.ts` | HTTP client |
| `src/screens/MainScreen.tsx` | Main personality selection |
| `src/screens/ChatScreen.tsx` | Chat with table integration |
| `src/screens/FriendsScreen.tsx` | Friends management |
| `src/screens/LoginScreen.tsx` | Login/register UI |
| `src/components/table/GameTable.tsx` | 3-slot table UI |
| `src/components/table/TableSlot.tsx` | Individual slot |
| `src/components/cards/CardHand.tsx` | Draggable card hand |
| `src/components/cards/WildcardButton.tsx` | Draw wildcard |
| `src/components/groups/GroupJoinModal.tsx` | Join group via invite code |

---

## Important Constraints

1. **Evolution, Not Replacement**: Extend tables, never drop
2. **Invisible Auto-Updates**: No approval workflow
3. **Per-Card Toggle**: Users can freeze specific cards
4. **Conflict Resolution**: AI never overwrites user edits (skips updates)
5. **Full Cards v1**: Claude/GPT have 100k+ context (no capsules)
6. **Simplified World Events**: NeuralRP-style (key_array, is_canon_law)
7. **Keyword-Based Entity Detection**: No embeddings, simple and fast
8. **Documentation Updates**: Update AGENTS.md and TECHNICAL.md, never create new phase summary files
9. **Persona Structure**: Personas use non-therapeutic field names (who_you_are, your_vibe, your_worldview). DB columns (specialization, therapeutic_style, credentials) are repurposed for compatibility. Core truths in `core_truths.py` apply universally.

---

## API Endpoints Reference

**Personalities** (`/api/v1/personalities`):
- `GET /` - List all personalities
- `GET /default` - Get Snow (default personality)
- `POST /` - Create custom personality
- `GET /{id}` - Get personality
- `PUT /{id}` - Update personality
- `DELETE /{id}` - Soft delete

**Cards** (`/api/v1/cards`):
- `POST /generate-from-text` - Generate from plain text
- `POST /save` - Save to database
- `PUT /{card_type}/{id}` - Partial update
- `PUT /{card_type}/{id}/pin` - Pin card
- `PUT /{card_type}/{id}/unpin` - Unpin card
- `PUT /{card_type}/{id}/toggle-auto-update` - Toggle auto-update
- `GET /search` - Search across types
- `DELETE /{card_type}/{id}` - Delete card

**Table** (`/api/v1/table`):
- `POST /play` - Play card to slot
- `POST /remove` - Remove card from slot
- `POST /clear` - Clear all cards
- `GET /state/{session_id}` - Get table state

**Friends** (`/api/v1/friends`):
- `POST /request/{username}` - Send friend request
- `POST /accept/{requester_id}` - Accept request
- `POST /decline/{requester_id}` - Decline request
- `GET /` - List friends
- `GET /pending` - Pending requests

**Chat** (`/api/v1/chat`):
- `POST /chat` - SSE streaming response with table context

**Groups** (`/api/v1/groups`):
- `POST /create` - Create group session with friend
- `POST /join/{invite_code}` - Join via invite code
- `GET /active` - Get user's active group session
- `GET /{group_id}` - Get group session details
- `POST /{group_id}/leave` - Leave group session
- `GET /{group_id}/messages` - Get group messages
- `POST /chat` - Group chat with SSE streaming

**Auth** (`/auth`):
- `POST /login` - Login with username/password
- `POST /register` - Register new user
- `GET /me` - Get current user info

---

## Color Palette (GBA-Style)

```
Background: #E8D0A0 (warm off-white)
Grass: #88C070 (bright lime)
Borders: #306850 (forest green)
UI Background: #F8F0D8 (cream)
Highlight: #F8D878 (yellow)
Text: #483018 (dark brown)
```

---

## Quick Start

```bash
npm install
npm run dev
```

---

## Deployment

### Production URLs
- **Frontend**: https://gameapy-web.vercel.app
- **Backend**: https://gameapy-backend-production.up.railway.app

### Vercel Configuration
- Build: `npm run build`
- Output: `dist/`
- Framework: Vite
- Environment Variable: `VITE_API_BASE_URL=https://gameapy-backend-production.up.railway.app`
- SPA Rewrites: All routes redirect to `index.html` for client-side routing
- Auto-deploy on push to `main` branch

---

**Questions?** Check root `AGENTS.md` for comprehensive documentation.
