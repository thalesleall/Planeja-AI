'use client'

import { useState, useEffect } from 'react'
import { X, Download, Trash2, Star, Image as ImageIcon, FileText } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Attachment {
  _id: string
  filename: string
  originalName: string
  mimetype: string
  size: number
  url: string
  thumbnailUrl?: string
  isCover: boolean
}

interface AttachmentModalProps {
  taskId: string
  isOpen: boolean
  onClose: () => void
  onAttachmentsChange: () => void
}

export function AttachmentModal({ taskId, isOpen, onClose, onAttachmentsChange }: AttachmentModalProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(false)

  const fetchAttachments = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/attachments/task/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setAttachments(data.attachments || [])
      }
    } catch (error) {
      console.error('Erro ao carregar anexos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchAttachments()
    }
  }, [isOpen, taskId])

  const handleDelete = async (attachmentId: string) => {
    if (!confirm('Tem certeza que deseja excluir este anexo?')) return

    try {
      const response = await fetch(`/api/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        await fetchAttachments()
        onAttachmentsChange()
      }
    } catch (error) {
      console.error('Erro ao deletar anexo:', error)
      alert('Erro ao deletar anexo')
    }
  }

  const handleSetCover = async (attachmentId: string) => {
    try {
      const response = await fetch(`/api/attachments/${attachmentId}/cover`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        await fetchAttachments()
        onAttachmentsChange()
      }
    } catch (error) {
      console.error('Erro ao definir capa:', error)
      alert('Erro ao definir capa')
    }
  }

  const handleDownload = (attachment: Attachment) => {
    window.open(attachment.url, '_blank')
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const isImage = (mimetype: string) => mimetype.startsWith('image/')

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Anexos da Tarefa</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando...
          </div>
        ) : attachments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum anexo encontrado
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {attachments.map((attachment) => (
              <div
                key={attachment._id}
                className="border rounded-lg p-4 space-y-3 relative"
              >
                {attachment.isCover && (
                  <Badge className="absolute top-2 right-2" variant="secondary">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Capa
                  </Badge>
                )}

                {isImage(attachment.mimetype) && attachment.thumbnailUrl ? (
                  <img
                    src={attachment.thumbnailUrl}
                    alt={attachment.originalName}
                    className="w-full h-32 object-cover rounded"
                  />
                ) : (
                  <div className="w-full h-32 bg-muted rounded flex items-center justify-center">
                    <FileText className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}

                <div className="space-y-1">
                  <p className="text-sm font-medium truncate" title={attachment.originalName}>
                    {attachment.originalName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.size)}
                  </p>
                </div>

                <div className="flex gap-2">
                  {isImage(attachment.mimetype) && !attachment.isCover && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetCover(attachment._id)}
                      title="Definir como capa"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(attachment)}
                    title="Baixar"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(attachment._id)}
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
