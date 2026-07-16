import Link from "next/link";
import { requireSession } from "@/lib/session";
import { LogoutButton } from "../logout-button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-paper-edge bg-paper/90 px-6 py-4 backdrop-blur lg:px-10">
        <div className="flex items-center gap-8">
          <Link
            href="/fichas"
            className="text-[20px] font-bold tracking-[-0.02em] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ember"
          >
            Treinux<span className="text-ember">.</span>
          </Link>
          <nav className="flex items-center gap-5 text-[13px] font-medium tracking-[0.04em]">
            <Link
              href="/fichas"
              className="text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ember"
            >
              FICHAS
            </Link>
            <Link
              href="/exercicios"
              className="text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ember"
            >
              EXERCÍCIOS
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden text-[13px] text-muted sm:block">
            {session.user.name.split(" ")[0]}
          </span>
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 px-6 py-8 lg:px-10 lg:py-12">{children}</main>
    </div>
  );
}
