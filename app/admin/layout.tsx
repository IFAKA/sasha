import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { shop } from "@/lib/shop";

export const metadata: Metadata = {
  title: { default: "Panel", template: `%s · Panel de ${shop.shortName}` },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Shops on the basic plan have no panel.
  if (!shop.admin) notFound();
  return (
    <div className="flex min-h-dvh flex-col bg-[#f6f1ec]">
      <AdminHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-5 pb-16 sm:px-6">{children}</main>
    </div>
  );
}
