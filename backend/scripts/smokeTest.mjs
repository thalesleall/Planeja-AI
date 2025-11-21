import fs from "fs";

const BASE_URL =
  process.env.BASE_URL?.replace(/\/$/, "") || "http://localhost:3002/api/v1";
const email = `qa+${Date.now()}@example.com`;
const password = "Planeja@123";
const name = "QA Bot";
const cookieJar = new Map();

const results = [];

function storeCookies(response) {
  const rawHeaders =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : response.headers.raw
      ? response.headers.raw()["set-cookie"]
      : null;
  const cookies =
    rawHeaders ||
    (response.headers.get("set-cookie")
      ? [response.headers.get("set-cookie")]
      : []);
  cookies.forEach((cookie) => {
    const [pair] = cookie.split(";");
    const [cookieName, value] = pair.split("=");
    if (cookieName && value) {
      cookieJar.set(cookieName.trim(), value.trim());
    }
  });
}

function getCookieHeader() {
  if (!cookieJar.size) return undefined;
  return Array.from(cookieJar.entries())
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");
}

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  const cookieHeader = getCookieHeader();
  if (cookieHeader) headers.Cookie = cookieHeader;
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  storeCookies(response);
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (err) {
    data = { parseError: err.message, raw: text };
  }

  const result = {
    path,
    method,
    status: response.status,
    ok: response.ok,
    body: data,
  };
  results.push(result);
  return result;
}

async function run() {
  console.log(`➡️  Testando backend em ${BASE_URL}`);
  console.log(`➡️  Registrando usuário ${email}`);
  const register = await request("/auth/register", {
    method: "POST",
    body: { name, email, password },
  });
  if (!register.ok) throw new Error(`Falha no registro: ${register.status}`);

  console.log("➡️  Fazendo login");
  const login = await request("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  if (!login.ok) throw new Error(`Falha no login: ${login.status}`);
  const accessToken = login.body?.token;
  if (!accessToken) throw new Error("Token não retornado no login");

  console.log("➡️  Consultando /auth/me");
  await request("/auth/me", { token: accessToken });

  console.log("➡️  Refresh de token");
  await request("/auth/refresh", { method: "POST" });

  console.log("➡️  Criando lista");
  const list = await request("/lists", {
    method: "POST",
    token: accessToken,
    body: {},
  });
  const listId = list.body?.list?.id;
  if (!listId) throw new Error("Lista não criada");

  console.log("➡️  Criando tarefa");
  await request(`/lists/${listId}/items`, {
    method: "POST",
    token: accessToken,
    body: {
      name: "Primeira tarefa",
      description: "Gerada pelo teste automático",
    },
  });

  console.log("➡️  Listando tarefas");
  await request("/tasks", { token: accessToken });

  console.log("\n✅ Smoke test concluído. Resumo:");
  for (const entry of results) {
    console.log(`- ${entry.method} ${entry.path} -> ${entry.status}`);
  }

  fs.writeFileSync(
    "smoke-test-report.json",
    JSON.stringify(
      { timestamp: new Date().toISOString(), email, results },
      null,
      2
    )
  );
  console.log("\n📄 Relatório salvo em backend/smoke-test-report.json");
}

run().catch((err) => {
  console.error("❌ Erro no smoke test:", err.message);
  process.exit(1);
});
