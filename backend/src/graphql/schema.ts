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

  type AutoInsight {
    message: String!
    type: String
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

  type Query {
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
    saveDashboard(input: SaveDashboardInput!): Dashboard
  }
`;
