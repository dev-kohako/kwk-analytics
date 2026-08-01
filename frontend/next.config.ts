import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O React Compiler memoiza automaticamente — dispensa useMemo/useCallback
  // manuais e corta re-render desnecessário nas listas de insights e gráficos.
  reactCompiler: true,

  transpilePackages: ["recharts"],

  // Recharts, Radix e lucide são o peso do bundle; o tree-shaking por import
  // nomeado evita puxar o pacote inteiro para a primeira tela.
  experimental: {
    optimizePackageImports: [
      "recharts",
      "lucide-react",
      "date-fns",
      "framer-motion",
    ],
  },
};

export default nextConfig;
