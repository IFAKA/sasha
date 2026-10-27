// Hand-lettered titles like the shop's logo and posters, with a rounded, readable body font.
import { Gochi_Hand, Nunito } from "next/font/google";

export const display = Gochi_Hand({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

export const body = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
});
