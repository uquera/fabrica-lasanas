import type { Metadata } from "next";
import { SanwichClient } from "./sanwich-client";

export const metadata: Metadata = {
  title: "Doña Any de Noche · Estreno · 2x1 en churrascos",
  description:
    "Estreno nocturno de Doña Any en Iquique: churrascos y salchipapas. Juega, arma tu churrasco y reclama tu cupón 2x1 de la noche de estreno.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Doña Any de Noche · 2x1 en churrascos",
    description: "Arma tu churrasco y reclama tu cupón de estreno. Padre Hurtado #2245, Iquique.",
    type: "website",
  },
};

export default function SanwichPage() {
  return <SanwichClient />;
}
