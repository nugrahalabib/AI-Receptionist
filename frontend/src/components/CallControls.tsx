'use client'

import { motion } from 'framer-motion'

interface CallControlsProps {
    isMuted: boolean
    isSpeakerOn: boolean
    onMuteToggle: () => void
    onSpeakerToggle: () => void
    onEndCall: () => void
    onStartCall: () => void
    isCallActive: boolean
}

export default function CallControls({
    isMuted,
    isSpeakerOn,
    onMuteToggle,
    onSpeakerToggle,
    onEndCall,
    onStartCall,
    isCallActive,
}: CallControlsProps) {

    // If call is not active, show start call button
    if (!isCallActive) {
        return (
            <div className="flex justify-center">
                <motion.button
                    onClick={onStartCall}
                    className="w-20 h-20 rounded-full bg-whatsapp-green flex items-center justify-center control-button shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                >
                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
                    </svg>
                </motion.button>
            </div>
        )
    }

    return (
        <div className="flex items-center justify-center gap-6">
            {/* Mute Button */}
            <motion.button
                onClick={onMuteToggle}
                className={`w-14 h-14 rounded-full flex items-center justify-center control-button ${isMuted
                        ? 'bg-white text-whatsapp-dark'
                        : 'bg-white/10 text-white'
                    }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={isMuted ? 'Unmute' : 'Mute'}
            >
                {isMuted ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
                    </svg>
                ) : (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
                    </svg>
                )}
            </motion.button>

            {/* Speaker Button */}
            <motion.button
                onClick={onSpeakerToggle}
                className={`w-14 h-14 rounded-full flex items-center justify-center control-button ${isSpeakerOn
                        ? 'bg-white text-whatsapp-dark'
                        : 'bg-white/10 text-white'
                    }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={isSpeakerOn ? 'Speaker Off' : 'Speaker On'}
            >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
            </motion.button>

            {/* Video Button (Disabled) */}
            <motion.button
                className="w-14 h-14 rounded-full flex items-center justify-center bg-white/5 text-white/30 cursor-not-allowed"
                title="Video (Not available)"
                disabled
            >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z" />
                </svg>
            </motion.button>

            {/* End Call Button */}
            <motion.button
                onClick={onEndCall}
                className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center control-button ml-4 shadow-lg"
                whileHover={{ scale: 1.05, backgroundColor: '#ef4444' }}
                whileTap={{ scale: 0.95 }}
                title="End Call"
            >
                <svg className="w-8 h-8 text-white rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
                </svg>
            </motion.button>
        </div>
    )
}
