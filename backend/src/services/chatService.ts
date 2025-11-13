import { supabase, supabaseAdmin } from "../config/supabase";
import LangchainAdapter from "../lib/langchainAdapter";
import { getIO } from "../lib/realtime";

type AddMessageParams = {
  userId: string;
  chatId?: string | null;
  message: string;
};

const getChatsForUser = async (userId: string) => {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
};

const getMessagesForChat = async (userId: string, chatId: string) => {
  // Verify chat ownership optionally
  const { data: messages, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return messages || [];
};

const addMessageAndMaybeAct = async ({ userId, chatId, message }: AddMessageParams) => {
  // Ensure chat exists
  let chat = null;
  if (!chatId) {
    const { data, error } = await (supabaseAdmin || supabase)
      .from('chats')
      .insert([{ user_id: userId, title: null }])
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    chat = data;
    chatId = chat.id;
  }

  // Persist user message
  const { data: userMsg, error: userMsgErr } = await (supabaseAdmin || supabase)
    .from('chat_messages')
    .insert([{ chat_id: chatId, role: 'user', content: message, user_id: userId }])
    .select('*')
    .single();

  if (userMsgErr) throw new Error(userMsgErr.message);

  // Fetch recent history to provide context (last 10 messages)
  const { data: historyData } = await supabase
    .from('chat_messages')
    .select('role, content, created_at')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })
    .limit(50);

  const history = (historyData || []).map((m: any) => ({ role: m.role, content: m.content }));

  // Call the LangChain adapter to get AI response and stream tokens to connected clients
  const io = getIO();

  let finalText = '';
  const tokenCallback = (token: string) => {
    // emit incremental token to user's room
    try {
      io.to(`user:${userId}`).emit('chat:stream:token', { chatId, token });
    } catch (e) {
      console.debug('Failed to emit token', e);
    }
  };

  const response = await LangchainAdapter.processMessage({ userId, chatId: chatId as string, message, history, onToken: tokenCallback });

  // Persist AI response (final)
  const { data: aiMsg, error: aiErr } = await (supabaseAdmin || supabase)
    .from('chat_messages')
    .insert([{ chat_id: chatId, role: 'assistant', content: response.text, user_id: null }])
    .select('*')
    .single();

  if (aiErr) throw new Error(aiErr.message);

  const actionsResults: any[] = [];

  // Handle simple tool actions: create_project
  if (response.actions && Array.isArray(response.actions)) {
    // Safety guard: only execute actions if user explicitly requested creation in the message
    const msgLower = String(message || '').toLowerCase();
    const explicitCreate = msgLower.includes('create project') || msgLower.includes('create a project') || msgLower.includes('please create');

    for (const action of response.actions) {
      if (action.type === 'create_project' && action.project) {
        if (!explicitCreate) {
          actionsResults.push({ action: 'create_project', note: 'Skipped: explicit creation phrase not found in user message' });
          continue;
        }

        // Create project + lists + tasks
        const projectPayload = {
          title: action.project.title || 'Untitled Project',
          user_id: userId,
          description: action.project.description || null
        };

        const { data: project, error: projectError } = await (supabaseAdmin || supabase)
          .from('projects')
          .insert([projectPayload])
          .select('*')
          .single();

        if (projectError) {
          actionsResults.push({ action, error: projectError.message });
          continue;
        }

        // Insert task lists and tasks if provided
        if (Array.isArray(action.project.lists)) {
          for (const list of action.project.lists) {
            const { data: listRow, error: listError } = await (supabaseAdmin || supabase)
              .from('task_lists')
              .insert([{ title: list.title || 'List', project_id: project.id, user_id: userId }])
              .select('*')
              .single();

            if (listError) {
              actionsResults.push({ action: 'create_list', error: listError.message });
              continue;
            }

            if (Array.isArray(list.tasks)) {
              for (const t of list.tasks) {
                const { error: taskError } = await (supabaseAdmin || supabase)
                  .from('tasks')
                  .insert([{ title: t.title || 'Task', description: t.description || null, list_id: listRow.id, user_id: userId }]);

                if (taskError) {
                  actionsResults.push({ action: 'create_task', error: taskError.message });
                }
              }
            }
          }
        }

        actionsResults.push({ action: 'create_project', projectId: project.id });
      } else {
        actionsResults.push({ action: action.type, note: 'Unhandled action type' });
      }
    }
  }

  return {
    chat_id: chatId,
    userMessage: userMsg,
    aiMessage: aiMsg,
    actions: actionsResults
  };
};

export default {
  getChatsForUser,
  getMessagesForChat,
  addMessageAndMaybeAct
};
