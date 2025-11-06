"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-5"
      >
        <div className="flex justify-center">
          <AlertTriangle className="h-12 w-12 text-destructive" aria-hidden="true" />
        </div>

        <h1 className="text-2xl font-bold">Página não encontrada</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          A página que você está tentando acessar não existe ou foi movida.
        </p>

        <div className="flex justify-center pt-3">
          <Link href="/">
            <Button variant="default" className="flex items-center gap-2">
              Voltar para o início
            </Button>
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
