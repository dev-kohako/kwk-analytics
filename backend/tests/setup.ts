import { PrismaClient } from "@prisma/client";
import { clearCache } from "../src/utils/cache";

const prisma = new PrismaClient();

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  clearCache();
  await prisma.$disconnect();
});

jest.setTimeout(30_000);