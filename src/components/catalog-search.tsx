"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Busca com debounce que escreve na URL — a URL é o estado do catálogo,
 * então o resultado é linkável e o back do browser funciona.
 */
export function CatalogSearch({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const urlQuery = searchParams.get("q") ?? "";
  const [value, setValue] = useState(urlQuery);
  const firstRender = useRef(true);

  // Mantém o input em sincronia quando a URL muda por fora (voltar, limpar filtros).
  useEffect(() => {
    setValue(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (value === urlQuery) return;

    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (value) params.set("q", value);
      else params.delete("q");
      params.delete("page");
      startTransition(() => {
        router.replace(`${pathname}?${params}`, { scroll: false });
      });
    }, 250);

    return () => clearTimeout(timeout);
  }, [value, urlQuery, pathname, router, searchParams]);

  return (
    <div className="relative flex-1">
      <label htmlFor="catalog-search" className="sr-only">
        Buscar exercício
      </label>
      <input
        id="catalog-search"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="peer h-12 w-full border-b-2 border-ink bg-transparent px-0.5 pr-8 text-[17px] font-medium outline-none transition-colors placeholder:text-clay"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-ember transition-transform duration-300 ease-out peer-focus:scale-x-100"
      />
      {pending && (
        <span
          aria-hidden="true"
          className="absolute top-1/2 right-1 inline-block size-4 -translate-y-1/2 animate-spin rounded-full border-2 border-paper-edge border-t-ember"
        />
      )}
    </div>
  );
}
