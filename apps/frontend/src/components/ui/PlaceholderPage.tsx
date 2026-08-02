interface PlaceholderPageProps {
  eyebrow: string;
  title: string;
  description: string;
  nextItems: string[];
}

export function PlaceholderPage({
  eyebrow,
  title,
  description,
  nextItems,
}: PlaceholderPageProps) {
  return (
    <main style={pageStyle}>
      <section style={panelStyle}>
        <p style={eyebrowStyle}>{eyebrow}</p>
        <h1 style={titleStyle}>{title}</h1>
        <p style={descriptionStyle}>{description}</p>

        <div style={gridStyle}>
          {nextItems.map((item, index) => (
            <article key={item} style={cardStyle}>
              <span style={indexStyle}>{String(index + 1).padStart(2, "0")}</span>
              <p style={itemStyle}>{item}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

const pageStyle = {
  minHeight: "calc(100vh - 74px)",
  padding: "18px",
  boxSizing: "border-box",
} as const;

const panelStyle = {
  minHeight: "calc(100vh - 110px)",
  display: "grid",
  alignContent: "center",
  maxWidth: "1100px",
  margin: "0 auto",
  padding: "48px",
  border: "1px solid rgba(148, 163, 184, 0.2)",
  borderRadius: "18px",
  background: "rgba(8, 15, 30, 0.78)",
  boxShadow: "0 24px 70px rgba(2, 6, 23, 0.48)",
} as const;

const eyebrowStyle = {
  margin: "0 0 10px",
  color: "#22d3ee",
  fontSize: "11px",
  fontWeight: 950,
  letterSpacing: "0.13em",
  textTransform: "uppercase",
} as const;

const titleStyle = {
  margin: 0,
  fontSize: "clamp(34px, 5vw, 62px)",
  lineHeight: 1,
  fontWeight: 950,
} as const;

const descriptionStyle = {
  maxWidth: "760px",
  margin: "18px 0 28px",
  color: "#94a3b8",
  fontSize: "15px",
  lineHeight: 1.7,
} as const;

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "12px",
} as const;

const cardStyle = {
  minHeight: "108px",
  padding: "16px",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderRadius: "12px",
  background: "rgba(15, 23, 42, 0.62)",
} as const;

const indexStyle = {
  color: "#f97316",
  fontSize: "10px",
  fontWeight: 950,
  letterSpacing: "0.1em",
} as const;

const itemStyle = {
  margin: "12px 0 0",
  color: "#e2e8f0",
  fontSize: "13px",
  lineHeight: 1.55,
  fontWeight: 750,
} as const;