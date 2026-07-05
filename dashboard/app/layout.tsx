import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pipeline — Agent Spending Governance",
  description: "The programmable spending engine for AI agents on Arc. Budgets, rate limits, and endpoint ACLs enforced onchain.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
