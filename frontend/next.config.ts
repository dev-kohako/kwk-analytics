import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O React Compiler memoiza automaticamente — dispensa useMemo/useCallback
  // manuais e corta re-render desnecessário nas listas de insights e gráficos.
  reactCompiler: true,

  transpilePackages: ["recharts"],

  // As rotas foram renomeadas para /explorar e /dashboards. Link salvo ou
  // dashboard compartilhado antes da mudança daria 404 — 308 preserva o
  // endereço antigo e avisa aos buscadores que ele mudou de vez.
  async redirects() {
    return [
      { source: "/explore", destination: "/explorar", permanent: true },
      { source: "/dashboard", destination: "/dashboards", permanent: true },
      {
        source: "/dashboard/:id",
        destination: "/dashboards/:id",
        permanent: true,
      },
    ];
  },

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
