"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Download, Trash2, Star, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api, { resolveAttachmentUrl } from "@/lib/api";
import { toast } from "sonner";

const PLACEHOLDER_IMAGE =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

type AttachmentRecord = {
  id?: string;
  _id?: string;
  filename?: string;
  original_name?: string;
  originalName?: string;
  mimetype?: string;
  size?: number;
  url?: string;
  thumbnail_url?: string;
  thumbnailUrl?: string;
  is_cover?: boolean;
  isCover?: boolean;
  metadata?: { is_cover?: boolean } | null;
};

interface AttachmentApiResponse {
  attachments?: AttachmentRecord[];
}

interface Attachment {
  _id?: string;
  id?: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  isCover?: boolean;
}

interface AttachmentModalProps {
  taskId: string;
  isOpen: boolean;
  onClose: () => void;
  onAttachmentsChange: () => void;
}

export function AttachmentModal({
  taskId,
  isOpen,
  onClose,
  onAttachmentsChange,
}: AttachmentModalProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAttachments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.attachments.list(taskId);
      if (response.ok) {
        const data = response.data as AttachmentApiResponse | undefined;
        const normalized = (data?.attachments || []).map((att) => ({
          id: att.id ?? att._id,
          _id: att._id ?? att.id,
          filename:
            att.filename ?? att.original_name ?? att.originalName ?? "Arquivo",
          originalName:
            att.original_name ?? att.originalName ?? att.filename ?? "Arquivo",
          mimetype: att.mimetype ?? "application/octet-stream",
          size: att.size ?? 0,
          url: att.url ?? "",
          thumbnailUrl: att.thumbnail_url ?? att.thumbnailUrl ?? "",
          isCover:
            att.is_cover ?? att.isCover ?? att.metadata?.is_cover ?? false,
        }));
        setAttachments(normalized);
      }
    } catch (error) {
      console.error("Erro ao carregar anexos:", error);
      toast.error("Não foi possível carregar os anexos.");
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (isOpen) {
      fetchAttachments();
    }
  }, [fetchAttachments, isOpen]);

  const handleDelete = async (attachmentId: string) => {
    if (!confirm("Tem certeza que deseja excluir este anexo?")) return;

    try {
      const response = await api.attachments.delete(taskId, attachmentId);
      if (response.ok) {
        await fetchAttachments();
        onAttachmentsChange();
        toast.success("Anexo excluído.");
      }
    } catch (error) {
      console.error("Erro ao deletar anexo:", error);
      toast.error("Erro ao deletar anexo");
    }
  };

  const handleSetCover = async (attachmentId: string) => {
    try {
      const response = await api.attachments.setCover(taskId, attachmentId);
      if (response.ok) {
        await fetchAttachments();
        onAttachmentsChange();
        toast.success("Anexo definido como capa.");
      }
    } catch (error) {
      console.error("Erro ao definir capa:", error);
      toast.error("Erro ao definir capa");
    }
  };

  const handleDownload = (attachment: Attachment) => {
    const url = resolveAttachmentUrl(attachment.url);
    if (!url) return;
    window.open(url, "_blank");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const isImage = (mimetype: string) => mimetype.startsWith("image/");

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
            {attachments.map((attachment) => {
              const attachmentId = attachment._id || attachment.id;
              return (
                <div
                  key={attachmentId}
                  className="border rounded-lg p-4 space-y-3 relative"
                >
                  {attachment.isCover && (
                    <Badge
                      className="absolute top-2 right-2"
                      variant="secondary"
                    >
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Capa
                    </Badge>
                  )}

                  {isImage(attachment.mimetype) &&
                  (attachment.thumbnailUrl || attachment.url) ? (
                    <div className="relative w-full h-32 overflow-hidden rounded bg-muted">
                      <Image
                        src={
                          resolveAttachmentUrl(
                            attachment.thumbnailUrl || attachment.url
                          ) || PLACEHOLDER_IMAGE
                        }
                        alt={attachment.originalName}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-32 bg-muted rounded flex items-center justify-center">
                      <FileText className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}

                  <div className="space-y-1">
                    <p
                      className="text-sm font-medium truncate"
                      title={attachment.originalName || attachment.filename}
                    >
                      {attachment.originalName || attachment.filename}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.size)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {isImage(attachment.mimetype) &&
                      !attachment.isCover &&
                      attachmentId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetCover(attachmentId)}
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
                    {attachmentId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(attachmentId)}
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
