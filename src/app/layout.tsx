import type { Metadata } from "next";
import "./globals.css";
import { AppNav } from "@/components/layout/app-nav";

export const metadata: Metadata = {
  title: "VehicleTrack",
  description: "Track stock taken by field vehicles and reconcile returned items.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <AppNav />
          <main className="main-content">{children}</main>
        </div>
      </body>
    </html>
  );
}
