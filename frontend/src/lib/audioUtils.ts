'use client'

import { useRef, useCallback } from 'react'

/**
 * Audio playback utilities for playing PCM audio received from WebSocket
 * Uses scheduled playback for gapless continuous audio stream
 */
export function useAudioPlayback() {
    const audioContextRef = useRef<AudioContext | null>(null)
    const nextPlayTimeRef = useRef<number>(0)
    const isInitializedRef = useRef<boolean>(false)

    const getAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new AudioContext({ sampleRate: 24000 })
            nextPlayTimeRef.current = 0
            isInitializedRef.current = false
        }
        return audioContextRef.current
    }, [])

    const playAudioBuffer = useCallback(async (audioData: ArrayBuffer) => {
        try {
            const audioContext = getAudioContext()

            // Ensure audio context is running
            if (audioContext.state === 'suspended') {
                await audioContext.resume()
            }

            // Convert PCM int16 to float32
            const int16Data = new Int16Array(audioData)
            const float32Data = new Float32Array(int16Data.length)

            for (let i = 0; i < int16Data.length; i++) {
                float32Data[i] = int16Data[i] / 32768.0
            }

            // Create audio buffer
            const audioBuffer = audioContext.createBuffer(1, float32Data.length, 24000)
            audioBuffer.getChannelData(0).set(float32Data)

            // Create source and connect
            const source = audioContext.createBufferSource()
            source.buffer = audioBuffer
            source.connect(audioContext.destination)

            // Calculate when to start playing for gapless playback
            const currentTime = audioContext.currentTime

            // Initialize or reset if we've fallen behind
            if (!isInitializedRef.current || nextPlayTimeRef.current < currentTime) {
                // Add a small buffer for the first chunk (50ms)
                nextPlayTimeRef.current = currentTime + 0.05
                isInitializedRef.current = true
            }

            // Schedule playback at the next available slot
            source.start(nextPlayTimeRef.current)

            // Update next play time for the following chunk
            nextPlayTimeRef.current += audioBuffer.duration

        } catch (error) {
            console.error('Error playing audio:', error)
        }
    }, [getAudioContext])

    const stopPlayback = useCallback(() => {
        if (audioContextRef.current) {
            audioContextRef.current.close()
            audioContextRef.current = null
        }
        nextPlayTimeRef.current = 0
        isInitializedRef.current = false
    }, [])

    return {
        playAudioBuffer,
        stopPlayback
    }
}

/**
 * Convert Float32Array to Int16 PCM
 */
export function float32ToInt16(float32Array: Float32Array): Int16Array {
    const int16Array = new Int16Array(float32Array.length)
    for (let i = 0; i < float32Array.length; i++) {
        const s = Math.max(-1, Math.min(1, float32Array[i]))
        int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
    }
    return int16Array
}

/**
 * Resample audio data to target sample rate
 */
export function resampleAudio(
    audioData: Float32Array,
    fromSampleRate: number,
    toSampleRate: number
): Float32Array {
    if (fromSampleRate === toSampleRate) {
        return audioData
    }

    const ratio = fromSampleRate / toSampleRate
    const newLength = Math.round(audioData.length / ratio)
    const result = new Float32Array(newLength)

    for (let i = 0; i < newLength; i++) {
        const srcIndex = i * ratio
        const srcIndexFloor = Math.floor(srcIndex)
        const srcIndexCeil = Math.min(srcIndexFloor + 1, audioData.length - 1)
        const t = srcIndex - srcIndexFloor

        result[i] = audioData[srcIndexFloor] * (1 - t) + audioData[srcIndexCeil] * t
    }

    return result
}
