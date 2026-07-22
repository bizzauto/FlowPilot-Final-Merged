import type { ReactNode } from "react";
import "./globals.css";
import PWARegister from "@/components/PWARegister";

export const metadata = {
  title: "FlowPilot Pro",
  description: "GoHighLevel-style SaaS automation platform",
};

export const viewport = {
  themeColor: "#070b14",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PWARegister />
        {children}
      </body>
    </html>
  );
}