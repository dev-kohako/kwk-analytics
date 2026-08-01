import { PrismaClient } from "@prisma/client";
import { clearCache } from "../src/utils/cache";

const prisma = new PrismaClient();

/**
 * A conexão é oportunista: as suítes de integração precisam de banco, mas as
 * unitárias (stats, insights, cache, wrapResolver) são puras e devem rodar em
 * qualquer máquina. Falhar aqui bloquearia todas elas de uma vez.
 */
let connected = false;

beforeAll(async () => {
  try {
    await prisma.$connect();
    connected = true;
  } catch (err) {
    const reason = (err as Error).message.split("\n")[0];
    console.warn(
      `[tests] banco indisponível (${reason}) — suítes de integração vão falhar, as unitárias seguem.`
    );
  }
});

afterAll(async () => {
  clearCache();
  // Desconectar um cliente que nunca conectou trava até o timeout do hook.
  if (!connected) return;

  try {
    await prisma.$disconnect();
  } catch {
    // nada a fazer no encerramento
  }
});

jest.setTimeout(30_000);
