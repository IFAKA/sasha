import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/admin-header";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s · Panel de Sasha" },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#f6f1ec]">
      <AdminHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-5 pb-16 sm:px-6">{children}</main>
    </div>
  );
}
