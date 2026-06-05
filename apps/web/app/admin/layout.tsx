import Link from "next/link";
import type { ReactNode } from "react";

import { requireAdmin } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <nav className="mb-8 flex items-center gap-4 border-b border-border pb-4 text-sm">
        <Link href="/admin" className="font-semibold">
          Content Studio
        </Link>
        <Link href="/admin/reports" className="text-muted hover:text-foreground">
          Reports
        </Link>
        <Link href="/dashboard" className="ml-auto text-muted hover:text-foreground">
          Exit to dashboard
        </Link>
      </nav>
      {children}
    </div>
  );
}
