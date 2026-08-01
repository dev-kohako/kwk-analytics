# 🍽️ KWK Analytics — Backend

> API GraphQL para análise de dados operacionais de restaurantes.
> **Apollo Server 3** · **Prisma 6** · **PostgreSQL 16** · **Zod** — rodando em **Bun** ou **Node 20+**.

📄 Visão geral do produto e do monorepo: [README raiz](../README.md)

---

## 🚀 O que este serviço entrega

- **Pivot dinâmico** — o cliente escolhe dimensões, métricas e filtros; o servidor monta o SQL
- **Comparação entre períodos** — Δ absoluto e Δ% calculados no backend
- **Insights automáticos** — leituras textuais dos últimos 30 dias vs. os 30 anteriores
- **Dashboards persistidos** — salvos como JSON no Postgres
- **Análises prontas** — top produtos, tendência de entrega por região, clientes perdidos

Toda leitura analítica passa pela materialized view **`mv_sales_fact`**, que resolve antecipadamente os joins entre vendas, produtos, lojas, canais e clientes.

---

## 🧩 Stack

| Tecnologia | Função |
|---|---|
| **Apollo Server 3** (standalone) | Servidor GraphQL — sem Express na frente |
| **Prisma 6** | Client tipado; queries analíticas via `$queryRaw` |
| **PostgreSQL 16** | Banco relacional + materialized view |
| **Zod** | Validação dos inputs GraphQL e da saída do modelo de IA |
| **Redis** (opcional) | Cache compartilhado entre réplicas, via `ioredis` |
| **LLM via API OpenAI-compatible** (opcional) | Camada de IA sobre os insights |
| **Jest + ts-jest** | Testes unitários e de integração |
| **Docker Compose** | Backend + banco em um comando |
| **Bun** | Runtime usado na imagem Docker (`oven/bun:1`) |

---

## 🧱 Estrutura de pastas

```
backend/
├── prisma/
│   └── schema.prisma            # introspectado do banco do desafio (20 models)
├── src/
│   ├── controllers/
│   │   ├── analytics/
│   │   │   ├── aiAnalytics/     # camada de IA sobre os insights
│   │   │   ├── pivot.controller.ts              # runPivot · getPivotFieldValues
│   │   │   ├── topProducts.controller.ts
│   │   │   ├── autoInsights.controller.ts
│   │   │   ├── deliveryRegionTrend.controller.ts
│   │   │   ├── lostButLoyal.controller.ts
│   │   │   └── dashboard.controller.ts
│   │   └── index.ts             # barrel dos controllers
│   ├── graphql/
│   │   ├── schema.ts            # typeDefs (gql tag)
│   │   ├── resolvers.ts         # resolvers + scalar JSON
│   │   └── context.ts
│   ├── lib/
│   │   ├── analytics/stats.ts   # tendência, anomalia, Pareto, extremos
│   │   ├── ai.ts                # cliente LLM provider-agnóstico
│   │   ├── prisma.ts            # client singleton
│   │   ├── redis.ts             # cache L2 opcional
│   │   └── sql.ts               # builder do pivot + allow-list de identificadores
│   ├── types/                   # tipos por feature
│   ├── utils/
│   │   ├── cache.ts             # cache em duas camadas (memória + Redis)
│   │   ├── errors.ts            # AppError
│   │   └── resolverWrapper.ts   # rate limit + normalização de erros
│   ├── validation/              # schemas Zod
│   └── index.ts                 # bootstrap do Apollo Server
├── sql/
│   └── mv_sales_fact.sql        # DDL da materialized view (setup obrigatório)
├── tests/                       # 10 suítes de integração
├── Dockerfile
├── jest.config.js
└── .env.example
```

---

## ⚙️ Execução

### Variáveis de ambiente

Copie `.env.example` para `.env`:

```env
PORT=4000
DATABASE_URL=postgresql://challenge:challenge_2024@localhost:5432/challenge_db
PRISMA_CLIENT_ENGINE_TYPE=binary

# opcionais
REDIS_URL=redis://localhost:6379   # sem isso, o cache é só in-memory
AI_API_KEY=                        # sem isso, os insights são só determinísticos
```

O `.env.example` traz as combinações prontas de `AI_BASE_URL`/`AI_MODEL` para Groq, OpenRouter, Ollama e DeepSeek. No boot o servidor imprime quais camadas subiram:

