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
} from "../controllers";

import {
  SaveDashboardInput as SaveDashboardSchema,
  DeliveryRegionTrendInput as DeliveryRegionTrendSchema,
} from "../validation/analytics.zod";

type SaveDashboardInput = z.infer<typeof SaveDashboardSchema>;
type DeliveryRegionTrendInput = z.infer<typeof DeliveryRegionTrendSchema>;

const CACHE_TTLS = {
  DASHBOARD: 60_000,
  DASHBOARDS: 60_000,
  DELIVERY_REGION_TREND: 60_000,
  LOST_LOYAL: 60_000,
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
          `deliveryRegionTrend:${input}`,
          CACHE_TTLS.DELIVERY_REGION_TREND,
          () => getDeliveryRegionTrend(parsed)
        );
      }
    ),

    lostButLoyal: wrapResolver(async () =>
      cacheWrap("lostButLoyal", CACHE_TTLS.LOST_LOYAL, getLostButLoyal)
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
