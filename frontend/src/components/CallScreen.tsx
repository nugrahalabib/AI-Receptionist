'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ProfileAvatar from './ProfileAvatar'
import AudioVisualizer from './AudioVisualizer'
import CallStatus from './CallStatus'
import CallControls from './CallControls'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useAudioCapture } from '@/hooks/useAudioCapture'
import { useCallTimer } from '@/hooks/useCallTimer'
import { useAudioPlayback } from '@/lib/audioUtils'

export default function CallScreen() {
    const [isSpeakerOn, setIsSpeakerOn] = useState(true)
    const [aiAudioLevel, setAiAudioLevel] = useState(0)

    // Custom hooks
    const {
        isConnected,
        status,
        sendAudio,
        connect,
        disconnect,
        onAudioReceived,
        aiSpeaking
    } = useWebSocket()

    const {
        isCapturing,
        audioLevel: userAudioLevel,
        startCapture,
        stopCapture,
        isMuted,
        toggleMute
    } = useAudioCapture()

    const { time, start: startTimer, stop: stopTimer, reset: resetTimer } = useCallTimer()
    const { playAudioBuffer, stopPlayback } = useAudioPlayback()

    // Handle audio received from AI
    useEffect(() => {
        onAudioReceived((audioData) => {
            if (isSpeakerOn) {
                playAudioBuffer(audioData)
            }

            // Simulate AI audio level for visualization
            setAiAudioLevel(0.7)
            setTimeout(() => setAiAudioLevel(0), 200)
        })
    }, [onAudioReceived, playAudioBuffer, isSpeakerOn])

    // Handle status changes
    useEffect(() => {
        if (status === 'connected') {
            startTimer()
        } else if (status === 'ended') {
            stopTimer()
        }
    }, [status, startTimer, stopTimer])

    // Start call
    const handleStartCall = useCallback(async () => {
        try {
            // Start audio capture first
            await startCapture((audioData) => {
                sendAudio(audioData)
            })

            // Then connect to WebSocket
            connect()
        } catch (error) {
            console.error('Failed to start call:', error)
            alert('Could not access microphone. Please allow microphone permission.')
        }
    }, [startCapture, sendAudio, connect])

    // End call
    const handleEndCall = useCallback(() => {
        stopCapture()
        disconnect()
        stopPlayback()
        resetTimer()
    }, [stopCapture, disconnect, stopPlayback, resetTimer])

    // Toggle speaker
    const handleSpeakerToggle = useCallback(() => {
        setIsSpeakerOn(prev => !prev)
    }, [])

    const isCallActive = status !== 'idle' && status !== 'ended'

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-whatsapp-call-bg via-whatsapp-dark to-whatsapp-darker">
            {/* Header - End-to-end encrypted */}
            <motion.header
                className="pt-12 pb-4 text-center"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex items-center justify-center gap-1 text-whatsapp-text-secondary text-xs">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                    </svg>
                    <span>End-to-end encrypted</span>
                </div>
            </motion.header>

            {/* Main content */}
            <main className="flex-1 flex flex-col items-center justify-center relative px-4">
                {/* Audio visualizer background */}
                <AudioVisualizer
                    userAudioLevel={userAudioLevel}
                    aiAudioLevel={aiSpeaking ? 0.8 : aiAudioLevel}
                    isConnected={isConnected}
                />

                {/* Profile avatar */}
                <motion.div
                    className="relative z-10 mb-8"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <ProfileAvatar
                        name="Sari"
                        audioLevel={aiSpeaking ? 0.8 : aiAudioLevel}
                        isAiSpeaking={aiSpeaking}
                    />
                </motion.div>

                {/* Call status */}
                <motion.div
                    className="relative z-10 mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <CallStatus
                        status={status}
                        time={time}
                        restaurantName="Restoran Caliana"
                    />
                </motion.div>

                {/* Call ended overlay */}
                <AnimatePresence>
                    {status === 'ended' && (
                        <motion.div
                            className="absolute inset-0 flex items-center justify-center bg-black/50 z-20"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <motion.div
                                className="text-center"
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                            >
                                <p className="text-2xl text-white mb-4">Call Ended</p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-6 py-3 bg-whatsapp-green text-white rounded-full hover:bg-whatsapp-green-dark transition-colors"
                                >
                                    Call Again
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Footer controls */}
            <motion.footer
                className="pb-12 pt-6 relative z-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
            >
                <CallControls
                    isMuted={isMuted}
                    isSpeakerOn={isSpeakerOn}
                    onMuteToggle={toggleMute}
                    onSpeakerToggle={handleSpeakerToggle}
                    onEndCall={handleEndCall}
                    onStartCall={handleStartCall}
                    isCallActive={isCallActive}
                />

                {/* User audio indicator */}
                {isCallActive && (
                    <div className="mt-6 flex justify-center">
                        <div className="flex items-center gap-2 text-whatsapp-text-secondary text-sm">
                            <div
                                className={`w-2 h-2 rounded-full transition-colors ${userAudioLevel > 0.1 && !isMuted
                                        ? 'bg-whatsapp-green'
                                        : 'bg-whatsapp-text-secondary/30'
                                    }`}
                            />
                            <span>{isMuted ? 'Microphone muted' : 'Microphone active'}</span>
                        </div>
                    </div>
                )}
            </motion.footer>
        </div>
    )
}
