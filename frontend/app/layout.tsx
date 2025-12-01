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
      <body className="mesh-bg min-h-screen light-theme">
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(255, 255, 255, 0.95)',
              color: '#0f172a',
              border: '1px solid rgba(15, 23, 42, 0.1)',
              boxShadow: '0 10px 20px rgba(15, 23, 42, 0.08)',
            },
            success: {
              iconTheme: {
                primary: '#4ECDC4',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#FF6B6B',
                secondary: '#ffffff',
              },
            },
          }}
        />
        {children}
      </body>
    </html>
  )
}

