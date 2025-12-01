import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'PDF AI Assistant | Smart Document Analysis',
  description: 'Upload PDFs and use AI to extract insights, ask questions, generate summaries, flashcards, and more.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="mesh-bg min-h-screen">
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(10, 10, 31, 0.9)',
              color: '#e0e8ff',
              border: '1px solid rgba(99, 112, 241, 0.3)',
              backdropFilter: 'blur(20px)',
            },
            success: {
              iconTheme: {
                primary: '#4ECDC4',
                secondary: '#0a0a1f',
              },
            },
            error: {
              iconTheme: {
                primary: '#FF6B6B',
                secondary: '#0a0a1f',
              },
            },
          }}
        />
        {children}
      </body>
    </html>
  )
}

