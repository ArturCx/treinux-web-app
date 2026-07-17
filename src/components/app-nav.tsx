"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS = [
  { href: "/fichas", label: "FICHAS" },
  { href: "/exercicios", label: "EXERCÍCIOS" },
  { href: "/treino", label: "TREINO" },
];

/**
 * Navegação das seções com estado ativo — o sublinhado ember cresce da
 * esquerda ao entrar na seção. No mobile os links têm altura de toque (44px).
 */
export function AppNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Seções"
      className="flex items-center gap-6 text-[13px] font-medium tracking-[0.04em] lg:gap-5"
    >
      {SECTIONS.map((s) => {
        const active =
          pathname === s.href || pathname.startsWith(`${s.href}/`);
        return (
          <Link
            key={s.href}
            href={s.href}
            aria-current={active ? "page" : undefined}
            className={`relative flex h-11 shrink-0 items-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ember lg:h-auto lg:py-1 ${
              active ? "text-ink" : "text-muted hover:text-ink"
            }`}
          >
            {s.label}
            <span
              aria-hidden="true"
              className={`absolute inset-x-0 bottom-0 h-0.5 origin-left bg-ember transition-transform duration-200 ease-out ${
                active ? "scale-x-100" : "scale-x-0"
              }`}
            />
          </Link>
        );
      })}
    </nav>
  );
}
