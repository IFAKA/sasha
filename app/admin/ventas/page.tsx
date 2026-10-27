import type { Metadata } from "next";
import { SalesDashboard } from "@/components/admin/sales-dashboard";
import { PageTransition } from "@/components/page-transition";

export const metadata: Metadata = { title: "Ventas" };

export default function AdminSalesPage() {
  return (
    <PageTransition>
      <div>
        <SalesDashboard />
      </div>
    </PageTransition>
  );
}
