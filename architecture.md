# Simpod Architecture Documentation

## Overview

Simpod is a podcast learning platform that enables "blind listening anchor placement → AI smart hotzones → batch review". This document captures the core architecture decisions, database schema, data flows, and API patterns that serve as foundation for the application.

---

## Section 1: Database Schema

### Core Tables

#### 1. `anchors` Table
Stores timestamp markers where users want to create highlights.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (PRIMARY KEY) | Unique identifier |
| `audio_id` | TEXT (NOT NULL) | Reference to audio file/episode |
| `timestamp` | FLOAT (NOT NULL) | Time in seconds where anchor is located |
| `source` | TEXT | Either 'manual' or 'auto' |
| `created_at` | TIMESTAMPTZ | Auto-generated timestamp |

**Constraints:**
- `source` must be 'manual' or 'auto'

#### 2. `hotzones` Table
Stores time-based audio segments with transcribed content.

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (PRIMARY KEY) | Unique identifier |
| `audio_id` | TEXT (NOT NULL) | Reference to audio file/episode |
| `start_time` | FLOAT (NOT NULL) | Start time in seconds |
| `end_time` | FLOAT (NOT NULL) | End time in seconds |
| `transcript_snippet` | TEXT | Transcribed text snippet |
| `source` | TEXT | Either 'manual' or 'auto' |
| `metadata` | JSONB | Flexible metadata (see below) |
| `status` | TEXT | 'pending', 'reviewed', or 'archived' |
| `created_at` | TIMESTAMPTZ | Auto-generated timestamp |

**Metadata JSONB Structure:**
```typescript
{
  transcript_words?: Array<{ word: string; start: number; end: number }>,
  confidence?: number,
  difficulty_score?: number,
  user_adjustment_history?: Array<{
    action: string;
    timestamp: string;
  }>
}
```

**Constraints:**
- `source` must be 'manual' or 'auto'
- `status` must be 'pending', 'reviewed', or 'archived'

#### 3. `transcripts` Table
Shared transcription storage to avoid redundant API calls (cost optimization).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PRIMARY KEY) | Auto-generated UUID |
| `audio_id` | TEXT (NOT NULL) | Reference to audio file |
| `start_time` | DOUBLE PRECISION (NOT NULL) | Start time of segment |
| `end_time` | DOUBLE PRECISION (NOT NULL) | End time of segment |
| `text` | TEXT (NOT NULL) | Full transcribed text |
| `words` | JSONB | Word-level timestamps |
| `created_at` | TIMESTAMPTZ | Auto-generated timestamp |

**Words JSONB Structure:**
```typescript
Array<{ word: string; start: number; end: number }>
```

**Constraints:**
- Unique on `(audio_id, start_time, end_time)` to prevent duplicate segments

### Table Relationships (ER Diagram)

```
audio_episodes
    │
    ├── anchors (1:N) - Multiple anchors per audio episode
    │
    ├── hotzones (1:N) - Multiple hotzones per audio episode
    │
    └── transcripts (1:N) - Multiple transcript segments per audio episode
```

**Key Concept:** All tables are linked via `audio_id`, making the system audio-centric rather than user-centric.

### Row Level Security (RLS)

All tables have RLS enabled with public access:

| Table | Operations | Policy |
|-------|------------|--------|
| `anchors` | SELECT, INSERT | Public read and insert |
| `hotzones` | SELECT, INSERT, UPDATE | Public read, insert, update |
| `transcripts` | SELECT, INSERT | Public read and insert |

### Indexes

- `transcripts`: Composite index on `audio_id, start_time, end_time` for efficient range queries
- `hotzones`: Implicit index on `audio_id` for fetching by audio ID
- `anchors`: Implicit index on `audio_id` for fetching by audio ID

---

## Section 2: Core Business Logic

### 2.1 RSS Parsing Flow

**Purpose:** Discover and index podcasts from multiple sources.

**Hybrid Search Pattern:**
1. **Podcast Index API** (server-side via proxy)
   - Endpoint: `https://api.podcastindex.org/api/1.0/search/byterm`
   - Authentication: HMAC SHA1 signature
   - Requires: `PODCAST_INDEX_KEY`, `PODCAST_INDEX_SECRET`

