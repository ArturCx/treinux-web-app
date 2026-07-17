"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * Prancha do espécime (50-exercicio): foto em cor original com Nº de série.
 * Foto estática por padrão; o GIF (≈100KB) só é buscado quando o usuário pede.
 */
export function ExerciseMedia({
  name,
  number,
  imageUrl,
  gifUrl,
}: {
  name: string;
  number: string;
  imageUrl: string;
  gifUrl: string | null;
}) {
  const [playing, setPlaying] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <figure className="mx-auto max-w-[340px] border-2 border-ink bg-paper shadow-[7px_7px_0_var(--color-riso)]">
      <div className="relative m-3 aspect-square overflow-hidden bg-paper-edge">
        {playing && gifUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- GIF animado: next/image congela a animação */}
            <img
              src={gifUrl}
              alt={`Animação do exercício ${name}`}
              width={180}
              height={180}
              onLoad={() => setLoaded(true)}
              className="size-full object-cover"
            />
            {!loaded && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span
                  aria-hidden="true"
                  className="inline-block size-6 animate-spin rounded-full border-2 border-paper/40 border-t-paper"
                />
              </span>
            )}
          </>
        ) : (
          <Image
            src={imageUrl}
            alt={`Posição do exercício ${name}`}
            width={360}
            height={360}
            priority
            className="size-full object-cover"
          />
        )}
        <span className="absolute top-2.5 left-2.5 z-[1] border border-ink bg-paper px-2 py-[3px] text-[10px] font-bold tracking-[0.14em] uppercase tabular-nums">
          {number}
        </span>
      </div>

      {gifUrl && (
        <button
          type="button"
          onClick={() => setPlaying((v) => !v)}
          aria-pressed={playing}
          className="mx-3 flex h-12 w-[calc(100%-1.5rem)] cursor-pointer items-center justify-between border border-ink px-3.5 text-[14px] font-bold transition-colors hover:bg-ink hover:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
        >
          <span>{playing ? "Ver posição" : "Ver movimento"}</span>
          <span aria-hidden="true" className="text-ember">
            {playing ? "◼" : "▶"}
          </span>
        </button>
      )}

      <figcaption className="mx-3 mt-2.5 mb-3 text-[11px] tracking-[0.1em] text-clay uppercase">
        Fig. 1 — {playing ? "movimento" : "posição"} · © Gym visual
      </figcaption>
    </figure>
  );
}
