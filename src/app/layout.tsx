import type { Metadata } from "next";
import { Anton, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

// Anton: gritos de seção do zine (peso único). JetBrains Mono: dados da
// telemetria e a tabela do resumo de sessão.
const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jbmono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Treinux — Diário de treino",
  description:
    "Monte suas fichas, registre cada série e acompanhe seu progresso.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${spaceGrotesk.variable} ${anton.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
