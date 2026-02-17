import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { SwRegister } from "@/components/sw-register";
import { ThemeToggle } from "@/components/theme-toggle";

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
    <html lang="en" className="dark" data-theme="dark">
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            (() => {
              try {
                const saved = localStorage.getItem("accent-theme");
                const theme = saved === "light" ? "light" : "dark";
                const root = document.documentElement;
                root.dataset.theme = theme;
                root.classList.toggle("dark", theme === "dark");
              } catch (_) {
                // Keep dark defaults if storage is unavailable.
              }
            })();
          `}
        </Script>
      </head>
      <body className="font-[var(--font-sora)] antialiased">
        <ThemeToggle />
        {children}
        <SwRegister />
      </body>
    </html>
  );
}
