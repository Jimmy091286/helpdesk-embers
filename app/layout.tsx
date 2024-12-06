import './globals.css'
import { Inter } from 'next/font/google'
import { UserProvider } from '../contexts/UserContext'
import Navigation from '@/components/Navigation'
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Error Management System',
  description: 'A system to manage and search for error messages',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
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

