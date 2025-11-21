"use client";

import { Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";

interface AttachmentButtonProps {
  taskId: string;
  attachmentCount: number;
  onAttachmentsChange: () => void;
}

export function AttachmentButton({
  taskId,
  attachmentCount,
  onAttachmentsChange,
}: AttachmentButtonProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const payload = Array.from(files);
      const response = await api.attachments.upload(taskId, payload);
      if (!response.ok) {
        throw new Error("Erro ao fazer upload");
      }
      onAttachmentsChange();
      toast.success("Anexos enviados com sucesso!");
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao fazer upload dos anexos");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="relative inline-block">
      <input
        type="file"
        id={`file-${taskId}`}
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt"
        disabled={isUploading}
      />
      <label htmlFor={`file-${taskId}`}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="relative"
          disabled={isUploading}
          asChild
        >
          <span className="cursor-pointer">
            <Paperclip className="h-4 w-4" />
            {attachmentCount > 0 && (
              <Badge
                variant="secondary"
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {attachmentCount}
              </Badge>
            )}
          </span>
        </Button>
      </label>
    </div>
  );
}
