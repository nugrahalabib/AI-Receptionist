'use client'

import { motion } from 'framer-motion'

interface ProfileAvatarProps {
    name: string
    imageSrc?: string
    audioLevel: number
    isAiSpeaking: boolean
}

export default function ProfileAvatar({
    name,
    imageSrc,
    audioLevel,
    isAiSpeaking
}: ProfileAvatarProps) {
    // Calculate ripple scale based on audio level
    const rippleScale = 1 + (isAiSpeaking ? audioLevel * 0.5 : audioLevel * 0.3)

    return (
        <div className="relative flex items-center justify-center">
            {/* Outer ripple rings */}
            <motion.div
                className="absolute w-40 h-40 rounded-full bg-whatsapp-green/20"
                animate={{
                    scale: isAiSpeaking ? [1, 1.8, 1] : [1, 1.3, 1],
                    opacity: isAiSpeaking ? [0.4, 0, 0.4] : [0.2, 0, 0.2],
                }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeOut",
                }}
            />

            <motion.div
                className="absolute w-40 h-40 rounded-full bg-whatsapp-green/15"
                animate={{
                    scale: isAiSpeaking ? [1, 2.2, 1] : [1, 1.5, 1],
                    opacity: isAiSpeaking ? [0.3, 0, 0.3] : [0.15, 0, 0.15],
                }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: 0.3,
                }}
            />

            <motion.div
                className="absolute w-40 h-40 rounded-full bg-whatsapp-green/10"
                animate={{
                    scale: isAiSpeaking ? [1, 2.6, 1] : [1, 1.7, 1],
                    opacity: isAiSpeaking ? [0.2, 0, 0.2] : [0.1, 0, 0.1],
                }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: 0.6,
                }}
            />

            {/* Dynamic audio level ring */}
            <motion.div
                className="absolute w-40 h-40 rounded-full border-2 border-whatsapp-green"
                animate={{
                    scale: rippleScale,
                    opacity: audioLevel > 0.1 ? 0.6 : 0.3,
                }}
                transition={{
                    duration: 0.1,
                    ease: "linear",
                }}
            />

            {/* Profile image container */}
            <motion.div
                className={`relative w-32 h-32 rounded-full overflow-hidden border-4 
          ${isAiSpeaking ? 'border-whatsapp-green glow-green-intense' : 'border-whatsapp-green/50'}`}
                animate={{
                    scale: isAiSpeaking ? [1, 1.02, 1] : 1,
                }}
                transition={{
                    duration: 0.5,
                    repeat: isAiSpeaking ? Infinity : 0,
                    ease: "easeInOut",
                }}
            >
                {imageSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={imageSrc}
                        alt={name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    /* Default avatar with initials */
                    <div className="w-full h-full bg-gradient-to-br from-whatsapp-green to-whatsapp-green-dark flex items-center justify-center">
                        <span className="text-4xl font-bold text-white">
                            {name.charAt(0).toUpperCase()}
                        </span>
                    </div>
                )}
            </motion.div>
        </div>
    )
}
