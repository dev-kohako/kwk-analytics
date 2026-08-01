# 🖥️ KWK Analytics — Frontend

> Interface de exploração de dados e dashboards para gestores de food service.
> **Next.js 16 (App Router)** · **React 19** · **Apollo Client 4** · **Tailwind 4 + shadcn/ui** · **Zustand 5**.

📄 Visão geral do produto e do monorepo: [README raiz](../README.md)

---

## 🗺️ Rotas

| Rota | O que faz |
|---|---|
| `/` | Home com atalhos para os três módulos |
| `/explore` | **Pivot Builder** — dimensões, métricas, filtros, período, comparação, CSV e "salvar como dashboard" |
| `/dashboard` | Lista de dashboards salvos |
| `/dashboard/[id]` | Detalhe do dashboard com gráficos e KPIs |
| `/insights` | Insights automáticos com severidade, delta, sugestão e marcação de origem (regra ou IA) |

As rotas internas ficam no route group `(dashboard)`, que aplica o layout com sidebar. `loading.tsx` e `not-found.tsx` cobrem os estados de carregamento e 404.

---

## ⚙️ Stack

| Ferramenta | Uso |
|---|---|
| **Next.js 16 (App Router)** + **React 19** | Rotas, layouts e route groups |
| **TypeScript 5** | Tipagem ponta a ponta |
| **Apollo Client 4** | Consultas GraphQL e cache normalizado (`src/lib/apollo/client.ts`) |
| **GraphQL Codegen** (`client` preset) | Tipos e documentos gerados em `src/gql/` |
| **Zustand 5** | Estado global de filtros e dashboards |
| **Tailwind CSS 4** + **shadcn/ui** (Radix) | UI acessível e consistente |
| **Recharts 3** | Gráficos de barra, linha e pizza |
| **Framer Motion** | Microinterações |
| **next-themes** | Dark/light mode com persistência |
| **Sonner** · **Lucide** | Toasts e ícones |
| **Jest + Testing Library** | 18 arquivos de teste |

---

## 📦 Setup

```bash
bun install                 # ou: npm install
cp .env.example .env.local
bun dev
```

Disponível em **http://localhost:3000**.

### Variáveis de ambiente

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/
```

> O backend precisa estar no ar para a aplicação carregar dados. Instruções em [backend/README.md](../backend/README.md).

### Scripts

| Script | Descrição |
|---|---|
| `bun dev` | Servidor de desenvolvimento |
| `bun run build` / `bun start` | Build de produção e execução |
| `bun run lint` | ESLint (`eslint-config-next`) |
| `bun test` · `test:watch` · `test:coverage` | Jest + Testing Library |
| `bun run codegen` | Gera os tipos GraphQL — **exige o backend rodando**, pois o schema é lido por introspecção do endpoint |

---

## 🧱 Estrutura

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx            # layout com sidebar
│   │   ├── dashboard/            # lista + [id]
│   │   ├── explore/              # Pivot Builder
│   │   └── insights/
│   ├── layout.tsx · providers.tsx
│   ├── loading.tsx · not-found.tsx
│   └── globals.css
├── components/
│   ├── charts/                   # BarChart · LineChart · PieChart · DashboardChart
│   ├── dashboard/                # FilterBuilder · KpiCard · InsightCard · DashboardCard · Sidebar
│   └── ui/                       # base shadcn/ui
├── hooks/                        # useExplore · useInsights · useDashboards · useDashboardById · useSaveDashboard · useFilterOptions
├── queries/                      # documentos GraphQL por domínio
├── gql/                          # gerado pelo codegen — não editar
├── store/useDashboardStore.ts    # Zustand
├── lib/                          # apollo/client.ts · utils.ts (inclui exportToCSV)
├── types/ · validation/
└── tests/
```

Cada pasta tem seu `__tests__/` ao lado do código testado.

---

## 🧪 Testes

```bash
bun test
```

18 arquivos cobrindo páginas (`ExplorePage`, `InsightsPage`, `DashboardsList`, `DashboardDetailsPage`, `Loading`, `NotFound`), hooks, store e documentos de query. Os testes mockam o Apollo — **não** exigem backend no ar.

---

## 🌈 UX e acessibilidade

- Layout **mobile-first**, sem scroll horizontal
- `aria-label` e `aria-sort` nos controles e nas colunas ordenáveis
- Skeleton loaders e estados explícitos de vazio e erro
- Dark mode com persistência via `next-themes`
- Feedback de ação com toasts (Sonner)

---

## 🧠 Decisões de Arquitetura (ADR)

### 1. Apollo Client em vez de fetch/REST
O Pivot Builder monta a query em tempo de execução. Apollo dá cache normalizado, estados de loading/error prontos e integração direta com o Codegen — o que mantém frontend e backend tipados a partir da mesma fonte.

### 2. Zustand em vez de Redux ou Context
O estado global é pequeno: filtros ativos, dashboards e preferências. Redux traria boilerplate desproporcional; Context puro causaria re-render em toda a árvore a cada mudança de filtro.

### 3. shadcn/ui em vez de MUI ou Chakra
Os componentes são copiados para o projeto, não importados de um pacote: acessibilidade do Radix, controle total do estilo e nenhum peso extra de biblioteca de design.

### 4. Organização por responsabilidade, não por tipo
`hooks/` separado de `components/` mantém a lógica de dados testável sem montar UI. Foi o que permitiu cobrir `useExplore` e a store com testes unitários simples.

### 5. Paginação no servidor
A tabela do pivot pagina via `limit` na query, não no cliente — o navegador nunca recebe o dataset completo.

### 6. Exibir o SQL gerado
A resposta do `pivot` traz a query executada. Numa ferramenta de análise, poder auditar de onde veio o número vale mais do que esconder a complexidade.

### 7. Insight é dado estruturado, não string
O `InsightCard` recebe um objeto com `severity`, `deltaPercent`, `entity` e `suggestion` — a cor da borda, o chip de variação e o bloco de sugestão saem daí. Renderizar como **texto** (nunca `dangerouslySetInnerHTML`) é o que permite exibir com segurança uma mensagem que pode ter vindo de um modelo de linguagem.

### 8. KPI só existe se houver número por trás
Os cards de KPI leem `value`/`previousValue`/`deltaPercent` dos insights. Métrica sem origem no dado não é estimada — some da tela.

---

## ⚖️ Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Redux Toolkit | Boilerplate desproporcional ao tamanho do estado |
| Context API pura | Re-renderizações desnecessárias a cada mudança de filtro |
| Chakra UI / MUI | Menos controle visual e bundle maior que o Radix headless |
| REST | Não cobre a combinatória do pivot dinâmico |

---

## 🗺️ Limitações conhecidas

- **Sem autenticação** — não há login nem escopo por usuário; a API é aberta
- **Sem compartilhamento por link público** — os dashboards são globais para quem acessa a aplicação
- **`bun run codegen` depende de `tsx`**, que não está declarado no `package.json`; enquanto isso, use `bunx graphql-codegen --config codegen.ts`, que funciona
- **`delivery_minutes` retorna zero** — limitação do dataset, detalhada no [README do backend](../backend/README.md#-performance-e-escalabilidade)

---

## 👤 Autor

**Joseph Kawe** — Full-Stack Engineer · KWK Tech
📧 joseph@kwktech.dev · 🌐 [kwktech.dev](https://kwktech.dev) · 💼 [LinkedIn](https://www.linkedin.com/in/josephkawe) · 🐙 [@dev-kohako](https://github.com/dev-kohako)

## 📜 Licença

MIT © 2025 — KWK Tech. Uso educacional e demonstrativo.