2. **iTunes API** (client-side with CORS proxy fallback)
   - Endpoint: `https://itunes.apple.com/search`
   - Parameters: `media=podcast`, `term=<query>`, `limit=10`
   - Fallback: Uses CORS proxies (allorigins.win, corsproxy.io)

3. **Deduplication**
   - Merge results from both sources
   - Deduplicate by `feedUrl`
   - Cache results to avoid redundant searches

**RSS Feed Fetching:**
1. Try local Vercel Function (`/api/rss-proxy`)
2. Fallback to public CORS proxies (allorigins.win, corsproxy.io)
3. Parse XML using browser's `DOMParser`
4. Extract: title, description, author, artwork, episode list

**Key Functions:**
- `searchPodcasts(term: string)` - Hybrid search with deduplication
- `fetchRSS(url: string)` - Robust RSS fetching with fallbacks

### 2.2 Groq Transcription Pipeline

**Purpose:** Transcribe audio segments with word-level timestamps.

**API Details:**
- Provider: Groq (OpenAI-compatible)
- Model: `whisper-large-v3`
- Endpoint: `https://api.groq.com/openai/v1/audio/transcriptions`
- Response Format: `verbose_json` for timestamps
- Granularity: Word-level (`timestamp_granularities[]=word`)

**Request Format:**
```typescript
const formData = new FormData();
formData.append('file', audioBlob, 'hotzone.wav');
formData.append('model', 'whisper-large-v3');
formData.append('response_format', 'verbose_json');
formData.append('timestamp_granularities[]', 'word');
```

**Response Format:**
```typescript
{
  text: string;
  words: Array<{ word: string; start: number; end: number }>;
}
```

**Transcription Caching Pattern:**
1. Check `transcripts` table for existing match
2. If found with ±1s tolerance, reuse result
3. If not found, call Groq API
4. Save result to `transcripts` for future reuse

**Key Functions:**
- `transcribeAudio(audioBlob: Blob)` - Groq API integration
- `findExistingTranscript(audioId, startTime, endTime)` - Cache lookup
- `saveTranscript(audioId, startTime, endTime, text, words)` - Cache storage

### 2.3 Audio Slicing Mechanism

**Purpose:** Extract precise audio segments for transcription.

**Approach:** Web Audio API for browser-based slicing.

**Process for Remote Audio:**
1. Fetch from byte 0 to `end_byte` (includes headers for proper decoding)
2. Estimate bytes: `bitrate * (end_time + buffer_seconds)`
3. Decode using `AudioContext.decodeAudioData()`
4. Slice to exact time range
5. Re-encode as WAV

**Process for Local Audio:**
1. Read file as ArrayBuffer
2. Decode using `AudioContext.decodeAudioData()`
3. Slice to exact time range
4. Re-encode as WAV

**WAV Re-encoding:**
- 16-bit PCM
- Little-endian byte order
- Proper RIFF/WAVE header structure
- Interleaved multi-channel data

**Key Functions:**
- `sliceRemoteAudio(url, startTime, endTime)` - Slice remote files via proxy
- `sliceAudio(file, startTime, endTime)` - Slice local files
- `bufferToWav(buffer)` - Convert AudioBuffer to WAV Blob

### 2.4 Hotzone Processing Workflow

**Purpose:** Convert anchor points into transcribed audio segments.

**Mechanical Hotzone Generation:**
- Reaction Offset: Shift center point back by 2s (accounts for user reaction time)
- Window: ±10 seconds around adjusted center point
- Formula: `center = max(0, anchor.timestamp - 2)`, `start = center - 10`, `end = center + 10`

**Contextual Alignment (if full transcript available):**
- Expand boundaries to align with sentence breaks
- Find overlapping transcript segments
- Extend to include full sentences

**Hotzone Extension Logic:**
- Detect nearby anchors (within 5s buffer) to existing hotzones
- Calculate extension range needed on left/right
- Transcribe only the diff (new range)
- Merge new text with existing transcript

**Word-Level Refinement:**
- After transcription, use first/last word timestamps to refine boundaries
- "Magnet" effect: Adjust boundaries to actual speech content
- Updates `start_time` and `end_time` to match actual speech

