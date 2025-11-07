# 🍽️ Nola Challenge — KWK Analytics (Frontend)

> **"Power BI para Restaurantes" — Uma plataforma de analytics customizável para donos de restaurantes explorarem seus dados operacionais.**

## 🚀 Visão Geral

Maria é dona de três restaurantes e vende por canais como iFood, Rappi, WhatsApp e app próprio.  
Ela tem os dados — mas não tem a ferramenta para transformá-los em decisões.

O **KWK Analytics** é a resposta: uma plataforma **no-code**, **personalizável** e **rápida** para que gestores do food service possam **criar dashboards**, **explorar dados** e **gerar insights** em segundos.

---

## 🎯 Objetivos Atendidos

✅ Criar dashboards personalizados sem código (Pivot Builder)  
✅ Visualizar métricas que importam (KPIs de operação e vendas)  
✅ Comparar períodos e identificar tendências  
✅ Compartilhar análises com a equipe  
✅ UX responsiva, acessível e fluida  

---

## 🏗️ Arquitetura

O projeto é composto por **dois módulos principais**:

| Módulo | Stack | Descrição |
|--------|--------|-----------|
| **Frontend** | Next.js 15, React 18, TypeScript, Tailwind, Shadcn/UI, Zustand, Apollo Client | Interface de exploração e dashboards |
| **Backend** | Node.js, Apollo Server, Express, Prisma, PostgreSQL | API GraphQL para pivotagem, insights e dashboards |

### 📊 Fluxo de dados
1. O usuário define **dimensões, métricas e filtros** via Pivot Builder.
2. O frontend monta o **input dinâmico GraphQL** e envia ao resolver `pivot`.
3. O backend traduz o input em SQL otimizado (com índices e materialized views).
4. Os resultados são formatados, comparados (período anterior) e retornados.
5. O frontend exibe a análise em tabela responsiva, com export e opção de dashboard.

---

## ⚙️ Tecnologias Principais

### 🧩 Frontend
- **Next.js 15 (App Router)**
- **React 18 + TypeScript**
- **Apollo Client (GraphQL)**
- **Zustand** para estado global (filtros e dashboards)
- **Shadcn/UI + TailwindCSS** para UI moderna e acessível
- **Framer Motion** para microinterações suaves
- **Sonner** para feedbacks
- **Lucide Icons** para consistência visual

### 🧠 Backend
- **Apollo Server + Express**
- **Prisma ORM + PostgreSQL**
- **Zod** para validação de inputs
- **JWT** e **bcrypt** para autenticação
- **faker + scripts de seed** (500.000 vendas simuladas)
- **Materialized Views e índices SQL** para performance

---

## 🧩 Features Implementadas

### 1. Pivot Builder (Explorar)
- Escolha de **dimensões**, **métricas**, **filtros** e **intervalo de datas**
- Comparação entre períodos (`compare: true`)
- Exportação de resultados para **CSV**
- Salvamento como **Dashboard customizado**
- Interface **responsiva**, **acessível** e **fluida**

### 2. Dashboards
- Visualização de múltiplos gráficos e métricas
- Cards de **Top Produtos**, **Tendência por Região**, **Clientes Perdidos**
- KPIs de operação: **Receita**, **Pedidos**, **Ticket médio**, **Tempo médio de entrega**
- Comparativo entre períodos (Δ e %)

### 3. Insights Automáticos (IA)
- Geração de insights textuais (“Seus produtos mais vendidos caíram 12% no iFood”)
- Sugestões de filtros e dimensões relevantes

### 4. Compartilhamento
- Geração de **link público read-only** via token
- Visualização segura sem autenticação

---

## ⚡ Performance

### 🚀 Banco otimizado
- Índices em colunas `channel`, `store_id`, `product_id`, `sold_date`
- Materialized View `mv_sales_day` com pre-agregação por dia
- Queries < **800ms** em dataset de 500k vendas

