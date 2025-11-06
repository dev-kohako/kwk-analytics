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

  input DeliveryRegionTrendInput {
    period: PeriodInput!
  }

  type LostCustomer {
    customer_id: ID!
    n_orders: Int!
    last_date: String!
  }

  type Query {
    dashboards: [Dashboard!]!
    dashboard(id: Int!): Dashboard
    deliveryRegionTrend(
      input: DeliveryRegionTrendInput!
    ): [DeliveryRegionTrend!]!
    lostButLoyal: [LostCustomer!]!
  }

  type Mutation {
    saveDashboard(input: SaveDashboardInput!): Dashboard
  }
`;
