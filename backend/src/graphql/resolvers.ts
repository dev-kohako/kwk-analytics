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
import {
  activeSessions,
  changePassword,
  currentUser,
  login,
  logout,
  logoutAll,
  refreshSession,
  register,
  updateProfile,
} from "../controllers/auth/auth.controller";
import {
  requestPasswordReset,
  resetPassword,
} from "../controllers/auth/password.controller";
import {
  RequestResetInput as RequestResetSchema,
  ResetPasswordInput as ResetPasswordSchema,
} from "../validation/password.zod";
import {
  ChangePasswordInput as ChangePasswordSchema,
  UpdateProfileInput as UpdateProfileSchema,
} from "../validation/profile.zod";
import {
  LoginInput as LoginSchema,
  RefreshInput as RefreshSchema,
  RegisterInput as RegisterSchema,
} from "../validation/auth.zod";
import {
  createBillingPortal,
  createCheckout,
  listPlans,
} from "../controllers/billing/billing.controller";
import type { GraphQLContext } from "./context";
import {
  exigirDentroDoLimite,
  registrarUso,
  type Metrica,
} from "../lib/limits";

/** Recusa o acesso quando não há sessão — usado pelos resolvers protegidos. */
const exigirConta = (ctx: GraphQLContext): number => {
  if (!ctx?.userId) throw new AppError("Faça login para continuar.", 401);
  return ctx.userId;
};

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

const mapaBase = {
  JSON: JSONScalar,

  Query: {
    me: wrapResolver(async (_: unknown, __: unknown, ctx: GraphQLContext) =>
      ctx?.userId ? currentUser(ctx.userId) : null
    ),

    plans: wrapResolver(async () => listPlans()),

    activeSessions: wrapResolver(
      async (_: unknown, __: unknown, ctx: GraphQLContext) =>
        activeSessions(exigirConta(ctx))
    ),

    dashboards: wrapResolver(async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      const userId = exigirConta(ctx);
      return cacheWrap(`dashboards:${userId}`, CACHE_TTLS.DASHBOARDS, () =>
        getDashboards(userId)
      );
    }
    ),

    dashboard: wrapResolver(
      async (_: unknown, { id }: { id: number }, ctx: GraphQLContext) => {
        const userId = exigirConta(ctx);
        return cacheWrap(
          `dashboard:${id}:${userId}`,
          CACHE_TTLS.DASHBOARD,
          () => getDashboardById(id, userId)
        );
      }
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
    register: wrapResolver(
      async (_: unknown, { input }: { input: unknown }, ctx: GraphQLContext) =>
        register({ ...RegisterSchema.parse(input), userAgent: ctx?.userAgent })
    ),

    login: wrapResolver(
      async (_: unknown, { input }: { input: unknown }, ctx: GraphQLContext) =>
        login({ ...LoginSchema.parse(input), userAgent: ctx?.userAgent })
    ),

    refreshSession: wrapResolver(async (_: unknown, args: unknown) => {
      const { refreshToken } = RefreshSchema.parse(args);
      const { accessToken } = await refreshSession(refreshToken);
      return accessToken;
    }),

    logout: wrapResolver(async (_: unknown, args: unknown) => {
      const { refreshToken } = RefreshSchema.parse(args);
      return logout(refreshToken);
    }),

    logoutAll: wrapResolver(
      async (_: unknown, __: unknown, ctx: GraphQLContext) =>
        logoutAll(exigirConta(ctx))
    ),

    createCheckout: wrapResolver(
      async (_: unknown, { planCode }: { planCode: string }, ctx: GraphQLContext) =>
        createCheckout(exigirConta(ctx), planCode)
    ),

    createBillingPortal: wrapResolver(
      async (_: unknown, __: unknown, ctx: GraphQLContext) =>
        createBillingPortal(exigirConta(ctx))
    ),

    changePassword: wrapResolver(
      async (_: unknown, args: any, ctx: GraphQLContext) => {
        const { currentPassword, newPassword } = ChangePasswordSchema.parse(args);
        return changePassword(exigirConta(ctx), currentPassword, newPassword);
      }
    ),

    updateProfile: wrapResolver(
      async (_: unknown, args: any, ctx: GraphQLContext) => {
        const { name } = UpdateProfileSchema.parse(args);
        return updateProfile(exigirConta(ctx), name);
      }
    ),

    requestPasswordReset: wrapResolver(async (_: unknown, args: unknown) => {
      const { email } = RequestResetSchema.parse(args);
      return requestPasswordReset(email);
    }),

    resetPassword: wrapResolver(async (_: unknown, args: unknown) => {
      const { token, password } = ResetPasswordSchema.parse(args);
      return resetPassword(token, password);
    }),

    saveDashboard: wrapResolver(
      async (
        _: unknown,
        { input }: { input: SaveDashboardInput },
        ctx: GraphQLContext
      ) => {
        const parsed = SaveDashboardSchema.parse(input);
        return saveDashboard(parsed.name, parsed.config, exigirConta(ctx));
      }
    ),
  },
};

/**
 * Fecha as operações atrás de login.
 *
 * A guarda é aplicada sobre o mapa inteiro, não resolver a resolver: assim
 * uma operação nova nasce protegida por padrão, e abrir ao público vira uma
 * decisão explícita — em vez de esquecer o guard ser o comportamento padrão.
 */
const PUBLICAS = new Set([
  "me",
  "plans",
  "register",
  "login",
  "refreshSession",
  "logout",
  "requestPasswordReset",
  "resetPassword",
]);

type Campo = (parent: unknown, args: any, ctx: GraphQLContext) => unknown;

/**
 * Operações que consomem cota. O limite é verificado antes de executar e
 * contado só depois do sucesso — cobrar por tentativa que falhou vira
 * reclamação de suporte, não receita.
 */
const COTA: Record<string, Metrica> = {
  pivot: "analyses",
  topProducts: "analyses",
  deliveryRegionTrend: "analyses",
  autoInsights: "aiInsights",
  saveDashboard: "dashboards",
};

const proteger = (campos: Record<string, Campo>): Record<string, Campo> =>
  Object.fromEntries(
    Object.entries(campos).map(([nome, fn]) => [
      nome,
      PUBLICAS.has(nome)
        ? fn
        : async (parent: unknown, args: any, ctx: GraphQLContext) => {
            const userId = exigirConta(ctx);
            const metrica = COTA[nome];

            if (metrica) await exigirDentroDoLimite(userId, metrica);

            const resultado = await fn(parent, args, ctx);

            if (metrica) await registrarUso(userId, metrica);

            return resultado;
          },
    ])
  );

export const resolvers = {
  ...mapaBase,
  Query: proteger(mapaBase.Query as Record<string, Campo>),
  Mutation: proteger(mapaBase.Mutation as Record<string, Campo>),
};
