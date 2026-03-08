// Export all v0 types
export * from './simpod';

// Transcription Result (service-specific type)
export interface TranscriptionResult {
  text: string;
  words: Array<{ word: string; start: number; end: number }>;
}
