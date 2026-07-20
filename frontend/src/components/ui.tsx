import { Button as BaseButton } from "@base-ui/react/button";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function Button({
  className = "",
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const variants = {
    primary: "bg-forest text-white hover:bg-forest-strong shadow-sm",
    secondary: "border border-line bg-white text-ink hover:border-sage hover:bg-paper",
    ghost: "text-ink hover:bg-mint",
    danger: "bg-red-700 text-white hover:bg-red-800",
  };
  return (
    <BaseButton
      className={`focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`focus-ring min-h-11 w-full rounded-lg border border-line bg-white px-3.5 text-sm text-ink placeholder:text-sage/70 ${className}`}
      {...props}
    />
  );
}

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-ink">
      <span>{label}</span>
      {children}
      {error ? <span className="text-xs font-medium text-red-700">{error}</span> : null}
      {!error && hint ? <span className="text-xs font-normal text-sage">{hint}</span> : null}
    </label>
  );
}

export function Textarea({
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`focus-ring min-h-28 w-full resize-y rounded-lg border border-line bg-white px-3.5 py-3 text-sm text-ink placeholder:text-sage/70 ${className}`}
      {...props}
    />
  );
}

export function Select({
  className = "",
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`focus-ring min-h-11 w-full rounded-lg border border-line bg-white px-3.5 text-sm text-ink ${className}`}
      {...props}
    />
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: string }) {
  const tones: Record<string, string> = {
    neutral: "bg-sand text-ink",
    info: "bg-blue-50 text-blue-800",
    warning: "bg-amber-50 text-amber-800",
    success: "bg-emerald-50 text-emerald-800",
    danger: "bg-red-50 text-red-800",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${tones[tone] ?? tones.neutral}`}>
      {children}
    </span>
  );
}

export function Panel({ className = "", children }: { className?: string; children: ReactNode }) {
  return <section className={`border border-line bg-white ${className}`}>{children}</section>;
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-52 items-center justify-center gap-3 text-sm font-semibold text-sage">
      <span className="size-5 animate-spin rounded-full border-2 border-mint border-t-forest" />
      {label}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid min-h-56 place-items-center border border-dashed border-line bg-paper/60 p-8 text-center">
      <div className="max-w-sm">
        <h3 className="text-lg font-bold text-ink">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-sage">{description}</p>
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </div>
  );
}
