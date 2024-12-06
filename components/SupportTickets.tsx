'use client'

import React, { useState, useEffect, useRef, useMemo, Suspense, ErrorBoundary } from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useUser } from '@/contexts/UserContext'
import { CheckCircle, Clock, Maximize2, Phone, MessageCircle } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from 'next/image'
import { useToast } from "@/components/ui/use-toast"
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from "@/components/ui/card"

// Interfaces bleiben gleich
interface SupportTicket {
  id: number
  name: string
  email: string
  phone: string
  error_description: string
  image_url?: string
  is_read: boolean
  status: 'new' | 'inProgress' | 'completed'
  assigned_to?: string
  created_at: string
}

interface TicketComment {
  id: number
  ticket_id: number
  text: string
  author: string
  created_at: string
}

// Error Boundary Komponente
function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div role="alert" className="p-4 border border-red-500 rounded-lg">
      <h2 className="text-lg font-semibold text-red-600">Etwas ist schiefgelaufen</h2>
      <p className="text-sm text-gray-600">{error.message}</p>
      <Button onClick={resetErrorBoundary} className="mt-4">Erneut versuchen</Button>
    </div>
  )
}

// Loading Komponente
function LoadingState() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      <div className="space-y-3">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-24 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  )
}

export function SupportTickets() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [comments, setComments] = useState<TicketComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null)
  const [isAddingComment, setIsAddingComment] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useUser()
  const { toast } = useToast()
  const dialogRef = useRef<HTMLDivElement>(null)

  const unreadCount = useMemo(() => tickets.filter(ticket => !ticket.is_read).length, [tickets])

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error

      setTickets(data || [])
    } catch (error) {
      console.error('Error fetching tickets:', error)
      toast({
        title: 'Fehler beim Abrufen der Tickets',
        description: 'Die Tickets konnten nicht abgerufen werden. Bitte versuchen Sie es erneut.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Rest der Funktionen bleiben gleich...
  // (fetchComments, handleTicketClick, updateTicket, handleTakeOver, handleComplete, addComment, handleAddComment, handleDeleteTicket, openWhatsApp)

  if (isLoading) {
    return <LoadingState />
  }

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-bold">
        Support-Tickets {unreadCount > 0 && <Badge variant="destructive">{unreadCount}</Badge>}
      </h1>
      {tickets.length === 0 ? (
        <p>Keine Support-Tickets vorhanden.</p>
      ) : (
        <ul className="space-y-3" role="list">
          {tickets.map((ticket) => (
            <li key={ticket.id}>
              <Dialog open={isDialogOpen && selectedTicket?.id === ticket.id} onOpenChange={(open) => {
                if (!open) {
                  setIsDialogOpen(false)
                  setSelectedTicket(null)
                }
              }}>
                <DialogTrigger asChild>
                  <Card className="transition-all duration-300 hover:shadow-md">
                    <CardContent className="p-0">
                      <Button
                        variant="ghost"
                        className={`w-full justify-start text-left p-4 rounded-lg transition-colors duration-300 ${
                          ticket.is_read ? 'hover:bg-gray-100' : 'bg-blue-50 hover:bg-blue-100'
                        }`}
                        onClick={() => handleTicketClick(ticket)}
                      >
                        <div className="flex items-center space-x-3 w-full">
                          {ticket.status === 'inProgress' && (
                            <Clock className="h-5 w-5 text-blue-500 flex-shrink-0" aria-label="In Bearbeitung" />
                          )}
                          {ticket.status === 'completed' && (
                            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" aria-label="Erledigt" />
                          )}
                          {ticket.status === 'new' && (
                            <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" aria-label="Neu" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{ticket.name}</div>
                            <div className="text-sm text-muted-foreground truncate">{ticket.error_description}</div>
                          </div>
                          <time className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(ticket.created_at).toLocaleString()}
                          </time>
                        </div>
                      </Button>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[700px] max-h-[80vh]" onInteractOutside={(e) => e.preventDefault()}>
                  <div ref={dialogRef}>
                    {selectedTicket && selectedTicket.id === ticket.id && (
                      <>
                        <DialogHeader>
                          <DialogTitle className="text-2xl">Support-Ticket #{selectedTicket.id}</DialogTitle>
                          <DialogDescription>
                            Erstellt am: {new Date(selectedTicket.created_at).toLocaleString()}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 my-4">
                          <div>
                            <strong className="block text-sm font-medium text-gray-700">Name:</strong>
                            <span>{selectedTicket.name}</span>
                          </div>
                          <div>
                            <strong className="block text-sm font-medium text-gray-700">Email:</strong>
                            <span className="break-all">{selectedTicket.email}</span>
                          </div>
                          <div>
                            <strong className="block text-sm font-medium text-gray-700">Telefon:</strong>
                            <span className="break-all">{selectedTicket.phone}</span>
                          </div>
                          <div>
                            <strong className="block text-sm font-medium text-gray-700">Status:</strong>
                            <Badge variant={
                              selectedTicket.status === 'new' ? "default" :
                              selectedTicket.status === 'inProgress' ? "secondary" :
                              "success"
                            }>
                              {selectedTicket.status === 'new' ? 'Neu' :
                               selectedTicket.status === 'inProgress' ? 'In Bearbeitung' :
                               'Erledigt'}
                            </Badge>
                          </div>
                        </div>
                        <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                          <div className="space-y-4">
                            <div>
                              <strong className="block text-sm font-medium text-gray-700">Fehlerbeschreibung:</strong>
                              <p className="mt-1 whitespace-pre-wrap break-words">{selectedTicket.error_description}</p>
                            </div>
                            {selectedTicket.image_url && (
                              <div>
                                <strong className="block text-sm font-medium text-gray-700">Fehlerbild:</strong>
                                <div className="mt-2 relative w-32 h-32 cursor-pointer" onClick={() => setEnlargedImage(selectedTicket.image_url)}>
                                  <Image 
                                    src={selectedTicket.image_url} 
                                    alt="Fehlerbild" 
                                    width={128}
                                    height={128}
                                    className="rounded-md object-cover"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity">
                                    <Maximize2 className="text-white" />
                                  </div>
                                </div>
                              </div>
                            )}
                            <div>
                              <strong className="block text-sm font-medium text-gray-700">Kommentare:</strong>
                              {comments.map((comment) => (
                                <div key={comment.id} className="bg-gray-50 rounded p-2 mt-2">
                                  <p className="text-sm">
                                    <strong>{comment.author}:</strong> <span className="whitespace-pre-wrap break-words">{comment.text}</span>
                                  </p>
                                  <time className="text-xs text-gray-500">
                                    {new Date(comment.created_at).toLocaleString()}
                                  </time>
                                </div>
                              ))}
                            </div>
                          </div>
                        </ScrollArea>
                        <Textarea
                          placeholder="Kommentar hinzufügen..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="mt-4"
                        />
                        <DialogFooter className="mt-4 flex flex-wrap justify-end gap-2">
                          <Button onClick={() => openWhatsApp(selectedTicket.phone)} variant="outline" size="sm">
                            <Phone className="mr-2 h-4 w-4" />
                            WhatsApp
                          </Button>
                          <Button onClick={handleAddComment} variant="outline" size="sm" disabled={isAddingComment}>
                            {isAddingComment ? (
                              <span>Wird hinzugefügt...</span>
                            ) : (
                              <>
                                <MessageCircle className="mr-2 h-4 w-4" />
                                Kommentar
                              </>
                            )}
                          </Button>
                          {selectedTicket.status === 'new' && (
                            <Button onClick={handleTakeOver} variant="secondary" size="sm">Übernehmen</Button>
                          )}
                          {selectedTicket.status !== 'completed' && (
                            <Button onClick={handleComplete} variant="default" size="sm">
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Erledigt
                            </Button>
                          )}
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteTicket(selectedTicket.id)}>Löschen</Button>
                        </DialogFooter>
                      </>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </li>
          ))}
        </ul>
      )}
      
      {enlargedImage && (
        <Dialog open={!!enlargedImage} onOpenChange={() => setEnlargedImage(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Vergrößertes Bild</DialogTitle>
            </DialogHeader>
            <div className="relative w-full h-[60vh]">
              <Image 
                src={enlargedImage} 
                alt="Vergrößertes Fehlerbild" 
                fill
                className="object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

