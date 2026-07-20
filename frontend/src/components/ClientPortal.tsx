import { CheckCircle2, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

import { Logo } from "./Logo";

export function ClientPortal({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-paper px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between"><Logo /><span className="flex items-center gap-1.5 text-xs font-bold text-sage"><ShieldCheck size={15} /> Secure client portal</span></div>
        {children}
        <p className="mt-8 text-center text-xs leading-5 text-sage">ScopeBase records the decision against the exact document version shown here. This is not a qualified digital signature.</p>
      </div>
    </main>
  );
}

export function ClientConfirmation({ title, description }: { title: string; description: string }) {
  return (
    <ClientPortal>
      <div className="grid min-h-[28rem] place-items-center border border-line bg-white p-8 text-center shadow-sm"><div className="max-w-md"><span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-50 text-emerald-700"><CheckCircle2 size={28} /></span><h1 className="mt-5 text-3xl font-extrabold tracking-[-0.04em]">{title}</h1><p className="mt-3 text-sm leading-6 text-sage">{description}</p></div></div>
    </ClientPortal>
  );
}

export function ClientPortalError({ message }: { message: string }) {
  return <div className="grid min-h-80 place-items-center border border-line bg-white p-8 text-center"><div><h1 className="text-2xl font-extrabold">Link unavailable</h1><p className="mt-3 text-sm leading-6 text-sage">{message}</p><p className="mt-2 text-sm text-sage">Ask the project team for a new secure link.</p></div></div>;
}
