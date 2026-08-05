import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Link href="/dashboard/orders/new">
          <Button type="button">New Order</Button>
        </Link>
      </div>
      <p className="text-foreground/70">
        Welcome back. Operational widgets (orders in progress, revenue, pending deliveries)
        arrive as their modules are built — see docs/03_ROADMAP.md.
      </p>
    </div>
  );
}