```
🚀 Analytics GraphQL ready at http://localhost:4000/
   cache:   memory + redis
   insights: regras + IA (llama-3.3-70b-versatile)
```

### Com Docker (a partir da **raiz** do repositório)

```bash
docker compose up --build
```

Sobe dois containers: `nola-db` (PostgreSQL 16) e `nola-backend`.
API disponível em 👉 **http://localhost:4000/**

> O `docker-compose.yml` fica na raiz do monorepo, não nesta pasta. O serviço lê `backend/.env` via `env_file`.

### Local, sem Docker

```bash
bun install          # ou: npm install
bunx prisma generate
bun run dev          # ts-node --transpile-only src/index.ts
```

---

## 🗄️ Banco de dados

O `schema.prisma` foi **introspectado** do banco do desafio (`prisma db pull`) e contém 20 models — entre eles `sales`, `product_sales`, `products`, `stores`, `channels`, `customers`, `delivery_sales`, `coupons`. O único model criado pela aplicação é:

```prisma
model dashboard {
  id         Int       @id @default(autoincrement())
  name       String    @db.VarChar(255)
  config     Json
  created_at DateTime? @default(now()) @db.Timestamp(6)
}
```

Credenciais provisionadas pelo Docker Compose:

| Variável (compose) | Valor |
|---|---|
| `POSTGRES_USER` | `challenge` |
| `POSTGRES_PASSWORD` | `challenge_2024` |
| `POSTGRES_DB` | `challenge_db` |

> A aplicação em si não lê essas variáveis — ela usa apenas `DATABASE_URL`.

---

## ⚡ Performance e Escalabilidade

### 🚀 Materialized view + índices

**Passo obrigatório de setup.** Nenhum controller consulta as tabelas originais; todos leem de `mv_sales_fact`. Rode este SQL após carregar o dataset:

```bash
psql "$DATABASE_URL" -f backend/sql/mv_sales_fact.sql
```

O script vive em [`sql/mv_sales_fact.sql`](sql/mv_sales_fact.sql) — cria a view e os três índices, e é **idempotente** (pode rodar mais de uma vez sem efeito colateral).

> ⚠️ **`delivery_minutes` é um placeholder.** A expressão `s.created_at - s.created_at` sempre resulta em `0` — o dataset do desafio não traz timestamp de entrega. Enquanto não existir esse campo, a métrica `delivery_minutes` e a query `deliveryRegionTrend` retornam zeros. A correção é trocar por `entregue_em - s.created_at` assim que a coluna existir.

A view é estática: após novas cargas de dados é preciso rodar `REFRESH MATERIALIZED VIEW mv_sales_fact;`.

### Outras otimizações

- **Cache em duas camadas** (`utils/cache.ts`) — L1 é um `Map` no processo, L2 é o Redis quando `REDIS_URL` existe. Se o Redis cair, a L1 continua respondendo sozinha
- **Paginação server-side** no `pivot` via `limit`
- **Agregações em paralelo** — `prisma.$transaction([...])` nos insights, `Promise.all` nas comparações de período
- **`cache: "bounded"`** no Apollo, evitando crescimento indefinido do cache de queries

---

## 🧠 Como os insights são gerados

A query `autoInsights` responde em duas camadas.

### 1. Camada determinística (sempre presente)

Um único `$transaction` carrega os agregados dos últimos 30 dias contra os 30 anteriores — receita, pedidos, série diária, canais, produtos, dias da semana e tempo de entrega. Em cima disso rodam as funções puras de `lib/analytics/stats.ts`:

| Análise | O que produz |
|---|---|
| Variação entre janelas | Receita, pedidos e ticket médio com Δ e Δ% |
| Regressão linear | Tendência dentro da janela, com `r²` como confiança |
| Z-score | Dias que fogem do padrão (pico ou queda) |
| Pareto | Quantos produtos concentram metade da receita |
| Extremos | Dia mais forte e mais fraco da semana |

Cada insight sai tipado, não só como texto: `metric`, `value`, `previousValue`, `deltaPercent`, `direction`, `dimension`, `entity`, `severity`, `suggestion` e `confidence`. O cliente pode ordenar por severidade ou montar um KPI a partir do mesmo objeto.

