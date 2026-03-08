# Simpo-v2 Migration Checklist

This checklist tracks the migration of core assets from legacy Simpod project to Simpo-v2.

---

## Overview

**Goal:** Carry forward to "brain" (core logic, database schema) while replacing to "nervous system" (build tooling, API routes, deployment) and "skin" (UI, styling).

**Legacy Project:** `c:\Users\17069\Documents\trae_projects\Simpod`
**v2 Project:** `E:\vibe-coding projects\Simpo-v2`

---

## Phase 1: Direct Copy Files

### 1.1 Environment Variables

| File | Destination | Status | Notes |
|------|-------------|--------|-------|
| `.env` | Copy to `E:\vibe-coding projects\Simpo-v2\.env` | ✅ | Contains all API keys |

**Environment Variables Included:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `GROQ_API_KEY` (or `VITE_OPENAI_API_KEY`)
- `PODCAST_INDEX_KEY`
- `PODCAST_INDEX_SECRET`

**Action:** ✅ Already copied to `E:\vibe-coding projects\Simpo-v2\.env`

---

### 1.2 Database Migrations

| File | Destination | Status | Notes |
|------|-------------|--------|-------|
| `supabase/migrations/20250227000000_create_tables.sql` | Copy to `E:\vibe-coding projects\Simpo-v2\supabase\migrations\` | ✅ | Creates anchors, hotzones tables |
| `supabase/migrations/20260301000000_create_transcripts_table.sql` | Copy to `E:\vibe-coding projects\Simpo-v2\supabase\migrations\` | ✅ | Creates transcripts table |

**Action:** ✅ Already copied to `E:\vibe-coding projects\Simpo-v2\supabase\migrations\`

**Post-Copy:** ⚠️ Run migrations on new Supabase project (see Phase 6).

---

## Phase 2: Core Logic Refactoring

### 2.1 Groq Service

| Source | Destination | Status | Notes |
|--------|-------------|--------|-------|
| `src/lib/groqService.ts` | `E:\vibe-coding projects\Simpo-v2\src\services\groq.ts` | ✅ | Adapted for new framework |

**Functions Migrated:**
- `transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult>`

**Changes Needed:**
- Update import paths if needed
- Adapt to new framework API routes

---

### 2.2 Supabase Operations

| Source | Destination | Status | Notes |
|--------|-------------|--------|-------|
| `src/lib/api.ts` (Supabase functions only) | `E:\vibe-coding projects\Simpo-v2\src\services\supabase.ts` | ✅ | Extract DB operations |

**Functions Migrated:**
- `saveHotzone(hotzone: Hotzone): Promise<Hotzone>`
- `fetchHotzones(audioId: string): Promise<Hotzone[]>`
- `findExistingTranscript(audioId, startTime, endTime): Promise<TranscriptSegment | null>`
- `saveTranscript(audioId, startTime, endTime, text, words): Promise<void>`

**Functions NOT to Migrate (reimplement in UI):**
- `searchPodcasts()` - Client-side logic
- `fetchRSS()` - Client-side logic

**Changes Needed:**
- Keep Supabase client setup pattern
- Maintain schema compatibility (transcript_words in metadata)

---

### 2.3 Audio Utilities

| Source | Destination | Status | Notes |
|--------|-------------|--------|-------|
| `src/utils/audioUtils.ts` | `E:\vibe-coding projects\Simpo-v2\src\utils\audio.ts` | ✅ | Keep as-is |

**Functions Migrated:**
- `sliceRemoteAudio(url, startTime, endTime): Promise<Blob>`
- `sliceAudio(file, startTime, endTime): Promise<Blob>`
- `sliceAudioBuffer(audioBuffer, startTime, endTime, audioContext): Promise<Blob>`
- `bufferToWav(buffer): Blob` (helper)

**Changes Needed:**
- None (pure browser functions)

---

### 2.4 Hotzone Pipeline

| Source | Destination | Status | Notes |
|--------|-------------|--------|-------|
| `src/utils/hotzonePipeline.ts` | `E:\vibe-coding projects\Simpo-v2\src\services\hotzone.ts` | ✅ | Keep business logic |

**Functions Migrated:**
- `generateHotzoneFromAnchor(anchor, transcript): Hotzone`
- `processAnchorsToHotzones(anchors, transcript, audioFile, audioUrl, transcriptInfo, existingHotzones): Promise<Hotzone[]>`

**Changes Needed:**
- Update import paths for audio utils and API functions

---

### 2.5 Supabase Client Setup

| Source | Destination | Status | Notes |
|--------|-------------|--------|-------|
| `src/lib/supabase.ts` | `E:\vibe-coding projects\Simpo-v2\src\lib\supabase.ts` | ✅ | Keep pattern |

**Changes Needed:**
- Update environment variable access (Next.js uses `process.env` not `import.meta.env`)

---

## Phase 3: API Patterns (Reimplement, Don't Copy)

### 3.1 Groq Proxy Pattern

**Legacy:** `api/groq-proxy.ts`

**v2 Implementation:** Reimplement in new framework (Next.js API route or similar)

**Key Pattern:**
- CORS headers
- Bearer token authentication
- FormData streaming (pipe req → upstream)

---

### 3.2 Audio Proxy Pattern

**Legacy:** `api/audio-proxy.ts`

**v2 Implementation:** Reimplement in new framework

**Key Pattern:**
- CORS headers
- Range request handling
- Redirect following (up to 5)
- Header forwarding (content-type, content-range, etc.)
- Streaming response

---

### 3.3 Podcast Search Proxy Pattern

**Legacy:** `api/podcast-search.ts`

**v2 Implementation:** Reimplement in new framework

**Key Pattern:**
- HMAC SHA1 authentication
- Query parameter handling
- Error handling

---

### 3.4 RSS Proxy Pattern

**Legacy:** `api/rss-proxy.ts`

**v2 Implementation:** Reimplement in new framework

**Key Pattern:**
- Basic CORS proxy
- Query parameter forwarding

---

## Phase 4: Documentation Copy

| File | Destination | Status | Notes |
|------|-------------|--------|-------|
| `architecture.md` | Copy to `E:\vibe-coding projects\Simpo-v2\` | ✅ | Technical documentation |
| `CLAUDE.md` | Copy to `E:\vibe-coding projects\Simpo-v2\` | ✅ | Developer guide |
| `MIGRATION_CHECKLIST.md` | Copy to `E:\vibe-coding projects\Simpo-v2\` | ✅ | This checklist |

**Action:** ✅ All documentation files already copied.

---

## Phase 5: What NOT to Copy

### UI Components (Replace Entirely)

| Path | Reason |
|------|--------|
| `src/components/` | "Skin" - completely redesigning |
| All React components | New UI framework/approach |

---

### Build Configuration (Replace)

| File | Reason |
|------|--------|
| `vite.config.ts` | New build tooling |
| `tsconfig.json` | May need updates |
| `package.json` | Different dependencies |
| `tailwind.config.js` | May adopt different styling |

---

### State Management (Replace)

| File | Reason |
|------|--------|
| Any Zustand stores | New state management approach |
| Context providers | New approach |

---

### PWA Configuration (Replace)

| File | Reason |
|------|--------|
| PWA config files | New deployment approach |
| Service worker files | New deployment approach |

---

## Phase 6: Post-Migration Actions

### 6.1 Database Setup

⚠️ **ACTION REQUIRED:** Create new Supabase project and run migrations.

**Steps:**
1. Visit https://supabase.com/
2. Click "New Project"
3. Fill in project info:
   - Name: `Simpo-v2`
   - Database Password: (remember this!)
   - Region: Southeast Asia (or closest to you)
4. Wait for project to be created (1-2 minutes)
5. Go to SQL Editor
6. Run these migrations:
   - [ ] `supabase/migrations/20250227000000_create_tables.sql`
   - [ ] `supabase/migrations/20260301000000_create_transcripts_table.sql`
7. Go to Table Editor to verify:
   - [ ] `anchors` table exists
   - [ ] `hotzones` table exists
   - [ ] `transcripts` table exists
8. Get API credentials from Settings > API:
   - [ ] Copy Project URL
   - [ ] Copy anon key
   - [ ] Update `.env` file with new credentials

---

### 6.2 Environment Setup

- [ ] ✅ `.env` file copied
- [ ] ⚠️ Update `VITE_SUPABASE_URL` with new project URL
- [ ] ⚠️ Update `VITE_SUPABASE_ANON_KEY` with new anon key
- [ ] ✅ Verify other API keys are present:
  - [ ] `GROQ_API_KEY`
  - [ ] `PODCAST_INDEX_KEY`
  - [ ] `PODCAST_INDEX_SECRET`

**API Keys Status:**
- [ ] Groq API: ✅ (using legacy key)
- [ ] Podcast Index: ✅ (using legacy keys)
- [ ] Supabase: ⚠️ (need to create new project and update)

---

### 6.3 Core Logic Testing

⚠️ **ACTION REQUIRED:** Test after database setup.

- [ ] Test audio slicing:
  - [ ] Local files
  - [ ] Remote URLs (requires API proxy implementation)
- [ ] Test Groq transcription (requires API proxy implementation)
- [ ] Test transcript caching
- [ ] Test hotzone generation
- [ ] Test hotzone extension

---

### 6.4 Integration Testing

⚠️ **ACTION REQUIRED:** Test after API implementation.

- [ ] Test podcast search flow (requires API implementation)
- [ ] Test RSS parsing (requires API implementation)
- [ ] Test anchor → hotzone flow
- [ ] Test transcript caching
- [ ] Test hotzone merge

---

## Summary of Files to Carry Forward

### ✅ Direct Copy (Complete)
- [x] `.env` - ✅ Copied to `E:\vibe-coding projects\Simpo-v2\.env`
- [x] `supabase/migrations/` - ✅ Copied to `E:\vibe-coding projects\Simpo-v2\supabase\migrations\`

### ✅ Refactor and Copy (Complete)
- [x] `src/lib/groqService.ts` → `src/services/groq.ts` - ✅ Copied
- [x] `src/lib/api.ts` (Supabase functions) → `src/services/supabase.ts` - ✅ Copied
- [x] `src/utils/audioUtils.ts` → `src/utils/audio.ts` - ✅ Copied
- [x] `src/utils/hotzonePipeline.ts` → `src/services/hotzone.ts` - ✅ Copied
- [x] `src/lib/supabase.ts` → `src/lib/supabase.ts` - ✅ Copied

### ✅ Documentation (Complete)
- [x] `architecture.md` - ✅ Copied
- [x] `CLAUDE.md` - ✅ Copied
- [x] `MIGRATION_CHECKLIST.md` - ✅ Copied

---

## Architecture Decisions to Preserve

- [x] Database schema (anchors, hotzones, transcripts tables) - ✅ Migrations copied
- [x] Transcription caching pattern - ✅ In code
- [x] Hotzone extension logic - ✅ In code
- [x] Audio slicing with headers - ✅ In code
- [x] Hybrid podcast search (Podcast Index + iTunes) - ⚠️ Need to implement UI
- [x] Web Audio API for audio processing - ✅ In code

---

## Critical File Reference

### Database
- `supabase/migrations/20250227000000_create_tables.sql` - ✅ Copied
- `supabase/migrations/20260301000000_create_transcripts_table.sql` - ✅ Copied

### Core Logic (✅ Copied to v2)
- `src/services/groq.ts` - Groq API integration
- `src/services/supabase.ts` - Database operations
- `src/services/hotzone.ts` - Hotzone processing
- `src/utils/audio.ts` - Audio slicing
- `src/lib/supabase.ts` - Supabase client

### Documentation (✅ Copied to v2)
- `architecture.md` - Technical documentation
- `CLAUDE.md` - Developer guide

---

## Environment Variables Required

```bash
# Supabase (⚠️ Need to create new project and update)
VITE_SUPABASE_URL=https://your-new-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-new-anon-key

