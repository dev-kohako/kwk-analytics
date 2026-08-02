-- =============================================================================
--  Contas, planos e uso
-- =============================================================================
--  Tabelas próprias da aplicação, separadas das tabelas de venda que vêm da
--  base do cliente. O `schema.prisma` é introspectado com `prisma db pull`, e
--  estas entram no mesmo fluxo — por isso vivem em SQL versionado.
--
--    psql "$DATABASE_URL" -f backend/sql/auth.sql
--    cd backend && bunx prisma db pull && bunx prisma generate
--
--  Idempotente: pode rodar mais de uma vez.
-- =============================================================================

CREATE TABLE IF NOT EXISTS app_user (
  id                SERIAL PRIMARY KEY,
  name              VARCHAR(120)  NOT NULL,
  email             VARCHAR(255)  NOT NULL,
  password_hash     VARCHAR(255)  NOT NULL,
  email_verified_at TIMESTAMP,
  created_at        TIMESTAMP     NOT NULL DEFAULT now(),
  updated_at        TIMESTAMP     NOT NULL DEFAULT now()
);

-- Índice único sobre o e-mail normalizado: "Maria@x.com" e "maria@x.com" são
-- a mesma pessoa, e deixar isso para a aplicação garantir sempre falha um dia.
CREATE UNIQUE INDEX IF NOT EXISTS idx_app_user_email ON app_user (lower(email));

-- --- Redefinição de senha ----------------------------------------------------
-- Guarda o hash do token, nunca o token em si: vazamento da tabela não permite
-- redefinir a senha de ninguém.
CREATE TABLE IF NOT EXISTS password_reset (
  id         SERIAL PRIMARY KEY,
  user_id    INT          NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP    NOT NULL,
  used_at    TIMESTAMP,
  created_at TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset (token_hash);
CREATE INDEX IF NOT EXISTS idx_password_reset_user  ON password_reset (user_id);

-- --- Sessões -----------------------------------------------------------------
-- Refresh tokens em tabela, para que "sair de todos os dispositivos" e a
-- revogação após troca de senha sejam possíveis — o que JWT sozinho não dá.
CREATE TABLE IF NOT EXISTS user_session (
  id          SERIAL PRIMARY KEY,
  user_id     INT          NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL,
  user_agent  VARCHAR(300),
  expires_at  TIMESTAMP    NOT NULL,
  revoked_at  TIMESTAMP,
  created_at  TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_session_token ON user_session (token_hash);
CREATE INDEX IF NOT EXISTS idx_user_session_user  ON user_session (user_id);

-- --- Planos ------------------------------------------------------------------
-- Os limites ficam em JSONB para acrescentar regra nova sem migração. O código
-- lê com valor padrão, então plano antigo não quebra ao surgir um limite novo.
CREATE TABLE IF NOT EXISTS plan (
  code        VARCHAR(30) PRIMARY KEY,
  name        VARCHAR(80)  NOT NULL,
  price_cents INT          NOT NULL DEFAULT 0,
  currency    VARCHAR(3)   NOT NULL DEFAULT 'BRL',
  trial_days  INT          NOT NULL DEFAULT 0,
  limits      JSONB        NOT NULL DEFAULT '{}'::jsonb,
  is_public   BOOLEAN      NOT NULL DEFAULT true,
  created_at  TIMESTAMP    NOT NULL DEFAULT now()
);

-- Free generoso de propósito: quem testa precisa conseguir usar de verdade
-- antes de decidir pagar. O limite existe para conter abuso, não para irritar.
INSERT INTO plan (code, name, price_cents, trial_days, limits) VALUES
  ('free', 'Gratuito', 0, 0, '{
     "dashboards": 10,
     "analysesPerDay": 200,
     "aiInsightsPerMonth": 100,
     "exportsPerMonth": 50,
     "historyDays": 365
   }'::jsonb),
  ('pro', 'Pro', 4900, 14, '{
     "dashboards": 100,
     "analysesPerDay": 5000,
     "aiInsightsPerMonth": 2000,
     "exportsPerMonth": 1000,
     "historyDays": null
   }'::jsonb),
  ('business', 'Business', 14900, 14, '{
     "dashboards": null,
     "analysesPerDay": null,
     "aiInsightsPerMonth": null,
     "exportsPerMonth": null,
     "historyDays": null
   }'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- --- Assinatura --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscription (
  id                     SERIAL PRIMARY KEY,
  user_id                INT         NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  plan_code              VARCHAR(30) NOT NULL REFERENCES plan(code),
  -- trialing | active | past_due | canceled
  status                 VARCHAR(20) NOT NULL DEFAULT 'active',
  trial_ends_at          TIMESTAMP,
  current_period_end     TIMESTAMP,
  cancel_at_period_end   BOOLEAN     NOT NULL DEFAULT false,
  stripe_customer_id     VARCHAR(120),
  stripe_subscription_id VARCHAR(120),
  created_at             TIMESTAMP   NOT NULL DEFAULT now(),
  updated_at             TIMESTAMP   NOT NULL DEFAULT now()
);

-- Uma assinatura viva por usuário; o histórico fica nas linhas canceladas.
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscription_ativa
  ON subscription (user_id) WHERE status IN ('trialing', 'active', 'past_due');

CREATE INDEX IF NOT EXISTS idx_subscription_stripe
  ON subscription (stripe_subscription_id);

-- --- Consumo -----------------------------------------------------------------
-- Contador por usuário, métrica e janela. A janela é texto ('2026-08' ou
-- '2026-08-02') para servir tanto limite mensal quanto diário na mesma tabela.
CREATE TABLE IF NOT EXISTS usage_counter (
  user_id    INT         NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  metric     VARCHAR(40) NOT NULL,
  window_key VARCHAR(10) NOT NULL,
  count      INT         NOT NULL DEFAULT 0,
  updated_at TIMESTAMP   NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, metric, window_key)
);

-- --- Dono do dashboard -------------------------------------------------------
-- Os dashboards existentes são globais. A coluna entra anulável para não
-- invalidar o que já está salvo; o código trata NULL como legado sem dono.
ALTER TABLE dashboard
  ADD COLUMN IF NOT EXISTS user_id INT REFERENCES app_user(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_dashboard_user ON dashboard (user_id);
