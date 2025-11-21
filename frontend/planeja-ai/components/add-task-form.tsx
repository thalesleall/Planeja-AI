"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";

interface AddTaskFormProps {
  onAddTask: (
    title: string,
    description: string | null,
    attachments?: File[],
    options?: { suppressToast?: boolean }
  ) => Promise<void> | void;
}
export function AddTaskForm({ onAddTask }: AddTaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      setIsSubmitting(true);
      try {
        await onAddTask(
          title,
          description.trim() ? description : null,
          attachments
        );
        setTitle("");
        setDescription("");
        setAttachments([]);
        setPreviewUrl(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (error) {
        console.error("Erro ao criar tarefa com imagem:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setAttachments([]);
      setPreviewUrl(null);
      return;
    }

    const selected = files[0];
    setAttachments([selected]);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(selected);
    });
  };

  const handleRemoveAttachment = () => {
    setAttachments([]);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Input
              placeholder="Adicionar nova tarefa..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1"
              disabled={isSubmitting}
            />
            <Button type="submit" disabled={isSubmitting}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
          <textarea
            placeholder="Descrição (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={isSubmitting}
          />
          <div className="flex flex-col gap-2">
            <Input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              A primeira imagem selecionada será usada como capa da tarefa.
            </p>
            {previewUrl && (
              <div className="rounded-md border border-dashed p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    Preview da imagem
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={handleRemoveAttachment}
                    disabled={isSubmitting}
                  >
                    Remover
                  </Button>
                </div>
                <div className="relative w-full h-40 overflow-hidden rounded-md bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Preview da tarefa"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
