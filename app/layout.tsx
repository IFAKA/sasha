import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { MotionProvider } from "@/components/motion-provider";
import { CartProvider } from "@/components/cart/cart-provider";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { business } from "@/lib/business";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["SOFT", "opsz"],
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${business.name} · Pastelería y café`,
    template: `%s · ${business.name}`,
  },
  description: "Tortas por encargo, desayunos, almuerzos y meriendas en Juncal 2110, Recoleta.",
  // Concept demo for a sales pitch: keep it out of search engines.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#fbf6f0",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-scroll-behavior="smooth": Next turns off our CSS smooth scrolling during route
    // changes, so each new page starts at the top instantly instead of animating.
    <html lang="es-AR" data-scroll-behavior="smooth" className={`${display.variable} ${body.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col font-sans">
        <MotionProvider>
          <CartProvider>
            {children}
            <CartDrawer />
          </CartProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
