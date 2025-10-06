✅ To-Do App com Supabase e Next.js
Um aplicativo moderno de gerenciamento de tarefas (To-Do List) construído com Next.js 14, React, Supabase e Tailwind CSS.
Permite criar, listar, marcar como concluídas, editar e visualizar descrições de tarefas, além de gerar tarefas automáticas com IA.

🚀 Tecnologias Utilizadas
Next.js 14 (App Router)
React
Supabase
TypeScript
Tailwind CSS
Lucide Icons
shadcn/ui
⚙️ Funcionalidades
📝 Adicionar tarefas com título e descrição
🤖 Gerar sugestões automáticas de tarefas com IA
✅ Marcar tarefas como concluídas ou pendentes
✏️ Editar nome e descrição diretamente na lista
📊 Visualizar total de tarefas pendentes e concluídas
🗂️ Filtrar por status: Todas, Pendentes e Completas
☁️ Persistência de dados via Supabase
🎨 Interface moderna e responsiva
🧰 Estrutura do Projeto
📦 project-root/ ├── 📁 app/ # Páginas do Next.js (App Router) │ └── page.tsx # Página inicial com a lista de tarefas ├── 📁 components/ # Componentes reutilizáveis │ ├── add-task-form.tsx │ ├── analytics-cards.tsx │ └── task-list.tsx ├── 📁 lib/ │ └── supabase.ts # Conexão com o Supabase ├── 📁 public/ │ └── favicon.ico ├── 📄 README.md ├── 📄 package.json └── 📄 tailwind.config.ts

⚡ Como Executar o Projeto
1️⃣ Clone o repositório
git clone https://github.com/gabrielstorti55/Planeja-AI.git
cd Planeja-AI
2️⃣ Instale as dependências

npm install

# ou

yarn install
3️⃣ Configure o Supabase
Crie um projeto no Supabase e adicione suas credenciais no arquivo .env:

NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=seu_anon_key_aqui

🧩 Melhorias Futuras
💬 Notificações de tarefas atrasadas

🔄 Reordenar tarefas (drag & drop)

🌙 Tema escuro

📱 PWA para uso offline

🖼️ Preview

🟦 Minhas Tarefas
├── Pendentes: 3
├── Completas: 2
A interface utiliza Cards e Tabs, com um visual limpo e responsivo.

👨‍💻 Autor
Desenvolvido por Gabriel Storti Segalla
