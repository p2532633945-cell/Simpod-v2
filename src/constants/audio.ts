/**
 * Audio URL Constants
 *
 * Priority order for audio sources:
 * 1. Remote public audio (most reliable for development)
 * 2. Local files (if available)
 * 3. Proxy URLs (for CORS handling)
 */

// Reliable remote audio sources (highest priority for dev)
export const REMOTE_DEMO_AUDIO_URLS = [
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",  // ~6 min test audio
  "https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3",
  "https://archive.org/download/testmp3/testfile.mp3",
]

// Local demo audio (optional, if file exists)
export const LOCAL_DEMO_AUDIO = "/audio/demo.mp3"

// Combined list with priority order - remote first
export const DEMO_AUDIO_URLS = [
  ...REMOTE_DEMO_AUDIO_URLS,
  LOCAL_DEMO_AUDIO,
]

// Default to remote audio for reliable playback
export const DEFAULT_AUDIO_URL = REMOTE_DEMO_AUDIO_URLS[0]
