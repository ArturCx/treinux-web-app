"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import { ErrorBanner, Field, SubmitButton } from "@/components/form";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [emailTaken, setEmailTaken] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEmailTaken(false);
    setPasswordError(null);

    if (password.length < 8) {
      setPasswordError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    setPending(true);
    const { error } = await signUp.email({ name, email, password });

    if (error) {
      setPending(false);
      if (error.code?.startsWith("USER_ALREADY_EXISTS")) {
        setEmailTaken(true);
      } else {
        setError("Não foi possível criar sua conta. Tente novamente em instantes.");
      }
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="text-[22px] font-bold tracking-[-0.02em]">
        Treinux<span className="text-ember">.</span>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-[30px] leading-[1.05] font-bold tracking-[-0.03em]">
          Criar conta
        </h1>
        <p className="text-[14.5px] leading-normal text-muted">
          Comece a registrar seus treinos hoje.
        </p>
      </div>

      {error && <ErrorBanner>{error}</ErrorBanner>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
        <Field
          id="name"
          label="NOME"
          type="text"
          required
          autoComplete="name"
          placeholder="Seu nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Field
          id="email"
          label="E-MAIL"
          type="email"
          required
          autoComplete="email"
          placeholder="voce@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailTaken(false);
          }}
          error={
            emailTaken ? (
              <>
                Este e-mail já está em uso.{" "}
                <Link href="/login" className="underline underline-offset-2">
                  Entrar?
                </Link>
              </>
            ) : undefined
          }
        />

        <Field
          id="password"
          label="SENHA"
          type="password"
          required
          autoComplete="new-password"
          placeholder="Mínimo de 8 caracteres"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setPasswordError(null);
          }}
          error={passwordError ?? undefined}
        />

        <SubmitButton pending={pending} pendingLabel="Criando conta…">
          Criar conta
        </SubmitButton>
      </form>

      <p className="text-[14px] text-muted">
        Já tem uma conta?{" "}
        <Link
          href="/login"
          className="font-bold text-ink underline decoration-ember underline-offset-3 transition-colors duration-200 hover:text-ember focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}
