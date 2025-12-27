'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface AudioVisualizerProps {
    userAudioLevel: number
    aiAudioLevel: number
    isConnected: boolean
}

// Pre-calculate static bar positions to avoid hydration mismatch
const BAR_COUNT = 40
const RADIUS = 140
const BASE_HEIGHT = 20

const barPositions = Array.from({ length: BAR_COUNT }, (_, index) => {
    const angle = (index / BAR_COUNT) * 360
    const radians = (angle * Math.PI) / 180
    const x = Math.cos(radians) * RADIUS
    const y = Math.sin(radians) * RADIUS
    const waveOffset = Math.sin((index / BAR_COUNT) * Math.PI * 4) * 10

    return {
        angle,
        x: Math.round(x * 100) / 100, // Round to avoid precision issues
        y: Math.round(y * 100) / 100,
        waveOffset: Math.round(waveOffset * 100) / 100,
        waveFactor: Math.round((1 + Math.sin((index / BAR_COUNT) * Math.PI * 2) * 0.5) * 100) / 100
    }
})

export default function AudioVisualizer({
    userAudioLevel,
    aiAudioLevel,
    isConnected
}: AudioVisualizerProps) {
    // Use state to ensure client-only rendering for dynamic values
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Combined audio level for overall activity
    const combinedLevel = Math.max(userAudioLevel, aiAudioLevel)

    // Don't render bars until mounted to avoid hydration mismatch
    if (!mounted) {
        return (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                {/* Ambient glow effect - static, no hydration issue */}
                <div className="absolute w-80 h-80 rounded-full bg-whatsapp-green/5 blur-3xl opacity-20" />
            </div>
        )
    }

    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            {/* Circular waveform around the avatar */}
            <div className="absolute w-[400px] h-[400px]">
                {barPositions.map((bar, index) => {
                    const audioHeight = isConnected
                        ? combinedLevel * 60 * bar.waveFactor
                        : 0
                    const height = Math.round((BASE_HEIGHT + bar.waveOffset + audioHeight) * 100) / 100

                    return (
                        <motion.div
                            key={index}
                            className="absolute bg-whatsapp-green/30 rounded-full"
                            style={{
                                left: '50%',
                                top: '50%',
                                width: '3px',
                                height: `${BASE_HEIGHT}px`,
                                transformOrigin: 'center bottom',
                                transform: `translate(-50%, -50%) translate(${bar.x}px, ${bar.y}px) rotate(${bar.angle + 90}deg)`,
                            }}
                            animate={{
                                height: isConnected ? `${height}px` : `${BASE_HEIGHT}px`,
                                opacity: isConnected ? 0.3 + combinedLevel * 0.5 : 0.2,
                            }}
                            transition={{
                                duration: 0.05,
                                ease: 'linear',
                            }}
                        />
                    )
                })}
            </div>

            {/* Ambient glow effect */}
            <motion.div
                className="absolute w-80 h-80 rounded-full bg-whatsapp-green/5 blur-3xl"
                animate={{
                    scale: isConnected ? [1, 1.2, 1] : 1,
                    opacity: isConnected ? [0.3, 0.5, 0.3] : 0.2,
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            {/* Inner subtle pulse */}
            {isConnected && combinedLevel > 0.1 && (
                <motion.div
                    className="absolute w-48 h-48 rounded-full border border-whatsapp-green/20"
                    animate={{
                        scale: [1, 1.5],
                        opacity: [0.4, 0],
                    }}
                    transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        ease: "easeOut",
                    }}
                />
            )}
        </div>
    )
}
