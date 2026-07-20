import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowRight, Check } from "lucide-react";

import { Logo } from "../components/Logo";

const problems = [
  ["The brief lives in six places", "Email, chat, calls, a doc somewhere. Nobody can point to what was agreed."],
  ["“That was included, right?”", "Verbal agreements turn every revision into a negotiation about memory."],
  ["Scope creep goes unbilled", "Small additions pile up silently. The project grows — the invoice doesn’t."],
] as const;

const workflow = [
  ["Collect a useful brief", "Build the questionnaire from templates, mark required questions, send one secure link. Answers and files land in the project — not your inbox."],
  ["Publish a versioned scope", "Deliverables, inclusions, exclusions, price, and date. Published versions are immutable — approvals always point to an exact document."],
  ["Handle changes explicitly", "New request mid-project? Publish it with the exact price and schedule impact. The client decides before the work starts."],
] as const;

const audiences = [
  ["Freelancers", "Protect your time", "Every “quick addition” becomes a priced decision instead of silent free work."],
  ["Studios", "Start projects cleanly", "One kickoff link instead of three calls — briefs, files, and approvals in one record."],
  ["Clients", "Decide with confidence", "They see exactly what they’re paying for — and approve it in one click, no account needed."],
] as const;

const faqs = [
  ["Do my clients need a ScopeBase account?", "No — briefs and approvals happen through secure one-time links."],
  ["What happens when the scope changes?", "You publish a change request with price and schedule impact; the client decides before work starts."],
  ["Can I export the agreed scope?", "On Pro, every published version exports to PDF with the approval record attached."],
  ["What does the free plan include?", "One active project with the full brief-to-approval flow."],
] as const;

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#edf0ec] sm:px-5 sm:pb-5 sm:pt-3 xl:px-12 xl:pb-12 xl:pt-6">
      <div className="mx-auto max-w-[1440px] overflow-hidden bg-line shadow-[0_24px_70px_rgba(23,63,53,0.09)] sm:border sm:border-line">
      <header className="grid grid-cols-[1fr_auto] gap-px bg-line lg:grid-cols-4">
        <div className="flex items-center bg-white px-5 py-5 sm:px-10 lg:col-span-1"><Logo /></div>
        <div className="flex items-center justify-end gap-4 bg-white px-5 py-3 text-sm font-semibold sm:px-10 lg:col-span-3 lg:gap-8">
          <nav className="hidden items-center gap-8 lg:flex"><a href="#workflow">Workflow</a><a href="#product">Product</a><a href="#pricing">Pricing</a><a href="#faq">FAQ</a></nav>
          <span className="hidden h-[22px] w-px bg-line lg:block" />
          <Link to="/sign-in" className="focus-ring whitespace-nowrap">Sign in</Link>
          <Link to="/sign-up" className="focus-ring whitespace-nowrap bg-coral px-[18px] py-[11px] font-bold text-white">Start free</Link>
        </div>
      </header>

      <main>
        <section className="mt-px grid gap-px bg-line lg:grid-cols-2">
          <div className="bg-white px-5 py-16 sm:px-10 sm:py-[88px]">
            <p className="inline-flex items-center gap-2 border border-line px-3 py-1.5 text-xs font-bold uppercase tracking-[0.1em] text-[#52625d]"><span className="size-1.5 rounded-full bg-coral" />For freelancers & small studios</p>
            <h1 className="mt-[26px] max-w-2xl font-display text-[42px] font-semibold leading-[1.07] tracking-[-0.025em] text-ink sm:text-[54px]">Scope it once. Get it approved. <span className="text-coral">Bill every change.</span></h1>
            <p className="mt-6 max-w-[520px] text-[17px] leading-[1.65] text-[#52625d]">The agreement layer between you and your clients: one brief, one versioned scope, every change priced — with a matching client view for each step.</p>
            <div className="mt-[34px] flex flex-wrap gap-3"><Link to="/sign-up" className="focus-ring inline-flex items-center gap-2 bg-coral px-[26px] py-[15px] text-[15px] font-bold text-white shadow-[0_10px_30px_rgba(229,111,81,0.28)]">Build your first scope <ArrowRight size={16} /></Link><a href="#workflow" className="focus-ring inline-flex items-center border border-ink px-[26px] py-[15px] text-[15px] font-bold">See the workflow</a></div>
            <p className="mt-6 text-[13.5px] text-[#52625d]">No credit card required · One active project free · Clients never need an account</p>
          </div>
          <div className="grid content-center bg-paper px-5 py-8 sm:px-10 sm:py-12">
            <div className="border border-line bg-white shadow-[0_30px_80px_rgba(23,63,53,0.13)]">
              <div className="flex items-center justify-between border-b border-line px-6 py-[18px]"><div className="min-w-0 pr-3"><p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#9a5d08]">Waiting for approval</p><h2 className="mt-1.5 text-lg font-semibold leading-tight">Dental clinic website redesign</h2></div><span className="grid size-[38px] shrink-0 place-items-center border border-line text-xs font-bold text-sage">v1</span></div>
              <div className="grid grid-cols-2 border-b border-line"><Meta label="Client" value="BrightSmile Clinic" /><Meta label="Scope value" value="€2,400" /></div>
              <div className="px-6 py-[18px]"><p className="text-xs font-bold uppercase tracking-[0.08em] text-[#52625d]">Included in scope</p><ul className="mt-3 grid gap-2.5 text-sm text-[#52625d]">{["Discovery and UX direction", "Responsive design for 8 page templates", "CMS build, QA, and launch support"].map((item) => <li key={item} className="flex gap-2.5"><Check size={16} className="text-coral" />{item}</li>)}</ul></div>
              <div className="flex items-center justify-between border-t border-line bg-paper px-6 py-3.5"><span className="text-[12.5px] text-sage">Scope version 1 · Sent today</span><span className="bg-forest px-3.5 py-2 text-[12.5px] font-bold text-white">Client review</span></div>
            </div>
          </div>
        </section>

        <section className="mt-px grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
          <Stat value="6 places">where a typical brief lives — email, chat, calls, docs. Here it is one.</Stat>
          <Stat value="Every €">of extra work is priced and decided before it starts — nothing slips in unbilled.</Stat>
          <Stat value="1 link">is all your client needs. No accounts — a secure portal for every decision.</Stat>
          <a href="#workflow" className="grid content-end bg-mint px-6 py-12 sm:px-10"><strong className="flex items-center gap-2 text-[15px]">See the full workflow <ArrowDown size={15} /></strong><span className="mt-1.5 text-[13px] text-[#52625d]">3 steps · 2 sides of the table</span></a>
        </section>

        <section id="product" className="mt-px grid gap-px bg-line lg:grid-cols-4">
          <SectionIntro eyebrow="The problem" title="Client work fails in the gaps between conversations." className="lg:row-span-3" />
          {problems.map(([title, description], index) => <div key={title} className="grid bg-white sm:grid-cols-[80px_1fr] lg:col-span-3"><span className="grid place-items-center border-b border-line py-8 font-display text-[15px] font-semibold text-sage sm:border-b-0 sm:border-r">0{index + 1}</span><div className="px-6 py-9 sm:px-10"><h3 className="font-sans text-[17px] font-bold">{title}</h3><p className="mt-2 text-[15px] leading-[1.6] text-[#52625d]">{description}</p></div></div>)}
        </section>

        <section id="workflow" className="mt-px grid gap-px bg-line lg:grid-cols-4">
          <SectionIntro eyebrow="The workflow" title="Three steps. Each has a client-facing view." />
          <div className="grid content-end bg-white px-6 py-9 sm:px-10 sm:py-12 lg:col-span-3"><p className="max-w-[640px] text-base leading-[1.65] text-[#52625d]">Everything you publish has a matching client page — no accounts, no attachments, just a secure link. Every decision is recorded against the exact version shown.</p></div>
          {workflow.map(([title, description], index) => <WorkflowRow key={title} index={index} title={title} description={description} />)}
        </section>

        <section className="mt-px grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
          <SectionIntro eyebrow="Who it’s for" title="Built for both sides of the table." />
          {audiences.map(([eyebrow, title, description], index) => <article key={eyebrow} className={`px-8 py-10 sm:px-10 sm:py-12 ${index === 2 ? "bg-mint" : "bg-white"}`}><p className="text-[11px] font-bold uppercase tracking-[0.1em] text-sage">{eyebrow}</p><h3 className="mt-3 text-[19px] font-semibold">{title}</h3><p className="mt-2.5 text-[14.5px] leading-[1.65] text-[#52625d]">{description}</p></article>)}
        </section>

        <section id="pricing" className="mt-px grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
          <SectionIntro eyebrow="Pricing" title="Start focused. Upgrade when work grows." />
          <Pricing name="Free" price="€0" features={["1 active project", "System brief templates", "25 MB file storage"]} />
          <Pricing featured name="Pro" price="€19" features={["Unlimited active projects", "Change requests + PDF export", "Custom templates · 1 GB storage"]} />
          <div className="grid content-end bg-paper px-8 py-10 text-[14.5px] leading-[1.65] text-[#52625d] sm:px-10 sm:py-12"><p>All plans include unlimited clients, secure client links, and EU data hosting.</p><p className="mt-3.5">No credit card required · Cancel anytime.</p></div>
        </section>

        <section id="faq" className="mt-px grid gap-px bg-line lg:grid-cols-4">
          <SectionIntro eyebrow="FAQ" title="Before you ask." className="lg:row-span-4" />
          {faqs.map(([question, answer]) => <article key={question} className="bg-white px-6 py-9 sm:px-10 lg:col-span-3"><h3 className="font-sans text-base font-bold">{question}</h3><p className="mt-2 text-[15px] leading-[1.6] text-[#52625d]">{answer}</p></article>)}
        </section>

        <section className="mt-px grid justify-items-center bg-forest px-5 py-24 text-center text-white"><h2 className="max-w-[720px] text-[38px] font-semibold leading-tight tracking-[-0.02em] sm:text-[44px]">Your next project deserves a clean start.</h2><p className="mt-4 max-w-[520px] text-[16.5px] leading-[1.6] text-white/65">Create a workspace, send your first brief link, and get an approved scope this week.</p><Link to="/sign-up" className="focus-ring mt-[30px] bg-coral px-[30px] py-4 text-[15px] font-bold">Start free — no card required</Link><p className="mt-3.5 text-[13px] text-white/45">No credit card · One active project free · Cancel anytime</p></section>
      </main>

        <footer className="mt-px grid gap-px bg-line text-[13px] text-sage sm:grid-cols-4"><span className="bg-white px-6 py-5 sm:px-10">© 2026 ScopeBase</span><div className="flex gap-6 bg-white px-6 py-5 sm:col-span-2 sm:px-10"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="mailto:hello@scopebase.app">Contact</a></div><span className="bg-white px-6 py-5 sm:px-10 sm:text-right">Made for client work</span></footer>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div className="border-r border-line px-6 py-3.5 last:border-r-0"><span className="text-xs text-sage">{label}</span><strong className="mt-1 block text-[14.5px]">{value}</strong></div>;
}

