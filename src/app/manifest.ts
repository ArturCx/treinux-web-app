import type { MetadataRoute } from "next";

// PWA / ícone da tela inicial do Android. O ícone é o símbolo do brand
// (public/icons/*), transparente ao redor do círculo, com folga interna.
// purpose "any" (não "maskable") porque a arte não sangra até a borda.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Treinux — Diário de treino",
    short_name: "Treinux",
    description:
      "Monte suas fichas, registre cada série e acompanhe seu progresso.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f1ea",
    theme_color: "#f4f1ea",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
