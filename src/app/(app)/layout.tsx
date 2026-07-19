import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { AppNav } from "@/components/app-nav";
import { Grain, issueLabel } from "@/components/zine";
import { LogoutButton } from "../logout-button";

/*
 * Shell de navegação do zine (handoff §60): masthead com wordmark + edição,
 * nav em caps com sublinhado ember de 3px no ativo. Mobile: 2 linhas;
 * desktop: 1 linha. As páginas controlam o próprio container/padding —
 * o main não impõe nada (capas sangram até a borda).
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const activeFichas = await prisma.ficha.count({
    where: { userId: session.user.id, archived: false },
  });

  return (
    <div className="flex min-h-dvh flex-col">
      <Grain />
      <header className="border-b-2 border-ink">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-baseline gap-x-6 gap-y-1.5 px-[18px] pt-3.5 lg:flex-nowrap lg:items-center lg:px-10 lg:pt-4">
          <Link
            href="/fichas"
            aria-label="Treinux"
            className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ember"
          >
            <Image
              src="/brand/treinux-logo.svg"
              alt="Treinux"
              width={389}
              height={96}
              priority
              className="h-7 w-auto"
            />
          </Link>

          <div className="ml-auto flex items-center gap-4 lg:order-3">
            <span className="text-[11px] font-medium tracking-[0.14em] text-muted uppercase tabular-nums">
              {issueLabel(activeFichas)}
            </span>
            <span className="hidden text-[13px] text-muted sm:block">
              {session.user.name.split(" ")[0]}
            </span>
            <LogoutButton />
          </div>

          <div className="scrollbar-none -mx-[18px] w-[calc(100%+36px)] overflow-x-auto px-[18px] lg:order-2 lg:m-0 lg:ml-[34px] lg:w-auto lg:overflow-visible lg:px-0">
            <AppNav />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
