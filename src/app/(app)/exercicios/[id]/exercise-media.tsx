"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * Foto estática por padrão; o GIF (≈100KB) só é buscado quando o usuário pede.
 * Evita baixar animação que ninguém olhou — e a foto já mostra a posição final.
 */
export function ExerciseMedia({
  name,
  imageUrl,
  gifUrl,
}: {
  name: string;
  imageUrl: string;
  gifUrl: string | null;
}) {
  const [playing, setPlaying] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <figure className="flex flex-col gap-3">
      <div className="relative aspect-square w-full overflow-hidden bg-paper-edge">
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
                  className="inline-block size-6 animate-spin rounded-full border-2 border-clay border-t-ink"
                />
              </span>
            )}
          </>
        ) : (
          <Image
            src={imageUrl}
            alt={`Posição do exercício ${name}`}
            width={180}
            height={180}
            priority
            className="size-full object-cover"
          />
        )}
      </div>

      {gifUrl && (
        <button
          type="button"
          onClick={() => setPlaying((v) => !v)}
          aria-pressed={playing}
          className="group flex h-12 cursor-pointer items-center justify-between border-2 border-ink px-4 text-[14px] font-bold transition-colors hover:bg-ink hover:text-paper active:bg-ink active:text-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
        >
          <span>{playing ? "Ver posição" : "Ver movimento"}</span>
          <span
            aria-hidden="true"
            className="text-ember transition-transform duration-200 group-hover:translate-x-1"
          >
            {playing ? "◼" : "▶"}
          </span>
        </button>
      )}

      <figcaption className="text-[11px] text-clay">
        Imagem: © Gym visual — gymvisual.com
      </figcaption>
    </figure>
  );
}
