"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { ErrorBanner, Field, SubmitButton } from "@/components/form";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const { error } = await signIn.email({ email, password });

    if (error) {
      setPending(false);
      setError(
        error.status === 401 || error.code === "INVALID_EMAIL_OR_PASSWORD"
          ? "E-mail ou senha incorretos. Verifique e tente novamente."
          : "Não foi possível entrar. Tente novamente em instantes.",
      );
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      <Image
        src="/brand/treinux-logo.svg"
        alt="Treinux"
        width={389}
        height={96}
        priority
        className="h-9 w-auto"
      />

      <div className="flex flex-col gap-2">
        <h1 className="text-[34px] leading-[1.05] font-bold tracking-[-0.03em]">
          Entrar
        </h1>
        <p className="text-[14.5px] leading-normal text-muted">
          Seu plano de treino te espera.
        </p>
      </div>

      {error && <ErrorBanner>{error}</ErrorBanner>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
        <Field
          id="email"
          label="E-MAIL"
          type="email"
          required
          autoComplete="email"
          placeholder="voce@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Field
          id="password"
          label="SENHA"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          labelEnd={
            <a
              href="#"
              className="text-[13px] font-medium text-ember transition-colors duration-200 hover:text-ember-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
            >
              Esqueci minha senha
            </a>
          }
        />

        <SubmitButton pending={pending} pendingLabel="Entrando…">
          Entrar
        </SubmitButton>
      </form>

      <p className="text-[14px] text-muted">
        Não tem uma conta?{" "}
        <Link
          href="/signup"
          className="font-bold text-ink underline decoration-ember underline-offset-3 transition-colors duration-200 hover:text-ember focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
        >
          Criar conta
        </Link>
      </p>
    </div>
  );
}
