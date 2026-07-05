import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pipeline — Agent Spending Governance",
  description: "The programmable spending engine for AI agents on Arc.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="nav" style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 32px 0" }}>
          <a href="/" className="active">Overview</a>
          <a href="/policies">Policies</a>
          <a href="/audit">Audit Log</a>
        </nav>
        {children}
      </body>
    </html>
  );
}