function Stat({ value, children }: { value: string; children: React.ReactNode }) {
  return <article className="bg-white px-6 py-12 sm:px-10"><strong className="block font-display text-4xl font-semibold tracking-[-0.02em] text-coral">{value}</strong><p className="mt-2 text-sm leading-[1.6] text-[#52625d]">{children}</p></article>;
}

function SectionIntro({ eyebrow, title, className = "" }: { eyebrow: string; title: string; className?: string }) {
  return <div className={`bg-white px-8 py-10 sm:px-10 sm:py-12 ${className}`}><p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">{eyebrow}</p><h2 className="mt-[18px] text-[32px] font-semibold leading-[1.15] tracking-[-0.02em]">{title}</h2></div>;
}

function WorkflowRow({ index, title, description }: { index: number; title: string; description: string }) {
  return <><article className="grid content-center justify-items-start bg-white px-8 py-10 sm:px-10 sm:py-12 lg:col-span-2"><span className="grid size-10 place-items-center border border-line font-display text-[15px] font-semibold text-coral">0{index + 1}</span><span className="mt-[22px] text-[11px] font-bold uppercase tracking-[0.1em] text-sage">You</span><h3 className="mt-2 text-[21px] font-semibold">{title}</h3><p className="mt-3 max-w-[480px] text-[15px] leading-[1.65] text-[#52625d]">{description}</p></article><article className="grid content-center bg-paper px-8 py-10 sm:px-10 sm:py-12 lg:col-span-2"><p className="text-[11px] font-bold uppercase tracking-[0.1em] text-coral">Your client sees</p><ClientCard index={index} /></article></>;
}

