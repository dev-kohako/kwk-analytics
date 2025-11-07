/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query GetDashboardById($id: Int!) {\n    dashboard(id: $id) {\n      id\n      name\n      config\n      created_at\n    }\n  }\n": typeof types.GetDashboardByIdDocument,
    "\n  query GetDashboards {\n    dashboards {\n      id\n      name\n      created_at\n    }\n  }\n": typeof types.GetDashboardsDocument,
    "\n  query Pivot($input: PivotInput!) {\n    pivot(input: $input) {\n      sql\n      rows\n    }\n  }\n": typeof types.PivotDocument,
    "\n  query GetPivotFieldValues($input: PivotFieldValuesInput!) {\n    pivotFieldValues(input: $input)\n  }\n": typeof types.GetPivotFieldValuesDocument,
    "\n  query GetAutoInsights {\n    autoInsights {\n      message\n    }\n  }\n": typeof types.GetAutoInsightsDocument,
    "\n  query GetTopProducts($input: TopProductsInput!) {\n    topProducts(input: $input) {\n      product_id\n      total_itens\n      faturamento\n      faturamento_prev\n      delta_percent\n    }\n  }\n": typeof types.GetTopProductsDocument,
    "\n  query GetDeliveryRegionTrend($input: DeliveryRegionTrendInput!) {\n    deliveryRegionTrend(input: $input) {\n      delivery_region\n      avg_prev\n      avg_cur\n      delta_min\n      delta_percent\n    }\n  }\n": typeof types.GetDeliveryRegionTrendDocument,
    "\n  query GetLostButLoyal {\n    lostButLoyal {\n      customer_id\n      n_orders\n      last_date\n    }\n  }\n": typeof types.GetLostButLoyalDocument,
    "\n  mutation SaveDashboard($input: SaveDashboardInput!) {\n    saveDashboard(input: $input) {\n      id\n      name\n      config\n      created_at\n    }\n  }\n": typeof types.SaveDashboardDocument,
};
const documents: Documents = {
    "\n  query GetDashboardById($id: Int!) {\n    dashboard(id: $id) {\n      id\n      name\n      config\n      created_at\n    }\n  }\n": types.GetDashboardByIdDocument,
    "\n  query GetDashboards {\n    dashboards {\n      id\n      name\n      created_at\n    }\n  }\n": types.GetDashboardsDocument,
    "\n  query Pivot($input: PivotInput!) {\n    pivot(input: $input) {\n      sql\n      rows\n    }\n  }\n": types.PivotDocument,
    "\n  query GetPivotFieldValues($input: PivotFieldValuesInput!) {\n    pivotFieldValues(input: $input)\n  }\n": types.GetPivotFieldValuesDocument,
    "\n  query GetAutoInsights {\n    autoInsights {\n      message\n    }\n  }\n": types.GetAutoInsightsDocument,
    "\n  query GetTopProducts($input: TopProductsInput!) {\n    topProducts(input: $input) {\n      product_id\n      total_itens\n      faturamento\n      faturamento_prev\n      delta_percent\n    }\n  }\n": types.GetTopProductsDocument,
    "\n  query GetDeliveryRegionTrend($input: DeliveryRegionTrendInput!) {\n    deliveryRegionTrend(input: $input) {\n      delivery_region\n      avg_prev\n      avg_cur\n      delta_min\n      delta_percent\n    }\n  }\n": types.GetDeliveryRegionTrendDocument,
    "\n  query GetLostButLoyal {\n    lostButLoyal {\n      customer_id\n      n_orders\n      last_date\n    }\n  }\n": types.GetLostButLoyalDocument,
    "\n  mutation SaveDashboard($input: SaveDashboardInput!) {\n    saveDashboard(input: $input) {\n      id\n      name\n      config\n      created_at\n    }\n  }\n": types.SaveDashboardDocument,
};

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = gql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function gql(source: string): unknown;

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetDashboardById($id: Int!) {\n    dashboard(id: $id) {\n      id\n      name\n      config\n      created_at\n    }\n  }\n"): (typeof documents)["\n  query GetDashboardById($id: Int!) {\n    dashboard(id: $id) {\n      id\n      name\n      config\n      created_at\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetDashboards {\n    dashboards {\n      id\n      name\n      created_at\n    }\n  }\n"): (typeof documents)["\n  query GetDashboards {\n    dashboards {\n      id\n      name\n      created_at\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query Pivot($input: PivotInput!) {\n    pivot(input: $input) {\n      sql\n      rows\n    }\n  }\n"): (typeof documents)["\n  query Pivot($input: PivotInput!) {\n    pivot(input: $input) {\n      sql\n      rows\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetPivotFieldValues($input: PivotFieldValuesInput!) {\n    pivotFieldValues(input: $input)\n  }\n"): (typeof documents)["\n  query GetPivotFieldValues($input: PivotFieldValuesInput!) {\n    pivotFieldValues(input: $input)\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetAutoInsights {\n    autoInsights {\n      message\n    }\n  }\n"): (typeof documents)["\n  query GetAutoInsights {\n    autoInsights {\n      message\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetTopProducts($input: TopProductsInput!) {\n    topProducts(input: $input) {\n      product_id\n      total_itens\n      faturamento\n      faturamento_prev\n      delta_percent\n    }\n  }\n"): (typeof documents)["\n  query GetTopProducts($input: TopProductsInput!) {\n    topProducts(input: $input) {\n      product_id\n      total_itens\n      faturamento\n      faturamento_prev\n      delta_percent\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetDeliveryRegionTrend($input: DeliveryRegionTrendInput!) {\n    deliveryRegionTrend(input: $input) {\n      delivery_region\n      avg_prev\n      avg_cur\n      delta_min\n      delta_percent\n    }\n  }\n"): (typeof documents)["\n  query GetDeliveryRegionTrend($input: DeliveryRegionTrendInput!) {\n    deliveryRegionTrend(input: $input) {\n      delivery_region\n      avg_prev\n      avg_cur\n      delta_min\n      delta_percent\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  query GetLostButLoyal {\n    lostButLoyal {\n      customer_id\n      n_orders\n      last_date\n    }\n  }\n"): (typeof documents)["\n  query GetLostButLoyal {\n    lostButLoyal {\n      customer_id\n      n_orders\n      last_date\n    }\n  }\n"];
/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "\n  mutation SaveDashboard($input: SaveDashboardInput!) {\n    saveDashboard(input: $input) {\n      id\n      name\n      config\n      created_at\n    }\n  }\n"): (typeof documents)["\n  mutation SaveDashboard($input: SaveDashboardInput!) {\n    saveDashboard(input: $input) {\n      id\n      name\n      config\n      created_at\n    }\n  }\n"];

export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;