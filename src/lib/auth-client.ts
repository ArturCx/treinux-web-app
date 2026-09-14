import { createAuthClient } from "better-auth/react";
import { sentinelClient } from "@better-auth/infra/client";

export const authClient = createAuthClient({
  plugins: [
    // envia a impressão digital do navegador ao sentinel e resolve sozinho o
    // desafio (PoW) quando o servidor pede um — o usuário não vê nada
    sentinelClient({ autoSolveChallenge: true }),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
