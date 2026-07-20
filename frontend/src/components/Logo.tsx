import { Link } from "@tanstack/react-router";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className={`focus-ring inline-flex items-center gap-2.5 rounded ${light ? "text-white" : "text-ink"}`}>
      <span className={`grid size-8 place-items-center rounded-lg ${light ? "bg-white text-forest" : "bg-forest text-white"}`}>
        <span className="h-3.5 w-3.5 border-b-2 border-l-2" />
      </span>
      <span className="text-lg font-extrabold tracking-tight">ScopeBase</span>
    </Link>
  );
}

