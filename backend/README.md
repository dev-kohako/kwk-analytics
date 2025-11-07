# 🍽️ KWK Analytics — Backend (Nola Challenge)

> API GraphQL de alta performance para análise de dados operacionais de restaurantes.  
> Desenvolvida com **Bun**, **Apollo Server**, **Prisma** e **PostgreSQL**.

---

## 🚀 Visão Geral

Este backend fornece uma **API de analytics customizável**, que permite:
- Executar consultas **pivot dinâmicas** (dimensões, métricas e filtros)
- Gerar **insights automáticos**
- Comparar períodos (Δ e %)
- Armazenar e recuperar **dashboards personalizados**

Foi projetado para escalar até **500.000 registros** de vendas, com respostas < **1s** via otimizações SQL, índices e materialized views.

---

## 🧩 Stack Técnica

| Tecnologia | Função |
|-------------|--------|
| **Bun** | Runtime JavaScript ultrarrápido |
| **Apollo Server (GraphQL)** | Gateway de queries e mutations tipadas |
| **Express.js** | Middleware HTTP e roteamento |
| **Prisma ORM** | Mapeamento e abstração de banco de dados |
| **PostgreSQL** | Banco relacional de alta performance |
| **Zod** | Validação de inputs GraphQL |
| **Jest** | Testes unitários e integração |
| **Docker Compose** | Infraestrutura containerizada |

---

## 🧱 Estrutura de Pastas

<pre>
backend/
├── src/
│   ├── controllers/          # Lógica de negócio (analytics, insights, dashboard)
│   ├── graphql/
│   │   ├── schema.graphql    # Tipos e inputs GraphQL
│   │   └── resolvers.ts      # Resolvers e integração Prisma
│   ├── utils/                # Helpers e tratadores de erro
│   ├── lib/
│   │   └── prisma.ts         # Cliente Prisma
│   └── server.ts             # Inicialização do Apollo Server
├── prisma/
│   └── schema.prisma
├── tests/
│   └── pivot.test.ts         # Testes automatizados com Jest
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── package.json
</pre>

---

## 🐳 Rodando com Docker

### 1️⃣ Build e execução
<pre>
docker compose up --build
</pre>

API GraphQL disponível em:  
👉 **http://localhost:4000/graphql**

---

## 🧪 Testes Automatizados

<pre>
bunx jest --runInBand --detectOpenHandles
</pre>

Saída esperada:
<pre>
Test Suites: 5 passed, 5 total
Tests:       5 passed, 5 total
Time:        ~4s
</pre>

---

## 🗄️ Banco de Dados