Insights sem lastro são **omitidos**, não preenchidos com zero — é por isso que o tempo de entrega não aparece enquanto `delivery_minutes` for o placeholder.

### 2. Camada de IA (opcional, aditiva)

Se houver chave configurada, o resumo agregado vai para um LLM que devolve leituras adicionais, marcadas com `generatedBy: ai`.

```env
AI_API_KEY=sua-chave
AI_BASE_URL=https://api.groq.com/openai
AI_MODEL=llama-3.3-70b-versatile
```

Funciona com qualquer provedor que fale o dialeto OpenAI — **Groq**, **OpenRouter** (modelos `:free`), **Ollama** local ou **DeepSeek**. Ver `.env.example` para as combinações prontas.

Garantias da camada:

- **Nunca derruba a query.** Sem chave, com timeout, com cota estourada ou com resposta malformada, `generateAIInsights` devolve `[]` e a resposta segue com os insights de regra.
- **A saída é validada com Zod** e limpa de HTML antes de entrar na resposta. Texto de LLM é input não confiável.
- **O modelo não vê dado bruto.** Recebe só o resumo agregado — sem linhas, sem id ou nome de cliente.
- **O prompt proíbe inventar número**, e o que ele devolve fica em campos separados dos determinísticos, com `generatedBy` explícito.

---

## 📡 API GraphQL

| Operação | Descrição |
|---|---|
| `pivot(input)` | Pivot dinâmico → `{ rows, sql }` |
| `pivotFieldValues(input)` | Valores distintos de um campo (autocomplete de filtros) |
| `topProducts(input)` | Top produtos com faturamento atual, anterior e Δ% |
| `deliveryRegionTrend(input)` | Variação do tempo médio de entrega por região |
| `lostButLoyal` | Clientes recorrentes que pararam de comprar |
| `autoInsights` | Insights textuais automáticos |
| `dashboards` / `dashboard(id)` | Dashboards salvos |
| `saveDashboard(input)` *(mutation)* | Persiste um dashboard |

### Campos aceitos pelo pivot

Definidos como allow-list em `src/lib/sql.ts`:

- **Dimensões** — `store_id`, `channel`, `product_id`, `customer_id`, `sold_date`, `dow`, `hour_of_day`, `delivery_region`
- **Métricas** — `revenue`, `quantity`, `sale_id`, `customer_id`, `delivery_minutes`
- **Funções** — `sum`, `avg`, `count`, `count_distinct`

Qualquer identificador fora dessas listas é rejeitado com erro 400.

<details>
<summary>Exemplo — pivot</summary>

```graphql
query {
  pivot(
    input: {
      dimensions: ["channel"]
      measures: [
        { field: "revenue", fn: sum, alias: "total_faturamento" }
        { field: "sale_id", fn: count, alias: "num_vendas" }
      ]
      dateRange: { from: "2025-09-01", to: "2025-10-31" }
      limit: 10
    }
  ) {
    sql
    rows
  }
}
```
</details>

<details>
<summary>Exemplo — topProducts</summary>

```graphql
query {
  topProducts(
    input: {
      channel: "iFood"
      dow: 3
      hourFrom: 10
      hourTo: 22
      period: {
        dateFrom: "2025-10-01"
        dateTo: "2025-10-31"
        prevDateFrom: "2025-09-01"
        prevDateTo: "2025-09-30"
      }
    }
  ) {
    product_id
    total_itens
    faturamento
    faturamento_prev
    delta_percent
  }
}
```
</details>

### Comparação de períodos

```
delta        = atual - anterior
deltaPercent = (delta / anterior) * 100
```

---

## 🔒 Segurança e validação

- **Zod** valida todo input antes de chegar ao banco
- **Allow-list de identificadores SQL** — a query é dinâmica, mas nenhum nome de campo vem do usuário sem checagem
- **Valores sempre parametrizados** em `$queryRaw` (template tag do Prisma)
- **Rate limit** por janela de 60s no `wrapResolver`, aplicado aos 10 resolvers
- **`csrfPrevention: true`** e **introspection desligada em produção**
- **`formatError`** normaliza a resposta e não vaza stack trace

---

## 🧪 Testes

```bash
bun run test                                # ou: npm test
bunx jest --runInBand --detectOpenHandles   # útil para diagnosticar handles abertos
```

13 suítes em `tests/`, divididas em dois grupos:

