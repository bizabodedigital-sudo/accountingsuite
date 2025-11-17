import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import Sidebar from '@/components/Sidebar'
import QuickActionButton from '@/components/QuickActionButton'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bizabode Accounting Suite',
  description: 'Modern invoicing & bookkeeping for Jamaican SMEs',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className={`${inter.className} h-full overflow-hidden`} suppressHydrationWarning={true}>
        <ThemeProvider>
          <AuthProvider>
            <div className="h-full bg-gray-50 dark:bg-gray-900 flex transition-colors">
              <Sidebar />
              <main className="flex-1 h-full overflow-hidden bg-gray-50 dark:bg-gray-900">
                {children}
              </main>
              <QuickActionButton />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}