import "dotenv/config";
import { ApolloServer } from "apollo-server";
import { typeDefs } from "./graphql/schema";
import { resolvers } from "./graphql/resolvers";
import { createContext } from "./graphql/context";
import { clearCache } from "./utils/cache";
import { prisma } from "./lib/prisma";

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
    console.log(`🚀 Analytics GraphQL ready at ${url}`);

    const shutdown = async () => {
      console.log("🛑 Shutting down server...");
      clearCache();
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
