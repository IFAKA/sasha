import type { Metadata } from "next";
import { Suspense } from "react";
import { SimulatedCheckout } from "@/components/simulated-checkout";

export const metadata: Metadata = { title: "Pago" };

const REFERENCE = /^SASHA-[0-9A-F]{8}$/;

export default function CheckoutPage({ searchParams }: PageProps<"/checkout">) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#ededed]" />}>
      <Checkout searchParams={searchParams} />
    </Suspense>
  );
}

async function Checkout({ searchParams }: Pick<PageProps<"/checkout">, "searchParams">) {
  const params = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const ref = one(params.ref);
  const pickup = one(params.retiro);
  const total = Number(one(params.total));

  return (
    <SimulatedCheckout
      reference={REFERENCE.test(ref) ? ref : null}
      pickup={Number.isNaN(Date.parse(pickup)) ? null : pickup}
      total={Number.isFinite(total) && total > 0 ? total : null}
    />
  );
}
