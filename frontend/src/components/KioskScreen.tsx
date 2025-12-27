'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useAudioCapture } from '@/hooks/useAudioCapture'
import { useAudioPlayback } from '@/lib/audioUtils'

export default function KioskScreen() {
    // Refs
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isStreaming, setIsStreaming] = useState(false)
    const [aiStatus, setAiStatus] = useState<string>("Standby")

    // UI State for Visual Feedback
    const [showFlash, setShowFlash] = useState(false)
    const [scanMode, setScanMode] = useState<'none' | 'face' | 'id'>('none')
    const [capturedImage, setCapturedImage] = useState<string | null>(null)
    const [accessGranted, setAccessGranted] = useState(false)

    // Hooks - Use "reza" persona
    const {
        isConnected,
        status,
        sendAudio,
        sendImage,
        connect,
        disconnect,
        onAudioReceived,
        onFunctionCall,
        aiSpeaking
    } = useWebSocket("reza")

    const {
        startCapture: startMic,
        stopCapture: stopMic,
        isMuted
    } = useAudioCapture()

    const { playAudioBuffer, stopPlayback } = useAudioPlayback()

    // 0. Helper: Capture Snapshot
    const takeSnapshot = useCallback(() => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current
            const canvas = canvasRef.current
            const ctx = canvas.getContext('2d')
            if (ctx) {
                canvas.width = video.videoWidth
                canvas.height = video.videoHeight
                ctx.drawImage(video, 0, 0)
                return canvas.toDataURL('image/jpeg', 0.8)
            }
        }
        return null
    }, [])

    // 0. Handle AI Tool Calls (Visual Triggers)
    useEffect(() => {
        onFunctionCall((name, args) => {
            if (name === 'trigger_ui_action') {
                const action = args.action
                const message = args.message

                setAiStatus(message || "Processing...")

                if (action === 'scan_face') {
                    setScanMode('face')
                    // Simulate scan delay then flash
                    setTimeout(() => {
                        setShowFlash(true)
                        const img = takeSnapshot()
                        setCapturedImage(img)
                        setTimeout(() => setShowFlash(false), 200)
                        setScanMode('none')
                    }, 2000)
                }

                if (action === 'scan_id') {
                    setScanMode('id')
                    setTimeout(() => {
                        setShowFlash(true)
                        const img = takeSnapshot()
                        setCapturedImage(img)
                        setTimeout(() => setShowFlash(false), 200)
                        setScanMode('none')
                    }, 2000)
                }

                if (action === 'approve') {
                    setAccessGranted(true)
                    setTimeout(() => setAccessGranted(false), 5000)
                }
            }
        })
    }, [onFunctionCall, takeSnapshot])

    // 1. Setup Camera
    useEffect(() => {
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "user", width: 1280, height: 720 },
                    audio: false // We handle audio separately
                })
                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                    setIsStreaming(true)
                }
            } catch (err) {
                console.error("Camera error:", err)
                setAiStatus("Camera Error")
            }
        }
        startCamera()

        return () => {
            // Cleanup tracks
            if (videoRef.current?.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream
                stream.getTracks().forEach(t => t.stop())
            }
        }
    }, [])

    // 2. Audio Handling (AI Voice)
    useEffect(() => {
        onAudioReceived((audioData) => {
            playAudioBuffer(audioData)
            setAiStatus("Speaking...")
            setTimeout(() => setAiStatus("Listening"), 1500) // Reset after bit
        })
    }, [onAudioReceived, playAudioBuffer])

    // 3. Start Session (Mic + WS)
    const startSession = useCallback(async () => {
        try {
            await startMic((audioData) => sendAudio(audioData))
            connect()
            setAiStatus("Connecting...")
        } catch (e) {
            console.error(e)
        }
    }, [startMic, sendAudio, connect])

    const endSession = useCallback(() => {
        stopMic()
        disconnect()
        stopPlayback()
        setAiStatus("Standby")
    }, [stopMic, disconnect, stopPlayback])

    // 4. Video Frame Capture Loop (Vision)
    useEffect(() => {
        if (!isConnected || !isStreaming) return

        const interval = setInterval(() => {
            if (videoRef.current && canvasRef.current) {
                const video = videoRef.current
                const canvas = canvasRef.current

                // Draw video frame to canvas
                const ctx = canvas.getContext('2d')
                if (ctx) {
                    canvas.width = video.videoWidth / 2 // Reduce res for optimization
                    canvas.height = video.videoHeight / 2
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

                    // Convert to base64
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.6) // Quality 0.6
                    sendImage(dataUrl)
                }
            }
        }, 1000) // Send 1 frame per second (sufficient for "Active Looking" without overloading)

        return () => clearInterval(interval)
    }, [isConnected, isStreaming, sendImage])


    return (
        <div className="relative min-h-screen bg-black overflow-hidden flex flex-col items-center justify-center text-white">
            {/* Hidden Canvas for capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Background Video (Smart Mirror Effect) */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover opacity-80 mirror-effect"
                style={{ transform: "scaleX(-1)" }} // Mirror flip
            />

            {/* UI Overlays */}
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

            {/* FLASH EFFECT */}
            <AnimatePresence>
                {showFlash && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                        className="absolute inset-0 z-50 bg-white pointer-events-none"
                    />
                )}
            </AnimatePresence>

            {/* CAPTURED SNAPSHOT CARD */}
            <AnimatePresence>
                {capturedImage && (
                    <motion.div
                        initial={{ x: 100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 100, opacity: 0 }}
                        className="absolute top-10 right-10 z-30 w-48 h-32 md:w-64 md:h-48 border-2 border-cyan-500 rounded-lg overflow-hidden shadow-[0_0_20px_rgba(34,211,238,0.5)] bg-black/80"
                    >
                        <p className="absolute top-1 left-2 text-[10px] text-cyan-400 font-mono tracking-widest uppercase">
                            LAST CAPTURE // {scanMode !== 'none' ? scanMode.toUpperCase() : 'DATA'}
                        </p>
                        <img src={capturedImage} alt="Capture" className="w-full h-full object-cover opacity-80" />

                        {/* Scanning Overlay on Card */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent animate-scan" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ACCESS GRANTED OVERLAY */}
            <AnimatePresence>
                {accessGranted && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    >
                        <div className="border-4 border-green-500 p-10 rounded-2xl bg-black/90 text-center shadow-[0_0_50px_rgba(34,197,94,0.6)]">
                            <h2 className="text-6xl font-bold text-green-500 tracking-tighter uppercase mb-4">
                                ACCESS GRANTED
                            </h2>
                            <p className="text-xl text-green-200 font-mono">
                                WELCOME TO NEXUS
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="absolute top-10 w-full text-center z-20">
                <h1 className="text-3xl font-light tracking-widest uppercase text-cyan-400 drop-shadow-glow">
                    Security Access
                </h1>
                <div className="flex items-center justify-center gap-2 mt-2">
                    <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                    <p className="text-sm font-mono text-cyan-200/80 uppercase">
                        System: {status === 'connected' ? "ONLINE" : "OFFLINE"}
                    </p>
                </div>
            </div>

            {/* Face Scanning Frame (Dynamic) */}
            <div className={`absolute z-10 w-64 h-64 md:w-96 md:h-96 rounded-lg pointer-events-none transition-all duration-700
                ${isConnected ? "opacity-100 scale-100" : "opacity-50 scale-95"}
                ${scanMode === 'face' ? "border-4 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.5)]" : "border border-cyan-500/30"}
                ${scanMode === 'id' ? "border-4 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.5)] w-80 h-52" : ""}
            `}>
                {scanMode === 'none' && (
                    <>
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-400" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-400" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-400" />
                    </>
                )}

                {/* Scan Line Animation - Active during scans */}
                {(isConnected || scanMode !== 'none') && (
                    <motion.div
                        className={`absolute h-0.5 w-full shadow-[0_0_15px_rgba(34,211,238,0.8)]
                            ${scanMode === 'face' ? "bg-yellow-400" : "bg-cyan-400/80"}
                            ${scanMode === 'id' ? "bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)]" : ""}
                        `}
                        animate={{ top: ["0%", "100%", "0%"] }}
                        transition={{ duration: scanMode !== 'none' ? 1.5 : 3, repeat: Infinity, ease: "linear" }}
                    />
                )}
            </div>


            {/* Status Text (Holographic) */}
            <div className="absolute bottom-32 w-full text-center z-20">
                <AnimatePresence mode='wait'>
                    <motion.p
                        key={aiStatus}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-2xl font-mono text-cyan-50 drop-shadow-md"
                    >
                        [{aiStatus.toUpperCase()}]
                    </motion.p>
                </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="absolute bottom-10 z-30 pointer-events-auto">
                {!isConnected ? (
                    <button
                        onClick={startSession}
                        className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-full border border-cyan-400 shadow-[0_0_20px_rgba(8,145,178,0.5)] transition-all"
                    >
                        INITIATE SYSTEM
                    </button>
                ) : (
                    <button
                        onClick={endSession}
                        className="px-8 py-3 bg-red-900/80 hover:bg-red-800 text-red-200 font-bold rounded-full border border-red-500/50 backdrop-blur-sm transition-all"
                    >
                        TERMINATE
                    </button>
                )}
            </div>
        </div >
    )
}