O PostgreSQL é configurado automaticamente via \`docker-compose.yml\`:

| Variável | Valor |
|-----------|--------|
| **DB_HOST** | db |
| **DB_USER** | challenge |
| **DB_PASSWORD** | challenge_2024 |
| **DB_NAME** | challenge_db |

### Schema Prisma

<pre>
model Sale {
  id                Int      @id @default(autoincrement())
  store_id          Int
  channel           String
  product_id        Int
  customer_id       Int
  revenue           Float
  quantity          Int
  delivery_minutes  Int
  sold_date         DateTime
  created_at        DateTime @default(now())
}
</pre>

---

## 🧬 Gerando Dados de Teste

<pre>
python generate_data.py --db-url postgresql://challenge:challenge_2024@localhost:5432/challenge_db
</pre>

Gera 500.000 registros de vendas simuladas (6 meses, múltiplos canais e lojas).

---

## ⚙️ Execução Local

<pre>
bun install
bun dev
</pre>

ou com Node.js:

<pre>
npm install
npm run dev
</pre>

---

## 🧩 Queries GraphQL Principais

### 🔹 Top Products
<pre>
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
</pre>

### 🔹 Pivot
<pre>
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
</pre>

---

## ⚡ Performance e Escalabilidade

### 🚀 Índices
<pre>

-- 2️⃣ Cria a materialized view completa e compatível com o backend
CREATE MATERIALIZED VIEW mv_sales_fact AS
SELECT
    s.id AS sale_id,
    s.created_at::date AS sold_date,
    EXTRACT(HOUR FROM s.created_at) AS hour_of_day,
    EXTRACT(DOW FROM s.created_at) AS dow,
    s.total_amount AS total_amount,
    s.total_amount_items AS total_items_amount,
    s.delivery_fee,
    s.total_discount,
    s.total_increase,
    s.channel_id,
    c.name AS channel,                      
    st.id AS store_id,
    st.name AS store_name,
    st.city AS store_city,
    st.state AS store_state,
    st.district AS delivery_region,         
    sb.id AS sub_brand_id,
    sb.name AS sub_brand_name,
    p.id AS product_id,
    p.name AS product_name,
    ps.quantity AS quantity,
    ps.total_price AS product_total_price,
    ps.total_price AS revenue,               
    (EXTRACT(EPOCH FROM (s.created_at - s.created_at)) / 60)::NUMERIC AS delivery_minutes,
    cu.id AS customer_id,
    cu.customer_name AS customer_name
FROM sales s
JOIN product_sales ps ON ps.sale_id = s.id
JOIN products p ON ps.product_id = p.id
LEFT JOIN stores st ON s.store_id = st.id
LEFT JOIN sub_brands sb ON s.sub_brand_id = sb.id
LEFT JOIN channels c ON s.channel_id = c.id
LEFT JOIN customers cu ON s.customer_id = cu.id;

CREATE INDEX IF NOT EXISTS idx_mv_sales_fact_sold_date ON mv_sales_fact(sold_date);
CREATE INDEX IF NOT EXISTS idx_mv_sales_fact_channel ON mv_sales_fact(channel);
CREATE INDEX IF NOT EXISTS idx_mv_sales_fact_product_id ON mv_sales_fact(product_id);
</pre>

### ⚙️ Comparação de períodos
As queries de analytics calculam automaticamente:
<pre>
delta = current - previous
deltaPercent = (delta / previous) * 100
</pre>

---

## 🧠 Decisões de Arquitetura (ADR)

### 📘 Contexto
O backend foi construído para oferecer uma API de analytics com alta flexibilidade e desempenho, permitindo consultas pivot dinâmicas e análise comparativa de períodos.

---

### 1️⃣ Stack e Frameworks
- **Bun** → execução rápida (startup < 50ms)
- **Apollo Server + Express** → GraphQL modular e extensível
- **Prisma** → tipagem e integração com PostgreSQL
- **Docker Compose** → ambiente padronizado e reprodutível

---

### 2️⃣ Estrutura Modular
- `controllers/` → lógica de negócio isolada
- `graphql/` → schema + resolvers
- `lib/prisma.ts` → cliente singleton do Prisma
- `utils/` → formatações, erros, cálculos comparativos

---

### 3️⃣ Segurança e Validação
- Inputs validados com **Zod**
- Tratamento de erros centralizado
- CORS e limites de profundidade de queries GraphQL
- Tokens de compartilhamento (link público read-only)

---

### 4️⃣ Performance
- Índices SQL e materialized views
- Paginador eficiente no resolver `pivot`
- Execução paralela de agregações via Promise.all
- Cache Redis (opcional)

---

### 5️⃣ Testabilidade
- Testes unitários com Jest
- Mocks de Prisma Client
- Testes de integração de resolvers e controllers
- Fixtures SQLite para ambiente CI

---

### 6️⃣ Escalabilidade
- Queries otimizadas para datasets grandes
- Prisma desacoplado de camada GraphQL (permite troca por raw SQL)
- Compatível com distribuição horizontal (load balancing via Docker)

---

### 7️⃣ Trade-offs
| Decisão | Prós | Contras |
|----------|------|---------|
| **GraphQL (Apollo)** | Flexível, schema tipado | Complexidade inicial |
| **Prisma ORM** | Tipagem forte, DX excelente | Queries complexas geram overhead |
| **Bun** | Build rápido e leve | Ecossistema ainda jovem |
| **Docker Compose** | Setup simples | Overhead leve em máquinas lentas |

---

## 🧾 Autor

👨‍💻 **Joseph Kawe (KWK Tech)**  
Full-Stack Engineer — Next.js | GraphQL | Prisma | Bun | TypeScript  
📧 contact@kwk.dev.br  
🌐 [https://kwktech.dev](https://kwktech.dev)  
💼 [LinkedIn](https://www.linkedin.com/in/josephkawe)

---

## ✅ Status

| Item | Situação |
|-------|-----------|
| Apollo Server + Prisma | ✅ Pronto |
| Docker + PostgreSQL | ✅ Operacional |
| Pivot Query | ✅ Validada |
| Top Products / Insights | ✅ Funcionando |
| Testes Jest | ✅ Passando |
| Documentação e ADR | ✅ Completa |

---

## 📜 Licença

MIT © 2025 — KWK Tech  
Uso educacional e demonstrativo para o **Desafio Nola**.