**Merge Overlapping Hotzones:**
- If hotzones overlap (within 2s buffer), merge them
- Combine text and word timestamps
- Adjust boundaries to cover full range

**Key Functions:**
- `generateHotzoneFromAnchor(anchor, transcript)` - Create hotzone from anchor
- `processAnchorsToHotzones(anchors, transcript, audioFile?, audioUrl?, existingHotzones?)` - Full workflow

---

## Section 3: Data Flow Diagrams

### 3.1 Podcast Discovery → Transcription Flow

```
User Input (Search Term)
    ↓
searchPodcasts()
    ├─→ Podcast Index API (server proxy)
    │   └─→ HMAC SHA1 Authentication
    │
    └─→ iTunes API (client)
        └─→ CORS Proxy Fallback
    ↓
Merge & Deduplicate Results
    ↓
User Selects Podcast
    ↓
fetchRSS(feedUrl)
    ├─→ Try /api/rss-proxy
    └─→ Fallback to CORS proxies
    ↓
DOMParser Parse XML
    ↓
Extract Episode List
    ↓
User Selects Episode
    ↓
User Creates Anchor
    ↓
generateHotzoneFromAnchor()
    ↓
sliceRemoteAudio() / sliceAudio()
    ↓
AudioContext.decodeAudioData()
    ↓
bufferToWav()
    ↓
transcribeAudio()
    ↓
Groq Whisper API
    ↓
saveTranscript() (Cache)
    ↓
saveHotzone() (Persist)
```

### 3.2 Anchor → Hotzone → Transcript Flow

```
User Creates Anchor
    ↓
Generate Mechanical Hotzone (±10s, -2s offset)
    ↓
Check Existing Hotzones
    ↓
┌─────────────────────────────────────────┐
│ Is anchor covered by existing hotzone?  │
└─────────────────────────────────────────┘
    │                    │
    YES                  NO
    │                    │
    ↓                    ↓
Skip                 Create New Hotzone
                         ↓
                 ┌───────────────────────┐
                 │ Check transcripts cache │
                 └───────────────────────┘
                         │                    │
                        Found               Not Found
                         │                    │
                         ↓                    ↓
                Reuse Transcript     Call Groq API
                         │                    │
                         └────────────────────┘
                                      ↓
                                Save to Cache
                                      ↓
                                Save Hotzone
```

---

## Section 4: API Patterns

### 4.1 CORS Proxy Pattern

**Purpose:** Proxy external API calls to handle CORS restrictions.

**Standard CORS Headers:**
```typescript
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PATCH, DELETE, PUT');
res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
```

**OPTIONS Handler:**
```typescript
if (req.method === 'OPTIONS') {
  return res.status(200).end();
}
```

### 4.2 Authentication Patterns

#### Bearer Token Authentication (Groq)
```typescript
const apiKey = process.env.GROQ_API_KEY;
const headers = {
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': req.headers['content-type'] || 'multipart/form-data',
};
```

#### HMAC SHA1 Authentication (Podcast Index)
```typescript
const apiKey = process.env.PODCAST_INDEX_KEY;
const apiSecret = process.env.PODCAST_INDEX_SECRET;
const apiHeaderTime = Math.floor(Date.now() / 1000);
const data4Hash = apiKey + apiSecret + apiHeaderTime;
const hash = crypto.createHash('sha1').update(data4Hash).digest('hex');

const headers = {
  'User-Agent': 'Simpod/1.0',
  'X-Auth-Key': apiKey,
  'X-Auth-Date': apiHeaderTime.toString(),
  'Authorization': hash,
};
```

### 4.3 Streaming Response Pattern

**Purpose:** Efficiently forward streaming responses (audio, long API responses).

```typescript
// Pipe upstream response directly to client
const proxyReq = https.request(upstreamUrl, options, (proxyRes) => {
  res.status(proxyRes.statusCode || 200);

  // Forward critical headers
  const forwardHeaders = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'content-encoding', 'content-disposition', 'cache-control', 'last-modified', 'etag'];
  forwardHeaders.forEach(key => {
    const val = proxyRes.headers[key];
    if (val) res.setHeader(key, val);
  });

  // Pipe data
  proxyRes.pipe(res);
});

// Pipe client request to upstream
req.pipe(proxyReq);
```

