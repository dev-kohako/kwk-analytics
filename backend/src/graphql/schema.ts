import gql from "graphql-tag";

export const typeDefs = gql`
  scalar JSON

  type Dashboard {
    id: ID!
    name: String!
    config: JSON
    created_at: String
  }

  input SaveDashboardInput {
    name: String!
    config: JSON!
  }

  type DeliveryRegionTrend {
    delivery_region: String!
    avg_prev: Float
    avg_cur: Float
    delta_min: Float
    delta_percent: Float
  }

  input PeriodInput {
    dateFrom: String!
    dateTo: String!
    prevDateFrom: String
    prevDateTo: String
  }

  input DateRangeInput {
    from: String
    to: String
  }

  input DeliveryRegionTrendInput {
    period: PeriodInput!
  }

  type LostCustomer {
    customer_id: ID!
    n_orders: Int!
    last_date: String!
  }

  type ProductAgg {
    product_id: ID!
    total_itens: Int!
    faturamento: Float!
    faturamento_prev: Float
    delta_percent: Float
  }

  input TopProductsInput {
    channel: String
    dow: Int
    hourFrom: Int
    hourTo: Int
    period: PeriodInput!
  }

  enum InsightSeverity {
    positive
    info
    warning
    critical
  }

  enum InsightDirection {
    up
    down
    flat
  }

  """
  Origem do insight: regra determinística sobre os agregados ou modelo de linguagem.
  """
  enum InsightSource {
    rule
    ai
  }

  type AutoInsight {
    id: ID!
    title: String!
    "Texto puro, sem HTML — o cliente deve renderizar como texto."
    message: String!
    type: String
    severity: InsightSeverity!
    "Nome da métrica analisada, ex.: revenue, average_ticket."
    metric: String
    value: Float
    previousValue: Float
    deltaPercent: Float
    direction: InsightDirection
    "Dimensão analisada, ex.: channel, product_name, dow."
    dimension: String
    "Item concreto dentro da dimensão, ex.: iFood."
    entity: String
    suggestion: String
    generatedBy: InsightSource!
    "0 a 1. Nos insights de regra, reflete a força estatística do sinal."
    confidence: Float
  }

  enum PivotFn {
    sum
    avg
    count
    count_distinct
    min
    max
  }

  input PivotMeasureInput {
    field: String!
    fn: PivotFn!
    alias: String
  }

  input PivotFieldValuesInput {
    field: String!
    search: String
    limit: Int
  }

  input FilterInput {
    field: String!
    op: String!
    value: JSON
  }

  input PivotInput {
    dimensions: [String!]
    measures: [PivotMeasureInput!]!
    filters: [FilterInput!]
    dateRange: DateRangeInput
    limit: Int
  }

  type PivotResult {
    rows: [JSON!]!
    sql: String!
  }

  type Consumo {
    metric: String!
    used: Int!
    limit: Int
    remaining: Int
  }

  type PlanoAtual {
    code: String!
    name: String!
    status: String!
    trialEndsAt: String
  }



  type SessaoAtiva {
    id: ID!
    userAgent: String
    createdAt: String!
    expiresAt: String!
  }

  type Conta {
    id: ID!
    name: String!
    email: String!
    createdAt: String
    plan: PlanoAtual
    usage: [Consumo!]!
  }

  "Tokens da sessão. O refresh é revogável; o de acesso dura 15 minutos."
  type Sessao {
    accessToken: String!
    refreshToken: String!
    user: Conta!
  }

  input RegisterInput {
    name: String!
    email: String!
    password: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  type Plano {
    code: String!
    name: String!
    priceCents: Int!
    currency: String!
    trialDays: Int!
    limits: JSON
  }

  type Query {
    "Conta autenticada, ou null quando não há token válido."
    me: Conta
    "Planos disponíveis para contratação."
    plans: [Plano!]!
    "Sessões abertas da conta, para reconhecer acesso que não é seu."
    activeSessions: [SessaoAtiva!]!
    dashboards: [Dashboard!]!
    dashboard(id: Int!): Dashboard
    deliveryRegionTrend(
      input: DeliveryRegionTrendInput!
    ): [DeliveryRegionTrend!]!
    lostButLoyal: [LostCustomer!]!
    topProducts(input: TopProductsInput!): [ProductAgg!]!
    autoInsights: [AutoInsight!]!
    pivot(input: PivotInput!): PivotResult!
    pivotFieldValues(input: PivotFieldValuesInput!): [String!]!
  }

  type Mutation {
    register(input: RegisterInput!): Sessao!
    login(input: LoginInput!): Sessao!
    "Troca o refresh por um novo token de acesso."
    refreshSession(refreshToken: String!): String!
    logout(refreshToken: String!): Boolean!
    "Encerra todas as sessões da conta. Exige estar autenticado."
    logoutAll: Int!
    changePassword(currentPassword: String!, newPassword: String!): Boolean!
    updateProfile(name: String!): Boolean!
    "Abre o checkout do Stripe e devolve a URL para redirecionar."
    createCheckout(planCode: String!): String!
    "Portal do Stripe: trocar cartão, ver faturas, cancelar."
    createBillingPortal: String!
    "Envia o link de redefinição. Responde true mesmo se o e-mail não existir."
    requestPasswordReset(email: String!): Boolean!
    resetPassword(token: String!, password: String!): Boolean!
    saveDashboard(input: SaveDashboardInput!): Dashboard
  }
`;
