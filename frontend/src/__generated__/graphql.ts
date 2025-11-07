import { gql } from '@apollo/client';
import type * as Apollo from '@apollo/client';
import * as ApolloReactHooks from '@apollo/client/react/hooks';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  JSON: { input: any; output: any; }
};

export type AutoInsight = {
  __typename?: 'AutoInsight';
  message: Scalars['String']['output'];
  type: Maybe<Scalars['String']['output']>;
};

export type Dashboard = {
  __typename?: 'Dashboard';
  config: Maybe<Scalars['JSON']['output']>;
  created_at: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type DateRangeInput = {
  from: InputMaybe<Scalars['String']['input']>;
  to: InputMaybe<Scalars['String']['input']>;
};

export type DeliveryRegionTrend = {
  __typename?: 'DeliveryRegionTrend';
  avg_cur: Maybe<Scalars['Float']['output']>;
  avg_prev: Maybe<Scalars['Float']['output']>;
  delivery_region: Scalars['String']['output'];
  delta_min: Maybe<Scalars['Float']['output']>;
  delta_percent: Maybe<Scalars['Float']['output']>;
};

export type DeliveryRegionTrendInput = {
  period: PeriodInput;
};

export type FilterInput = {
  field: Scalars['String']['input'];
  op: Scalars['String']['input'];
  value: InputMaybe<Scalars['JSON']['input']>;
};

export type LostCustomer = {
  __typename?: 'LostCustomer';
  customer_id: Scalars['ID']['output'];
  last_date: Scalars['String']['output'];
  n_orders: Scalars['Int']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  saveDashboard: Maybe<Dashboard>;
};


export type MutationSaveDashboardArgs = {
  input: SaveDashboardInput;
};

export type PeriodInput = {
  dateFrom: Scalars['String']['input'];
  dateTo: Scalars['String']['input'];
  prevDateFrom: InputMaybe<Scalars['String']['input']>;
  prevDateTo: InputMaybe<Scalars['String']['input']>;
};

export type PivotFieldValuesInput = {
  field: Scalars['String']['input'];
  limit: InputMaybe<Scalars['Int']['input']>;
  search: InputMaybe<Scalars['String']['input']>;
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
  dateRange: InputMaybe<DateRangeInput>;
  dimensions: InputMaybe<Array<Scalars['String']['input']>>;
  filters: InputMaybe<Array<FilterInput>>;
  limit: InputMaybe<Scalars['Int']['input']>;
  measures: Array<PivotMeasureInput>;
};

export type PivotMeasureInput = {
  alias: InputMaybe<Scalars['String']['input']>;
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
  delta_percent: Maybe<Scalars['Float']['output']>;
  faturamento: Scalars['Float']['output'];
  faturamento_prev: Maybe<Scalars['Float']['output']>;
  product_id: Scalars['ID']['output'];
  total_itens: Scalars['Int']['output'];
};

export type Query = {
  __typename?: 'Query';
  autoInsights: Array<AutoInsight>;
  dashboard: Maybe<Dashboard>;
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
  channel: InputMaybe<Scalars['String']['input']>;
  dow: InputMaybe<Scalars['Int']['input']>;
  hourFrom: InputMaybe<Scalars['Int']['input']>;
  hourTo: InputMaybe<Scalars['Int']['input']>;
  period: PeriodInput;
};

export type GetDashboardsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetDashboardsQuery = { __typename?: 'Query', dashboards: Array<{ __typename?: 'Dashboard', id: string, name: string, created_at: string | null }> };

export type PivotQueryVariables = Exact<{
  input: PivotInput;
}>;


export type PivotQuery = { __typename?: 'Query', pivot: { __typename?: 'PivotResult', sql: string, rows: Array<any> } };

export type GetDashboardByIdQueryVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type GetDashboardByIdQuery = { __typename?: 'Query', dashboard: { __typename?: 'Dashboard', id: string, name: string, config: any | null, created_at: string | null } | null };

export type GetAutoInsightsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAutoInsightsQuery = { __typename?: 'Query', autoInsights: Array<{ __typename?: 'AutoInsight', message: string }> };

export type GetTopProductsQueryVariables = Exact<{
  input: TopProductsInput;
}>;


export type GetTopProductsQuery = { __typename?: 'Query', topProducts: Array<{ __typename?: 'ProductAgg', product_id: string, total_itens: number, faturamento: number, faturamento_prev: number | null, delta_percent: number | null }> };

export type GetDeliveryRegionTrendQueryVariables = Exact<{
  input: DeliveryRegionTrendInput;
}>;


export type GetDeliveryRegionTrendQuery = { __typename?: 'Query', deliveryRegionTrend: Array<{ __typename?: 'DeliveryRegionTrend', delivery_region: string, avg_prev: number | null, avg_cur: number | null, delta_min: number | null, delta_percent: number | null }> };

export type GetLostButLoyalQueryVariables = Exact<{ [key: string]: never; }>;


export type GetLostButLoyalQuery = { __typename?: 'Query', lostButLoyal: Array<{ __typename?: 'LostCustomer', customer_id: string, n_orders: number, last_date: string }> };

export type SaveDashboardMutationVariables = Exact<{
  input: SaveDashboardInput;
}>;


export type SaveDashboardMutation = { __typename?: 'Mutation', saveDashboard: { __typename?: 'Dashboard', id: string, name: string, config: any | null, created_at: string | null } | null };

export type GetPivotFieldValuesQueryVariables = Exact<{
  input: PivotFieldValuesInput;
}>;


export type GetPivotFieldValuesQuery = { __typename?: 'Query', pivotFieldValues: Array<string> };


export const GetDashboardsDocument = gql`
    query GetDashboards {
  dashboards {
    id
    name
    created_at
  }
}
    `;

/**
 * __useGetDashboardsQuery__
 *
 * To run a query within a React component, call `useGetDashboardsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetDashboardsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetDashboardsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetDashboardsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetDashboardsQuery, GetDashboardsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetDashboardsQuery, GetDashboardsQueryVariables>(GetDashboardsDocument, options);
      }
export function useGetDashboardsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetDashboardsQuery, GetDashboardsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetDashboardsQuery, GetDashboardsQueryVariables>(GetDashboardsDocument, options);
        }
export function useGetDashboardsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetDashboardsQuery, GetDashboardsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetDashboardsQuery, GetDashboardsQueryVariables>(GetDashboardsDocument, options);
        }
export type GetDashboardsQueryHookResult = ReturnType<typeof useGetDashboardsQuery>;
export type GetDashboardsLazyQueryHookResult = ReturnType<typeof useGetDashboardsLazyQuery>;
export type GetDashboardsSuspenseQueryHookResult = ReturnType<typeof useGetDashboardsSuspenseQuery>;
export type GetDashboardsQueryResult = Apollo.QueryResult<GetDashboardsQuery, GetDashboardsQueryVariables>;
export const PivotDocument = gql`
    query Pivot($input: PivotInput!) {
  pivot(input: $input) {
    sql
    rows
  }
}
    `;

/**
 * __usePivotQuery__
 *
 * To run a query within a React component, call `usePivotQuery` and pass it any options that fit your needs.
 * When your component renders, `usePivotQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePivotQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function usePivotQuery(baseOptions: ApolloReactHooks.QueryHookOptions<PivotQuery, PivotQueryVariables> & ({ variables: PivotQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<PivotQuery, PivotQueryVariables>(PivotDocument, options);
      }
export function usePivotLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<PivotQuery, PivotQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<PivotQuery, PivotQueryVariables>(PivotDocument, options);
        }
export function usePivotSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<PivotQuery, PivotQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<PivotQuery, PivotQueryVariables>(PivotDocument, options);
        }
export type PivotQueryHookResult = ReturnType<typeof usePivotQuery>;
export type PivotLazyQueryHookResult = ReturnType<typeof usePivotLazyQuery>;
export type PivotSuspenseQueryHookResult = ReturnType<typeof usePivotSuspenseQuery>;
export type PivotQueryResult = Apollo.QueryResult<PivotQuery, PivotQueryVariables>;
export const GetDashboardByIdDocument = gql`
    query GetDashboardById($id: Int!) {
  dashboard(id: $id) {
    id
    name
    config
    created_at
  }
}
    `;

/**
 * __useGetDashboardByIdQuery__
 *
 * To run a query within a React component, call `useGetDashboardByIdQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetDashboardByIdQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetDashboardByIdQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetDashboardByIdQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetDashboardByIdQuery, GetDashboardByIdQueryVariables> & ({ variables: GetDashboardByIdQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetDashboardByIdQuery, GetDashboardByIdQueryVariables>(GetDashboardByIdDocument, options);
      }
export function useGetDashboardByIdLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetDashboardByIdQuery, GetDashboardByIdQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetDashboardByIdQuery, GetDashboardByIdQueryVariables>(GetDashboardByIdDocument, options);
        }
export function useGetDashboardByIdSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetDashboardByIdQuery, GetDashboardByIdQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetDashboardByIdQuery, GetDashboardByIdQueryVariables>(GetDashboardByIdDocument, options);
        }
export type GetDashboardByIdQueryHookResult = ReturnType<typeof useGetDashboardByIdQuery>;
export type GetDashboardByIdLazyQueryHookResult = ReturnType<typeof useGetDashboardByIdLazyQuery>;
export type GetDashboardByIdSuspenseQueryHookResult = ReturnType<typeof useGetDashboardByIdSuspenseQuery>;
export type GetDashboardByIdQueryResult = Apollo.QueryResult<GetDashboardByIdQuery, GetDashboardByIdQueryVariables>;
export const GetAutoInsightsDocument = gql`
    query GetAutoInsights {
  autoInsights {
    message
  }
}
    `;

/**
 * __useGetAutoInsightsQuery__
 *
 * To run a query within a React component, call `useGetAutoInsightsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAutoInsightsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAutoInsightsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetAutoInsightsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetAutoInsightsQuery, GetAutoInsightsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetAutoInsightsQuery, GetAutoInsightsQueryVariables>(GetAutoInsightsDocument, options);
      }
export function useGetAutoInsightsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetAutoInsightsQuery, GetAutoInsightsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetAutoInsightsQuery, GetAutoInsightsQueryVariables>(GetAutoInsightsDocument, options);
        }
export function useGetAutoInsightsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetAutoInsightsQuery, GetAutoInsightsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetAutoInsightsQuery, GetAutoInsightsQueryVariables>(GetAutoInsightsDocument, options);
        }
export type GetAutoInsightsQueryHookResult = ReturnType<typeof useGetAutoInsightsQuery>;
export type GetAutoInsightsLazyQueryHookResult = ReturnType<typeof useGetAutoInsightsLazyQuery>;
export type GetAutoInsightsSuspenseQueryHookResult = ReturnType<typeof useGetAutoInsightsSuspenseQuery>;
export type GetAutoInsightsQueryResult = Apollo.QueryResult<GetAutoInsightsQuery, GetAutoInsightsQueryVariables>;
export const GetTopProductsDocument = gql`
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

/**
 * __useGetTopProductsQuery__
 *
 * To run a query within a React component, call `useGetTopProductsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetTopProductsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetTopProductsQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetTopProductsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetTopProductsQuery, GetTopProductsQueryVariables> & ({ variables: GetTopProductsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetTopProductsQuery, GetTopProductsQueryVariables>(GetTopProductsDocument, options);
      }
export function useGetTopProductsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetTopProductsQuery, GetTopProductsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetTopProductsQuery, GetTopProductsQueryVariables>(GetTopProductsDocument, options);
        }
export function useGetTopProductsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetTopProductsQuery, GetTopProductsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetTopProductsQuery, GetTopProductsQueryVariables>(GetTopProductsDocument, options);
        }
export type GetTopProductsQueryHookResult = ReturnType<typeof useGetTopProductsQuery>;
export type GetTopProductsLazyQueryHookResult = ReturnType<typeof useGetTopProductsLazyQuery>;
export type GetTopProductsSuspenseQueryHookResult = ReturnType<typeof useGetTopProductsSuspenseQuery>;
export type GetTopProductsQueryResult = Apollo.QueryResult<GetTopProductsQuery, GetTopProductsQueryVariables>;
export const GetDeliveryRegionTrendDocument = gql`
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

/**
 * __useGetDeliveryRegionTrendQuery__
 *
 * To run a query within a React component, call `useGetDeliveryRegionTrendQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetDeliveryRegionTrendQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetDeliveryRegionTrendQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetDeliveryRegionTrendQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetDeliveryRegionTrendQuery, GetDeliveryRegionTrendQueryVariables> & ({ variables: GetDeliveryRegionTrendQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetDeliveryRegionTrendQuery, GetDeliveryRegionTrendQueryVariables>(GetDeliveryRegionTrendDocument, options);
      }
export function useGetDeliveryRegionTrendLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetDeliveryRegionTrendQuery, GetDeliveryRegionTrendQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetDeliveryRegionTrendQuery, GetDeliveryRegionTrendQueryVariables>(GetDeliveryRegionTrendDocument, options);
        }
export function useGetDeliveryRegionTrendSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetDeliveryRegionTrendQuery, GetDeliveryRegionTrendQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetDeliveryRegionTrendQuery, GetDeliveryRegionTrendQueryVariables>(GetDeliveryRegionTrendDocument, options);
        }
export type GetDeliveryRegionTrendQueryHookResult = ReturnType<typeof useGetDeliveryRegionTrendQuery>;
export type GetDeliveryRegionTrendLazyQueryHookResult = ReturnType<typeof useGetDeliveryRegionTrendLazyQuery>;
export type GetDeliveryRegionTrendSuspenseQueryHookResult = ReturnType<typeof useGetDeliveryRegionTrendSuspenseQuery>;
export type GetDeliveryRegionTrendQueryResult = Apollo.QueryResult<GetDeliveryRegionTrendQuery, GetDeliveryRegionTrendQueryVariables>;
export const GetLostButLoyalDocument = gql`
    query GetLostButLoyal {
  lostButLoyal {
    customer_id
    n_orders
    last_date
  }
}
    `;

/**
 * __useGetLostButLoyalQuery__
 *
 * To run a query within a React component, call `useGetLostButLoyalQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetLostButLoyalQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetLostButLoyalQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetLostButLoyalQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetLostButLoyalQuery, GetLostButLoyalQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetLostButLoyalQuery, GetLostButLoyalQueryVariables>(GetLostButLoyalDocument, options);
      }
export function useGetLostButLoyalLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetLostButLoyalQuery, GetLostButLoyalQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetLostButLoyalQuery, GetLostButLoyalQueryVariables>(GetLostButLoyalDocument, options);
        }
export function useGetLostButLoyalSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetLostButLoyalQuery, GetLostButLoyalQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetLostButLoyalQuery, GetLostButLoyalQueryVariables>(GetLostButLoyalDocument, options);
        }
export type GetLostButLoyalQueryHookResult = ReturnType<typeof useGetLostButLoyalQuery>;
export type GetLostButLoyalLazyQueryHookResult = ReturnType<typeof useGetLostButLoyalLazyQuery>;
export type GetLostButLoyalSuspenseQueryHookResult = ReturnType<typeof useGetLostButLoyalSuspenseQuery>;
export type GetLostButLoyalQueryResult = Apollo.QueryResult<GetLostButLoyalQuery, GetLostButLoyalQueryVariables>;
export const SaveDashboardDocument = gql`
    mutation SaveDashboard($input: SaveDashboardInput!) {
  saveDashboard(input: $input) {
    id
    name
    config
    created_at
  }
}
    `;
export type SaveDashboardMutationFn = Apollo.MutationFunction<SaveDashboardMutation, SaveDashboardMutationVariables>;

/**
 * __useSaveDashboardMutation__
 *
 * To run a mutation, you first call `useSaveDashboardMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSaveDashboardMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [saveDashboardMutation, { data, loading, error }] = useSaveDashboardMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useSaveDashboardMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<SaveDashboardMutation, SaveDashboardMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<SaveDashboardMutation, SaveDashboardMutationVariables>(SaveDashboardDocument, options);
      }
export type SaveDashboardMutationHookResult = ReturnType<typeof useSaveDashboardMutation>;
export type SaveDashboardMutationResult = Apollo.MutationResult<SaveDashboardMutation>;
export type SaveDashboardMutationOptions = Apollo.BaseMutationOptions<SaveDashboardMutation, SaveDashboardMutationVariables>;
export const GetPivotFieldValuesDocument = gql`
    query GetPivotFieldValues($input: PivotFieldValuesInput!) {
  pivotFieldValues(input: $input)
}
    `;

/**
 * __useGetPivotFieldValuesQuery__
 *
 * To run a query within a React component, call `useGetPivotFieldValuesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPivotFieldValuesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPivotFieldValuesQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetPivotFieldValuesQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetPivotFieldValuesQuery, GetPivotFieldValuesQueryVariables> & ({ variables: GetPivotFieldValuesQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetPivotFieldValuesQuery, GetPivotFieldValuesQueryVariables>(GetPivotFieldValuesDocument, options);
      }
export function useGetPivotFieldValuesLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetPivotFieldValuesQuery, GetPivotFieldValuesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetPivotFieldValuesQuery, GetPivotFieldValuesQueryVariables>(GetPivotFieldValuesDocument, options);
        }
export function useGetPivotFieldValuesSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetPivotFieldValuesQuery, GetPivotFieldValuesQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetPivotFieldValuesQuery, GetPivotFieldValuesQueryVariables>(GetPivotFieldValuesDocument, options);
        }
export type GetPivotFieldValuesQueryHookResult = ReturnType<typeof useGetPivotFieldValuesQuery>;
export type GetPivotFieldValuesLazyQueryHookResult = ReturnType<typeof useGetPivotFieldValuesLazyQuery>;
export type GetPivotFieldValuesSuspenseQueryHookResult = ReturnType<typeof useGetPivotFieldValuesSuspenseQuery>;
export type GetPivotFieldValuesQueryResult = Apollo.QueryResult<GetPivotFieldValuesQuery, GetPivotFieldValuesQueryVariables>;