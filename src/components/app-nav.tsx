"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS = [
  { href: "/fichas", label: "Fichas" },
  { href: "/exercicios", label: "Exercícios" },
  { href: "/treino", label: "Treino" },
];

/**
 * Nav do masthead (§60): caps com tracking largo, item ativo em tinta com
 * sublinhado ember de 3px. Alvo de toque generoso no mobile.
 */
export function AppNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Seções" className="flex items-center gap-[22px]">
      {SECTIONS.map((s) => {
        const active = pathname === s.href || pathname.startsWith(`${s.href}/`);
        return (
          <Link
            key={s.href}
            href={s.href}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 border-b-[3px] pt-2.5 pb-3 text-[12.5px] font-bold tracking-[0.14em] uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ember lg:pt-3.5 lg:pb-4 ${
              active
                ? "border-ember text-ink"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {s.label}
          </Link>
        );
      })}
    </nav>
  );
}
