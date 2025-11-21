import { supabase, supabaseAdmin } from "../config/supabase";
import GeminiAdapter, { type GeminiProjectAction } from "../lib/geminiAdapter";
import { getIO } from "../lib/realtime";
import { ChatStore } from "../lib/chatStore";

type AddMessageParams = {
  userId: string;
  chatId?: string | null;
  message: string;
};

const getChatsForUser = async (userId: string) => {
  return ChatStore.listChats(userId);
};

const createChatForUser = async (userId: string) => {
  return ChatStore.createChat(userId);
};

const getMessagesForChat = async (userId: string, chatId: string) => {
  // Verify chat ownership optionally
  return ChatStore.listMessages(chatId);
};

const addMessageAndMaybeAct = async ({
  userId,
  chatId,
  message,
}: AddMessageParams) => {
  // Ensure chat exists
  let activeChatId = chatId || null;
  if (!activeChatId) {
    const chat = await ChatStore.createChat(userId);
    activeChatId = chat.id;
  } else {
    await ChatStore.ensureChat(userId, activeChatId);
  }

  const userMsg = await ChatStore.insertMessage({
    chat_id: activeChatId,
    role: "user",
    content: message,
    user_id: userId,
  });

  const historyData = await ChatStore.listMessages(activeChatId);
  const history = historyData.map((m: any) => ({
    role: m.role,
    content: m.content,
  }));

  // Call the Gemini adapter to get AI response and stream tokens to connected clients
  let io: ReturnType<typeof getIO> | null = null;
  try {
    io = getIO();
  } catch (error) {
    if (process.env.NODE_ENV !== "test") {
      console.warn("Realtime not initialized; continuing without socket emits");
    }
  }

  let finalText = "";
  const tokenCallback = (token: string) => {
    // emit incremental token to user's room
    try {
      finalText += token;
      io?.to(`user:${userId}`).emit("chat:stream:token", {
        chatId: activeChatId,
        token,
      });
    } catch (e) {
      console.debug("Failed to emit token", e);
    }
  };

  const response = await GeminiAdapter.processMessage({
    userId,
    chatId: activeChatId as string,
    message,
    history,
    onToken: tokenCallback,
  });

  // Persist AI response (final)
  const aiMsg = await ChatStore.insertMessage({
    chat_id: activeChatId,
    role: "assistant",
    content: response.text,
    user_id: null,
  });

  const actionsResults: any[] = [];

  // Handle simple tool actions: create_project
  const aiActions: GeminiProjectAction[] = response.actions ?? [];
  if (aiActions.length > 0) {
    // Safety guard: only execute actions if user explicitly requested creation in the message
    const msgLower = String(message || "").toLowerCase();
    const explicitCreate =
      msgLower.includes("create project") ||
      msgLower.includes("create a project") ||
      msgLower.includes("please create");

    for (const action of aiActions) {
      if (action.type === "create_project" && action.project) {
        if (!explicitCreate) {
          actionsResults.push({
            action: "create_project",
            note: "Skipped: explicit creation phrase not found in user message",
          });
          continue;
        }

        // Create project + lists + tasks
        const projectPayload = {
          title: action.project.title || "Untitled Project",
          user_id: userId,
          description: action.project.description || null,
        };

        const { data: project, error: projectError } = await (
          supabaseAdmin || supabase
        )
          .from("projects")
          .insert([projectPayload])
          .select("*")
          .single();

        if (projectError) {
          actionsResults.push({ action, error: projectError.message });
          continue;
        }

        // Insert task lists and tasks if provided
        if (Array.isArray(action.project.lists)) {
          for (const list of action.project.lists) {
            const { data: listRow, error: listError } = await (
              supabaseAdmin || supabase
            )
              .from("task_lists")
              .insert([
                {
                  title: list.title || "List",
                  project_id: project.id,
                  user_id: userId,
                },
              ])
              .select("*")
              .single();

            if (listError) {
              actionsResults.push({
                action: "create_list",
                error: listError.message,
              });
              continue;
            }

            if (Array.isArray(list.tasks)) {
              for (const t of list.tasks) {
                const { error: taskError } = await (supabaseAdmin || supabase)
                  .from("tasks")
                  .insert([
                    {
                      title: t.title || "Task",
                      description: t.description || null,
                      list_id: listRow.id,
                      user_id: userId,
                    },
                  ]);

                if (taskError) {
                  actionsResults.push({
                    action: "create_task",
                    error: taskError.message,
                  });
                }
              }
            }
          }
        }

        actionsResults.push({
          action: "create_project",
          projectId: project.id,
        });
      } else {
        actionsResults.push({
          action: action.type,
          note: "Unhandled action type",
        });
      }
    }
  }

  try {
    io?.to(`user:${userId}`).emit("chat:stream:done", {
      chatId: activeChatId,
      text: response.text || finalText,
    });
  } catch (e) {
    console.debug("Failed to emit done", e);
  }

  return {
    chat_id: activeChatId,
    userMessage: userMsg,
    aiMessage: aiMsg,
    actions: actionsResults,
  };
};

export default {
  getChatsForUser,
  getMessagesForChat,
  addMessageAndMaybeAct,
  createChatForUser,
};
