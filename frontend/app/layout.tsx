import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/tools/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { SidebarProvider } from "@/components/ui/sidebar";
import LayoutWithConditionalSidebar from "./layout-with-sidebar";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ScavTools - Developer Utilities",
  description: "High-quality, browser-based tools for developers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
          storageKey="scavtools-theme"
        >
          <AuthProvider>
            <SidebarProvider>
              <LayoutWithConditionalSidebar>
                {children}
                <Toaster />
              </LayoutWithConditionalSidebar>
            </SidebarProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
