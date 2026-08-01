import { gql } from "@apollo/client";

export const GET_AUTO_INSIGHTS = gql`
  query GetAutoInsights {
    autoInsights {
      id
      title
      message
      type
      severity
      metric
      value
      previousValue
      deltaPercent
      direction
      dimension
      entity
      suggestion
      generatedBy
      confidence
    }
  }
`;

export const GET_TOP_PRODUCTS = gql`
  query GetTopProducts($input: TopProductsInput!) {
    topProducts(input: $input) {
      product_id
      total_itens
      faturamento
      faturamento_prev
      delta_percent
    }
  }
`;

export const GET_DELIVERY_REGION_TREND = gql`
  query GetDeliveryRegionTrend($input: DeliveryRegionTrendInput!) {
    deliveryRegionTrend(input: $input) {
      delivery_region
      avg_prev
      avg_cur
      delta_min
      delta_percent
    }
  }
`;

export const GET_LOST_BUT_LOYAL = gql`
  query GetLostButLoyal {
    lostButLoyal {
      customer_id
      n_orders
      last_date
    }
  }
`;

export const SAVE_DASHBOARD = gql`
  mutation SaveDashboard($input: SaveDashboardInput!) {
    saveDashboard(input: $input) {
      id
      name
      config
      created_at
    }
  }
`;