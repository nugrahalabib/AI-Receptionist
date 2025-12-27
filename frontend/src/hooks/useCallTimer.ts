'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface UseCallTimerReturn {
    time: string
    seconds: number
    start: () => void
    stop: () => void
    reset: () => void
    isRunning: boolean
}

export function useCallTimer(): UseCallTimerReturn {
    const [seconds, setSeconds] = useState(0)
    const [isRunning, setIsRunning] = useState(false)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    const formatTime = useCallback((totalSeconds: number): string => {
        const mins = Math.floor(totalSeconds / 60)
        const secs = totalSeconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }, [])

    const start = useCallback(() => {
        if (!isRunning) {
            setIsRunning(true)
        }
    }, [isRunning])

    const stop = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
        setIsRunning(false)
    }, [])

    const reset = useCallback(() => {
        stop()
        setSeconds(0)
    }, [stop])

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setSeconds(prev => prev + 1)
            }, 1000)
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [isRunning])

    return {
        time: formatTime(seconds),
        seconds,
        start,
        stop,
        reset,
        isRunning
    }
}
