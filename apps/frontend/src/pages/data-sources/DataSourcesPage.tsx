import { PlaceholderPage } from "../../components/ui/PlaceholderPage";

export default function DataSourcesPage() {
  return (
    <PlaceholderPage
      eyebrow="System Transparency"
      title="Data Sources"
      description="Inspect source datasets, processing status, spatial coverage, and pipeline freshness."
      nextItems={[
        "Provider and dataset inventory",
        "Processing and validation status",
        "Latency and freshness indicators",
      ]}
    />
  );
}