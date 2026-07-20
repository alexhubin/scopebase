import { Link, Navigate, Outlet, useRouterState } from "@tanstack/react-router";
import { FolderKanban, Gauge, Settings } from "lucide-react";

import { useAuth } from "../features/auth/auth-context";
import { Logo } from "./Logo";
import { Button, Spinner } from "./ui";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: Gauge },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function ProtectedLayout() {
  const { session, loading } = useAuth();
  if (loading) return <Spinner label="Opening your workspace" />;
  if (!session) return <Navigate to="/sign-in" />;
  return <AppShell />;
}

export function AppShell() {
  const { session, signOut } = useAuth();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (!session) return null;

  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[264px_1fr]">
      <aside className="hidden min-h-screen border-r border-white/10 bg-forest px-5 py-6 text-white lg:flex lg:flex-col">
        <Logo light />
        <nav className="mt-10 grid gap-1 text-sm font-semibold">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`focus-ring px-3 py-[11px] transition ${active ? "bg-white text-forest" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-white/10 pt-5">
          <p className="truncate text-sm font-bold">{session.user.full_name}</p>
          <p className="mt-1 truncate text-xs text-white/55">{session.organization.name} · Free plan</p>
          <button
            type="button"
            onClick={() => void signOut()}
            className="focus-ring mt-4 flex w-full items-center py-1 text-[13px] font-semibold text-white/65 transition hover:text-white"
          >
            Sign out
          </button>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-paper/95 px-4 backdrop-blur lg:hidden">
          <Logo />
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-label={item.label}
                  className="focus-ring p-2 text-sage hover:bg-mint hover:text-forest"
                >
                  <Icon size={20} />
                </Link>
              );
            })}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-[1440px] p-4 sm:p-7 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        {eyebrow ? <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-coral">{eyebrow}</p> : null}
        <h1 className="font-display text-[32px] font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-[34px]">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-[#52625d] sm:text-[15px]">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function RetryPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="border border-red-200 bg-red-50 p-6 text-red-900">
      <p className="font-bold">Unable to load this page</p>
      <p className="mt-1 text-sm">{message}</p>
      <Button type="button" variant="secondary" className="mt-4" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
