import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atreyus CutSheet Demo",
  description: "Staged CutSheet demo: Claude extraction → browser optimization → Claude estimator summary for a pressure-treated deck scope.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
