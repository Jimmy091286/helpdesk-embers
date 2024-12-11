import './globals.css'
import { Inter } from 'next/font/google'
import { UserProvider } from '../contexts/UserContext'
import Navigation from '@/components/Navigation'
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Fehlerverwaltungssystem',
  description: 'Ein System zur Verwaltung und Suche von Fehlermeldungen',
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
          <div className="container mx-auto p-4">
            <Navigation />
            {children}
          </div>
          <Toaster />
        </UserProvider>
      </body>
    </html>
  )
}

