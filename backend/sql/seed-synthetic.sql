-- =============================================================================
--  Dataset sintético para desenvolvimento local
-- =============================================================================
--  Popula o banco com ~90 dias de vendas para exercitar todas as análises sem
--  depender do dump do desafio. NÃO usar em ambiente com dado real: o script
--  começa com TRUNCATE.
--
--    psql "$DATABASE_URL" -f backend/sql/seed-synthetic.sql
--    psql "$DATABASE_URL" -f backend/sql/mv_sales_fact.sql
--
--  O dataset é desenhado para disparar cada insight:
--    · sexta e sábado mais fortes  → sazonalidade por dia da semana
--    · leve crescimento no período → tendência por regressão linear
--    · um dia de queda brusca      → anomalia por z-score
--    · Rappi encolhendo nos últimos 30 dias → canal em retração
--    · poucos produtos dominando   → concentração de Pareto
--    · delivery_seconds preenchido → tempo médio de entrega
--
--  setseed deixa a geração reproduzível: rodar duas vezes dá o mesmo resultado.
-- =============================================================================

BEGIN;

TRUNCATE product_sales, sales, customers, products, categories, channels,
         stores, sub_brands, brands RESTART IDENTITY CASCADE;

SELECT setseed(0.42);

-- --- Estrutura ---------------------------------------------------------------

INSERT INTO brands (name) VALUES ('Rede da Maria');

INSERT INTO sub_brands (brand_id, name) VALUES
  (1, 'Cantina da Maria'),
  (1, 'Maria Burger');

INSERT INTO stores (brand_id, sub_brand_id, name, city, state, district) VALUES
  (1, 1, 'Cantina - Centro',    'São Paulo', 'SP', 'Centro'),
  (1, 1, 'Cantina - Pinheiros', 'São Paulo', 'SP', 'Pinheiros'),
  (1, 2, 'Burger - Moema',      'São Paulo', 'SP', 'Moema');

INSERT INTO channels (brand_id, name, type) VALUES
  (1, 'iFood',      'D'),
  (1, 'Rappi',      'D'),
  (1, 'WhatsApp',   'W'),
  (1, 'App Próprio','A');

INSERT INTO categories (brand_id, name) VALUES
  (1, 'Pratos'),
  (1, 'Lanches'),
  (1, 'Bebidas'),
  (1, 'Sobremesas');

-- O preço vive aqui porque a tabela `products` do desafio não tem coluna de preço.
CREATE TEMP TABLE seed_products (name text, category_id int, price numeric) ON COMMIT DROP;
INSERT INTO seed_products VALUES
  ('Pizza Calabresa',        1, 54.90),
  ('Pizza Margherita',       1, 49.90),
  ('Lasanha Bolonhesa',      1, 46.50),
  ('Nhoque ao Sugo',         1, 39.90),
  ('Burger Duplo',           2, 38.00),
  ('Burger Cheddar',         2, 34.00),
  ('Burger Veggie',          2, 32.00),
  ('Batata Rústica',         2, 22.00),
  ('Refrigerante Lata',      3,  8.00),
  ('Suco Natural',           3, 12.00),
  ('Pudim',                  4, 16.00),
  ('Petit Gateau',           4, 24.00);

INSERT INTO products (brand_id, category_id, name)
SELECT 1, category_id, name FROM seed_products;

INSERT INTO customers (customer_name, store_id, sub_brand_id)
SELECT
  'Cliente ' || n,
  1 + (n % 3),
  1 + (n % 2)
FROM generate_series(1, 400) n;

-- --- Vendas ------------------------------------------------------------------

