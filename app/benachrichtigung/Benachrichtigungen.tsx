'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
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
import { CheckCircle, Clock, Maximize2, Phone, MessageCircle, AlertCircle } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from 'next/image'
import { useToast } from "@/components/ui/use-toast"
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from 'next/navigation'

interface SupportTicket {
  id: number
  name: string
  email: string
  phone: string
  error_description: string
  image_url?: string
  images?: string[]
  is_read: boolean
  status: 'new' | 'inProgress'| 'completed'
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

export function Benachrichtigungen() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [comments, setComments] = useState<TicketComment[]>([])
  const [newComment, setNewComment] = useState('')
  //const [enlargedImage, setEnlargedImage] = useState<string | null>(null) //Removed
  const [isAddingComment, setIsAddingComment] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const { user } = useUser()
  const { toast } = useToast()
  const dialogRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const unreadCount = useMemo(() => tickets.filter(ticket => !ticket.is_read).length, [tickets])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets]); //Added fetchTickets to dependencies

  const fetchTickets = async () => {
    try {
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
    }
  }

  const fetchComments = async (ticketId: number) => {
    try {
      const { data, error } = await supabase
        .from('ticket_comments')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })
      
      if (error) throw error

      setComments(data || [])
    } catch (error) {
      console.error('Error fetching comments:', error)
      toast({
        title: 'Fehler beim Abrufen der Kommentare',
        description: 'Die Kommentare konnten nicht abgerufen werden. Bitte versuchen Sie es erneut.',
        variant: 'destructive',
      })
    }
  }

  const handleTicketClick = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket)
    setIsDialogOpen(true)
    await fetchComments(ticket.id)
    if (!ticket.is_read) {
      await updateTicket(ticket.id, { is_read: true })
    }
  }

  const updateTicket = async (id: number, updates: Partial<SupportTicket>) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', id)
      
      if (error) throw error

      setTickets(tickets.map(t => t.id === id ? { ...t, ...updates } : t))
      if (selectedTicket && selectedTicket.id === id) {
        setSelectedTicket({ ...selectedTicket, ...updates })
      }
    } catch (error) {
      console.error('Error updating ticket:', error)
      toast({
        title: 'Fehler beim Aktualisieren des Tickets',
        description: 'Das Ticket konnte nicht aktualisiert werden. Bitte versuchen Sie es erneut.',
        variant: 'destructive',
      })
    }
  }

  const handleTakeOver = async () => {
    if (selectedTicket && user) {
      await updateTicket(selectedTicket.id, {
        status: 'inProgress',
        assigned_to: user.email,
      })
      await addComment(`Ticket übernommen von ${user.email}`)
      setIsDialogOpen(false)
      setSelectedTicket(null)
      toast({
        title: "Ticket übernommen",
        description: `Sie haben das Ticket #${selectedTicket.id} übernommen.`,
      })
    }
  }

  const handleComplete = async () => {
    if (selectedTicket && user) {
      await updateTicket(selectedTicket.id, { status: 'completed' })
      await addComment(`Ticket erledigt von ${user.email}`)
      setIsDialogOpen(false)
      setSelectedTicket(null)
      toast({
        title: "Ticket erledigt",
        description: `Ticket #${selectedTicket.id} wurde als erledigt markiert.`,
      })
    }
  }

  const addComment = async (text: string) => {
    if (selectedTicket && user) {
      setIsAddingComment(true)
      try {
        const { error } = await supabase
          .from('ticket_comments')
          .insert({ ticket_id: selectedTicket.id, text, author: user.email })
        
        if (error) throw error

        await fetchComments(selectedTicket.id)
        setNewComment('')
        toast({
          title: "Kommentar hinzugefügt",
          description: "Ihr Kommentar wurde erfolgreich hinzugefügt.",
        })
      } catch (error) {
        console.error('Error adding comment:', error)
        toast({
          title: 'Fehler beim Hinzufügen des Kommentars',
          description: 'Der Kommentar konnte nicht hinzugefügt werden. Bitte versuchen Sie es erneut.',
          variant: 'destructive',
        })
      } finally {
        setIsAddingComment(false)
      }
    }
  }

  const handleAddComment = () => {
    if (newComment.trim() && selectedTicket) {
      addComment(newComment.trim())
    }
  }

  const handleDeleteTicket = async (id: number) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .delete()
        .eq('id', id)
      
      if (error) throw error

      setTickets(tickets.filter(t => t.id !== id))
      setIsDialogOpen(false)
      setSelectedTicket(null)
      toast({
        title: "Ticket gelöscht",
        description: "Das Support-Ticket wurde erfolgreich gelöscht.",
        variant: "destructive",
      })
    } catch (error) {
      console.error('Error deleting ticket:', error)
      toast({
        title: "Fehler beim Löschen",
        description: "Das Ticket konnte nicht gelöscht werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      })
    }
  }

  const openWhatsApp = (phone: string) => {
    const whatsappUrl = `https://web.whatsapp.com/send?phone=${phone.replace(/\D/g, '')}`
    window.open(whatsappUrl, '_blank')
  }

  useEffect(() => {
    if (dialogRef.current) {
      const dialog = dialogRef.current.closest('[role="dialog"]')
      if (dialog) {
        const closeButton = dialog.querySelector('[data-radix-collection-item]')
        if (closeButton) {
          (closeButton as HTMLElement).style.display = 'none'
        }
      }
    }
  }, [selectedTicket])

  const getTicketImages = (ticket: SupportTicket): string[] => {
    const images: string[] = [];
    
    // Helper function to validate and clean URLs
    const cleanUrl = (url: string) => {
      if (!url || typeof url !== 'string') return null;
      // Remove any duplicate slashes except after protocol
      return url.replace(/(https?:\/\/)|(\/)+/g, "$1$2").trim();
    };
    
    if (ticket.image_url) {
      const urls = ticket.image_url.split(',');
      urls.forEach(url => {
        const cleanedUrl = cleanUrl(url);
        if (cleanedUrl && !images.includes(cleanedUrl)) {
          images.push(cleanedUrl);
        }
      });
    }
    
    if (ticket.images && Array.isArray(ticket.images)) {
      ticket.images.forEach(imageUrl => {
        if (typeof imageUrl === 'string') {
          const urls = imageUrl.split(',');
          urls.forEach(url => {
            const cleanedUrl = cleanUrl(url);
            if (cleanedUrl && !images.includes(cleanedUrl)) {
              images.push(cleanedUrl);
            }
          });
        }
      });
    }
    
    return images;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">
          Support-Tickets {unreadCount > 0 && <Badge variant="destructive">{unreadCount}</Badge>}
        </h2>
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard')}
        >
          Dashboard
        </Button>
      </div>
      {tickets.length === 0 ? (
        <p>Keine Benachrichtigungen vorhanden.</p>
      ) : (
        <ul className="space-y-3">
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
                          {ticket.status === 'inProgress' && <Clock className="h-5 w-5 text-blue-500 flex-shrink-0" />}
                          {ticket.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />}
                          {ticket.status === 'new' && <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{ticket.name}</div>
                            <div className="text-sm text-muted-foreground truncate">{ticket.error_description}</div>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(ticket.created_at).toLocaleString()}
                          </span>
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
                              <strong className="block text-sm font-medium text-gray-700">Beschreibung:</strong>
                              <p className="mt-1 whitespace-pre-wrap break-words">{selectedTicket?.error_description}</p>
                            </div>
                            {selectedTicket && (
                              <div>
                                <strong className="block text-sm font-medium text-gray-700">Bilder:</strong>
                                {getTicketImages(selectedTicket).length > 0 ? (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {getTicketImages(selectedTicket).map((image, index) => (
                                      <div 
                                        key={index} 
                                        className="relative w-32 h-32 cursor-pointer group" 
                                        onClick={() => setSelectedImages(getTicketImages(selectedTicket))}
                                      >
                                        <Image 
                                          src={image} 
                                          alt={`Bild ${index + 1}`} 
                                          layout="fill" 
                                          objectFit="cover" 
                                          className="rounded-md"
                                          onError={() => {
                                            const shortUrl = image.split('/').slice(-2).join('/');
                                            console.error(`Fehler beim Laden des Bildes: ${shortUrl}`);
                                            toast({
                                              title: "Fehler beim Laden des Bildes",
                                              description: `Bild ${index + 1} (${shortUrl}) konnte nicht geladen werden. Bitte überprüfen Sie die URL.`,
                                              variant: "destructive",
                                            });
                                          }}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Maximize2 className="text-white" />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="mt-2 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-md flex items-center">
                                    <AlertCircle className="mr-2" />
                                    <span>Keine Bilder gefunden oder Fehler beim Laden der Bilder.</span>
                                  </div>
                                )}
                              </div>
                            )}
                            <div>
                              <strong className="block text-sm font-medium text-gray-700">Kommentare:</strong>
                              {comments.map((comment) => (
                                <div key={comment.id} className="bg-gray-50 rounded p-2 mt-2">
                                  <p className="text-sm">
                                    <strong>{comment.author}:</strong> <span className="whitespace-pre-wrap break-words">{comment.text}</span>
                                  </p>
                                  <span className="text-xs text-gray-500">
                                    {new Date(comment.created_at).toLocaleString()}
                                  </span>
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
      
      {selectedImages.length > 0 && (
        <Dialog open={selectedImages.length > 0} onOpenChange={() => setSelectedImages([])}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Bilder</DialogTitle>
            </DialogHeader>
            <div className="relative w-full h-[60vh]">
              <Image 
                src={selectedImages[0]} 
                alt="Vergrößertes Bild" 
                layout="fill" 
                objectFit="contain" 
                className="rounded-lg"
              />
            </div>
            {selectedImages.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto p-2">
                {selectedImages.map((image, index) => (
                  <div
                    key={index}
                    className={`relative w-20 h-20 cursor-pointer rounded-md overflow-hidden ${
                      image === selectedImages[0] ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => {
                      const newImages = [...selectedImages];
                      const clickedImage = newImages.splice(index, 1)[0];
                      newImages.unshift(clickedImage);
                      setSelectedImages(newImages);
                    }}
                  >
                    <Image
                      src={image}
                      alt={`Vorschau ${index + 1}`}
                      layout="fill"
                      objectFit="cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
