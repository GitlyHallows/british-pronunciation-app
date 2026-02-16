import type { Metadata } from "next";
import "./globals.css";
import { SwRegister } from "@/components/sw-register";

export const metadata: Metadata = {
  title: "Accent Practice Lab",
  description: "Practice-focused Modern RP companion with sentence decks and recording annotations.",
  metadataBase: new URL("http://localhost:3000"),
  appleWebApp: {
    capable: true,
    title: "Accent Lab",
    statusBarStyle: "default"
  },
  manifest: "/manifest.webmanifest"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-[var(--font-sora)] antialiased">
        {children}
        <SwRegister />
      </body>
    </html>
  );
}
