import Link from "next/link";
import { requireSession } from "@/lib/session";
import { AppNav } from "@/components/app-nav";
import { LogoutButton } from "../logout-button";

/*
 * Alturas do header são fixas de propósito: as telas de sangria total
 * (ficha, primeira visita) calculam min-h com elas.
 * Mobile: 56px (linha do logo) + 44px (linha do nav) + 1px = 101px.
 * Desktop: 64px + 1px = 65px.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 border-b border-paper-edge bg-paper/90 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-6 lg:h-16 lg:px-10">
          <div className="flex items-center gap-8">
            <Link
              href="/fichas"
              className="text-[20px] font-bold tracking-[-0.02em] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ember"
            >
              Treinux<span className="text-ember">.</span>
            </Link>
            <div className="hidden lg:block">
              <AppNav />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-[13px] text-muted sm:block">
              {session.user.name.split(" ")[0]}
            </span>
            <LogoutButton />
          </div>
        </div>
        {/* nav em linha própria no mobile — não estoura em telas estreitas */}
        <div className="scrollbar-none flex overflow-x-auto px-6 lg:hidden">
          <AppNav />
        </div>
      </header>
      <main className="flex-1 px-6 py-8 lg:px-10 lg:py-12">{children}</main>
    </div>
  );
}