WITH days AS (
  SELECT
    d::date                    AS day,
    EXTRACT(DOW FROM d)::int   AS dow,
    (current_date - d::date)   AS days_ago
  FROM generate_series(current_date - interval '89 days', current_date, interval '1 day') d
),
volume AS (
  SELECT
    day,
    dow,
    days_ago,
    GREATEST(4, (
        38                                                        -- base diária
      + CASE WHEN dow IN (5, 6) THEN 34 ELSE 0 END                -- sex/sáb fortes
      + CASE WHEN dow = 1 THEN -10 ELSE 0 END                     -- segunda fraca
      - (days_ago * 0.18)::int                                    -- tendência de alta
      - CASE WHEN days_ago = 12 THEN 48 ELSE 0 END                -- dia anômalo
    )::int) AS orders
  FROM days
)
INSERT INTO sales (
  store_id, sub_brand_id, customer_id, channel_id, created_at,
  sale_status_desc, total_amount_items, total_amount,
  delivery_fee, delivery_seconds, origin
)
SELECT
  store_id,
  CASE WHEN store_id = 3 THEN 2 ELSE 1 END,
  1 + floor(random() * 400)::int,
  channel_id,
  day
    + make_interval(hours  => (CASE WHEN random() < 0.45 THEN 11 ELSE 18 END + floor(random() * 4)::int))
    + make_interval(mins   => floor(random() * 60)::int),
  'CONCLUIDA',
  0, 0,                                                            -- totais vêm do UPDATE final
  CASE WHEN channel_id IN (1, 2) THEN 7.90 ELSE 0 END,
  CASE
    WHEN channel_id IN (1, 2)
    -- entrega mais lenta no período recente, para gerar variação por região
    THEN (1500 + random() * 1500 + CASE WHEN days_ago < 30 THEN 240 ELSE 0 END)::int
    ELSE NULL
  END,
  'SEED'
FROM (
  SELECT
    v.day,
    v.days_ago,
    1 + floor(random() * 3)::int AS store_id,
    CASE
      WHEN random() < 0.45 THEN 1                                  -- iFood
      -- a fatia da Rappi encolhe nos últimos 30 dias
      WHEN random() < (CASE WHEN v.days_ago < 30 THEN 0.18 ELSE 0.48 END) THEN 2
      WHEN random() < 0.75 THEN 3                                  -- WhatsApp
      ELSE 4                                                       -- App Próprio
    END AS channel_id
  FROM volume v, LATERAL generate_series(1, v.orders) g
) pedidos;

-- --- Itens por venda ---------------------------------------------------------
-- 1 a 3 linhas por pedido, com peso maior nos primeiros produtos para produzir
-- uma curva de Pareto realista.

INSERT INTO product_sales (sale_id, product_id, quantity, base_price, total_price)
SELECT
  s.id,
  p.id,
  qtd,
  sp.price,
  ROUND((sp.price * qtd)::numeric, 2)
FROM sales s
CROSS JOIN LATERAL generate_series(1, 1 + floor(random() * 3)::int) linha
CROSS JOIN LATERAL (
  SELECT 1 + floor(power(random(), 1.7) * 12)::int AS produto_idx,
         1 + floor(random() * 2)::int              AS qtd
) escolha
JOIN products p ON p.id = LEAST(escolha.produto_idx, 12)
JOIN seed_products sp ON sp.name = p.name;

-- --- Totais coerentes com os itens ------------------------------------------

UPDATE sales s
SET total_amount_items = t.itens,
    total_amount       = t.itens + COALESCE(s.delivery_fee, 0)
FROM (
  SELECT sale_id, SUM(total_price)::numeric(10, 2) AS itens
  FROM product_sales
  GROUP BY sale_id
) t
WHERE t.sale_id = s.id;

COMMIT;

-- --- Conferência -------------------------------------------------------------

SELECT
  (SELECT COUNT(*) FROM sales)          AS vendas,
  (SELECT COUNT(*) FROM product_sales)  AS itens,
  (SELECT COUNT(*) FROM customers)      AS clientes,
  (SELECT MIN(created_at)::date FROM sales) AS primeiro_dia,
  (SELECT MAX(created_at)::date FROM sales) AS ultimo_dia,
  (SELECT ROUND(SUM(total_price)::numeric, 2) FROM product_sales) AS receita_total;
