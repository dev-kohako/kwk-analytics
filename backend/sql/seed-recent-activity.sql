-- =============================================================================
--  Movimento recente sobre a base existente
-- =============================================================================
--  Gera ~90 dias de vendas recentes reaproveitando o catálogo que já está no
--  banco: lojas, canais, produtos e clientes reais permanecem intactos.
--
--  Diferente do seed-synthetic.sql, este arquivo NÃO apaga nada. Serve para
--  quando a base tem histórico antigo e as análises dos últimos 30 dias
--  aparecem vazias.
--
--    bun run seed -- --append
--
--  Os preços saem da média já praticada em product_sales, então o ticket
--  continua coerente com o histórico. As vendas geradas ficam marcadas com
--  origin = 'SEED' e podem ser removidas depois com:
--
--    DELETE FROM sales WHERE origin = 'SEED'
--
--  Requer que existam lojas, canais, produtos e clientes cadastrados.
-- =============================================================================

WITH catalogo AS (
  SELECT
    (SELECT array_agg(id) FROM stores)    AS lojas,
    (SELECT array_agg(id) FROM channels)  AS canais,
    (SELECT array_agg(id) FROM customers) AS clientes
),
dias AS (
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
    c.lojas[1 + floor(random() * array_length(c.lojas, 1))::int]       AS store_id,
    c.clientes[1 + floor(random() * array_length(c.clientes, 1))::int] AS customer_id,
    c.canais[
      CASE
        WHEN array_length(c.canais, 1) = 1 THEN 1
        WHEN random() < 0.45 THEN 1
        WHEN random() < (CASE WHEN v.dias_atras < 30 THEN 0.18 ELSE 0.48 END)
          THEN LEAST(2, array_length(c.canais, 1))
        WHEN random() < 0.75 THEN LEAST(3, array_length(c.canais, 1))
        ELSE array_length(c.canais, 1)
      END
    ] AS channel_id
  FROM volume v
  CROSS JOIN catalogo c
  CROSS JOIN LATERAL generate_series(1, v.pedidos) g
)
INSERT INTO sales (
  store_id, sub_brand_id, customer_id, channel_id, created_at,
  sale_status_desc, total_amount_items, total_amount,
  delivery_fee, delivery_seconds, origin
)
SELECT
  g.store_id,
  st.sub_brand_id,
  g.customer_id,
  g.channel_id,
  g.dia
    + make_interval(hours => (CASE WHEN random() < 0.45 THEN 11 ELSE 18 END + floor(random() * 4)::int))
    + make_interval(mins  => floor(random() * 60)::int),
  'CONCLUIDA',
  0,
  0,
  CASE WHEN random() < 0.6 THEN 7.90 ELSE 0 END,
  CASE
    WHEN random() < 0.6
    THEN (1500 + random() * 1500 + CASE WHEN g.dias_atras < 30 THEN 240 ELSE 0 END)::int
    ELSE NULL
  END,
  'SEED'
FROM gerados g
JOIN stores st ON st.id = g.store_id;

WITH precos AS (
  SELECT
    p.id,
    COALESCE(AVG(ps.base_price), 35)::float8 AS preco,
    row_number() OVER (ORDER BY p.id)        AS pos,
    count(*) OVER ()                         AS total
  FROM products p
  LEFT JOIN product_sales ps ON ps.product_id = p.id
  GROUP BY p.id
)
INSERT INTO product_sales (sale_id, product_id, quantity, base_price, total_price)
SELECT
  s.id,
  pr.id,
  escolha.qtd,
  pr.preco,
  (pr.preco * escolha.qtd)::float8
FROM sales s
CROSS JOIN LATERAL generate_series(1, 1 + floor(random() * 3)::int) linha
CROSS JOIN LATERAL (
  SELECT 1 + floor(random() * 2)::int AS qtd, random() AS sorte
) escolha
JOIN precos pr
  ON pr.pos = LEAST(1 + floor(power(escolha.sorte, 1.7) * pr.total)::int, pr.total)
WHERE s.origin = 'SEED'
  AND NOT EXISTS (SELECT 1 FROM product_sales ps WHERE ps.sale_id = s.id);

UPDATE sales s
SET total_amount_items = t.itens,
    total_amount       = t.itens + COALESCE(s.delivery_fee, 0)
FROM (
  SELECT sale_id, SUM(total_price)::numeric(10, 2) AS itens
  FROM product_sales
  GROUP BY sale_id
) t
WHERE t.sale_id = s.id
  AND s.origin = 'SEED'
  AND s.total_amount = 0;