### 4.4 Error Handling Pattern

```typescript
try {
  // API logic
} catch (error: any) {
  console.error('Error:', error);
  res.status(500).json({ error: error.message || 'Internal Server Error' });
}
```

### 4.5 Header Forwarding Pattern

For audio proxy responses, forward specific headers:
- `content-type` - MIME type
- `content-length` - File size
- `content-range` - For partial content
- `accept-ranges` - Indicates range support
- `content-encoding` - Compression info
- `content-disposition` - Filename info
- `cache-control` - Caching directives
- `last-modified` - Modification time
- `etag` - Entity tag for validation

### 4.6 Range Request Pattern

**Purpose:** Support efficient partial file downloads for audio streaming.

```typescript
// Client sends: Range: bytes=0-1048576
// Server responds with partial content

res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
res.status(206); // Partial Content
```

### 4.7 Redirect Following Pattern

**Purpose:** Handle HTTP redirects (301, 302, 303, 307, 308).

```typescript
const fetchWithRedirects = (url, options, redirectCount = 0) => {
  if (redirectCount > 5) {
    return res.status(502).send('Too many redirects');
  }

  const req = https.request(url, options, (response) => {
    if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
      const location = response.headers['location'];
      const nextUrl = new URL(location, url).toString();
      return fetchWithRedirects(nextUrl, options, redirectCount + 1);
    }
    // Handle response...
  });
};
```

---

## Section 5: Database Schema Compatibility

### Schema Evolution

**Important:** The `transcript_words` field was moved from top-level to `metadata.transcript_words` in the `hotzones` table.

**Current Schema:**
- `transcript_words` is stored in `hotzones.metadata.transcript_words`

**UI Compatibility Layer:**
When fetching hotzones, transform the data:
```typescript
// Pull transcript_words from metadata to top-level for UI
return data.map(hz => {
  if (hz.metadata?.transcript_words) {
    return { ...hz, transcript_words: hz.metadata.transcript_words };
  }
  return hz;
});
```

When saving hotzones:
```typescript
// Move transcript_words to metadata before saving
if (payload.transcript_words) {
  payload.metadata = { ...payload.metadata, transcript_words: payload.transcript_words };
  delete payload.transcript_words;
}
```

---

## Section 6: Key Design Decisions

### 6.1 Audio-Centric Data Model
- All tables reference `audio_id` rather than user_id
- Enables shared transcript caching across all users
- Reduces API costs by reusing transcriptions

### 6.2 Optimistic Concurrency
- Use `upsert` with conflict handling for safe updates
- Avoids race conditions in hotzone extension scenarios

### 6.3 JSONB Flexibility
- `hotzones.metadata` allows adding new attributes without schema changes
- Supports future features like difficulty scoring, user adjustments, etc.

### 6.4 Transcript Caching
- Shared `transcripts` table reduces Groq API costs
- Unique constraint prevents duplicate transcriptions
- ±1 second tolerance for matching cached segments

### 6.5 Web Audio API Over ffmpeg.wasm
- Lighter weight for MVP
- No external binary dependencies
- Sufficient for basic slicing and WAV encoding

---

## Section 7: Dependencies

### External APIs

| Service | Purpose | Key Required |
|---------|---------|--------------|
| Groq | Audio transcription (Whisper) | `GROQ_API_KEY` |
| Podcast Index | Podcast search | `PODCAST_INDEX_KEY`, `PODCAST_INDEX_SECRET` |
| iTunes | Podcast search (fallback) | None (public) |
| Supabase | Database & Auth | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |

### npm Dependencies

| Package | Purpose | Usage |
|---------|---------|-------|
| `@supabase/supabase-js` | Database client | Supabase operations |
| `fast-xml-parser` | XML parsing | RSS feed parsing (backup) |

### Browser APIs

| API | Purpose |
|-----|---------|
| `AudioContext` | Audio decoding and processing |
| `DOMParser` | XML parsing for RSS feeds |
| `fetch` | HTTP requests |
| `crypto` | HMAC SHA1 authentication |

