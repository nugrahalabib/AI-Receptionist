'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

interface UseAudioCaptureReturn {
    isCapturing: boolean
    audioLevel: number
    startCapture: (onAudioData: (data: ArrayBuffer) => void) => Promise<void>
    stopCapture: () => void
    isMuted: boolean
    toggleMute: () => void
}

export function useAudioCapture(): UseAudioCaptureReturn {
    const [isCapturing, setIsCapturing] = useState(false)
    const [audioLevel, setAudioLevel] = useState(0)
    const [isMuted, setIsMuted] = useState(false)

    const mediaStreamRef = useRef<MediaStream | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const processorRef = useRef<ScriptProcessorNode | null>(null)
    const animationFrameRef = useRef<number | null>(null)
    const onAudioDataRef = useRef<((data: ArrayBuffer) => void) | null>(null)

    const updateAudioLevel = useCallback(() => {
        if (!analyserRef.current) return

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
        analyserRef.current.getByteFrequencyData(dataArray)

        // Calculate average level
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length
        const normalizedLevel = Math.min(1, average / 128)

        setAudioLevel(normalizedLevel)

        animationFrameRef.current = requestAnimationFrame(updateAudioLevel)
    }, [])

    const startCapture = useCallback(async (onAudioData: (data: ArrayBuffer) => void) => {
        try {
            onAudioDataRef.current = onAudioData

            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 16000,
                }
            })

            mediaStreamRef.current = stream

            // Create audio context with correct sample rate
            const audioContext = new AudioContext({ sampleRate: 16000 })
            audioContextRef.current = audioContext

            // Create analyser for visualizations
            const analyser = audioContext.createAnalyser()
            analyser.fftSize = 256
            analyserRef.current = analyser

            // Create source from microphone
            const source = audioContext.createMediaStreamSource(stream)
            source.connect(analyser)

            // Create script processor for raw audio data
            const processor = audioContext.createScriptProcessor(4096, 1, 1)
            processorRef.current = processor

            processor.onaudioprocess = (e) => {
                if (isMuted || !onAudioDataRef.current) return

                const inputData = e.inputBuffer.getChannelData(0)

                // Convert float32 to int16 PCM
                const pcmData = new Int16Array(inputData.length)
                for (let i = 0; i < inputData.length; i++) {
                    const s = Math.max(-1, Math.min(1, inputData[i]))
                    pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
                }

                onAudioDataRef.current(pcmData.buffer)
            }

            source.connect(processor)
            processor.connect(audioContext.destination)

            setIsCapturing(true)
            updateAudioLevel()

        } catch (error) {
            console.error('Error starting audio capture:', error)
            throw error
        }
    }, [isMuted, updateAudioLevel])

    const stopCapture = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
            animationFrameRef.current = null
        }

        if (processorRef.current) {
            processorRef.current.disconnect()
            processorRef.current = null
        }

        if (audioContextRef.current) {
            audioContextRef.current.close()
            audioContextRef.current = null
        }

        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop())
            mediaStreamRef.current = null
        }

        analyserRef.current = null
        onAudioDataRef.current = null

        setIsCapturing(false)
        setAudioLevel(0)
    }, [])

    const toggleMute = useCallback(() => {
        setIsMuted(prev => {
            const newValue = !prev

            // Actually mute/unmute the media stream tracks
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getAudioTracks().forEach(track => {
                    track.enabled = !newValue
                })
            }

            return newValue
        })
    }, [])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopCapture()
        }
    }, [stopCapture])

    return {
        isCapturing,
        audioLevel,
        startCapture,
        stopCapture,
        isMuted,
        toggleMute
    }
}