| Grupo | Suítes | Precisa de banco? |
|---|---|---|
| **Unitárias** | `stats`, `buildRuleInsights`, `ai`, `cache`, `wrapResolver` | Não |
| **Integração** | `runPivot`, `getPivotFieldValues`, `getTopProducts`, `getAutoInsights`, `getDeliveryRegionTrend`, `getLostButLoyal`, `saveDashboard`, `getDashboardById` | Sim |

As unitárias cobrem o motor estatístico, a geração de insights por regra e o comportamento da camada de IA (desligada, timeout, resposta fora do schema, HTML na saída do modelo) — tudo sem rede e sem banco.

> `tests/setup.ts` tenta conectar no Postgres mas não falha se ele não existir: as suítes de integração quebram sozinhas e as unitárias seguem rodando em qualquer máquina.

---

## 🧠 Decisões de Arquitetura (ADR)

### 1. GraphQL em vez de REST
O pivot é combinatório por natureza (dimensões × métricas × filtros × período). Endpoints REST fixos exigiriam ou um endpoint por combinação, ou um endpoint genérico que aceita SQL — o primeiro não escala, o segundo é um buraco de segurança. Um `PivotInput` tipado resolve os dois problemas.

### 2. Apollo Server standalone, sem Express
Não há rota HTTP fora do endpoint GraphQL, nem upload, nem webhook. Adicionar Express seria uma camada sem função.

### 3. SQL montado à mão em vez de agregações do Prisma
O `groupBy` do Prisma não cobre múltiplas métricas com aliases arbitrários nem `count_distinct`. `src/lib/sql.ts` monta o SQL e devolve a string junto com o resultado — quem analisa dado precisa conseguir auditar o número.

### 4. Materialized view em vez de otimizar os joins
Tirar o custo dos joins do caminho da requisição foi o ganho mais barato. O preço é a view ficar defasada entre refreshes — aceitável para dados de vendas do dia anterior.

### 5. Cache in-memory em vez de Redis
Uma única instância, TTL curto, sem necessidade de invalidação coordenada. Redis entra quando houver mais de um processo — hoje seria infraestrutura sem problema correspondente.

### 6. Validação em duas camadas
Zod garante o **formato**; a allow-list de `sql.ts` garante o **domínio**. Um input pode ser bem formado e ainda assim pedir um campo que não existe.

---

## ⚖️ Trade-offs

| Decisão | Prós | Contras |
|---|---|---|
| **GraphQL (Apollo 3)** | Query flexível, schema tipado | Apollo 3 está em manutenção; migrar para o `@apollo/server` 4 é dívida conhecida |
| **`$queryRaw`** | Controle total do SQL | Perde a tipagem automática do Prisma; exige a allow-list |
| **Materialized view** | Consulta muito mais rápida | Dados defasados até o `REFRESH` |
| **Cache in-memory** | Zero infra | Não compartilhado entre réplicas |
| **Testes de integração** | Validam o SQL de verdade | Precisam de banco populado; não rodam em CI limpo |

---

## 🗺️ Limitações conhecidas

- **Sem autenticação** — `context.ts` devolve um contexto vazio; a API é aberta, pensada para demonstração
- **Rate limit compartilhado** — o wrapper agrupa por IP, mas o contexto não carrega o IP, então o balde é único para todos os clientes
- **`delivery_minutes` sempre zero** — ver aviso na seção da materialized view
- **`src/db/pool.ts`** é um pool `pg` que nenhum módulo importa — resquício da estrutura inicial
- **`codegen.yml`** aponta para caminhos que não existem mais; o codegen ativo é o `frontend/codegen.ts`
- **Refresh manual da MV** — sem job agendado
- **Insights de IA não são cacheados separadamente** — vão junto do TTL de `autoInsights`, então uma chamada ao modelo pode acontecer a cada expiração

---

## 👤 Autor

**Joseph Kawe** — Full-Stack Engineer · KWK Tech
📧 joseph@kwktech.dev · 🌐 [kwktech.dev](https://kwktech.dev) · 💼 [LinkedIn](https://www.linkedin.com/in/josephkawe) · 🐙 [@dev-kohako](https://github.com/dev-kohako)

## 📜 Licença

MIT © 2025 — KWK Tech. Uso educacional e demonstrativo para o **Desafio Nola**.
