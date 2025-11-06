import prisma from "../../lib/prisma";
import { DashboardConfig } from "../../types/dashboard.types";
import { AppError } from "../../utils/errors";

const DEFAULT_CONFIG: DashboardConfig = {
  chartTitle: "Novo Dashboard",
  type: "bar",
  xKey: "product_id",
  lines: [{ key: "faturamento", name: "Faturamento", color: "#3b82f6" }],
  data: [
    { product_id: "Pizza", faturamento: 12000 },
    { product_id: "Hambúrguer", faturamento: 9800 },
    { product_id: "Sushi", faturamento: 7300 },
    { product_id: "Açaí", faturamento: 6400 },
    { product_id: "Café", faturamento: 4200 },
  ],
  xAxisLabel: "Produto",
  yAxisLabel: "Faturamento (R$)",
  showGrid: true,
  showLegend: true,
};

function buildConfig(name: string, config?: Partial<DashboardConfig>): DashboardConfig {
  return {
    ...DEFAULT_CONFIG,
    ...config,
    chartTitle: config?.chartTitle || name || DEFAULT_CONFIG.chartTitle,
  };
}

export const saveDashboard = async (name: string, config?: Partial<DashboardConfig>) => {
  if (!name?.trim()) {
    throw new AppError("Nome do dashboard é obrigatório.", 400);
  }

  try {
    const finalConfig = buildConfig(name, config);

    const dashboard = await prisma.dashboard.create({
      data: { name, config: finalConfig },
      select: { id: true, name: true, created_at: true, config: true },
    });

    return dashboard;
  } catch (err: any) {
    if (err.code === "P2002") {
      throw new AppError("Já existe um dashboard com este nome.", 409);
    }
    throw new AppError("Erro ao salvar dashboard", 500, err);
  }
};

export async function getDashboards() {
  const dashboards = await prisma.dashboard.findMany({
    orderBy: { created_at: "desc" },
  });

  return dashboards.map((d) => ({
    ...d,
    config: d.config ?? {},
  }));
}

export const getDashboardById = async (id: number) => {
  try {
    const dashboard = await prisma.dashboard.findUnique({
      where: { id },
      select: { id: true, name: true, created_at: true, config: true },
    });

    if (!dashboard) throw new AppError("Dashboard não encontrado", 404);

    return dashboard;
  } catch (err) {
    throw new AppError("Erro ao buscar dashboard", 500, err);
  }
};
