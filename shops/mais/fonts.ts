// A high-contrast serif like the MAIS logo for titles, and DM Sans like the text of their catalog.
import { Cormorant_Garamond, DM_Sans } from "next/font/google";

export const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const body = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});
