"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnalyticsCards } from "@/components/analytics-cards";
import api, { resolveAttachmentUrl } from "@/lib/api";
import { TaskList } from "@/components/task-list";
import { AddTaskForm } from "@/components/add-task-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListTodo, Sparkles } from "lucide-react";
import { ToDoItem } from "@/lib/supabase";
import { TaskState } from "@/@types/task";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AiSuggestionModal } from "@/components/ai-suggestion-modal";

type TaskWithAttachment = ToDoItem & {
  attachmentCount?: number;
  coverUrl?: string | null;
  coverThumbnailUrl?: string | null;
};

type AttachmentResponse = {
  id?: string;
  _id?: string;
  url?: string;
  thumbnail_url?: string;
  thumbnailUrl?: string;
  mimetype?: string;
  is_cover?: boolean;
  isCover?: boolean;
  metadata?: { is_cover?: boolean } | null;
};

interface AttachmentListResponse {
  attachments?: AttachmentResponse[];
}

type ListRecord = { id: number };

interface ListsResponseShape {
  lists?: ListRecord[];
  data?: ListRecord[];
}

interface SingleListResponseShape {
  list?: ListRecord;
  data?: ListRecord;
}

interface TasksPayload {
  items?: ToDoItem[];
  data?: ToDoItem[];
  total?: number;
  summary?: {
    pending?: number;
    completed?: number;
  };
}

interface CreateItemResponseShape {
  item?: ToDoItem;
  data?: ToDoItem;
}

const PAGE_SIZE = 10;

