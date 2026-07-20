import { Link } from "@tanstack/react-router";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className={`focus-ring inline-flex items-center gap-2.5 font-display text-[17px] font-bold ${light ? "text-white" : "text-ink"}`}>
      <span className={`grid size-7 place-items-center text-xs font-bold ${light ? "bg-white text-forest" : "bg-forest text-white"}`}>SB</span>
      <span>ScopeBase</span>
    </Link>
  );
}