### 🧠 Cache (opcional)
- Cache Redis com TTL curto para consultas repetidas
- Estratégia por chave de filtro (hash JSON do input)

---

## 🧪 Testes

### Backend (Jest)
- Testes de integração para resolvers `pivot`, `getTopProducts`, `comparePeriods`
- Mock de banco via SQLite in-memory

### Frontend (React Testing Library)
- Testes de UI para:
  - `FilterBuilder` (adicionar/remover filtros)
  - `ExplorePage` (executar análise e renderizar tabela)
  - `DashboardChart` (renderização condicional e props)

---

## 🌈 UX e Acessibilidade

- Interface mobile-first e sem scroll duplo
- Teclas de navegação e foco visível
- `aria-label` e `aria-sort` em colunas
- Skeleton loaders e mensagens de estado (“Sem dados”, “Executando…”)
- Modo escuro/claro suportado

---

## 📦 Setup e Execução

### 🔹 Pré-requisitos
- Node 20+ ou Bun
- PostgreSQL 15+
- Docker (opcional)

### 🔹 Clone e instale
<pre>
git clone https://github.com/josephkwk/nola-challenge.git
cd nola-challenge/frontend
bun install
</pre>

### 🔹 Configure o ambiente
Crie o arquivo **.env.local**:
<pre>
NEXT_PUBLIC_API_URL=http://localhost:4000/graphql
</pre>

### 🔹 Rode o servidor
<pre>
bun dev
</pre>

> O app estará disponível em http://localhost:3000

---

## 🧠 Decisões Arquiteturais

| Decisão | Justificativa |
|----------|----------------|
| **GraphQL + Apollo** | Permite queries dinâmicas (pivot), evita endpoints REST fixos |
| **Zustand > Redux** | Menor boilerplate e ideal para estados simples |
| **Shadcn/UI** | Componentes acessíveis e estilização consistente com Tailwind |
| **Materialized Views** | Aceleração de consultas agregadas (6x mais rápido) |
| **Separação de responsabilidades** | Hooks (queries), componentes (UI), tipos isolados |
| **Arquitetura declarativa** | Exploração no frontend, lógica de agregação no backend |

---

## 📹 Demo e Apresentação

🎥 **Vídeo (5–10 min)** — roteiro sugerido:
1. Introdução à Maria (persona)
2. Problema: “Ela tem dados, mas não tem insights.”
3. Pivot Builder: criando análise ao vivo
4. Comparando períodos e lendo deltas
5. Salvando dashboard e compartilhando link
6. KPIs automáticos e insights
7. Arquitetura (resumo com diagrama)
8. Encerramento (performance + próximos passos)

---

## 🧱 Estrutura de Pastas

<pre>
src/
├── app/
│   ├── page.tsx
│   ├── explore/
│   │   └── page.tsx
│   ├── dashboards/
│   │   └── [id]/page.tsx
├── components/
│   ├── dashboard/
│   ├── charts/
│   ├── ui/
├── hooks/
│   ├── useExplore.ts
│   ├── useInsights.ts
│   └── useDashboardById.ts
├── queries/
│   ├── explore.queries.ts
│   └── insights.queries.ts
├── store/
│   └── useDashboardStore.ts
├── types/
│   └── types.ts
└── lib/
    └── utils.ts
</pre>

---

## 💡 Próximos Passos

- Implementar editor visual de dashboards (arrastar/soltar)
- Adicionar autenticação multi-usuário e permissões
- Exportar dashboards em PDF/PNG
- Implementar cache Redis no backend
- Otimizar materialized view incremental

---

## 👤 Autor

**Joseph Kawe (KWK Tech)**  
Full-Stack Engineer • Founder at KWK Technologies  
📧 joseph@kwktech.dev  
🌐 [https://kwktech.dev](https://kwktech.dev)  
💼 [LinkedIn](https://www.linkedin.com/in/josephkawe)

---

## 📜 Licença

MIT © 2025 — KWK Tech.  
Uso educacional e demonstrativo para o **Desafio Nola**.
