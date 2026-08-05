export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-foreground/70">
        Welcome back. Operational widgets (orders in progress, revenue, pending deliveries)
        arrive as their modules are built — see docs/03_ROADMAP.md.
      </p>
    </div>
  );
}
