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
 *
 * 优化：精确估算起始字节，减少下载量
 * - 从 startTime 对应的字节开始下载，而非从 0 开始
 * - 加 10s buffer 保证解码帧对齐
 * - 对于 400s 处的热区，只需下载约 20s 的数据而非 400s
 */
export const sliceRemoteAudio = async (url: string, startTime: number, endTime: number): Promise<Blob> => {
    // 动态估算比特率（默认 128kbps = 16KB/s，常见播客格式）
    const BITRATE_ESTIMATE = 16 * 1024; // 16KB/s (128kbps)
    const BUFFER_SECONDS = 15; // 前后各加 15s buffer 保证帧对齐

    // 精确计算字节范围：从 startTime 前 BUFFER_SECONDS 开始
    const startByte = Math.max(0, Math.floor((startTime - BUFFER_SECONDS) * BITRATE_ESTIMATE));
    const endByte = Math.floor((endTime + BUFFER_SECONDS) * BITRATE_ESTIMATE);

    const proxyUrl = `/api/audio-proxy?url=${encodeURIComponent(url)}`;

    console.log(`[RemoteSlice] Fetching bytes ${startByte}-${endByte} (${((endByte - startByte) / 1024).toFixed(0)}KB) from ${url} via /api/audio-proxy...`);
    console.log(`[RemoteSlice] Time range: ${startTime.toFixed(1)}s - ${endTime.toFixed(1)}s, buffer: ±${BUFFER_SECONDS}s`);

    let audioContext: AudioContext | null = null;

    try {
        // startByte=0 时某些服务器对 Range: bytes=0-N 返回空，改为不带偏移直接请求
        const fetchHeaders: HeadersInit = { 'Range': `bytes=${startByte}-${endByte}` }

        const response = await fetch(proxyUrl, { headers: fetchHeaders });

        console.log(`[RemoteSlice] Response status: ${response.status}`);
        if (response.status === 206) {
             const contentRange = response.headers.get('Content-Range');
             console.log(`[RemoteSlice] Partial Content received. Range: ${contentRange}`);
        } else if (response.status === 200) {
             console.warn(`[RemoteSlice] Server returned 200 OK (Full File). Server doesn't support Range requests.`);
        } else {
             throw new Error(`Proxy Fetch failed: ${response.status} ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        console.log(`[RemoteSlice] Downloaded ${(arrayBuffer.byteLength / 1024).toFixed(0)}KB.`);

        if (arrayBuffer.byteLength === 0) {
          throw new Error(`Audio proxy returned empty response (status: ${response.status}, url: ${url.slice(0, 80)})`)
        }

        // 在 decodeAudioData 之前保存 byteLength（decode 后 ArrayBuffer 被 transfer，byteLength 变 0）
        const downloadedBytes = arrayBuffer.byteLength

        // 从对象池获取 AudioContext
        const pool = getAudioContextPool();
        audioContext = pool.getContext();

        // Decode — browser handles partial MP3 frames gracefully
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        console.log(`[RemoteSlice] Decoded audio duration: ${audioBuffer.duration.toFixed(2)}s`);

        // 计算相对时间偏移（因为我们从 startByte 开始，不是从 0 开始）
        // 关键修复：从解码后的实际 duration 反推真实比特率，避免固定 BITRATE_ESTIMATE 导致偏移错误
        // 注意：decodeAudioData 会 transfer ArrayBuffer，之后 byteLength=0，所以用预先保存的 downloadedBytes
        const actualDuration = audioBuffer.duration
        const actualBitrate = actualDuration > 0
          ? downloadedBytes / actualDuration
          : BITRATE_ESTIMATE
        const timeOffset = startByte / actualBitrate
        const relativeStart = Math.max(0, startTime - timeOffset)
        const relativeEnd = Math.min(audioBuffer.duration, endTime - timeOffset)

        console.log(`[RemoteSlice] Actual bitrate: ${(actualBitrate / 1024).toFixed(1)}KB/s, timeOffset: ${timeOffset.toFixed(2)}s`)
        console.log(`[RemoteSlice] Slicing: relative ${relativeStart.toFixed(2)}s - ${relativeEnd.toFixed(2)}s from decoded buffer`)

        if (relativeEnd <= relativeStart) {
          throw new Error(`Invalid relative time range: ${relativeStart.toFixed(2)}s - ${relativeEnd.toFixed(2)}s (decoded duration: ${actualDuration.toFixed(2)}s, timeOffset: ${timeOffset.toFixed(2)}s)`)
        }

        // Slice to the exact requested time
        const result = sliceAudioBuffer(audioBuffer, relativeStart, relativeEnd, audioContext);

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
