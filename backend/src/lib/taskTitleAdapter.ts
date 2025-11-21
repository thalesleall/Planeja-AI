import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import trainingDoc from "./taskTitleTraining.json";

dotenv.config();

type TrainingDoc = {
  persona?: string;
  goal?: string;
  goals?: string[];
  instructions?: string[];
  examples?: { title: string; subtasks: string[]; notes?: string }[];
  formatting?: string;
};

type GenerateParams = {
  title: string;
  context?: string;
  limit?: number;
};

type SuggestionResult = {
  title: string;
  subtasks: string[];
  notes?: string;
  provider: "gemini" | "fallback";
  promptVersion: string;
  raw?: string;
  fallbackReason?: string;
};

const PROMPT_VERSION = "taskTitleTraining@2025-11-21";
const DEFAULT_LIMIT = 4;
const MAX_LIMIT = 5;
const MAX_TITLE_LENGTH = 180;
const MAX_ITEM_LENGTH = 120;
const MODEL_NAME =
  process.env.GEMINI_TASK_MODEL ||
  process.env.GEMINI_MODEL ||
  "gemini-1.5-flash";
const TEMPERATURE =
  Number(
    process.env.GEMINI_TASK_TEMPERATURE ??
      process.env.GEMINI_TEMPERATURE ??
      "0.25"
  ) || 0.25;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const client = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

const systemInstruction = (() => {
  const doc = trainingDoc as TrainingDoc;
  const chunks: string[] = [];
  if (doc.persona) {
    chunks.push(`Persona: ${doc.persona}`);
  }
  if (doc.goal) {
    chunks.push(`Objetivo principal: ${doc.goal}`);
  }
  if (doc.goals?.length) {
    chunks.push(`Metas:
- ${doc.goals.join("\n- ")}`);
  }
  if (doc.instructions?.length) {
    chunks.push(`Diretrizes:
- ${doc.instructions.join("\n- ")}`);
  }
  if (doc.examples?.length) {
    const rendered = doc.examples
      .map(
        (example, idx) =>
          `Exemplo ${idx + 1}:
Título: ${example.title}
Subtarefas:
${example.subtasks.map((task) => `- ${task}`).join("\n")}` +
          (example.notes ? `\nNotas: ${example.notes}` : "")
      )
      .join("\n\n");
    chunks.push(rendered);
  }
  if (doc.formatting) {
    chunks.push(`Formatação preferida: ${doc.formatting}`);
  }
  chunks.push(
    'Sempre responda COM APENAS um JSON válido no formato {"title":"...","subtasks":["..."],"notes":"... opcional"}.'
  );
  return chunks.join("\n\n");
})();

const fallbackTemplates = [
  "Mapear escopo inicial de {title}",
  "Listar recursos essenciais para {title}",
  "Agendar checkpoints para {title}",
  "Definir responsáveis chave de {title}",
  "Preparar materiais de suporte de {title}",
];

const sanitizeTitle = (title: string) =>
  title?.trim().slice(0, MAX_TITLE_LENGTH) ?? "";

const sanitizeSubtasks = (items: unknown, limit: number) => {
  if (!Array.isArray(items)) return [];
  const output: string[] = [];
  for (const item of items) {
    if (typeof item !== "string") continue;
    const normalized = item.trim();
    if (!normalized) continue;
    const clipped =
      normalized.length > MAX_ITEM_LENGTH
        ? `${normalized.slice(0, MAX_ITEM_LENGTH - 1)}…`
        : normalized;
    output.push(clipped);
    if (output.length >= limit) break;
  }
  return output;
};

const buildUserPrompt = (
  title: string,
  context: string | undefined,
  limit: number
) => {
  const lines = [
    `Título fornecido: "${title}"`,
    context ? `Contexto adicional: ${context}` : null,
    `Gere até ${limit} subtarefas objetivas (cada uma <= ${MAX_ITEM_LENGTH} caracteres).`,
    "Use verbos no infinitivo ou imperativo discreto e mantenha o texto em português.",
    "Retorne somente o JSON seguindo o formato descrito, sem explicações fora dele.",
  ].filter(Boolean);
  return lines.join("\n");
};

const extractJson = (raw: string) => {
  if (!raw) return null;
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) {
    return raw.trim();
  }
  return raw.slice(first, last + 1);
};

const parseResponse = (raw: string) => {
  const snippet = extractJson(raw);
  if (!snippet) return null;
  try {
    return JSON.parse(snippet) as {
      title?: string;
      subtasks?: string[];
      notes?: string;
    };
  } catch {
    return null;
  }
};

const buildFallback = (
  title: string,
  limit: number,
  reason: string
): SuggestionResult => {
  const safeTitle = title || "Planejamento";
  const suggestions: string[] = [];
  let idx = 0;
  while (suggestions.length < limit) {
    const template = fallbackTemplates[idx % fallbackTemplates.length];
    suggestions.push(template.split("{title}").join(safeTitle));
    idx += 1;
  }
  return {
    title: safeTitle,
    subtasks: suggestions,
    provider: "fallback",
    promptVersion: PROMPT_VERSION,
    fallbackReason: reason,
  };
};

const generateFromTitle = async ({
  title,
  context,
  limit,
}: GenerateParams): Promise<SuggestionResult> => {
  const normalizedTitle = sanitizeTitle(title);
  const maxSuggestions = Math.max(
    1,
    Math.min(limit ?? DEFAULT_LIMIT, MAX_LIMIT)
  );

  if (!normalizedTitle) {
    return buildFallback("Planejamento", maxSuggestions, "missing_title");
  }

  if (!client) {
    return buildFallback(normalizedTitle, maxSuggestions, "missing_api_key");
  }

  try {
    const model = client.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction,
    });

    const prompt = buildUserPrompt(
      normalizedTitle,
      context?.trim() || undefined,
      maxSuggestions
    );
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: TEMPERATURE,
        maxOutputTokens: 512,
        topP: 0.9,
        topK: 32,
      },
    });

    const raw =
      result.response?.text?.() ??
      result.response?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join(" ") ??
      "";
    const parsed = parseResponse(raw);
    const subtasks = sanitizeSubtasks(parsed?.subtasks, maxSuggestions);

    if (!subtasks.length) {
      return buildFallback(normalizedTitle, maxSuggestions, "empty_response");
    }

    return {
      title: parsed?.title?.trim() || normalizedTitle,
      subtasks,
      notes: parsed?.notes?.trim() || undefined,
      provider: "gemini",
      promptVersion: PROMPT_VERSION,
      raw,
    };
  } catch (error) {
    console.error("Gemini task title adapter error", error);
    return buildFallback(normalizedTitle, maxSuggestions, "gemini_error");
  }
};

export default {
  generateFromTitle,
};
