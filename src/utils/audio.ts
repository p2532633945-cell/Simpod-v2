/**
 * Slices an audio file (Blob/File) from start time to end time.
 * 
 * 改进：
 * - 使用 AudioContextPool 复用 AudioContext
 * - 自动释放资源
 * - 改进错误处理
 */

import { getAudioContextPool } from '@/lib/audio-context-pool';

/**
 * Fetches a slice of a remote audio file using our custom Vercel Proxy.
 * This handles CORS, Mixed Content, and Range Requests robustly.
 */
export const sliceRemoteAudio = async (url: string, startTime: number, endTime: number): Promise<Blob> => {
    const BITRATE_ESTIMATE = 32 * 1024; // 32KB/s (256kbps)
    const BUFFER_SECONDS = 10;
    const endByte = Math.floor((endTime + BUFFER_SECONDS) * BITRATE_ESTIMATE);

    const proxyUrl = `/api/audio-proxy?url=${encodeURIComponent(url)}`;

    console.log(`[RemoteSlice] Fetching 0-${endByte} bytes from ${url} via /api/audio-proxy...`);

    let audioContext: AudioContext | null = null;

    try {
        const response = await fetch(proxyUrl, {
            headers: {
                'Range': `bytes=0-${endByte}`
            }
        });

        console.log(`[RemoteSlice] Response status: ${response.status}`);
        if (response.status === 206) {
             const contentRange = response.headers.get('Content-Range');
             console.log(`[RemoteSlice] Partial Content received. Range: ${contentRange}`);
        } else if (response.status === 200) {
             console.warn(`[RemoteSlice] Server returned 200 OK (Full File). Downloading potentially large file...`);
        } else {
             throw new Error(`Proxy Fetch failed: ${response.status} ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        console.log(`[RemoteSlice] Downloaded ${arrayBuffer.byteLength} bytes.`);

        // 从对象池获取 AudioContext
        const pool = getAudioContextPool();
        audioContext = pool.getContext();

        // Decode might fail if the file is truncated mid-frame, but usually browsers handle it.
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        console.log(`[RemoteSlice] Decoded audio duration: ${audioBuffer.duration.toFixed(2)}s`);

        // 4. Slice to the exact requested time
        const result = sliceAudioBuffer(audioBuffer, startTime, endTime, audioContext);

        // 释放 AudioContext 回对象池
        pool.releaseContext(audioContext);

        return result;

    } catch (e) {
        // 确保释放资源
        if (audioContext) {
            const pool = getAudioContextPool();
            pool.releaseContext(audioContext);
        }
        console.error("Remote slice failed:", e);
        throw e;
    }
}

export const sliceAudio = async (file: File, startTime: number, endTime: number): Promise<Blob> => {
  const pool = getAudioContextPool();
  const audioContext = pool.getContext();

  try {
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const result = sliceAudioBuffer(audioBuffer, startTime, endTime, audioContext);
    return result;
  } finally {
    // 确保释放资源
    pool.releaseContext(audioContext);
  }
};

const sliceAudioBuffer = async (audioBuffer: AudioBuffer, startTime: number, endTime: number, audioContext: AudioContext): Promise<Blob> => {
  const sampleRate = audioBuffer.sampleRate;
  const startFrame = Math.max(0, Math.floor(startTime * sampleRate));
  const endFrame = Math.min(audioBuffer.length, Math.floor(endTime * sampleRate));
  const frameCount = endFrame - startFrame;

  if (frameCount <= 0) {
    throw new Error("Invalid time range for audio slicing");
  }

  // Create a new buffer for the slice
  const slicedBuffer = audioContext.createBuffer(
    audioBuffer.numberOfChannels,
    frameCount,
    sampleRate
  );

  // Copy data from the original buffer to the new one
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    const slicedData = slicedBuffer.getChannelData(channel);
    slicedData.set(channelData.subarray(startFrame, endFrame));
  }

  // Convert AudioBuffer to WAV Blob
  return bufferToWav(slicedBuffer);
};

// Helper function to convert AudioBuffer to WAV Blob
const bufferToWav = (buffer: AudioBuffer): Blob => {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArr = new ArrayBuffer(length);
  const view = new DataView(bufferArr);
  const channels = [];
  let i;
  let sample;
  let offset = 0;
  let pos = 0;

  // write WAVE header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit (hardcoded in this example)

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  // write interleaved data
  for (i = 0; i < buffer.numberOfChannels; i++)
    channels.push(buffer.getChannelData(i));

  while (pos < buffer.length) {
    for (i = 0; i < numOfChan; i++) {
      // interleave channels
      sample = Math.max(-1, Math.min(1, channels[i][pos])); // clamp
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
      view.setInt16(44 + offset, sample, true); // write 16-bit sample
      offset += 2;
    }
    pos++;
  }

  return new Blob([bufferArr], { type: 'audio/wav' });

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
};