# Groq (✅ Using legacy key)
GROQ_API_KEY=your-groq-api-key

# Podcast Index (✅ Using legacy keys)
PODCAST_INDEX_KEY=your-podcast-index-key
PODCAST_INDEX_SECRET=your-podcast-index-secret
```

---

## Migration Status

| Phase | Status |
|-------|--------|
| Phase 1: Direct Copy | ✅ Complete |
| Phase 2: Core Logic Refactoring | ✅ Complete |
| Phase 3: API Patterns | ⚠️ Pending (requires new framework) |
| Phase 4: Documentation | ✅ Complete |
| Phase 5: (Nothing to do) | ✅ N/A |
| Phase 6: Testing | ⚠️ Pending (requires database setup) |

---

## Next Steps for You

### 1. Create New Supabase Project (Required)

1. Go to https://supabase.com/
2. Create a new project named "Simpo-v2"
3. Wait for it to be ready
4. Run the two migration files from `supabase/migrations/`
5. Get the new Project URL and anon key from Settings > API
6. Update `.env` file with these new values

### 2. Choose Your v2 Framework

Which framework will you use for v2?
- Next.js? (Recommended)
- Remix?
- Nuxt?
- SvelteKit?
- Other?

### 3. Implement API Patterns

Based on your chosen framework, reimplement:
- Groq proxy (`/api/groq-proxy`)
- Audio proxy (`/api/audio-proxy`)
- Podcast search proxy (`/api/podcast-search`)
- RSS proxy (`/api/rss-proxy`)

### 4. Build UI

When ready to start building, reference:
- `architecture.md` - For technical understanding
- `CLAUDE.md` - For development guidance

---

## Migration Timeline

| Task | Estimated Time | Status |
|------|----------------|--------|
| Direct copy files | 15 minutes | ✅ Done |
| Core logic refactoring | 2-3 hours | ✅ Done |
| API pattern reimplementation | 2-3 hours | ⚠️ Pending |
| Documentation | 5 minutes | ✅ Done |
| Database setup | 30 minutes | ⚠️ Pending |
| Testing | 1-2 hours | ⚠️ Pending |
| **Total** | **5-8 hours** | ⚠️ ~4 hours done, 3-4 hours remaining |

---

## Questions for Next Phase

- [ ] What framework for v2? (Next.js, Remix, etc.)
- [ ] What state management approach? (Zustand, Redux, Context, etc.)
- [ ] What deployment platform? (Vercel, Netlify, etc.)
- [ ] Any new features planned that require schema changes?

---

**Last Updated:** 2026-03-07
**Migration Checklist Version:** 1.0
