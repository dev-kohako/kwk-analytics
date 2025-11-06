"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center space-y-4"
      >
        <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden="true" />
        <h2 className="text-lg font-semibold">Carregando...</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Aguarde um momento enquanto preparamos os dados para você ⚙️
        </p>
      </motion.div>
    </main>
  );
}
