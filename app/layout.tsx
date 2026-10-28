import type { Metadata, Viewport } from "next";
import { MotionProvider } from "@/components/motion-provider";
import { CartProvider } from "@/components/cart/cart-provider";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { shop } from "@/lib/shop";
import { body, display } from "@/shops/current-fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${shop.name} · ${shop.kind}`,
    template: `%s · ${shop.name}`,
  },
  description: shop.description,
  // Concept demo for a sales pitch: keep it out of search engines.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: shop.theme.cream ?? "#fbf6f0",
};

// The shop's colors override the defaults in globals.css.
const theme = {
  "--brand": shop.theme.brand,
  "--brand-ink": shop.theme.brandInk,
  "--blush": shop.theme.blush,
  ...(shop.theme.cream ? { "--cream": shop.theme.cream } : {}),
  ...(shop.theme.ink ? { "--ink": shop.theme.ink } : {}),
  ...(shop.theme.muted ? { "--muted": shop.theme.muted } : {}),
  ...(shop.theme.line ? { "--line": shop.theme.line } : {}),
} as React.CSSProperties;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-scroll-behavior="smooth": Next turns off our CSS smooth scrolling during route
    // changes, so each new page starts at the top instantly instead of animating.
    <html lang="es-AR" data-scroll-behavior="smooth" style={theme} className={`${display.variable} ${body.variable} antialiased`}>
      {/* `relative`: Base UI's drawer and dialog backdrops cover the whole page on iOS Safari. */}
      <body className="relative flex min-h-dvh flex-col font-sans">
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
