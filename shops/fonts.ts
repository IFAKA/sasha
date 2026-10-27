// Default fonts. A shop can bring its own in shops/<slug>/fonts.ts, exporting `display` and `body`
// the same way; scripts/select-shop.mjs points shops/current-fonts.ts at the right file.
import { Fraunces, Manrope } from "next/font/google";

export const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["SOFT", "opsz"],
});

export const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});
