"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Loader2, ListChecks } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface SuggestionOption {
  id: string;
  label: string;
  fullTitle: string;
  description?: string | null;
  selected: boolean;
}

interface AiSuggestionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (
    tasks: { title: string; description?: string | null }[]
  ) => Promise<void> | void;
}

const MAX_PROMPT_LENGTH = 400;

export function AiSuggestionModal({
  open,
  onOpenChange,
  onApply,
}: AiSuggestionModalProps) {
  const [prompt, setPrompt] = useState("");
  const [options, setOptions] = useState<SuggestionOption[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (!open) {
      setPrompt("");
      setOptions([]);
      setIsGenerating(false);
      setIsApplying(false);
    }
  }, [open]);

  const selectedCount = useMemo(
    () => options.filter((opt) => opt.selected).length,
    [options]
  );

  const toggleOption = (id: string, value: boolean) => {
    setOptions((prev) =>
      prev.map((opt) => (opt.id === id ? { ...opt, selected: value } : opt))
    );
  };

  const toggleAll = (value: boolean) => {
    setOptions((prev) => prev.map((opt) => ({ ...opt, selected: value })));
  };

  const buildTasksPayload = () =>
    options
      .filter((opt) => opt.selected)
      .map((opt) => ({
        title: opt.fullTitle,
        description: opt.description ?? null,
      }));

  const handleGenerate = async () => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      toast.info("Descreva o que precisa para gerar sugestões.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await api.ai.suggest({
        title: trimmed.slice(0, MAX_PROMPT_LENGTH),
        context: trimmed,
      });

      if (!res.ok) {
        throw new Error(`Falha ao obter sugestão (${res.status})`);
      }

      const payload = (res.data as Record<string, unknown>) ?? {};
      const dataBlock = ((payload["data"] as Record<string, unknown>) ??
        payload) as Record<string, unknown>;
      const subtasks = Array.isArray(dataBlock?.["subtasks"])
        ? (dataBlock["subtasks"] as unknown[])
            .map((item) => (typeof item === "string" ? item.trim() : ""))
            .filter((item) => item.length > 0)
        : [];
      const baseTitle =
        typeof dataBlock?.["title"] === "string" &&
        dataBlock["title"].trim().length > 0
          ? (dataBlock["title"] as string).trim()
          : trimmed;
      const fallbackSuggestion =
        typeof dataBlock?.["suggestion"] === "string" &&
        dataBlock["suggestion"].trim().length > 0
          ? (dataBlock["suggestion"] as string).trim()
          : baseTitle;
      const notes =
        typeof dataBlock?.["notes"] === "string" &&
        dataBlock["notes"].trim().length > 0
          ? (dataBlock["notes"] as string).trim()
          : null;

      const generated: SuggestionOption[] = (
        subtasks.length ? subtasks : [fallbackSuggestion]
      ).map((item, idx) => ({
        id: `${Date.now()}-${idx}`,
        label: item,
        fullTitle: `${baseTitle} · ${item}`.slice(0, 200),
        description: notes,
        selected: true,
      }));

      setOptions(generated);
      if (!generated.length) {
        toast.info("A IA não retornou sugestões.");
      }
    } catch (error) {
      console.error("Erro ao gerar sugestões", error);
      toast.error("Não foi possível gerar sugestões agora.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = async () => {
    const tasks = buildTasksPayload();
    if (!tasks.length) {
      toast.info("Selecione ao menos uma sugestão.");
      return;
    }

    setIsApplying(true);
    try {
      await Promise.resolve(onApply(tasks));
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao aplicar sugestões", error);
      toast.error("Falha ao aplicar as sugestões selecionadas.");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Assistente de tarefas
          </DialogTitle>
          <DialogDescription>
            Descreva o que precisa e selecione as sugestões que deseja criar no
            Planeja-AI.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Prompt para a IA
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ex.: Preciso planejar o lançamento do aplicativo com design, QA e marketing"
              className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              maxLength={MAX_PROMPT_LENGTH}
            />
            <p className="text-xs text-muted-foreground text-right">
              {prompt.length}/{MAX_PROMPT_LENGTH}
            </p>
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || isApplying}
              className="w-fit"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Gerar tarefas
                </>
              )}
            </Button>
          </div>

          {options.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  Sugestões geradas ({selectedCount}/{options.length})
                </p>
                <div className="flex gap-2 text-sm">
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => toggleAll(true)}
                    disabled={isApplying}
                  >
                    Selecionar todas
                  </Button>
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => toggleAll(false)}
                    disabled={isApplying}
                  >
                    Limpar seleção
                  </Button>
                </div>
              </div>
              <div className="space-y-2 rounded-md border p-3 max-h-64 overflow-auto">
                {options.map((option) => (
                  <label
                    key={option.id}
                    className="flex items-start gap-2 text-sm"
                  >
                    <Checkbox
                      checked={option.selected}
                      onCheckedChange={(value) =>
                        toggleOption(option.id, Boolean(value))
                      }
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-slate-900">
                        {option.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {option.description ?? ""}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            variant="outline"
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isApplying}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            disabled={isApplying || selectedCount === 0}
          >
            {isApplying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adicionando...
              </>
            ) : (
              <>
                <ListChecks className="h-4 w-4 mr-2" />
                Adicionar selecionadas
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
