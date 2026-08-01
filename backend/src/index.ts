import "dotenv/config";
import { ApolloServer } from "apollo-server";
import { typeDefs } from "./graphql/schema";
import { resolvers } from "./graphql/resolvers";
import { createContext } from "./graphql/context";
import { cacheLayers, clearCache } from "./utils/cache";
import { prisma } from "./lib/prisma";
import { closeRedis } from "./lib/redis";
import { getAIConfig } from "./lib/ai";

const PORT = Number(process.env.PORT || 4000);
const NODE_ENV = process.env.NODE_ENV || "development";

async function startServer() {
  try {
    const server = new ApolloServer({
      typeDefs,
      resolvers,
      context: createContext,
      introspection: NODE_ENV !== "production",
      csrfPrevention: true,
      cache: "bounded",
      formatError: (err) => {
        console.error("❌ GraphQL Error:", err);
        return {
          message: err.message,
          code: err.extensions?.code || "INTERNAL_SERVER_ERROR",
        };
      },
    });

    const { url } = await server.listen({ port: PORT });
    const ai = getAIConfig();

    console.log(`🚀 Analytics GraphQL ready at ${url}`);
    console.log(`   cache:   ${cacheLayers().join(" + ")}`);
    console.log(
      `   insights: regras${ai.enabled ? ` + IA (${ai.provider}/${ai.model})` : " (IA desligada — defina GROQ_API_KEY, GEMINI_API_KEY ou AI_PROVIDER=ollama)"}`
    );

    const shutdown = async () => {
      console.log("🛑 Shutting down server...");
      clearCache();
      await closeRedis();
      await prisma.$disconnect();
      await server.stop();
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
