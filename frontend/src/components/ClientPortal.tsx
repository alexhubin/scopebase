import { CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";

import { Logo } from "./Logo";

export function ClientPortal({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-paper px-4 pb-12 pt-8 sm:px-6">
      <div className="mx-auto max-w-[760px]">
        <div className="mb-7 flex items-center justify-between"><Logo /><span className="flex items-center gap-2 text-[12.5px] font-bold text-[#52625d]"><span className="size-[7px] rounded-full bg-[#087a55]" /> Secure client portal</span></div>
        {children}
        <p className="mt-[22px] text-center text-[12.5px] leading-5 text-sage">ScopeBase records the decision against the exact document version shown here.</p>
      </div>
    </main>
  );
}

export function ClientConfirmation({ title, description }: { title: string; description: string }) {
  return (
    <ClientPortal>
      <div className="grid min-h-[28rem] place-items-center border border-line bg-white p-8 text-center"><div className="max-w-md"><span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-50 text-emerald-700"><CheckCircle2 size={28} /></span><h1 className="mt-5 text-3xl font-semibold tracking-[-0.02em]">{title}</h1><p className="mt-3 text-sm leading-6 text-sage">{description}</p></div></div>
    </ClientPortal>
  );
}

export function ClientPortalError({ message }: { message: string }) {
  return <div className="grid min-h-80 place-items-center border border-line bg-white p-8 text-center"><div><h1 className="text-2xl font-semibold">Link unavailable</h1><p className="mt-3 text-sm leading-6 text-sage">{message}</p><p className="mt-2 text-sm text-sage">Ask the project team for a new secure link.</p></div></div>;
}
