"use client";

import { useActionState } from "react";
import { ErrorBanner, Field, SubmitButton, Textarea } from "@/components/form";
import { createFicha } from "../actions";

export function NewFichaForm() {
  const [state, action, pending] = useActionState(createFicha, null);

  return (
    <form action={action} className="flex flex-col gap-6">
      {state?.error && <ErrorBanner>{state.error}</ErrorBanner>}

      <Field
        id="name"
        name="name"
        label="NOME DA FICHA"
        type="text"
        required
        maxLength={80}
        autoFocus
        placeholder="Treino A — Puxar"
      />

      <Textarea
        id="notes"
        name="notes"
        label="OBSERVAÇÕES"
        hint="opcional"
        maxLength={500}
        placeholder="Aquecer 5 min antes. Focar na cadência."
      />

      <SubmitButton pending={pending} pendingLabel="Criando…">
        Criar ficha
      </SubmitButton>
    </form>
  );
}
