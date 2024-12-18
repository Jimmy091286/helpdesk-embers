'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from "@/lib/utils"
import { useUser } from '@/contexts/UserContext'

const Navigation = () => {
  const pathname = usePathname()
  const { user } = useUser()

  return (
    <nav className="flex space-x-4 mb-4">
      {!user && (
        <Link href="/" className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/" ? "text-primary" : "text-muted-foreground"
        )}>
          Home
        </Link>
      )}
      {user && (
        <Link href="/dashboard" className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === "/dashboard" ? "text-primary" : "text-muted-foreground"
        )}>
          Dashboard
        </Link>
      )}
      <Link href="/search" className={cn(
        "text-sm font-medium transition-colors hover:text-primary",
        pathname === "/search" ? "text-primary" : "text-muted-foreground"
      )}>
        Suche
      </Link>
    </nav>
  )
}

export default Navigation

