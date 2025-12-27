import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: 'AI Receptionist - Restoran Caliana',
    description: 'Virtual receptionist powered by AI for restaurant reservations',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="id" suppressHydrationWarning>
            <body suppressHydrationWarning>{children}</body>
        </html>
    )
}
