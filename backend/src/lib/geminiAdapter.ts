import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import trainingDoc from "./geminiTraining.json";

dotenv.config();

type Message = { role: string; content: string };
type ProcessParams = {
  userId: string;
  chatId: string;
  message: string;
  history: Message[];
  onToken?: (token: string) => void;
};

export type GeminiProjectAction = {
  type: "create_project";
  project?: {
    title?: string;
    description?: string;
    lists?: Array<{
      title?: string;
      tasks?: Array<{
        title?: string;
        description?: string;
      }>;
    }>;
  };
};

export type GeminiResponse = {
  text: string;
  actions?: GeminiProjectAction[];
};

type TrainingDoc = {
  persona?: string;
  goals?: string[];
  instructions?: string[];
  examples?: { user: string; assistant: string }[];
  formatting?: string;
};

const MAX_INPUT_CHARS = 4000;
const DEFAULT_FALLBACK =
  "Sem acesso ao Gemini agora. Anote seus próximos passos manualmente e tente novamente em instantes.";
const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const TEMPERATURE = Number(process.env.GEMINI_TEMPERATURE ?? "0.2") || 0.2;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const client = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

const systemInstruction = (() => {
  const doc = trainingDoc as TrainingDoc;
  const chunks: string[] = [];
  if (doc.persona) chunks.push(`Persona: ${doc.persona}`);
  if (doc.goals?.length) {
    chunks.push(`Objetivos:\n- ${doc.goals.join("\n- ")}`);
  }
  if (doc.instructions?.length) {
    chunks.push(`Diretrizes:\n- ${doc.instructions.join("\n- ")}`);
  }
  if (doc.formatting) {
    chunks.push(`Formato preferido: ${doc.formatting}`);
  }
  if (doc.examples?.length) {
    const formatted = doc.examples
      .map(
        (ex, idx) =>
          `Exemplo ${idx + 1}:\nUsuário: ${ex.user}\nAssistente: ${
            ex.assistant
          }`
      )
      .join("\n\n");
    chunks.push(formatted);
  }
  return (
    process.env.GEMINI_SYSTEM_PROMPT?.trim() ||
    chunks.join("\n\n") ||
    "Você é o copiloto Planeja-AI."
  );
})();

const toGeminiRole = (role: string) => (role === "user" ? "user" : "model");

const sanitize = (value: string) => {
  if (!value) return "";
  const trimmed = value.trim();
  if (trimmed.length <= MAX_INPUT_CHARS) return trimmed;
  return trimmed.slice(trimmed.length - MAX_INPUT_CHARS);
};

const convertHistory = (history: Message[]) =>
  history
    .filter(
      (msg) => typeof msg.content === "string" && msg.content.trim().length > 0
    )
    .map((msg) => ({
      role: toGeminiRole(msg.role),
      parts: [{ text: sanitize(msg.content) }],
    }));

const emitFallback = (input: string, onToken?: (token: string) => void) => {
  const fallback = `Assistant reply to: ${input}`;
  if (onToken) fallback.split(/\s+/).forEach((token) => onToken(`${token} `));
  return fallback;
};

const processMessage = async ({
  message,
  history,
  onToken,
}: ProcessParams): Promise<GeminiResponse> => {
  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return { text: "", actions: [] };
  }

  const content = sanitize(message);

  if (!client) {
    const text = emitFallback(content, onToken);
    return { text, actions: [] };
  }

  try {
    const model = client.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction,
    });

    const contents = [
      ...convertHistory(history),
      {
        role: "user" as const,
        parts: [{ text: content }],
      },
    ];

    const stream = await model.generateContentStream({
      contents,
      generationConfig: {
        temperature: TEMPERATURE,
        maxOutputTokens: 2048,
        topP: 0.95,
        topK: 32,
      },
    });

    let finalText = "";
    for await (const chunk of stream.stream) {
      const chunkText = chunk.text();
      if (!chunkText) continue;
      finalText += chunkText;
      if (onToken) {
        onToken(chunkText);
      }
    }

    const text = finalText.trim() || DEFAULT_FALLBACK;
    return { text, actions: [] };
  } catch (error) {
    console.error("Gemini adapter error", error);
    const text = emitFallback(content, onToken);
    return { text, actions: [] };
  }
};

export default { processMessage };