export default function Home() {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskWithAttachment[]>([]);
  const [filter, setFilter] = useState<TaskState>("all");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ pending: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [defaultListId, setDefaultListId] = useState<number | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  const ensureDefaultList = useCallback(async () => {
    try {
      if (defaultListId) return defaultListId;

      const res = await api.lists.getAll();
      if (res.ok) {
        const payload = res.data as ListsResponseShape | undefined;
        const lists = payload?.lists ?? payload?.data ?? [];
        if (lists.length > 0) {
          setDefaultListId(lists[0].id);
          return lists[0].id;
        }
      }

      const created = await api.lists.create();
      if (created.ok) {
        const payload = created.data as SingleListResponseShape | undefined;
        const list = payload?.list ?? payload?.data;
        if (list?.id) {
          setDefaultListId(list.id);
          return list.id;
        }
      }
    } catch (err) {
      console.error("Erro ao garantir lista padrão", err);
    }
    return defaultListId;
  }, [defaultListId]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number | boolean> = {
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      };
      if (filter === "pending") params.done = false;
      if (filter === "completed") params.done = true;

      const res = await api.tasks.get(params);
      if (res.status === 401) {
        router.push("/auth");
        return;
      }
      if (!res.ok) {
        const message = "Não foi possível carregar as tarefas.";
        setError(message);
        toast.error(message);
        return;
      }

      const payload = res.data as TasksPayload | undefined;
      const items: ToDoItem[] = payload?.items ?? payload?.data ?? [];
      const summaryData = payload?.summary;
      const tasksWithCounts = await Promise.all(
        items.map(async (task: ToDoItem) => {
          try {
            const attachRes = await api.attachments.list(String(task.id));
            if (!attachRes.ok) {
              return { ...task, attachmentCount: 0 } as TaskWithAttachment;
            }

            const attachments =
              (attachRes.data as AttachmentListResponse | undefined)
                ?.attachments ?? [];
            const normalized = attachments.map((att) => ({
              url: att.url,
              thumbnailUrl: att.thumbnail_url ?? att.thumbnailUrl,
              mimetype: att.mimetype,
              isCover: Boolean(
                att.is_cover ?? att.metadata?.is_cover ?? att.isCover
              ),
            }));

            const imageAttachments = normalized.filter((att) =>
              (att.mimetype ?? "").startsWith("image/")
            );
            const coverCandidate =
              imageAttachments.find((att) => att.isCover) ??
              imageAttachments[0];
            const coverUrl = coverCandidate?.url
              ? resolveAttachmentUrl(coverCandidate.url)
              : null;
            const coverThumb = coverCandidate?.thumbnailUrl
              ? resolveAttachmentUrl(coverCandidate.thumbnailUrl)
              : null;

            return {
              ...task,
              attachmentCount: normalized.length,
              coverUrl,
              coverThumbnailUrl: coverThumb ?? coverUrl,
            } as TaskWithAttachment;
          } catch {
            return { ...task, attachmentCount: 0 } as TaskWithAttachment;
          }
        })
      );

      setTasks(tasksWithCounts);
      setTotal(payload?.total ?? items.length);
      setSummary({
        pending: summaryData?.pending ?? 0,
        completed: summaryData?.completed ?? 0,
      });
    } catch (err) {
      console.error("Erro ao buscar tarefas:", err);
      const message = "Erro inesperado ao buscar tarefas.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [filter, page, router]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    ensureDefaultList();
  }, [ensureDefaultList]);

  useEffect(() => {
    setPage(0);
  }, [filter]);

  const addTask = async (
    title: string,
    description: string | null = null,
    attachments: File[] = [],
    options?: { suppressToast?: boolean; skipRefresh?: boolean }
  ) => {
    try {
      const listId = await ensureDefaultList();
      if (!listId) throw new Error("Lista padrão não encontrada");
      const res = await api.lists.createItem(listId, {
        name: title,
        description,
      });
      if (!res.ok) throw new Error(`Create failed: ${res.status}`);
      const createPayload = res.data as CreateItemResponseShape | undefined;
      const createdItem = createPayload?.item ?? createPayload?.data ?? null;

      if (attachments.length > 0) {
        if (!createdItem?.id) {
          throw new Error(
            "Não foi possível determinar o ID da tarefa para anexar imagem."
          );
        }

        const uploadRes = await api.attachments.upload(
          createdItem.id,
          attachments
        );
        if (!uploadRes.ok) {
          throw new Error("Falha ao enviar a imagem");
        }
      }

      if (!options?.skipRefresh) {
        await fetchTasks();
      }

      if (!options?.suppressToast) {
        toast.success(
          attachments.length > 0
            ? "Tarefa e imagem adicionadas com sucesso!"
            : "Tarefa adicionada com sucesso!"
        );
      }
    } catch (error) {
      console.error("Erro ao adicionar tarefa:", error);
      if (!options?.suppressToast) {
        toast.error("Não foi possível adicionar a tarefa.");
      }
      if (options?.suppressToast || options?.skipRefresh) {
        throw error;
      }
    }
  };

  const handleAiApply = async (
    items: { title: string; description?: string | null }[]
  ) => {
    if (!items.length) return;

    try {
      for (const task of items) {
        await addTask(task.title, task.description ?? null, [], {
          suppressToast: true,
          skipRefresh: true,
        });
      }

      await fetchTasks();
      toast.success(
        items.length > 1
          ? `${items.length} tarefas sugeridas foram adicionadas.`
          : "Sugestão adicionada como tarefa."
      );
    } catch (error) {
      console.error("Erro ao aplicar tarefas sugeridas:", error);
      toast.error("Não foi possível aplicar as sugestões selecionadas.");
    }
  };

  const toggleComplete = async (id: number, completed: boolean) => {
    try {
      const res = await api.tasks.complete(id, completed);
      if (!res.ok) throw new Error(`complete failed ${res.status}`);
      const d = res.data as Record<string, unknown> | null;
      const updated = (d?.["item"] ?? d?.["data"]) as TaskWithAttachment | null;
      if (updated) {
        setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      } else {
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, done: completed } : t))
        );
      }
      fetchTasks();
    } catch (error) {
      console.error("Erro ao atualizar tarefa:", error);
      toast.error("Não foi possível atualizar a tarefa.");
    }
  };

  const updateTask = async (
    id: number,
    fields: { name?: string; description?: string | null }
  ) => {
    try {
      const res = await api.tasks.update(id, fields);
      if (!res.ok) throw new Error("Falha ao atualizar");
      const payload = res.data as Record<string, unknown> | null;
      const updated = (payload?.["item"] ??
        payload?.["data"]) as TaskWithAttachment | null;
      if (updated) {
        setTasks((prev) =>
          prev.map((task) => (task.id === id ? updated : task))
        );
      }
    } catch (error) {
      console.error("Erro ao atualizar tarefa:", error);
      toast.error("Erro ao salvar alterações da tarefa.");
    }
  };

  const paginatedInfo =
    total > 0
      ? {
          start: page * PAGE_SIZE + 1,
          end: Math.min(total, (page + 1) * PAGE_SIZE),
        }
      : { start: 0, end: 0 };
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="flex items-center gap-3">
          <ListTodo className="h-8 w-8 text-blue-600" />
          <h1 className="text-4xl font-bold text-slate-900">Minhas Tarefas</h1>
        </div>

        <AnalyticsCards
          completedTasks={summary.completed}
          pendingTasks={summary.pending}
        />

        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAiModalOpen(true)}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4 text-blue-600" />
              Planejar com IA
            </Button>
          </div>
          <AddTaskForm onAddTask={addTask} />
        </div>

        <Tabs
          value={filter}
          onValueChange={(value) => setFilter(value as TaskState)}
        >
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="completed">Completas</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {error && <p className="text-red-500 mb-3">{error}</p>}
            {loading ? (
              <p className="text-muted-foreground">Carregando tarefas...</p>
            ) : (
              <TaskList
                tasks={tasks}
                onToggleComplete={toggleComplete}
                onUpdateTask={updateTask}
                onAttachmentsChange={fetchTasks}
              />
            )}
          </TabsContent>

          <TabsContent value="pending" className="mt-6">
            {error && <p className="text-red-500 mb-3">{error}</p>}
            {loading ? (
              <p className="text-muted-foreground">Carregando tarefas...</p>
            ) : (
              <TaskList
                tasks={tasks}
                onToggleComplete={toggleComplete}
                onUpdateTask={updateTask}
                onAttachmentsChange={fetchTasks}
              />
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            {error && <p className="text-red-500 mb-3">{error}</p>}
            {loading ? (
              <p className="text-muted-foreground">Carregando tarefas...</p>
            ) : (
              <TaskList
                tasks={tasks}
                onToggleComplete={toggleComplete}
                onUpdateTask={updateTask}
                onAttachmentsChange={fetchTasks}
              />
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted-foreground">
            {total > 0
              ? `Mostrando ${paginatedInfo.start}-${paginatedInfo.end} de ${total} tarefas`
              : "Nenhuma tarefa encontrada"}
          </p>
          <div className="flex items-center gap-2">
            <button
              className="btn btn-sm btn-outline"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Anterior
            </button>
            <span className="text-sm text-muted-foreground">
              Página {total === 0 ? 0 : page + 1} de{" "}
              {total === 0 ? 0 : totalPages}
            </span>
            <button
              className="btn btn-sm btn-outline"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              Próxima
            </button>
          </div>
        </div>
      </div>

      <AiSuggestionModal
        open={aiModalOpen}
        onOpenChange={setAiModalOpen}
        onApply={handleAiApply}
      />
    </div>
  );
}
