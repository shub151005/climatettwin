import { PlaceholderPage } from "../../components/ui/PlaceholderPage";

export default function HistoryPage() {
  return (
    <PlaceholderPage
      eyebrow="Historical Intelligence"
      title="History & Replay"
      description="Explore observed climate records and replay past rainfall and temperature fields across Assam."
      nextItems={[
        "Date-based historical field explorer",
        "Event and anomaly timeline",
        "Observed-versus-baseline comparison",
      ]}
    />
  );
}