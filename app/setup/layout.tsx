"use client";

import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Globe,
  Newspaper,
  FileText,
  Settings,
  LayoutDashboard,
  ChevronLeft,
  Briefcase,
  ClipboardList,
  Mail,
  FileCheck,
  ScrollText,
} from "lucide-react";

const sidebarLinks = [
  { href: "/setup", label: "Dashboard", icon: LayoutDashboard },
  { href: "/setup/jobs", label: "Jobs", icon: Briefcase },
  { href: "/setup/applications", label: "Applications", icon: ClipboardList },
  { href: "/setup/offer-letters", label: "Offer Letters", icon: FileCheck },
  { href: "/setup/contracts", label: "Contracts", icon: ScrollText },
  { href: "/setup/countries", label: "Countries", icon: Globe },
  { href: "/setup/news", label: "News & Stories", icon: Newspaper },
  { href: "/setup/resources", label: "Resources", icon: FileText },
  { href: "/setup/emails", label: "Emails", icon: Mail },
  { href: "/setup/email-settings", label: "Email Settings", icon: Settings },
];

export default function SetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b px-6">
            <Link href="/setup" className="flex items-center gap-2">
              <img
                src="/images/unedf-logo.jpg"
                alt="UNEDF Logo"
                className="h-8 w-auto"
              />
              <span className="font-semibold text-primary">Admin</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {sidebarLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/setup" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Back to site */}
          <div className="border-t p-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to website
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 p-8">{children}</main>
    </div>
  );
}
