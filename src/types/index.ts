// Anchor
export interface Anchor {
  id: string;
  audio_id: string;
  timestamp: number;
  source: 'manual' | 'auto';
  created_at: string;
}

// Hotzone
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

// Transcript
export interface TranscriptSegment {
  audio_id: string;
  start_time: number;
  end_time: number;
  text: string;
  words?: Array<{ word: string; start: number; end: number }>;
}

// Transcription Result
export interface TranscriptionResult {
  text: string;
  words: Array<{ word: string; start: number; end: number }>;
}

// Podcast
export interface Podcast {
  title: string;
  author: string;
  feedUrl: string;
  artwork: string;
  source?: 'podcastindex' | 'itunes';
}

// Episode
export interface Episode {
  title: string;
  description: string;
  pubDate: string;
  audioUrl: string;
  transcriptUrl?: string;
  duration?: number;
}
