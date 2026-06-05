import type { Metadata } from "next";
import type { ReactNode } from "react";
import { APP_NAME } from "@charterbank/shared";

import { Analytics } from "@/components/analytics";
import "./globals.css";

export const metadata: Metadata = {
  title: `${APP_NAME} — Affordable CFA Level I Practice`,
  description:
    "Independent, affordable CFA Level I Q-Bank with original questions, clear explanations, and smarter review.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
