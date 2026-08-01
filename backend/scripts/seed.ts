import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

/**
 * Popula o banco com dados de exemplo e atualiza a materialized view.
 *
 *   bun run seed             -> banco vazio: cria catálogo fictício e vendas
 *   bun run seed -- --append -> mantém tudo e só acrescenta vendas recentes
 *   bun run seed -- --force  -> APAGA o catálogo e recria do zero
 *
 * `--append` é o modo seguro para uma base que já tem dado real: reaproveita
 * lojas, canais, produtos e clientes existentes e só gera movimento nos
 * últimos 90 dias. Nada é apagado.
 *
 * Sem flag nenhuma o script recusa rodar num banco que já tem vendas, porque o
 * caminho padrão começa com TRUNCATE.
 */

const prisma = new PrismaClient();
const sqlDir = join(__dirname, "..", "sql");
const force = process.argv.includes("--force");
const append = process.argv.includes("--append");

/** Divide o arquivo em comandos. Os .sql do projeto não usam dollar-quoting. */
function statements(file: string): string[] {
  return readFileSync(join(sqlDir, file), "utf8")
    .split(/;\s*\r?\n/)
    .map((chunk) =>
      chunk
        .split(/\r?\n/)
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .trim()
    )
    .filter((chunk) => chunk.length > 0);
}

/**
 * Roda o arquivo inteiro numa transação: se um comando falhar no meio, nada
 * é gravado. Sem isso, uma falha parcial deixaria vendas sem itens no banco.
 */
async function run(file: string, label: string) {
  const comandos = statements(file);
  process.stdout.write(`${label} (${comandos.length} comandos)... `);

  await prisma.$transaction(
    async (tx) => {
      for (const comando of comandos) {
        await tx.$executeRawUnsafe(comando);
      }
    },
    { timeout: 180_000, maxWait: 30_000 }
  );

  process.stdout.write("ok\n");
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("✖ DATABASE_URL não definida. Configure o .env do backend.");
    process.exit(1);
  }

  const [{ total }] = await prisma.$queryRaw<Array<{ total: bigint }>>`
    SELECT COUNT(*)::bigint AS total FROM sales;
  `;

  if (Number(total) > 0 && !force && !append) {
    console.error(
      [
        `✖ O banco já tem ${Number(total).toLocaleString("pt-BR")} vendas registradas.`,
        "",
        "  Para acrescentar movimento recente sem apagar nada:",
        "    bun run seed -- --append",
        "",
        "  Para descartar tudo e recriar do zero (só em base descartável):",
        "    bun run seed -- --force",
      ].join("\n")
    );
    process.exit(1);
  }

  if (append) {
    await run("seed-recent-activity.sql", "→ acrescentando vendas recentes");
  } else {
    await run("seed-synthetic.sql", "→ gerando vendas de exemplo");
  }

  await run("mv_sales_fact.sql", "→ atualizando a materialized view");

  // A view é criada com IF NOT EXISTS, então precisa do refresh para enxergar
  // os dados novos quando já existia.
  await prisma.$executeRawUnsafe("REFRESH MATERIALIZED VIEW mv_sales_fact;");

  const [resumo] = await prisma.$queryRaw<
    Array<{ vendas: bigint; itens: bigint; receita: number; de: Date; ate: Date }>
  >`
    SELECT
      (SELECT COUNT(*)::bigint FROM sales)                       AS vendas,
      (SELECT COUNT(*)::bigint FROM product_sales)               AS itens,
      (SELECT COALESCE(SUM(total_price), 0)::float8 FROM product_sales) AS receita,
      (SELECT MIN(created_at)::date FROM sales)                  AS de,
      (SELECT MAX(created_at)::date FROM sales)                  AS ate;
  `;

  const brl = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  console.log("");
  console.log("✔ Dados de exemplo prontos:");
  console.log(`  vendas   ${Number(resumo.vendas).toLocaleString("pt-BR")}`);
  console.log(`  itens    ${Number(resumo.itens).toLocaleString("pt-BR")}`);
  console.log(`  receita  ${brl.format(resumo.receita)}`);
  console.log(`  período  ${resumo.de.toISOString().slice(0, 10)} a ${resumo.ate.toISOString().slice(0, 10)}`);
}

main()
  .catch((err) => {
    console.error(`✖ Falha ao popular: ${(err as Error).message}`);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
