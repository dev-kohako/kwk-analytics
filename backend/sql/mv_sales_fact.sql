-- =============================================================================
--  mv_sales_fact — materialized view de leitura analítica
-- =============================================================================
--  Passo OBRIGATÓRIO de setup: nenhum controller consulta as tabelas originais,
--  todos leem daqui. Rode este arquivo depois de carregar a base de vendas.
--
--    psql "$DATABASE_URL" -f backend/sql/mv_sales_fact.sql
--
--  O script é idempotente: pode ser executado mais de uma vez sem efeito
--  colateral. Para recriar a view após mudança de schema, descomente o DROP.
--
--  Após novas cargas de dados, atualize os dados da view:
--    REFRESH MATERIALIZED VIEW mv_sales_fact;
-- =============================================================================

-- DROP MATERIALIZED VIEW IF EXISTS mv_sales_fact CASCADE;

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_sales_fact AS
SELECT
    s.id                                  AS sale_id,
    s.created_at::date                    AS sold_date,
    EXTRACT(HOUR FROM s.created_at)       AS hour_of_day,
    EXTRACT(DOW  FROM s.created_at)       AS dow,
    s.total_amount                        AS total_amount,
    s.total_amount_items                  AS total_items_amount,
    s.delivery_fee,
    s.total_discount,
    s.total_increase,
    s.channel_id,
    c.name                                AS channel,
    st.id                                 AS store_id,
    st.name                               AS store_name,
    st.city                               AS store_city,
    st.state                              AS store_state,
    st.district                           AS delivery_region,
    sb.id                                 AS sub_brand_id,
    sb.name                               AS sub_brand_name,
    p.id                                  AS product_id,
    p.name                                AS product_name,
    ps.quantity                           AS quantity,
    ps.total_price                        AS product_total_price,
    ps.total_price                        AS revenue,

    -- Tempo de entrega em minutos, a partir de `sales.delivery_seconds`.
    -- A versão anterior calculava `s.created_at - s.created_at`, que é sempre
    -- zero: a métrica existia, mas nunca saía do zero. NULLIF evita tratar
    -- "sem registro de entrega" (0) como uma entrega instantânea — os
    -- controllers filtram `delivery_minutes IS NOT NULL`.
    (NULLIF(s.delivery_seconds, 0) / 60.0)::NUMERIC AS delivery_minutes,

    cu.id                                 AS customer_id,
    cu.customer_name                      AS customer_name
FROM sales s
JOIN      product_sales ps ON ps.sale_id     = s.id
JOIN      products      p  ON ps.product_id  = p.id
LEFT JOIN stores        st ON s.store_id     = st.id
LEFT JOIN sub_brands    sb ON s.sub_brand_id = sb.id
LEFT JOIN channels      c  ON s.channel_id   = c.id
LEFT JOIN customers     cu ON s.customer_id  = cu.id;

-- Índices alinhados aos cortes mais frequentes das queries analíticas.
CREATE INDEX IF NOT EXISTS idx_mv_sales_fact_sold_date  ON mv_sales_fact (sold_date);
CREATE INDEX IF NOT EXISTS idx_mv_sales_fact_channel    ON mv_sales_fact (channel);
CREATE INDEX IF NOT EXISTS idx_mv_sales_fact_product_id ON mv_sales_fact (product_id);
