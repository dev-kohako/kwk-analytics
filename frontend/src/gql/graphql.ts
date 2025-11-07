/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** Arbitrary JSON value compatible with Apollo */
  JSON: { input: any; output: any; }
};

export type AutoInsight = {
  __typename?: 'AutoInsight';
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

export type Dashboard = {
  __typename?: 'Dashboard';
  config?: Maybe<Scalars['JSON']['output']>;
  created_at?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type DateRangeInput = {
  from?: InputMaybe<Scalars['String']['input']>;
  to?: InputMaybe<Scalars['String']['input']>;
};

export type DeliveryRegionTrend = {
  __typename?: 'DeliveryRegionTrend';
  avg_cur?: Maybe<Scalars['Float']['output']>;
  avg_prev?: Maybe<Scalars['Float']['output']>;
  delivery_region: Scalars['String']['output'];
  delta_min?: Maybe<Scalars['Float']['output']>;
  delta_percent?: Maybe<Scalars['Float']['output']>;
};

export type DeliveryRegionTrendInput = {
  period: PeriodInput;
};

export type FilterInput = {
  field: Scalars['String']['input'];
  op: Scalars['String']['input'];
  value?: InputMaybe<Scalars['JSON']['input']>;
};

export type LostCustomer = {
  __typename?: 'LostCustomer';
  customer_id: Scalars['ID']['output'];
  last_date: Scalars['String']['output'];
  n_orders: Scalars['Int']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  saveDashboard?: Maybe<Dashboard>;
};


export type MutationSaveDashboardArgs = {
  input: SaveDashboardInput;
};

export type PeriodInput = {
  dateFrom: Scalars['String']['input'];
  dateTo: Scalars['String']['input'];
  prevDateFrom?: InputMaybe<Scalars['String']['input']>;
  prevDateTo?: InputMaybe<Scalars['String']['input']>;
};

export type PivotFieldValuesInput = {
  field: Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
};

export enum PivotFn {
  Avg = 'avg',
  Count = 'count',
  CountDistinct = 'count_distinct',
  Max = 'max',
  Min = 'min',
  Sum = 'sum'
}

export type PivotInput = {
  dateRange?: InputMaybe<DateRangeInput>;
  dimensions?: InputMaybe<Array<Scalars['String']['input']>>;
  filters?: InputMaybe<Array<FilterInput>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  measures: Array<PivotMeasureInput>;
};

export type PivotMeasureInput = {
  alias?: InputMaybe<Scalars['String']['input']>;
  field: Scalars['String']['input'];
  fn: PivotFn;
};

export type PivotResult = {
  __typename?: 'PivotResult';
  rows: Array<Scalars['JSON']['output']>;
  sql: Scalars['String']['output'];
};

export type ProductAgg = {
  __typename?: 'ProductAgg';
  delta_percent?: Maybe<Scalars['Float']['output']>;
  faturamento: Scalars['Float']['output'];
  faturamento_prev?: Maybe<Scalars['Float']['output']>;
  product_id: Scalars['ID']['output'];
  total_itens: Scalars['Int']['output'];
};

export type Query = {
  __typename?: 'Query';
  autoInsights: Array<AutoInsight>;
  dashboard?: Maybe<Dashboard>;
  dashboards: Array<Dashboard>;
  deliveryRegionTrend: Array<DeliveryRegionTrend>;
  lostButLoyal: Array<LostCustomer>;
  pivot: PivotResult;
  pivotFieldValues: Array<Scalars['String']['output']>;
  topProducts: Array<ProductAgg>;
};


export type QueryDashboardArgs = {
  id: Scalars['Int']['input'];
};


export type QueryDeliveryRegionTrendArgs = {
  input: DeliveryRegionTrendInput;
};


export type QueryPivotArgs = {
  input: PivotInput;
};


export type QueryPivotFieldValuesArgs = {
  input: PivotFieldValuesInput;
};


export type QueryTopProductsArgs = {
  input: TopProductsInput;
};

export type SaveDashboardInput = {
  config: Scalars['JSON']['input'];
  name: Scalars['String']['input'];
};

export type TopProductsInput = {
  channel?: InputMaybe<Scalars['String']['input']>;
  dow?: InputMaybe<Scalars['Int']['input']>;
  hourFrom?: InputMaybe<Scalars['Int']['input']>;
  hourTo?: InputMaybe<Scalars['Int']['input']>;
  period: PeriodInput;
};

export type GetDashboardByIdQueryVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type GetDashboardByIdQuery = { __typename?: 'Query', dashboard?: { __typename?: 'Dashboard', id: string, name: string, config?: any | null, created_at?: string | null } | null };

export type GetDashboardsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetDashboardsQuery = { __typename?: 'Query', dashboards: Array<{ __typename?: 'Dashboard', id: string, name: string, created_at?: string | null }> };

export type PivotQueryVariables = Exact<{
  input: PivotInput;
}>;


export type PivotQuery = { __typename?: 'Query', pivot: { __typename?: 'PivotResult', sql: string, rows: Array<any> } };

export type GetPivotFieldValuesQueryVariables = Exact<{
  input: PivotFieldValuesInput;
}>;


export type GetPivotFieldValuesQuery = { __typename?: 'Query', pivotFieldValues: Array<string> };

export type GetAutoInsightsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAutoInsightsQuery = { __typename?: 'Query', autoInsights: Array<{ __typename?: 'AutoInsight', message: string }> };

export type GetTopProductsQueryVariables = Exact<{
  input: TopProductsInput;
}>;


export type GetTopProductsQuery = { __typename?: 'Query', topProducts: Array<{ __typename?: 'ProductAgg', product_id: string, total_itens: number, faturamento: number, faturamento_prev?: number | null, delta_percent?: number | null }> };

export type GetDeliveryRegionTrendQueryVariables = Exact<{
  input: DeliveryRegionTrendInput;
}>;


export type GetDeliveryRegionTrendQuery = { __typename?: 'Query', deliveryRegionTrend: Array<{ __typename?: 'DeliveryRegionTrend', delivery_region: string, avg_prev?: number | null, avg_cur?: number | null, delta_min?: number | null, delta_percent?: number | null }> };

export type GetLostButLoyalQueryVariables = Exact<{ [key: string]: never; }>;


export type GetLostButLoyalQuery = { __typename?: 'Query', lostButLoyal: Array<{ __typename?: 'LostCustomer', customer_id: string, n_orders: number, last_date: string }> };

export type SaveDashboardMutationVariables = Exact<{
  input: SaveDashboardInput;
}>;


export type SaveDashboardMutation = { __typename?: 'Mutation', saveDashboard?: { __typename?: 'Dashboard', id: string, name: string, config?: any | null, created_at?: string | null } | null };


export const GetDashboardByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetDashboardById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dashboard"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"config"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}}]}}]}}]} as unknown as DocumentNode<GetDashboardByIdQuery, GetDashboardByIdQueryVariables>;
export const GetDashboardsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetDashboards"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dashboards"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}}]}}]}}]} as unknown as DocumentNode<GetDashboardsQuery, GetDashboardsQueryVariables>;
export const PivotDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Pivot"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PivotInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pivot"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sql"}},{"kind":"Field","name":{"kind":"Name","value":"rows"}}]}}]}}]} as unknown as DocumentNode<PivotQuery, PivotQueryVariables>;
export const GetPivotFieldValuesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetPivotFieldValues"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PivotFieldValuesInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pivotFieldValues"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<GetPivotFieldValuesQuery, GetPivotFieldValuesQueryVariables>;
export const GetAutoInsightsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAutoInsights"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"autoInsights"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<GetAutoInsightsQuery, GetAutoInsightsQueryVariables>;
export const GetTopProductsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTopProducts"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TopProductsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"topProducts"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"product_id"}},{"kind":"Field","name":{"kind":"Name","value":"total_itens"}},{"kind":"Field","name":{"kind":"Name","value":"faturamento"}},{"kind":"Field","name":{"kind":"Name","value":"faturamento_prev"}},{"kind":"Field","name":{"kind":"Name","value":"delta_percent"}}]}}]}}]} as unknown as DocumentNode<GetTopProductsQuery, GetTopProductsQueryVariables>;
export const GetDeliveryRegionTrendDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetDeliveryRegionTrend"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeliveryRegionTrendInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deliveryRegionTrend"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"delivery_region"}},{"kind":"Field","name":{"kind":"Name","value":"avg_prev"}},{"kind":"Field","name":{"kind":"Name","value":"avg_cur"}},{"kind":"Field","name":{"kind":"Name","value":"delta_min"}},{"kind":"Field","name":{"kind":"Name","value":"delta_percent"}}]}}]}}]} as unknown as DocumentNode<GetDeliveryRegionTrendQuery, GetDeliveryRegionTrendQueryVariables>;
export const GetLostButLoyalDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetLostButLoyal"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"lostButLoyal"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"customer_id"}},{"kind":"Field","name":{"kind":"Name","value":"n_orders"}},{"kind":"Field","name":{"kind":"Name","value":"last_date"}}]}}]}}]} as unknown as DocumentNode<GetLostButLoyalQuery, GetLostButLoyalQueryVariables>;
export const SaveDashboardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SaveDashboard"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SaveDashboardInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"saveDashboard"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"config"}},{"kind":"Field","name":{"kind":"Name","value":"created_at"}}]}}]}}]} as unknown as DocumentNode<SaveDashboardMutation, SaveDashboardMutationVariables>;