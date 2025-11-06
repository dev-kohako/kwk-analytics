import { GraphQLScalarType, Kind } from "graphql";
import { z } from "zod";
import { wrapResolver } from "../utils/resolverWrapper";
import { cacheWrap } from "../utils/cache";

import {
  saveDashboard,
  getDashboards,
  getDashboardById,
  getDeliveryRegionTrend,
  getLostButLoyal,
  getTopProducts,
  getAutoInsights,
  runPivot,
  getPivotFieldValues,
} from "../controllers";

import {
  SaveDashboardInput as SaveDashboardSchema,
  DeliveryRegionTrendInput as DeliveryRegionTrendSchema,
  TopProductsInput as TopProductsSchema,
  PivotInput as PivotSchema,
  PivotFieldInput as PivotFieldSchema,
} from "../validation/analytics.zod";
import { AppError } from "../utils/errors";

type SaveDashboardInput = z.infer<typeof SaveDashboardSchema>;
type DeliveryRegionTrendInput = z.infer<typeof DeliveryRegionTrendSchema>;
type TopProductsInput = z.infer<typeof TopProductsSchema>;
type PivotInput = z.infer<typeof PivotSchema>;
type PivotFieldValuesInput = z.infer<typeof PivotFieldSchema>;

const CACHE_TTLS = {
  DASHBOARD: 60_000,
  DASHBOARDS: 60_000,
  DELIVERY_REGION_TREND: 60_000,
  LOST_LOYAL: 60_000,
  TOP_PRODUCTS: 60_000,
  AUTO_INSIGHTS: 30_000,
  PIVOT: 60_000,
};

const JSONScalar = new GraphQLScalarType({
  name: "JSON",
  description: "Arbitrary JSON value compatible with Apollo",
  parseValue: (value) => value,
  serialize: (value) => value,
  parseLiteral(ast) {
    switch (ast.kind) {
      case Kind.STRING:
      case Kind.BOOLEAN:
        return ast.value;
      case Kind.INT:
      case Kind.FLOAT:
        return parseFloat(ast.value);
      case Kind.OBJECT: {
        const obj: Record<string, any> = {};
        for (const field of ast.fields ?? []) {
          obj[field.name.value] = (field.value as any).value;
        }
        return obj;
      }
      case Kind.LIST:
        return ast.values.map((v: any) => v.value);
      default:
        return null;
    }
  },
});

export const resolvers = {
  JSON: JSONScalar,

  Query: {
    dashboards: wrapResolver(async () =>
      cacheWrap("dashboards", CACHE_TTLS.DASHBOARDS, () => getDashboards())
    ),

    dashboard: wrapResolver(async (_: unknown, { id }: { id: number }) =>
      cacheWrap(`dashboard:${id}`, CACHE_TTLS.DASHBOARD, () =>
        getDashboardById(id)
      )
    ),

    deliveryRegionTrend: wrapResolver(
      async (_: unknown, { input }: { input: DeliveryRegionTrendInput }) => {
        const parsed = DeliveryRegionTrendSchema.parse(input);
        return cacheWrap(
          `deliveryRegionTrend:${JSON.stringify(parsed)}`,
          CACHE_TTLS.DELIVERY_REGION_TREND,
          () => getDeliveryRegionTrend(parsed)
        );
      }
    ),

    lostButLoyal: wrapResolver(async () =>
      cacheWrap("lostButLoyal", CACHE_TTLS.LOST_LOYAL, getLostButLoyal)
    ),

    topProducts: wrapResolver(
      async (_: unknown, { input }: { input: TopProductsInput }) => {
        const parsed = TopProductsSchema.parse(input);
        return cacheWrap(
          `topProducts:${JSON.stringify(parsed)}`,
          CACHE_TTLS.TOP_PRODUCTS,
          () => getTopProducts(parsed)
        );
      }
    ),

    autoInsights: wrapResolver(async () =>
      cacheWrap("autoInsights", CACHE_TTLS.AUTO_INSIGHTS, getAutoInsights)
    ),

    pivot: wrapResolver(
      async (_: unknown, { input }: { input: PivotInput }) => {
        const parsed = PivotSchema.parse(input);
        const normalized = {
          ...parsed,
          measures: parsed.measures.map((m) => ({
            ...m,
            alias: m.alias ?? undefined,
          })),
        };
        const key = JSON.stringify(normalized);
        return cacheWrap(`pivot:${key}`, CACHE_TTLS.PIVOT, () =>
          runPivot(normalized)
        );
      }
    ),

    pivotFieldValues: wrapResolver(
      async (_: unknown, { input }: { input: PivotFieldValuesInput }) => {
        try {
          const parsed = PivotFieldSchema.parse(input);
          return cacheWrap(
            `pivotFieldValues:${input.field}`,
            CACHE_TTLS.PIVOT,
            () => getPivotFieldValues(parsed)
          );
        } catch (err) {
          console.error("Erro ao buscar valores do pivot:", err);
          throw new AppError(
            "Falha ao carregar valores de filtro dinâmico.",
            400,
            err
          );
        }
      }
    ),
  },

  Mutation: {
    saveDashboard: wrapResolver(
      async (_: unknown, { input }: { input: SaveDashboardInput }) => {
        const parsed = SaveDashboardSchema.parse(input);
        return saveDashboard(parsed.name, parsed.config);
      }
    ),
  },
};
