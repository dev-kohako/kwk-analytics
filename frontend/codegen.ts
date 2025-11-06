import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "http://localhost:4000/graphql",
  documents: ["src/**/*.ts", "src/**/*.tsx"],
  generates: {
    "./src/__generated__/graphql.ts": {
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-react-apollo"
      ],
      config: {
        avoidOptionals: true,
        withHooks: true,
      },
    },
  },
};

export default config;
