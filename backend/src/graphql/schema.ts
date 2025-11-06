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

  type Query {
    dashboards: [Dashboard!]!
    dashboard(id: Int!): Dashboard
  }

  type Mutation {
    saveDashboard(input: SaveDashboardInput!): Dashboard
  }
`;
