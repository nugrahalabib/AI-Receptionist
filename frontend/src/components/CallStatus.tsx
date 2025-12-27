'use client'

import { motion } from 'framer-motion'

type CallStatus = 'idle' | 'connecting' | 'ringing' | 'connected' | 'ended'

interface CallStatusProps {
    status: CallStatus
    time: string
    restaurantName: string
}

export default function CallStatus({ status, time, restaurantName }: CallStatusProps) {
    const getStatusText = () => {
        switch (status) {
            case 'idle':
                return 'Tap to call'
            case 'connecting':
                return 'Connecting...'
            case 'ringing':
                return 'Ringing...'
            case 'connected':
                return time
            case 'ended':
                return 'Call ended'
            default:
                return ''
        }
    }

    const isAnimating = status === 'connecting' || status === 'ringing'

    return (
        <div className="text-center">
            {/* Restaurant name */}
            <h1 className="text-2xl font-semibold text-whatsapp-text mb-1">
                {restaurantName}
            </h1>

            {/* AI name */}
            <p className="text-lg text-whatsapp-text-secondary mb-3">
                Sari
            </p>

            {/* Status indicator */}
            <motion.div
                className="flex items-center justify-center gap-2"
                animate={isAnimating ? { opacity: [1, 0.5, 1] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
            >
                {/* Status dot */}
                {status === 'connected' && (
                    <motion.div
                        className="w-2 h-2 rounded-full bg-whatsapp-green"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                    />
                )}

                {/* Status text */}
                <span className={`text-base ${status === 'connected'
                        ? 'text-whatsapp-green font-medium'
                        : 'text-whatsapp-text-secondary'
                    }`}>
                    {getStatusText()}
                </span>
            </motion.div>

            {/* Encryption notice */}
            {status === 'connected' && (
                <motion.p
                    className="text-xs text-whatsapp-text-secondary mt-2 flex items-center justify-center gap-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <svg
                        className="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                    </svg>
                    End-to-end encrypted
                </motion.p>
            )}
        </div>
    )
}
