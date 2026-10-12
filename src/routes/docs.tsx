import { createFileRoute } from "@tanstack/react-router";
import { Construction } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/rail/bits";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Project Documentation — RailYatra" },
      { name: "description", content: "Project Documentation section of the RailYatra railway reservation DSA project." },
      { property: "og:title", content: "Project Documentation — RailYatra" },
      { property: "og:description", content: "Project Documentation section of the RailYatra DSA project." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div>
      <PageHeader title="Project Documentation" />
      <EmptyState icon={Construction} title="This section is not built yet" />
    </div>
  );
}
