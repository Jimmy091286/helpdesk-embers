import { Inter } from 'next/font/google'
import { Toaster } from '@/components/ui/toaster'
import { UserProvider } from '@/contexts/UserContext'
import { Metadata } from 'next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Helpdesk Embers - Helpdesk-System',
  description: 'Ein modernes Helpdesk-System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body className={inter.className}>
        <UserProvider>
          <main className="min-h-screen">
            {children}
          </main>
          <Toaster />
        </UserProvider>
      </body>
    </html>
  )
}

