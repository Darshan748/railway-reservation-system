import { createFileRoute } from "@tanstack/react-router";
import { Construction } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/rail/bits";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Train Management — RailYatra" },
      { name: "description", content: "Train Management section of the RailYatra railway reservation DSA project." },
      { property: "og:title", content: "Train Management — RailYatra" },
      { property: "og:description", content: "Train Management section of the RailYatra DSA project." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div>
      <PageHeader title="Train Management" />
      <EmptyState icon={Construction} title="This section is not built yet" />
    </div>
  );
}
