import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React Compiler desligado temporariamente: o build da Vercel falha desde que
  // ele foi ativado, enquanto o build local passa. Sem acesso aos logs do
  // deploy não dá para confirmar a causa, então fica desligado para não
  // segurar produção. Reativar junto com a leitura dos logs.
  // reactCompiler: true,

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