---

## Section 8: Performance Considerations

### 8.1 Audio Slicing
- Fetch from byte 0 includes headers → ensures proper decoding
- Conservative bitrate estimate (32KB/s) prevents under-fetching
- 10-second buffer ensures we get enough data for segment

### 8.2 Transcription Caching
- Check cache before calling Groq API
- ±1 second tolerance for matching cached segments
- Composite index on `(audio_id, start_time, end_time)` for fast lookups

### 8.3 Parallel Processing
- Podcast Index and iTunes searches run in parallel
- Hotzone processing uses `Promise.all` for batch operations

### 8.4 Hotzone Merge
- Merges overlapping hotzones to reduce transcription count
- 2-second buffer for overlap detection

---

## Section 9: Security Considerations

### 9.1 API Keys
- Server-side storage for API keys (Groq, Podcast Index)
- Client-side only has Supabase anon key
- Proxies hide sensitive keys from client

### 9.2 Row Level Security
- Public read access for demo purposes
- Future: Implement user-specific access controls

### 9.3 Input Validation
- Type checking for all API parameters
- Constraint checks in database (source, status enums)

---

## Section 10: Future Enhancements

### 10.1 Database
- Add `users` table for authentication
- Add `audio_episodes` table to track podcast episodes
- Add indexes for performance optimization

### 10.2 Transcription
- Implement transcript stitching for partial matches
- Add support for other transcription providers (OpenAI, Whisper API)

### 10.3 Audio Processing
- Add support for more audio formats (MP3, AAC)
- Implement ffmpeg.wasm for complex audio processing

### 10.4 API
- Add rate limiting
- Implement request caching
- Add monitoring and logging

---

## Appendix A: TypeScript Type Definitions

```typescript
// Core Types
export interface Anchor {
  id: string;
  audio_id: string;
  timestamp: number;
  source: 'manual' | 'auto';
  created_at: string;
}

export interface Hotzone {
  id: string;
  audio_id: string;
  start_time: number;
  end_time: number;
  transcript_snippet?: string;
  transcript_words?: Array<{ word: string; start: number; end: number }>;
  source: 'manual' | 'auto';
  metadata: {
    confidence?: number;
    difficulty_score?: number;
    user_adjustment_history?: Array<{
      action: string;
      timestamp: string;
    }>;
    transcript_words?: Array<{ word: string; start: number; end: number }>;
  };
  status: 'pending' | 'reviewed' | 'archived';
  created_at: string;
}

export interface TranscriptSegment {
  audio_id: string;
  start_time: number;
  end_time: number;
  text: string;
  words?: Array<{ word: string; start: number; end: number }>;
}

export interface TranscriptionResult {
  text: string;
  words: Array<{ word: string; start: number; end: number }>;
}

// Podcast Types
export interface Podcast {
  title: string;
  author: string;
  feedUrl: string;
  artwork: string;
  source?: 'podcastindex' | 'itunes';
}

export interface Episode {
  title: string;
  description: string;
  pubDate: string;
  audioUrl: string;
  transcriptUrl?: string;
  duration?: number;
}
```

---

## Appendix B: SQL Migration Scripts

See `supabase/migrations/` for the complete SQL migration scripts:

1. `20250227000000_create_tables.sql` - Creates `anchors` and `hotzones` tables
2. `20260301000000_create_transcripts_table.sql` - Creates `transcripts` table

---

## Appendix C: API Proxy Reference (Patterns Only)

The following API routes demonstrate patterns to replicate in v2:

| Route | Purpose | Pattern |
|-------|---------|---------|
| `api/groq-proxy.ts` | Proxy Groq Whisper API | FormData streaming, Bearer auth |
| `api/audio-proxy.ts` | Proxy audio files | Range requests, redirect handling |
| `api/podcast-search.ts` | Proxy Podcast Index | HMAC SHA1 auth |
| `api/rss-proxy.ts` | Proxy RSS feeds | Basic CORS proxy |

**Note:** Do not copy these routes directly to v2 - adapt to patterns to your new framework and deployment platform.
