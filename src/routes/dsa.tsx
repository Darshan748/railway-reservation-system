import { createFileRoute } from "@tanstack/react-router";
import { Construction } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/rail/bits";

export const Route = createFileRoute("/dsa")({
  head: () => ({
    meta: [
      { title: "DSA Concepts — RailYatra" },
      { name: "description", content: "DSA Concepts section of the RailYatra railway reservation DSA project." },
      { property: "og:title", content: "DSA Concepts — RailYatra" },
      { property: "og:description", content: "DSA Concepts section of the RailYatra DSA project." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div>
      <PageHeader title="DSA Concepts" />
      <EmptyState icon={Construction} title="This section is not built yet" />
    </div>
  );
}
