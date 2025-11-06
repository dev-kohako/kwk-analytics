"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { BarChart3, FileText, Brain, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const DashboardPage = () => {
  return (
    <main className="py-10 px-4 max-w-6xl mx-auto space-y-10">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center space-y-4"
      >
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Bem-vindo ao seu <span className="text-primary">KWK Analytics</span>
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
          Acompanhe os resultados, analise tendências e crie insights para
          otimizar suas operações em tempo real.
        </p>
      </motion.section>

      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
          <CardHeader className="flex items-center gap-2 pb-0">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Meus Dashboards</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-between h-full pt-3">
            <p className="text-sm text-muted-foreground mb-3 flex-1">
              Visualize e gerencie dashboards salvos.
            </p>
            <div className="mt-auto pt-2">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  Acessar
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
          <CardHeader className="flex items-center gap-2 pb-0">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Insights Automáticos</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-between h-full pt-3">
            <p className="text-sm text-muted-foreground mb-3 flex-1">
              Gere insights inteligentes com base em seus dados.
            </p>
            <div className="mt-auto pt-2">
              <Link href="/insights">
                <Button variant="outline" size="sm">
                  Explorar
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
          <CardHeader className="flex items-center gap-2 pb-0">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Relatórios</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-between h-full pt-3">
            <p className="text-sm text-muted-foreground mb-3 flex-1">
              Exporte relatórios personalizados e métricas detalhadas.
            </p>
            <div className="mt-auto pt-2">
              <Link href="/reports">
                <Button variant="outline" size="sm">
                  Ver Relatórios
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.section>

      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="rounded-xl border border-border bg-card p-6 text-center"
      >
        <div className="flex flex-col items-center gap-4">
          <BarChart3 className="h-8 w-8 text-primary" />
          <h2 className="text-lg font-semibold">Visão Geral de Desempenho</h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Aqui você poderá acompanhar KPIs, vendas, retenção e muito mais.
            Crie um dashboard personalizado e visualize seus dados em tempo
            real.
          </p>
          <Link href="/insights">
            <Button size="sm" className="mt-2">
              Criar Meu Primeiro Dashboard
            </Button>
          </Link>
        </div>
      </motion.section>
    </main>
  );
};

export default dynamic(() => Promise.resolve(DashboardPage), { ssr: false });