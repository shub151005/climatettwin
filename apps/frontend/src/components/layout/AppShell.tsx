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
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(14,165,233,0.15), transparent 28%), radial-gradient(circle at top right, rgba(249,115,22,0.12), transparent 30%), #020617",
  color: "#f8fafc",
} as const;

const contentStyle = {
  paddingTop: "74px",
} as const;