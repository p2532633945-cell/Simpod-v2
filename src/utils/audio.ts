/**
 * Audio utility functions
 * Slices audio files by time range using Web Audio API
 */

/**
 * Fetches a slice of a remote audio file via the audio proxy.
 */
export const sliceRemoteAudio = async (url: string, startTime: number, endTime: number): Promise<Blob> => {
  const BITRATE_ESTIMATE = 32 * 1024 // 32KB/s
  const BUFFER_SECONDS = 10
  const endByte = Math.floor((endTime + BUFFER_SECONDS) * BITRATE_ESTIMATE)

  const proxyUrl = `/api/audio-proxy?url=${encodeURIComponent(url)}`

  console.log(`[RemoteSlice] Fetching 0-${endByte} bytes from ${url} via /api/audio-proxy`)

  const response = await fetch(proxyUrl, {
    headers: { Range: `bytes=0-${endByte}` },
  })

  console.log(`[RemoteSlice] Response status: ${response.status}`)

  if (!response.ok && response.status !== 206) {
    throw new Error(`Proxy fetch failed: ${response.status} ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  console.log(`[RemoteSlice] Downloaded ${arrayBuffer.byteLength} bytes`)

  const audioContext = new AudioContext()
  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    console.log(`[RemoteSlice] Decoded audio duration: ${audioBuffer.duration.toFixed(2)}s`)
    return sliceAudioBuffer(audioBuffer, startTime, endTime, audioContext)
  } finally {
    await audioContext.close()
  }
}

/**
 * Slices a local audio File by time range.
 */
export const sliceAudio = async (file: File, startTime: number, endTime: number): Promise<Blob> => {
  const audioContext = new AudioContext()
  try {
    const arrayBuffer = await file.arrayBuffer()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    return sliceAudioBuffer(audioBuffer, startTime, endTime, audioContext)
  } finally {
    await audioContext.close()
  }
}

const sliceAudioBuffer = (
  audioBuffer: AudioBuffer,
  startTime: number,
  endTime: number,
  audioContext: AudioContext
): Blob => {
  const sampleRate = audioBuffer.sampleRate
  const startFrame = Math.max(0, Math.floor(startTime * sampleRate))
  const endFrame = Math.min(audioBuffer.length, Math.floor(endTime * sampleRate))
  const frameCount = endFrame - startFrame

  if (frameCount <= 0) {
    throw new Error('Invalid time range for audio slicing')
  }

  const slicedBuffer = audioContext.createBuffer(audioBuffer.numberOfChannels, frameCount, sampleRate)

  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel)
    const slicedData = slicedBuffer.getChannelData(channel)
    slicedData.set(channelData.subarray(startFrame, endFrame))
  }

  return bufferToWav(slicedBuffer)
}

const bufferToWav = (buffer: AudioBuffer): Blob => {
  const numOfChan = buffer.numberOfChannels
  const length = buffer.length * numOfChan * 2 + 44
  const bufferArr = new ArrayBuffer(length)
  const view = new DataView(bufferArr)
  const channels: Float32Array[] = []
  let offset = 0
  let pos = 0

  setUint32(0x46464952) // "RIFF"
  setUint32(length - 8)
  setUint32(0x45564157) // "WAVE"
  setUint32(0x20746d66) // "fmt "
  setUint32(16)
  setUint16(1) // PCM
  setUint16(numOfChan)
  setUint32(buffer.sampleRate)
  setUint32(buffer.sampleRate * 2 * numOfChan)
  setUint16(numOfChan * 2)
  setUint16(16)
  setUint32(0x61746164) // "data"
  setUint32(length - pos - 4)

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i))
  }

  while (pos < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][pos]))
      sample = ((0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0)
      view.setInt16(44 + offset, sample, true)
      offset += 2
    }
    pos++
  }

  return new Blob([bufferArr], { type: 'audio/wav' })

  function setUint16(data: number) {
    view.setUint16(pos, data, true)
    pos += 2
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true)
    pos += 4
  }
}
