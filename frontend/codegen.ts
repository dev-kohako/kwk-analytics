import { CodegenConfig } from "@graphql-codegen/cli";

// O Apollo Server 3 standalone serve o GraphQL na raiz, não em /graphql.
const config: CodegenConfig = {
  schema: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/",
  documents: ["src/**/*.ts", "src/**/*.tsx"],
  generates: {
    "./src/gql/": {
      preset: "client",
      presetConfig: {
        gqlTagName: "gql",
      },
    },
  },
};

export default config;
