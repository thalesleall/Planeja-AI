/**
 * Lightweight adapter to LangChain.js + Azure/OpenAI for MVP.
 * - Provides processMessage which returns { text, actions }
 * - actions is an optional array of tool calls (e.g., create_project)
 *
 * This is intentionally minimal: a future refactor should move to a proper chain/agent
 */

// We dynamically import langchain and provider packages at runtime inside processMessage.
// This allows running in local dev without requiring LangChain to be present or ESM exports to match.
import { z } from "zod";
import dotenv from "dotenv";
dotenv.config();

type Message = { role: string; content: string };

type ProcessParams = {
  userId: string;
  chatId: string;
  message: string;
  history: Message[];
  onToken?: (token: string) => void;
};

/**
 * Generic LangChain adapter using ChatOpenAI. This implementation uses streaming via
 * the agent.stream API to emit incremental tokens through the optional onToken callback.
 *
 * NOTE: For Azure OpenAI, set the appropriate environment variables (OPENAI_API_KEY and
 * OPENAI_API_BASE) and LangChain will use the underlying OpenAI client with the Azure endpoint.
 */
const processMessage = async ({
  userId,
  chatId,
  message,
  history,
  onToken,
}: ProcessParams) => {
  // Basic input safety checks before calling the LLM
  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return { text: "", actions: [] };
  }

  if (message.length > 10000) {
    // avoid sending excessive content to the LLM
    message = message.slice(0, 10000);
  }
  // Attempt to dynamically load LangChain and ChatOpenAI. If unavailable, fall back to a simple echo implementation.
  let LangChain: any = null;
  let ChatOpenAI: any = null;
  try {
    LangChain = await import(/* @vite-ignore */ "langchain");
    ChatOpenAI = (await import(/* @vite-ignore */ "@langchain/openai"))
      .ChatOpenAI;
  } catch (e) {
    // LangChain not available or incompatible — will use fallback below
    LangChain = null;
    ChatOpenAI = null;
  }

  // If LangChain is not available, return a simple fallback response to keep local dev running.
  if (!LangChain || !ChatOpenAI) {
    // Call onToken with the message split into tokens (simple whitespace split) to simulate streaming
    if (onToken) {
      const tokens = `Assistant reply to: ${message}`.split(/\s+/);
      for (const t of tokens) onToken(t + " ");
    }
    return { text: `Assistant reply to: ${message}`, actions: [] };
  }

  // Create a minimal tool that can be invoked by the agent to request a project creation.
  const createProjectTool = (LangChain as any).tool(
    async (args: any) => {
      // The tool itself simply returns the args back as a JSON string; the host will interpret and act on them.
      return JSON.stringify(args);
    },
    {
      name: "create_project",
      description:
        "Create a Project structure with lists and tasks. Returns a JSON object representing the project.",
      schema: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        lists: z
          .array(
            z.object({
              title: z.string().optional(),
              tasks: z
                .array(
                  z.object({
                    title: z.string().optional(),
                    description: z.string().optional(),
                  })
                )
                .optional(),
            })
          )
          .optional(),
      }),
    }
  );

  // Instantiate model. LangChain will use OPENAI_API_KEY / OPENAI_API_BASE for Azure if configured.
  const model = new ChatOpenAI({
    model:
      process.env.AZURE_OPENAI_MODEL ||
      process.env.OPENAI_MODEL ||
      "gpt-4o-mini",
    temperature: 0.2,
  });

  // Simple prompt template wrapper: gives the assistant explicit instruction about allowed tool calls
  const systemInstruction = `You are an assistant that may propose actions like create_project. Only propose create_project when the user explicitly requests creating a project. When proposing create_project, output a tool call named create_project with arguments matching the schema.`;

  const agent = (LangChain as any).createAgent({
    model,
    tools: [createProjectTool],
    systemMessage: systemInstruction as any,
  });

  // Prepare messages for the agent: include history as human/assistant messages
  const messages = [] as any[];
  if (history && history.length) {
    for (const h of history) {
      if (h.role === "user")
        messages.push(new (LangChain as any).HumanMessage(h.content));
      else messages.push(new (LangChain as any).HumanMessage(h.content));
    }
  }
  messages.push(new (LangChain as any).HumanMessage(message));

  // Stream from the agent
  const stream = await agent.stream({ messages }, { streamMode: "values" });

  let finalText = "";
  let finalToolCalls: any[] = [];

  for await (const chunk of stream) {
    try {
      const lastMessage = chunk.messages?.at(-1);
      if (lastMessage) {
        if (lastMessage.content) {
          // Emit incremental content via callback when available.
          const text = lastMessage.content;
          finalText = text; // keep last seen
          if (onToken) onToken(text);
        }

        // Collect any tool calls if present
        if (
          Array.isArray(lastMessage.tool_calls) &&
          lastMessage.tool_calls.length > 0
        ) {
          for (const tc of lastMessage.tool_calls) {
            finalToolCalls.push(tc);
          }
        }
      }
    } catch (e) {
      // ignore streaming parse errors
      console.debug("langchain stream chunk parse error", e);
    }
  }

  // Normalize tool calls into actions
  const actions: any[] = [];
  for (const tc of finalToolCalls) {
    const name = tc.name;
    let args = tc.args;
    // args might be a JSON string
    try {
      if (typeof args === "string") args = JSON.parse(args);
    } catch (e) {
      // leave as-is
    }
    actions.push({ type: name, project: args });
  }

  return { text: finalText, actions };
};

export default { processMessage };