function ClientCard({ index }: { index: number }) {
  if (index === 0) return <div className="mt-3 border border-line bg-white px-5 py-[18px]"><p className="text-sm font-bold">1. What is the primary outcome for this website? *</p><p className="mt-1.5 text-[12.5px] text-sage">Describe the business result, not only the requested pages.</p><div className="mt-2.5 border border-line bg-paper px-3 py-2.5 text-[13px] text-[#52625d]">Help new patients understand the clinic and book with confidence…</div></div>;
  const change = index === 2;
  return <div className="mt-3 border border-line bg-white px-5 py-[18px]"><div className="flex items-center justify-between gap-3"><p className="text-sm font-bold">{change ? "Add analytics dashboard" : "BrightSmile website redesign scope"}</p><span className={`rounded-full px-2.5 py-1 text-[10.5px] font-bold ${change ? "bg-amber-50 text-amber-800" : "bg-sand"}`}>{change ? "Decision needed" : "Version 1"}</span></div><div className="mt-2 flex gap-4 text-[13px] text-[#52625d]"><strong className="text-ink">{change ? "+€650" : "€2,400"}</strong><span>·</span><span>{change ? "+5 days" : "Aug 28, 2026"}</span></div><div className="mt-3 grid grid-cols-2 gap-2"><span className="grid place-items-center bg-forest p-2.5 text-[12.5px] font-bold text-white">{change ? "Accept change" : "Approve scope"}</span><span className="grid place-items-center border border-line p-2.5 text-[12.5px] font-bold">{change ? "Decline" : "Request changes"}</span></div></div>;
}

function Pricing({ name, price, features, featured = false }: { name: string; price: string; features: string[]; featured?: boolean }) {
  return <article className={`px-8 py-10 sm:px-10 sm:py-12 ${featured ? "bg-forest text-white" : "bg-white"}`}><div className="flex items-center justify-between"><h3 className="text-[17px] font-semibold">{name}</h3>{featured ? <span className="bg-coral px-2.5 py-1 text-[11px] font-bold">MOST USEFUL</span> : null}</div><p className="mt-4 font-display text-[40px] font-semibold">{price}<span className={`text-sm font-medium ${featured ? "text-white/60" : "text-sage"}`}> /mo</span></p><ul className={`mt-[22px] grid gap-2.5 text-sm ${featured ? "text-white/80" : "text-[#52625d]"}`}>{features.map((feature) => <li className="flex gap-2.5" key={feature}><Check size={16} className="text-coral" />{feature}</li>)}</ul><Link to="/sign-up" className={`focus-ring mt-[26px] grid place-items-center p-3 text-sm font-bold ${featured ? "bg-coral text-white" : "border border-ink"}`}>Start with {name}</Link></article>;
}
