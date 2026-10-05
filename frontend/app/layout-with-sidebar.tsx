"use client";

import type React from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/tools/app-sidebar";
import { Footer } from "@/components/footer";
import { TopBar } from "@/components/top-bar";

function LayoutWithConditionalSidebar({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Pages where sidebar should be hidden
  const noSidebarPages = ["/", "/about", "/privacy", "/terms", "/contact"];
  const showSidebar = !noSidebarPages.includes(pathname);

  return (
    <>
      {/* Only show TopBar when sidebar is hidden */}
      {!showSidebar && <TopBar />}

      <div
        className={`flex min-h-screen flex-col ${!showSidebar ? "pt-16" : ""}`}
      >
        {showSidebar ? (
          <div className="flex flex-1">
            <AppSidebar />
            <main className="flex-1 pl-10">{children}</main>
          </div>
        ) : (
          <main className="flex-1">{children}</main>
        )}
        <Footer />
      </div>
    </>
  );
}

export default LayoutWithConditionalSidebar;
