// Their menu and catalog are set in Poppins: heavy titles, light body text.
import { Poppins } from "next/font/google";

export const display = Poppins({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const body = Poppins({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
