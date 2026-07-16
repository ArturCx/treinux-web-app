import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

/**
 * Sessão do usuário logado. Redireciona para /login quando não há sessão.
 * Server Functions são alcançáveis por POST direto, então toda action e
 * toda página protegida precisa chamar isto — não confie na UI.
 */
export async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return session;
}
