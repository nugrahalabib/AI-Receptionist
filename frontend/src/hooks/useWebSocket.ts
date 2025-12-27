'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

type CallStatus = 'idle' | 'connecting' | 'ringing' | 'connected' | 'ended'

interface WebSocketMessage {
    type: 'audio' | 'status' | 'function_call' | 'error' | 'text'
    data?: string
    status?: string
    name?: string
    arguments?: Record<string, unknown>
    message?: string
}

interface UseWebSocketReturn {
    isConnected: boolean
    status: CallStatus
    sendAudio: (audioData: ArrayBuffer) => void
    connect: () => void
    disconnect: () => void
    onAudioReceived: (callback: (audioData: ArrayBuffer) => void) => void
    onFunctionCall: (callback: (name: string, args: any) => void) => void
    aiSpeaking: boolean
    sendImage: (base64Data: string) => void
}

export function useWebSocket(persona: string = "sari"): UseWebSocketReturn {
    const [isConnected, setIsConnected] = useState(false)
    const [status, setStatus] = useState<CallStatus>('idle')
    const [aiSpeaking, setAiSpeaking] = useState(false)

    const wsRef = useRef<WebSocket | null>(null)
    const audioCallbackRef = useRef<((audioData: ArrayBuffer) => void) | null>(null)
    const functionCallCallbackRef = useRef<((name: string, args: any) => void) | null>(null)
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return
        }

        const baseUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/call'
        const wsUrl = `${baseUrl}?persona=${persona}`

        setStatus('connecting')

        try {
            const ws = new WebSocket(wsUrl)
            wsRef.current = ws

            ws.onopen = () => {
                console.log('WebSocket connected')
                setIsConnected(true)
                setStatus('ringing')

                // Simulate ringing for 2 seconds before connected
                setTimeout(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        setStatus('connected')
                    }
                }, 2000)
            }

            ws.onmessage = async (event) => {
                try {
                    const message: WebSocketMessage = JSON.parse(event.data)

                    switch (message.type) {
                        case 'audio':
                            if (message.data && audioCallbackRef.current) {
                                // Decode base64 audio and pass to callback
                                const binaryString = atob(message.data)
                                const bytes = new Uint8Array(binaryString.length)
                                for (let i = 0; i < binaryString.length; i++) {
                                    bytes[i] = binaryString.charCodeAt(i)
                                }
                                audioCallbackRef.current(bytes.buffer)
                                setAiSpeaking(true)

                                // Reset AI speaking after a short delay
                                setTimeout(() => setAiSpeaking(false), 500)
                            }
                            break

                        case 'status':
                            if (message.status === 'connected') {
                                setStatus('connected')
                            } else if (message.status === 'listening') {
                                setAiSpeaking(false)
                            } else if (message.status === 'speaking') {
                                setAiSpeaking(true)
                            }
                            break

                        case 'function_call':
                            console.log('Function call:', message.name, message.arguments)
                            if (message.name && functionCallCallbackRef.current) {
                                functionCallCallbackRef.current(message.name, message.arguments)
                            }
                            break

                        case 'error':
                            console.error('WebSocket error:', message.message)
                            break

                        case 'text':
                            console.log('AI text:', message.data)
                            break
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error)
                }
            }

            ws.onclose = () => {
                console.log('WebSocket disconnected')
                setIsConnected(false)
                setAiSpeaking(false)

                if (status !== 'ended' && status !== 'idle') {
                    setStatus('ended')
                }
            }

            ws.onerror = (error) => {
                console.error('WebSocket error:', error)
                setIsConnected(false)
            }

        } catch (error) {
            console.error('Failed to connect WebSocket:', error)
            setStatus('idle')
        }
    }, [status, persona])

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
        }

        if (wsRef.current) {
            // Send end call message before closing
            if (wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({ type: 'end_call' }))
            }
            wsRef.current.close()
            wsRef.current = null
        }

        setIsConnected(false)
        setStatus('ended')
        setAiSpeaking(false)
    }, [])

    const sendAudio = useCallback((audioData: ArrayBuffer) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            // Convert ArrayBuffer to base64
            const bytes = new Uint8Array(audioData)
            let binary = ''
            for (let i = 0; i < bytes.length; i++) {
                binary += String.fromCharCode(bytes[i])
            }
            const base64 = btoa(binary)

            wsRef.current.send(JSON.stringify({
                type: 'audio',
                data: base64
            }))
        }
    }, [])

    const sendImage = useCallback((base64Data: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            // Remove header if present (e.g. "data:image/jpeg;base64,")
            const cleanBase64 = base64Data.split(',')[1] || base64Data

            wsRef.current.send(JSON.stringify({
                type: 'image',
                data: cleanBase64
            }))
        }
    }, [])

    const onAudioReceived = useCallback((callback: (audioData: ArrayBuffer) => void) => {
        audioCallbackRef.current = callback
    }, [])

    const onFunctionCall = useCallback((callback: (name: string, args: any) => void) => {
        functionCallCallbackRef.current = callback
    }, [])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current)
            }
            if (wsRef.current) {
                wsRef.current.close()
            }
        }
    }, [])

    return {
        isConnected,
        status,
        sendAudio,
        connect,
        disconnect,
        onAudioReceived,
        onFunctionCall,
        aiSpeaking,
        sendImage
    }
}
