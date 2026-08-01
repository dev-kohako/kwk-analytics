-- =============================================================================
--  Dados de exemplo
-- =============================================================================
--  Popula o banco com ~90 dias de vendas fictícias, para quem quer ver a
--  plataforma funcionando antes de conectar uma base própria.
--
--  ATENÇÃO: começa com TRUNCATE. Não rode em banco com dado real.
--
--    bun run seed                                     (caminho recomendado)
--    psql "$DATABASE_URL" -f backend/sql/seed-synthetic.sql
--
--  Depois é preciso recriar a materialized view:
--    psql "$DATABASE_URL" -f backend/sql/mv_sales_fact.sql
--
--  O conjunto é desenhado para exercitar cada análise da plataforma:
--    · sexta e sábado mais fortes  -> sazonalidade por dia da semana
--    · leve crescimento no período -> tendência por regressão linear
--    · um dia de queda brusca      -> anomalia por z-score
--    · um canal encolhendo no mês  -> canal em retração
--    · poucos produtos dominando   -> concentração de Pareto
--    · delivery_seconds preenchido -> tempo médio de entrega
--
--  Cada comando é independente, sem tabela temporária e sem controle de
--  transação embutido, para rodar tanto via psql quanto statement a statement
--  pelo script de seed.
-- =============================================================================

TRUNCATE product_sales, sales, customers, products, categories, channels,
         stores, sub_brands, brands RESTART IDENTITY CASCADE;

INSERT INTO brands (name) VALUES ('Rede Sabor & Cia');

INSERT INTO sub_brands (brand_id, name) VALUES
  (1, 'Cantina Sabor'),
  (1, 'Sabor Burger');

INSERT INTO stores (brand_id, sub_brand_id, name, city, state, district) VALUES
  (1, 1, 'Cantina - Centro',    'São Paulo', 'SP', 'Centro'),
  (1, 1, 'Cantina - Pinheiros', 'São Paulo', 'SP', 'Pinheiros'),
  (1, 2, 'Burger - Moema',      'São Paulo', 'SP', 'Moema');

INSERT INTO channels (brand_id, name, type) VALUES
  (1, 'iFood',       'D'),
  (1, 'Rappi',       'D'),
  (1, 'WhatsApp',    'W'),
  (1, 'App Próprio', 'A');

INSERT INTO categories (brand_id, name) VALUES
  (1, 'Pratos'),
  (1, 'Lanches'),
  (1, 'Bebidas'),
  (1, 'Sobremesas');

INSERT INTO products (brand_id, category_id, name) VALUES
  (1, 1, 'Pizza Calabresa'),
  (1, 1, 'Pizza Margherita'),
  (1, 1, 'Lasanha Bolonhesa'),
  (1, 1, 'Nhoque ao Sugo'),
  (1, 2, 'Burger Duplo'),
  (1, 2, 'Burger Cheddar'),
  (1, 2, 'Burger Veggie'),
  (1, 2, 'Batata Rústica'),
  (1, 3, 'Refrigerante Lata'),
  (1, 3, 'Suco Natural'),
  (1, 4, 'Pudim'),
  (1, 4, 'Petit Gateau');

INSERT INTO customers (customer_name, store_id, sub_brand_id)
SELECT 'Cliente ' || n, 1 + (n % 3), 1 + (n % 2)
FROM generate_series(1, 400) n;

WITH dias AS (
  SELECT
    d::date                  AS dia,
    EXTRACT(DOW FROM d)::int AS dow,
    (current_date - d::date) AS dias_atras
  FROM generate_series(current_date - interval '89 days', current_date, interval '1 day') d
),
volume AS (
  SELECT
    dia,
    dias_atras,
    GREATEST(4, (
        38
      + CASE WHEN dow IN (5, 6) THEN 34 ELSE 0 END
      + CASE WHEN dow = 1 THEN -10 ELSE 0 END
      - (dias_atras * 0.18)::int
      - CASE WHEN dias_atras = 12 THEN 48 ELSE 0 END
    )::int) AS pedidos
  FROM dias
),
gerados AS (
  SELECT
    v.dia,
    v.dias_atras,
    1 + floor(random() * 3)::int AS store_id,
    CASE
      WHEN random() < 0.45 THEN 1
      WHEN random() < (CASE WHEN v.dias_atras < 30 THEN 0.18 ELSE 0.48 END) THEN 2
      WHEN random() < 0.75 THEN 3
      ELSE 4
    END AS channel_id
  FROM volume v, LATERAL generate_series(1, v.pedidos) g
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
  dia
    + make_interval(hours => (CASE WHEN random() < 0.45 THEN 11 ELSE 18 END + floor(random() * 4)::int))
    + make_interval(mins  => floor(random() * 60)::int),
  'CONCLUIDA',
  0,
  0,
  CASE WHEN channel_id IN (1, 2) THEN 7.90 ELSE 0 END,
  CASE
    WHEN channel_id IN (1, 2)
    THEN (1500 + random() * 1500 + CASE WHEN dias_atras < 30 THEN 240 ELSE 0 END)::int
    ELSE NULL
  END,
  'SEED'
FROM gerados;

WITH precos (nome, preco) AS (
  VALUES
    ('Pizza Calabresa',   54.90),
    ('Pizza Margherita',  49.90),
    ('Lasanha Bolonhesa', 46.50),
    ('Nhoque ao Sugo',    39.90),
    ('Burger Duplo',      38.00),
    ('Burger Cheddar',    34.00),
    ('Burger Veggie',     32.00),
    ('Batata Rústica',    22.00),
    ('Refrigerante Lata',  8.00),
    ('Suco Natural',      12.00),
    ('Pudim',             16.00),
    ('Petit Gateau',      24.00)
)
INSERT INTO product_sales (sale_id, product_id, quantity, base_price, total_price)
SELECT
  s.id,
  p.id,
  escolha.qtd,
  pr.preco::float8,
  (pr.preco * escolha.qtd)::float8
FROM sales s
CROSS JOIN LATERAL generate_series(1, 1 + floor(random() * 3)::int) linha
CROSS JOIN LATERAL (
  SELECT LEAST(1 + floor(power(random(), 1.7) * 12)::int, 12) AS produto_id,
         1 + floor(random() * 2)::int                         AS qtd
) escolha
JOIN products p ON p.id = escolha.produto_id
JOIN precos pr ON pr.nome = p.name;

UPDATE sales s
SET total_amount_items = t.itens,
    total_amount       = t.itens + COALESCE(s.delivery_fee, 0)
FROM (
  SELECT sale_id, SUM(total_price)::numeric(10, 2) AS itens
  FROM product_sales
  GROUP BY sale_id
) t
WHERE t.sale_id = s.id;
