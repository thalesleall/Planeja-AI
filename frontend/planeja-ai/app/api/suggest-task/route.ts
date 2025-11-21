import { NextResponse } from "next/server";

type SuggestionRequest = {
  context?: string;
  timeframe?: string;
  project?: string;
};

const FALLBACK_SUGGESTIONS = [
  "Revisar prioridades da semana e separar 30 minutos para planejamento.",
  "Registrar três tarefas rápidas no Planeja-AI para limpar a mente antes de começar o dia.",
  "Organizar anexos da tarefa mais urgente e marcar próximos passos claros.",
  "Criar um checklist simples para o projeto principal e delegar o que puder.",
  "Tirar 15 minutos para responder mensagens pendentes do time e destravar dependências.",
];

const OPENAI_MODEL =
  process.env.OPENAI_MODEL || process.env.AZURE_OPENAI_MODEL || "gpt-4o-mini";
const OPENAI_BASE_URL =
  process.env.OPENAI_BASE_URL ||
  process.env.AZURE_OPENAI_ENDPOINT ||
  "https://api.openai.com/v1";

async function createSuggestionWithOpenAI(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY;
  if (!apiKey) return null;

  const endpoint = `${OPENAI_BASE_URL.replace(/\/$/, "")}/chat/completions`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content:
            "Você é um assistente de produtividade. Responda com uma sugestão de tarefa curta (máx. 200 caracteres) e acionável.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text().catch(() => "Erro desconhecido");
    console.warn("Falha ao consultar OpenAI para sugestão de task", error);
    return null;
  }

  const data = (await response.json().catch(() => null)) as {
    choices?: { message?: { content?: string } }[];
  } | null;

  const content = data?.choices?.[0]?.message?.content?.trim();
  return content || null;
}

function buildFallbackSuggestion(payload: SuggestionRequest) {
  const random =
    FALLBACK_SUGGESTIONS[
      Math.floor(Math.random() * FALLBACK_SUGGESTIONS.length)
    ];
  const prefix = payload.project ? `Projeto ${payload.project}: ` : "";
  const suffix = payload.timeframe ? ` (foque ${payload.timeframe})` : "";
  return `${prefix}${random}${suffix}`.trim();
}

export async function POST(req: Request) {
  try {
    const payload = ((await req.json().catch(() => ({}))) ||
      {}) as SuggestionRequest;
    const context = [
      payload.context?.trim(),
      payload.project ? `Projeto atual: ${payload.project}` : null,
      payload.timeframe ? `Prazo: ${payload.timeframe}` : null,
    ]
      .filter(Boolean)
      .join(" | ");

    const prompt =
      context.length > 0
        ? `Sugira UMA tarefa objetiva considerando: ${context}.`
        : "Sugira UMA tarefa objetiva para melhorar o planejamento pessoal hoje.";

    const openAISuggestion = await createSuggestionWithOpenAI(prompt).catch(
      () => null
    );
    const suggestion = openAISuggestion ?? buildFallbackSuggestion(payload);

    return NextResponse.json({
      suggestion,
      provider: openAISuggestion ? "openai" : "fallback",
    });
  } catch (error) {
    console.error("Erro em /api/suggest-task", error);
    return NextResponse.json(
      {
        suggestion: buildFallbackSuggestion({}),
        provider: "fallback",
        error: "Não foi possível gerar sugestão dinâmica no momento.",
      },
      { status: 200 }
    );
  }
}
