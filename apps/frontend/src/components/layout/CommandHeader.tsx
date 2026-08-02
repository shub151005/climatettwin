import { NavLink } from "react-router-dom";

const navigationItems = [
  { label: "Live", to: "/live" },
  { label: "History", to: "/history" },
  { label: "Scenario Lab", to: "/scenario-lab" },
  { label: "Analytics", to: "/analytics" },
  { label: "Data Sources", to: "/data-sources" },
];

export function CommandHeader() {
  return (
    <header style={headerStyle}>
      <NavLink to="/live" style={brandLinkStyle}>
        <span style={brandMarkStyle}>CT</span>
        <span>
          <span style={brandTitleStyle}>ClimateTwin India</span>
          <span style={brandSubtitleStyle}>Project VARSHA · Assam</span>
        </span>
      </NavLink>

      <nav style={navigationStyle} aria-label="Primary navigation">
        {navigationItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              ...navigationLinkStyle,
              ...(isActive ? activeNavigationLinkStyle : {}),
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div style={systemStatusStyle}>
        <span style={statusDotStyle} />
        System online
      </div>
    </header>
  );
}

const headerStyle = {
  position: "fixed",
  inset: "0 0 auto 0",
  zIndex: 100,
  height: "74px",
  display: "grid",
  gridTemplateColumns: "auto 1fr auto",
  alignItems: "center",
  gap: "24px",
  padding: "0 18px",
  borderBottom: "1px solid rgba(148, 163, 184, 0.2)",
  background: "rgba(2, 6, 23, 0.92)",
  backdropFilter: "blur(18px)",
  boxShadow: "0 12px 34px rgba(2, 6, 23, 0.42)",
} as const;

const brandLinkStyle = {
  display: "flex",
  alignItems: "center",
  gap: "11px",
  color: "#f8fafc",
  textDecoration: "none",
} as const;

const brandMarkStyle = {
  width: "36px",
  height: "36px",
  display: "grid",
  placeItems: "center",
  border: "1px solid rgba(34, 211, 238, 0.48)",
  borderRadius: "10px",
  background: "rgba(8, 145, 178, 0.16)",
  color: "#67e8f9",
  fontSize: "12px",
  fontWeight: 950,
  letterSpacing: "0.08em",
} as const;

const brandTitleStyle = {
  display: "block",
  fontSize: "14px",
  fontWeight: 950,
  letterSpacing: "0.03em",
} as const;

const brandSubtitleStyle = {
  display: "block",
  marginTop: "2px",
  color: "#64748b",
  fontSize: "9px",
  fontWeight: 800,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
} as const;

const navigationStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "6px",
  minWidth: 0,
} as const;

const navigationLinkStyle = {
  padding: "9px 12px",
  borderRadius: "8px",
  border: "1px solid transparent",
  color: "#94a3b8",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 850,
  whiteSpace: "nowrap",
} as const;

const activeNavigationLinkStyle = {
  border: "1px solid rgba(34, 211, 238, 0.3)",
  background: "rgba(8, 145, 178, 0.16)",
  color: "#ecfeff",
  boxShadow: "0 0 18px rgba(34, 211, 238, 0.08)",
} as const;

const systemStatusStyle = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  color: "#cbd5e1",
  fontSize: "11px",
  fontWeight: 850,
} as const;

const statusDotStyle = {
  width: "7px",
  height: "7px",
  borderRadius: "999px",
  background: "#22c55e",
  boxShadow: "0 0 12px rgba(34, 197, 94, 0.9)",
} as const;