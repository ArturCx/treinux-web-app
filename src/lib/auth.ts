import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./prisma";

/*
 * Origens confiáveis: o Better Auth rejeita (403 "Invalid origin") requisições
 * de auth vindas de uma origem que não está nesta lista. Derivamos das vars
 * que o Vercel injeta sozinho, então funciona em produção e em previews sem
 * precisar setar BETTER_AUTH_URL manualmente:
 *  - VERCEL_PROJECT_PRODUCTION_URL → domínio de produção (ex.: treinux.vercel.app)
 *  - VERCEL_URL → URL específica do deployment (previews)
 */
const trustedOrigins = [
  "http://localhost:3000",
  process.env.BETTER_AUTH_URL,
  process.env.VERCEL_PROJECT_PRODUCTION_URL &&
    `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
  process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
].filter((o): o is string => Boolean(o));

export const auth = betterAuth({
  ...(process.env.BETTER_AUTH_URL ? { baseURL: process.env.BETTER_AUTH_URL } : {}),
  trustedOrigins,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  // nextCookies precisa ser o último plugin
  plugins: [nextCookies()],
});
