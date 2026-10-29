// Their menu: Playfair-style serif titles ("DESAYUNOS Y MERIENDAS", "Tienda & Café") over a geometric sans.
import { Outfit, Playfair_Display } from "next/font/google";

export const display = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
});

export const body = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
});
