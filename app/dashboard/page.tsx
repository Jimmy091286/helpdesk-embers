import { Suspense } from 'react'
import DashboardContent from '@/components/DashboardContent'
import { Skeleton } from "@/components/ui/skeleton"
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard - Helpdesk Embers',
  description: 'Übersicht und Verwaltung des Helpdesk-Systems',
}

export default function Dashboard() {
  return (
    <main>
      <h1 className="sr-only">Dashboard</h1>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </main>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4" aria-label="Lädt Dashboard-Inhalte">
      <Skeleton className="h-8 w-[250px]" />
      <Skeleton className="h-[200px] w-full" />
      <Skeleton className="h-[200px] w-full" />
      <Skeleton className="h-[200px] w-full" />
    </div>
  )
}

