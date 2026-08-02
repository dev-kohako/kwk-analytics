# KWK Analytics

> **"Power BI para restaurantes"** — plataforma de analytics no-code onde o gestor monta suas próprias análises, salva dashboards e recebe insights automáticos sobre a operação.

<p align="left">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-000?logo=nextdotjs&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white">
  <img alt="GraphQL" src="https://img.shields.io/badge/GraphQL-Apollo-E10098?logo=graphql&logoColor=white">
  <img alt="Prisma" src="https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white">
  <img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-green">
</p>

🔗 **Demo:** [kwk-analytics.vercel.app](https://kwk-analytics.vercel.app/) · **API:** GraphQL na raiz (`/`)

---

## 🚀 O problema

Maria é dona de três restaurantes e vende por iFood, Rappi, WhatsApp e app próprio.
Ela **tem** os dados — o que falta é a ferramenta para transformá-los em decisão.

O KWK Analytics resolve isso com três pilares:

| Pilar | O que entrega |
|---|---|
| **Explorar** | Um roteiro de quatro passos: escolha o que medir, como separar e o período — sem escrever SQL |
| **Dashboards** | Salve qualquer análise como dashboard e reabra depois com gráficos e KPIs |
| **Insights** | Leituras automáticas do período (canal líder, produto destaque, tempo de entrega) |

---

## ✨ Funcionalidades

### 1. Explorar — `/explorar`
- Dimensões disponíveis: `store_id`, `channel`, `product_id`, `customer_id`, `sold_date`, `dow`, `hour_of_day`, `delivery_region`
- Métricas: `sum`, `avg`, `count`, `count_distinct` sobre `revenue`, `quantity`, `sale_id`, `customer_id`, `delivery_minutes`
- Filtros dinâmicos com autocomplete de valores reais (`pivotFieldValues`)
- Intervalo de datas + **comparação com o período anterior** (Δ e %)
- Paginação server-side e **exportação para CSV**
- **Salvar como dashboard** em um clique
- A query exibe o **SQL gerado** — transparência total sobre o que foi executado

### 2. Dashboards — `/dashboards` e `/dashboards/[id]`
- Lista de dashboards salvos (persistidos no Postgres como `config` JSON)
- Gráficos de barra, linha e pizza (Recharts) + KPI cards
- Análises prontas: **Top Produtos**, **Tendência de entrega por região**, **Lost but Loyal** (clientes fiéis que pararam de comprar)

### 3. Insights automáticos — `/insights`
Duas camadas sobre os 30 dias até a última venda registrada, contra os 30 anteriores:

- **Determinística (sempre presente):** variação de receita, pedidos e ticket médio; tendência por regressão linear; dias fora do padrão por z-score; concentração de Pareto; sazonalidade por dia da semana; canal em retração
- **IA (opcional):** com uma chave de provedor gratuito configurada, um modelo lê o mesmo resumo agregado e acrescenta leituras marcadas com `generatedBy: ai`
- Cada insight vem tipado — `severity`, `metric`, `value`, `previousValue`, `deltaPercent`, `entity` e `suggestion` — e não apenas como frase solta
- Sinal sem lastro é omitido, não preenchido com zero

### 4. UX
- Página de entrada estática em `/` e visão geral da operação em `/painel`
- Mobile-first, dark/light mode (`next-themes`), skeleton loaders, estados de vazio/erro
- Microinterações com Motion, feedback com Sonner, componentes acessíveis (Radix/shadcn)

---

## 🏗️ Arquitetura

Monorepo com dois módulos independentes:

```
┌──────────────────────┐      GraphQL       ┌──────────────────────┐      SQL       ┌───────────────┐
│  frontend (Next 16)  │ ──────────────────▶│  backend (Apollo 3)  │ ──────────────▶│  PostgreSQL   │
│  Apollo Client 4     │                    │  Zod · Prisma 6      │                │ mv_sales_fact │
│  Zustand · shadcn/ui │◀────────────────── │  cache memória+Redis │◀────────────── │  + índices    │
└──────────────────────┘   rows + sql       └──────────┬───────────┘                └───────────────┘
                                                       │ resumo agregado (sem PII)
                                                       ▼
                                            ┌──────────────────────┐
                                            │  LLM opcional        │
                                            │  Groq · OpenRouter   │
                                            │  Ollama · DeepSeek   │
                                            └──────────────────────┘
```

### Fluxo de uma análise
1. O usuário monta a análise em Explorar, escolhendo métricas, cortes e período.
2. O frontend envia um `PivotInput` dinâmico para o resolver `pivot`.
3. O backend valida com **Zod** e passa por um **allow-list** de campos (`src/lib/sql.ts`) — nenhum identificador vem do usuário sem checagem, o que fecha a porta para SQL injection.
4. A query roda sobre a materialized view `mv_sales_fact`, que já resolve os joins pesados (vendas × produtos × lojas × canais × clientes).
5. O resultado volta como `{ rows, sql }`, é comparado com o período anterior e renderizado.

---

## ⚙️ Stack

### Frontend (`/frontend`)
| Ferramenta | Uso |
|---|---|
| **Next.js 16 (App Router)** + **React 19** | Rotas, layouts e Server Components |
| **TypeScript 5** | Tipagem ponta a ponta |
| **Apollo Client 4** | Comunicação GraphQL e cache normalizado |
| **GraphQL Codegen** | Tipos gerados a partir do schema do backend |
| **Zustand 5** | Estado global (filtros, dashboards) |
| **Tailwind CSS 4 + shadcn/ui (Radix)** | UI acessível e consistente |
| **Recharts 3** | Gráficos |
| **Motion**, **Sonner**, **Lucide** | Animações, toasts e ícones |
| **Jest + Testing Library** | Testes de UI e hooks |

### Backend (`/backend`)
| Ferramenta | Uso |
|---|---|
| **Apollo Server 3** (standalone) | Servidor GraphQL |
| **Prisma 6** | Client tipado e acesso ao Postgres |
| **PostgreSQL 16** | Banco relacional + materialized view |
| **Zod** | Validação dos inputs GraphQL e da saída do modelo |
| **Redis** (opcional) | Cache L2 compartilhado entre réplicas |
| **LLM OpenAI-compatible** (opcional) | Camada de IA sobre os insights — Groq, Gemini, OpenRouter, Ollama ou DeepSeek |
| **Jest** | Testes unitários e de integração |
| **Docker Compose** | Backend + banco em um comando |

---

## 📡 API GraphQL

| Operação | Descrição |
|---|---|
| `pivot(input)` | Consulta pivot dinâmica → `{ rows, sql }` |
| `pivotFieldValues(input)` | Valores distintos de um campo (autocomplete de filtros) |
| `topProducts(input)` | Top produtos com faturamento atual, anterior e Δ% |
| `deliveryRegionTrend(input)` | Variação do tempo médio de entrega por região |
| `lostButLoyal` | Clientes recorrentes que pararam de comprar |
| `autoInsights` | Insights textuais automáticos |
| `dashboards` / `dashboard(id)` | Dashboards salvos |
| `saveDashboard(input)` *(mutation)* | Persiste um dashboard |

<details>
<summary>Exemplo de query pivot</summary>

```graphql
query {
  pivot(
    input: {
      dimensions: ["channel"]
      measures: [
        { field: "revenue", fn: sum, alias: "faturamento" }
        { field: "sale_id", fn: count, alias: "pedidos" }
      ]
      dateRange: { from: "2025-09-01", to: "2025-10-31" }
      limit: 10
    }
  ) {
    rows
    sql
  }
}
```
</details>

---

## 📦 Como rodar

### Pré-requisitos
- **Bun 1.x** ou **Node 20+**
- **PostgreSQL 16** (ou Docker)

### 1. Clone
```bash
git clone https://github.com/dev-kohako/kwk-analytics.git
cd kwk-analytics
```

### 2. Banco + backend via Docker
```bash
cp backend/.env.example backend/.env   # preencha DATABASE_URL
docker compose up --build
```
> Sobe `kwk-db` (Postgres 16) e `kwk-backend` em **http://localhost:4000/**.

### 3. Prepare os dados

**Não tem base ainda?** Um comando popula tudo com ~90 dias de vendas fictícias e já cria a materialized view:

```bash
cd backend && bun run seed
```

**Já tem base própria?** Carregue-a e crie a materialized view `mv_sales_fact` — todas as análises leem dela:

```bash
psql "$DATABASE_URL" -f backend/sql/mv_sales_fact.sql
```

Se a base tem histórico antigo e os últimos 30 dias aparecem vazios, `bun run seed -- --append` acrescenta movimento recente **sem apagar nada**, reaproveitando suas lojas, canais, produtos e clientes.

> Detalhes e limitações em [backend/README.md](backend/README.md#-performance-e-escalabilidade).

### 4. Frontend
```bash
cd frontend
bun install
cp .env.example .env.local
bun dev
```
> Disponível em **http://localhost:3000**.

<details>
<summary>Rodando o backend sem Docker</summary>

```bash
cd backend
bun install
bunx prisma generate
bun run dev
```
</details>

### Variáveis de ambiente

**`backend/.env`**
```env
PORT=4000
DATABASE_URL=postgresql://challenge:challenge_2024@localhost:5432/challenge_db
PRISMA_CLIENT_ENGINE_TYPE=binary

# Opcionais — a API sobe e responde sem nenhum dos dois.
REDIS_URL=redis://localhost:6379
AI_API_KEY=
AI_BASE_URL=https://api.groq.com/openai
AI_MODEL=llama-3.3-70b-versatile
```

> Sem `REDIS_URL` o cache é in-memory. Sem `AI_API_KEY` os insights são apenas determinísticos. Combinações prontas de provedores gratuitos estão em [backend/.env.example](backend/.env.example).

**`frontend/.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/
```

---

## 🧪 Testes

```bash
cd frontend && bun test          # páginas, hooks, store e queries
cd backend  && bunx jest         # controllers: pivot, topProducts, insights, cache…
```

Os testes do backend são de **integração** e esperam um banco populado com `mv_sales_fact`.

---

## ⚡ Performance

- **Materialized view `mv_sales_fact`** pré-resolve os joins entre vendas, produtos, lojas, canais e clientes — o custo do join sai do caminho da requisição.
- **Índices** em `sold_date`, `channel` e `product_id`, que são os cortes mais frequentes.
- **Cache in-memory com TTL** (`src/utils/cache.ts`) para repetições da mesma consulta, com limpeza periódica.
- **Agregações em paralelo** via `prisma.$transaction` nos insights.
- Paginação server-side no `pivot` — o frontend nunca recebe o dataset inteiro.

---

## 🧠 Decisões arquiteturais

| Decisão | Por quê |
|---|---|
| **GraphQL em vez de REST** | O pivot é dinâmico por natureza; endpoints fixos não cobrem a combinatória de dimensões × métricas × filtros |
| **Allow-list de identificadores SQL** | Query dinâmica sem abrir brecha de injection; campo fora da lista é rejeitado com 400 |
| **Materialized view** | Mover o custo dos joins para fora do request foi o ganho mais barato e mais efetivo |
| **Zustand em vez de Redux** | Estado global pequeno (filtros e dashboards); Redux traria boilerplate sem retorno |
| **shadcn/ui em vez de MUI/Chakra** | Componentes acessíveis, sem bundle extra e com controle total do estilo |
| **Retornar o `sql` na resposta** | Quem analisa dado precisa confiar no número — expor a query é a forma mais direta |
| **Dashboard como JSON** | `config` em JSONB deixa o formato do dashboard evoluir sem migração |

ADRs completos: [frontend/README.md](frontend/README.md) e [backend/README.md](backend/README.md#-decisões-de-arquitetura-adr).

---

## 🧱 Estrutura

```
.
├── backend/
│   ├── prisma/schema.prisma       # schema introspectado da base de vendas
│   ├── src/
│   │   ├── controllers/analytics/ # pivot, topProducts, autoInsights, lostButLoyal…
│   │   ├── graphql/               # schema.ts · resolvers.ts · context.ts
│   │   ├── lib/                   # prisma.ts · sql.ts (builder + allow-list)
│   │   ├── utils/                 # cache, erros, wrapper de resolver
│   │   ├── validation/            # schemas Zod
│   │   └── index.ts
│   └── tests/
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── (dashboard)/dashboards/[id]/
│       │   ├── (dashboard)/explorar/
│       │   ├── (dashboard)/painel/
│       │   └── (dashboard)/insights/
│       ├── components/            # charts/ · dashboard/ · ui/
│       ├── hooks/                 # useExplore, useInsights, useDashboardById…
│       ├── queries/ · store/ · types/ · validation/
│       └── lib/apollo/
└── docker-compose.yml
```

---

## 🗺️ Status e próximos passos

Entregue: pivot dinâmico, dashboards persistidos, insights determinísticos com camada opcional de IA, cache em duas camadas, comparação de períodos, export CSV, dark mode e testes.

Fora do escopo desta versão:
- **Autenticação / multi-tenant** — a API é aberta, pensada para o ambiente de demonstração
- **Compartilhamento por link público**
- **Refresh automático da materialized view** — hoje o `REFRESH` é manual

---

## 👤 Autor

**Joseph Kawe** — Full-Stack Engineer · KWK Tech
📧 joseph@kwktech.dev · 🌐 [kwktech.dev](https://kwktech.dev) · 💼 [LinkedIn](https://www.linkedin.com/in/josephkawe) · 🐙 [@dev-kohako](https://github.com/dev-kohako)

## 📜 Licença

MIT © 2025 — KWK Tech. Uso educacional e demonstrativo.
