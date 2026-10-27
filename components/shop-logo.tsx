import Image from "next/image";
import { shop } from "@/lib/shop";

/** The shop's round logo, or its initial on the brand color when it has none. */
export function ShopLogo({ size, className = "" }: { size: number; className?: string }) {
  if (shop.logo) {
    return <Image src={shop.logo} alt="" width={size} height={size} style={{ width: size, height: size }} className={`rounded-full ${className}`} />;
  }
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: size * 0.5 }}
      className={`grid shrink-0 place-items-center rounded-full bg-brand font-display font-semibold text-white ${className}`}
    >
      {shop.name.charAt(0)}
    </span>
  );
}

/**
 * The shop's identity in a header: its wordmark when it has one (the name is already in it),
 * otherwise the round logo followed by the name.
 */
export function ShopBrand({ size, name }: { size: number; name: React.ReactNode }) {
  if (shop.wordmark) {
    const { src, width, height } = shop.wordmark;
    // A wordmark is wide: a bit shorter than the round logo keeps the header's links on one line.
    const h = Math.round(size * 0.8);
    return <Image src={src} alt="" width={Math.round((h * width) / height)} height={h} style={{ height: h, width: "auto" }} preload />;
  }
  return (
    <>
      <ShopLogo size={size} />
      {name}
    </>
  );
}
