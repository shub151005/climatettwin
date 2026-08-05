import type { ReactNode } from "react";

import { CommandHeader } from "./CommandHeader";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div style={shellStyle}>
      <CommandHeader />
      <div style={contentStyle}>{children}</div>
    </div>
  );
}

const shellStyle = {
  width: "100%",
  minWidth: 0,
  minHeight: "100vh",
  overflowX: "hidden",
  background:
    "radial-gradient(circle at top left, rgba(14,165,233,0.15), transparent 28%), radial-gradient(circle at top right, rgba(249,115,22,0.12), transparent 30%), #020617",
  color: "#f8fafc",
} as const;

const contentStyle = {
  width: "100%",
  minWidth: 0,
  paddingTop: "74px",
  boxSizing: "border-box",
  overflowX: "hidden",
} as const;