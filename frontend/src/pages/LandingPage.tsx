import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowRight, Check, MousePointer2 } from "lucide-react";

import { Logo } from "../components/Logo";

const checklists = [
  ["Pick a template — website, branding, or custom", "Mark the questions you can’t start without", "Send one link — track progress per question"],
  ["Turn brief answers into priced deliverables", "State what’s not included — in writing", "Publish v1 — locked, ready for approval"],
  ["Log the request as a change, not a favor", "Attach the price and schedule impact", "Client accepts or declines — recorded forever"],
] as const;

const audiences = [
  ["Freelancers", "Protect your time", "Every “quick addition” becomes a priced decision instead of silent free work.", ["Changes priced before you build them", "An approval record behind every invoice line"]],
  ["Studios", "Start projects cleanly", "One kickoff link instead of three calls — briefs, files, and approvals in one record.", ["The same brief structure on every project", "A new PM sees the whole history in one place"]],
  ["Clients", "Decide with confidence", "They see exactly what they’re paying for — and approve it in one click, no account needed.", ["One page with everything agreed so far", "Works from a phone — approve on the go"]],
] as const;

const faqs = [
  ["Do my clients need a ScopeBase account?", "No — briefs and approvals happen through secure one-time links."],
  ["What happens when the scope changes?", "You publish a change request with price and schedule impact; the client decides before work starts."],
  ["Can I export the agreed scope?", "On Pro, every published version exports to PDF with the approval record attached."],
  ["What does the free plan include?", "One active project with the full brief-to-approval flow."],
  ["Where is my data stored?", "On EU servers. Client links are per-project and revocable, and you can export everything at any time."],
  ["Can I keep using my own contract?", "Yes — ScopeBase records the day-to-day working agreement. Attach your master contract to the project and reference it from the scope."],
] as const;

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#eef0ec] sm:px-5 sm:pb-5 sm:pt-3 xl:px-12 xl:pb-12 xl:pt-6">
      <div className="mx-auto max-w-[1440px] overflow-hidden bg-line shadow-[0_24px_70px_rgba(23,63,53,0.09)] sm:border sm:border-line">
        <header className="sticky top-0 z-20 grid grid-cols-[1fr_auto] gap-px border-b border-line bg-line lg:grid-cols-4">
          <div className="flex items-center bg-white px-5 py-5 sm:px-10 lg:py-6 xl:px-12"><Logo /></div>
          <div className="flex items-center justify-end gap-4 bg-white px-5 py-3 text-sm font-semibold sm:px-10 lg:col-span-3 lg:gap-8 xl:px-12">
            <nav className="hidden items-center gap-8 lg:flex"><a href="#workflow">Workflow</a><a href="#problem">Product</a><a href="#pricing">Pricing</a><a href="#faq">FAQ</a></nav>
            <span className="hidden h-[22px] w-px bg-line lg:block" />
            <Link to="/sign-in" className="focus-ring whitespace-nowrap">Sign in</Link>
            <Link to="/sign-up" className="focus-ring whitespace-nowrap bg-coral px-[18px] py-[11px] font-bold text-white">Start free</Link>
          </div>
        </header>

        <main>
          <section className="grid gap-px bg-line lg:grid-cols-2">
            <div className="bg-white px-5 py-16 sm:px-10 sm:py-24 lg:px-[clamp(48px,4.5vw,96px)] lg:py-[clamp(110px,9.5vw,210px)]">
              <p className="inline-flex items-center gap-2 border border-line px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#52625d] sm:text-xs"><span className="size-1.5 rounded-full bg-coral" />For freelancers & small studios</p>
              <h1 className="mt-[26px] max-w-[15ch] font-display text-[42px] font-semibold leading-[1.07] tracking-[-0.025em] text-ink sm:text-[56px] lg:text-[clamp(48px,4.2vw,82px)]">Scope it once. Get it approved. <span className="text-coral">Bill every change.</span></h1>
              <p className="mt-7 max-w-[600px] text-[17px] leading-[1.65] text-[#52625d] lg:text-[clamp(17.5px,1.05vw,20px)]">The agreement layer between you and your clients: one brief, one versioned scope, every change priced — with a matching client view for each step.</p>
              <div className="mt-[34px] flex flex-col gap-3 sm:flex-row sm:flex-wrap"><Link to="/sign-up" className="focus-ring inline-flex items-center justify-center gap-2 bg-coral px-[26px] py-[15px] text-[15px] font-bold text-white shadow-[0_10px_30px_rgba(229,111,81,0.28)]">Build your first scope <ArrowRight size={16} /></Link><a href="#workflow" className="focus-ring inline-flex items-center justify-center border border-ink px-[26px] py-[15px] text-[15px] font-bold">See the workflow</a></div>
              <p className="mt-6 text-[13.5px] leading-relaxed text-[#52625d]">No credit card required · One active project free · Clients never need an account</p>
              <ProcessRail />
            </div>
            <div className="grid content-center bg-paper px-5 py-12 sm:px-10 sm:py-20 lg:px-[clamp(48px,4.5vw,96px)] lg:py-[clamp(80px,7vw,160px)]">
              <HeroScopeCard />
            </div>
          </section>

          <section className="mt-px grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
            <Stat value="6 places">where a typical brief lives — email, chat, calls, docs. Here it is one.</Stat>
            <Stat value="Every €">of extra work is priced and decided before it starts — nothing slips in unbilled.</Stat>
            <Stat value="1 link">is all your client needs. No accounts — a secure portal for every decision.</Stat>
            <a href="#workflow" className="grid content-end bg-mint px-6 py-16 sm:px-10 lg:px-12 lg:py-[clamp(64px,5.5vw,120px)]"><strong className="flex items-center gap-2 text-[15px]">See the full workflow <ArrowDown size={15} /></strong><span className="mt-1.5 text-[13px] text-[#52625d]">3 steps · 2 sides of the table</span></a>
          </section>

          <ProblemSection />
          <WorkflowSection />

          <section className="mt-px grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
            <SectionIntro eyebrow="Who it’s for" title="Built for both sides of the table." />
            {audiences.map(([eyebrow, title, description, items], index) => <AudienceCard key={eyebrow} eyebrow={eyebrow} title={title} description={description} items={items} featured={index === 2} />)}
          </section>

          <PricingSection />

          <section id="faq" className="mt-px grid gap-px bg-line lg:grid-cols-4">
            <SectionIntro eyebrow="FAQ" title="Before you ask." className="lg:row-span-6" />
            {faqs.map(([question, answer]) => <article key={question} className="bg-white px-6 py-12 sm:px-10 lg:col-span-3 lg:px-12 lg:py-[clamp(48px,4vw,84px)]"><h3 className="font-sans text-[18px] font-bold sm:text-[19px]">{question}</h3><p className="mt-2 max-w-[860px] text-[15.5px] leading-[1.6] text-[#52625d] sm:text-[16.5px]">{answer}</p></article>)}
          </section>

          <section id="cta" className="mt-px grid justify-items-center bg-forest px-5 py-28 text-center text-white sm:px-12 sm:py-36 lg:py-[clamp(140px,13vw,260px)]">
            <h2 className="max-w-[720px] text-[40px] font-semibold leading-[1.12] tracking-[-0.02em] sm:text-[52px] lg:text-[clamp(46px,3.4vw,68px)]">Your next project deserves a clean start.</h2>
            <p className="mt-4 max-w-[520px] text-[16.5px] leading-[1.6] text-white/65">Create a workspace, send your first brief link, and get an approved scope this week.</p>
            <Link to="/sign-up" className="focus-ring mt-[30px] bg-coral px-[30px] py-4 text-[15px] font-bold">Start free — no card required</Link>
            <p className="mt-3.5 text-[13px] text-white/45">No credit card · One active project free · Cancel anytime</p>
            <div className="mt-12 flex max-w-4xl flex-col items-center gap-3 text-[14.5px] font-semibold text-white/75 sm:flex-row sm:flex-wrap sm:justify-center"><span>1 · Create a workspace</span><span className="text-coral">→</span><span>2 · Send the brief link</span><span className="text-coral">→</span><span>3 · Publish scope v1</span><span className="text-coral">→</span><span>4 · Get approval this week</span></div>
          </section>
        </main>

        <footer className="mt-px grid gap-px bg-line text-sm text-sage sm:grid-cols-4"><span className="bg-white px-6 py-8 sm:px-10 lg:px-12">© 2026 ScopeBase</span><div className="flex flex-wrap gap-6 bg-white px-6 py-8 sm:col-span-2 sm:px-10 lg:px-12"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="mailto:hello@scopebase.app">Contact</a></div><span className="bg-white px-6 py-8 sm:px-10 sm:text-right lg:px-12">Made for client work</span></footer>
      </div>
    </div>
  );
}

function ProcessRail() {
  const steps = ["1 · Brief", "2 · Scope v1", "3 · Client approval", "4 · Priced changes"];
  return <div className="mt-11 flex flex-wrap items-center gap-3 border-t border-[#eef0ec] pt-[30px] text-sm font-semibold text-[#52625d]">{steps.map((step, index) => <div key={step} className="contents"><span className={index === 2 ? "bg-mint px-4 py-2.5" : "border border-line px-4 py-2.5"}>{step}</span>{index < steps.length - 1 ? <span className="font-bold text-coral">→</span> : null}</div>)}</div>;
}

function HeroScopeCard() {
  return <div className="w-full max-w-[800px] justify-self-center border border-line bg-white shadow-[0_30px_80px_rgba(23,63,53,0.13)]">
    <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-5 sm:px-[30px] sm:py-6"><div className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#9a5d08]">Waiting for approval</p><h2 className="mt-1.5 text-lg font-semibold leading-tight sm:text-[22px]">Dental clinic website redesign</h2></div><span className="grid size-[38px] shrink-0 place-items-center border border-line text-xs font-bold text-sage">v1</span></div>
    <div className="grid grid-cols-2 border-b border-line"><Meta label="Client" value="BrightSmile Clinic" /><Meta label="Scope value" value="€2,400" /></div>
    <div className="px-5 py-6 sm:px-[30px]"><p className="text-xs font-bold uppercase tracking-[0.08em] text-[#52625d]">Included in scope</p><CheckList items={["Discovery and UX direction", "Responsive design for 8 page templates", "CMS build, QA, and launch support"]} className="mt-3.5" /></div>
    <div className="flex flex-col items-start justify-between gap-3 border-t border-line bg-paper px-5 py-[18px] sm:flex-row sm:items-center sm:px-[30px]"><span className="text-sm text-sage">Scope version 1 · Sent today</span><span className="bg-forest px-4 py-2.5 text-[13.5px] font-bold text-white">Client review</span></div>
  </div>;
}

function ProblemSection() {
  return <section id="problem" className="mt-px grid gap-px bg-line lg:grid-cols-4">
    <SectionIntro eyebrow="The problem" title="Client work fails in the gaps between conversations." className="lg:row-span-3" />
    <ProblemRow index="01" title="The brief lives in six places" description="Email, chat, calls, a doc somewhere. Nobody can point to what was agreed."><div className="flex flex-wrap content-center gap-2.5">{["Email — Re: Re: FINAL brief", "Slack — “is the blog included?”", "Call — nobody took notes", "brief_final_v3 (2).docx", "Voice note — 4:32"].map((item) => <span key={item} className="border border-line px-4 py-2.5 text-sm text-[#52625d]">{item}</span>)}<span className="bg-forest px-4 py-2.5 text-sm font-bold text-white">In ScopeBase: one brief</span></div></ProblemRow>
    <ProblemRow index="02" title="“That was included, right?”" description="Verbal agreements turn every revision into a negotiation about memory."><div className="grid content-center gap-2.5"><span className="max-w-[84%] justify-self-start border border-line bg-paper px-[18px] py-3 text-[14.5px]">“The blog was included, right? We discussed it in March.”</span><span className="max-w-[84%] justify-self-end bg-forest px-[18px] py-3 text-[14.5px] text-white">“Let me dig through the thread…”</span><span className="justify-self-start text-[13.5px] text-sage">14 messages later — still no answer.</span></div></ProblemRow>
    <ProblemRow index="03" title="Scope creep goes unbilled" description="Small additions pile up silently. The project grows — the invoice doesn’t."><div className="grid content-center text-[14.5px] text-[#52625d]">{["+ “Tiny” extra banner", "+ Third revision round", "+ One more page template"].map((item) => <div key={item} className="flex justify-between gap-6 border-b border-[#eef0ec] py-2.5"><span>{item}</span><span className="whitespace-nowrap text-sage">not billed</span></div>)}<div className="flex justify-between gap-6 pt-3 font-bold text-ink"><span>Invoice total</span><span>unchanged</span></div></div></ProblemRow>
  </section>;
}

function WorkflowSection() {
  const steps = [
    ["Collect a useful brief", "Build the questionnaire from templates, mark required questions, send one secure link. Answers and files land in the project — not your inbox."],
    ["Publish a versioned scope", "Deliverables, inclusions, exclusions, price, and date. Published versions are immutable — approvals always point to an exact document."],
    ["Handle changes explicitly", "New request mid-project? Publish it with the exact price and schedule impact. The client decides before the work starts."],
  ] as const;
  return <section id="workflow" className="mt-px grid gap-px bg-line lg:grid-cols-4">
    <SectionIntro eyebrow="The workflow" title="Three steps. Each has a client-facing view." />
    <div className="grid content-end bg-white px-6 py-14 sm:px-10 sm:py-20 lg:col-span-3 lg:px-12 lg:py-[clamp(72px,6vw,140px)]"><p className="max-w-[640px] text-base leading-[1.65] text-[#52625d]">Everything you publish has a matching client page — no accounts, no attachments, just a secure link. Every decision is recorded against the exact version shown.</p><p className="mt-3.5 max-w-[640px] text-base leading-[1.65] text-[#52625d]">Below are the actual screens both sides work with — your side on the left, the client’s link on the right.</p></div>
    {steps.map(([title, description], index) => <WorkflowPair key={title} index={index} title={title} description={description} />)}
    <Link to="/sign-up" className="flex items-center justify-center gap-4 bg-forest px-6 py-[38px] text-center text-white lg:col-span-4"><span className="text-[15.5px] font-bold">That’s the whole flow — start with one free project</span><ArrowRight size={18} className="shrink-0 text-coral" /></Link>
  </section>;
}

function WorkflowPair({ index, title, description }: { index: number; title: string; description: string }) {
  return <>
    <article className="grid content-center justify-items-start bg-white px-6 py-20 sm:px-10 sm:py-24 lg:col-span-2 lg:px-[clamp(48px,4.5vw,96px)] lg:py-[clamp(88px,7vw,170px)]"><span className="grid size-[52px] place-items-center border border-line font-display text-[15px] font-semibold text-coral">0{index + 1}</span><span className="mt-[22px] text-[11px] font-bold uppercase tracking-[0.1em] text-sage">You</span><h3 className="mt-2 text-[25px] font-semibold sm:text-[27px]">{title}</h3><p className="mt-4 max-w-[540px] text-base leading-[1.65] text-[#52625d] sm:text-[17px]">{description}</p><CheckList items={[...checklists[index]]} className="mt-[26px]" /></article>
    <article className="grid content-center bg-paper px-5 py-16 sm:px-10 sm:py-24 lg:col-span-2 lg:px-[clamp(48px,4.5vw,96px)] lg:py-[clamp(80px,6.5vw,160px)]"><p className="text-[11px] font-bold uppercase tracking-[0.1em] text-coral">Your client sees</p><InteractiveClientCard index={index} /></article>
    {index < 2 ? <div className="flex items-center justify-center gap-4 bg-mint px-6 py-[34px] text-center lg:col-span-4"><span className="text-[15px] font-bold text-forest">{index === 0 ? "Submitted brief answers become the first scope draft" : "The approved scope becomes the baseline — every change is measured against it"}</span><ArrowDown size={18} className="shrink-0 text-coral" /></div> : null}
  </>;
}

function InteractiveClientCard({ index }: { index: number }) {
  const [active, setActive] = useState(false);
  if (index === 0) return <BriefCard active={active} onToggle={() => setActive((value) => !value)} />;
  if (index === 1) return <ScopeCard active={active} onToggle={() => setActive(true)} />;
  return <ChangeCard active={active} onToggle={() => setActive(true)} />;
}

function BriefCard({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return <div className="relative mt-[18px] border border-line bg-white shadow-[0_24px_60px_rgba(23,63,53,0.10)]">
    <MousePointer2 size={22} className="pointer-events-none absolute right-6 top-20 hidden fill-ink text-white drop-shadow-md sm:block" />
    <div className="flex flex-col items-start justify-between gap-3 border-b border-line px-5 py-5 sm:flex-row sm:items-center sm:px-[34px]"><h4 className="text-lg font-semibold sm:text-[19px]">Project brief — BrightSmile Clinic</h4><span className="whitespace-nowrap rounded-full bg-sand px-3 py-1.5 text-[12.5px] font-bold">{active ? "4 of 7 answered" : "3 of 7 answered"}</span></div>
    <div className="grid gap-6 px-5 py-6 sm:px-[34px] sm:py-[26px]"><div><p className="font-bold sm:text-[16.5px]">1. What is the primary outcome for this website? *</p><p className="mt-2 text-[14.5px] text-sage">Describe the business result, not only the requested pages.</p><div className="mt-3 border border-line bg-paper px-[18px] py-4 text-[15px] text-[#52625d]">Help new patients understand the clinic and book with confidence…</div></div><div><p className="font-bold sm:text-[16.5px]">2. Who are your main patient groups? *</p><div className="mt-3 flex flex-wrap gap-2.5"><span className="bg-forest px-4 py-2.5 text-sm font-semibold text-white">Families ✓</span><button type="button" onClick={onToggle} className={`focus-ring px-4 py-2.5 text-sm font-semibold ${active ? "bg-forest text-white" : "border border-line text-[#52625d]"}`}>Implant patients{active ? " ✓" : ""}</button><span className="border border-line px-4 py-2.5 text-sm font-semibold text-[#52625d]">Orthodontics</span></div></div><div><p className="font-bold sm:text-[16.5px]">3. Upload your current brand assets</p><div className="mt-3 flex flex-wrap items-center gap-2.5 border border-dashed border-[#a9b8b0] px-[18px] py-3.5 text-[14.5px] text-[#52625d]"><strong className="text-forest">logo-pack.zip</strong><span>· 4.2 MB — uploaded</span></div></div></div>
    <div className="flex flex-col items-start justify-between gap-3 border-t border-line bg-paper px-5 py-[18px] sm:flex-row sm:items-center sm:px-[34px]"><span className={`text-sm ${active ? "font-bold text-[#2e7d54]" : "text-sage"}`}>{active ? "Brief submitted — answers saved to the project ✓" : "Progress saves automatically"}</span><button type="button" onClick={onToggle} className={`focus-ring px-[22px] py-3 text-[14.5px] font-bold text-white ${active ? "bg-[#2e7d54]" : "bg-forest"}`}>{active ? "Submitted ✓" : "Submit brief"}</button></div>
  </div>;
}

function ScopeCard({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  const deliverables = [["Discovery & UX direction", "€400"], ["Responsive design — 8 page templates", "€1,200"], ["CMS build, QA & launch support", "€800"]];
  return <div className="relative mt-[18px] border border-line bg-white shadow-[0_24px_60px_rgba(23,63,53,0.10)]"><div className="flex flex-col items-start justify-between gap-3 border-b border-line px-5 py-5 sm:flex-row sm:items-center sm:px-[34px]"><h4 className="text-lg font-semibold sm:text-[19px]">BrightSmile website redesign — scope</h4><span className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[12.5px] font-bold ${active ? "bg-[#2e7d54] text-white" : "bg-sand"}`}>{active ? "Approved ✓" : "Version 1"}</span></div><div className="px-5 py-2 sm:px-[34px]">{deliverables.map(([name, price]) => <div key={name} className="flex justify-between gap-6 border-b border-[#eef0ec] py-[15px] text-[15px] last:border-b-0"><span>{name}</span><strong>{price}</strong></div>)}</div><div className="flex flex-col justify-between gap-2 border-t border-line px-5 py-4 sm:flex-row sm:items-center sm:gap-6 sm:px-[34px]"><span className="text-sm text-sage">Not included: copywriting, photography</span><strong className="font-display text-[19px]">€2,400 · Aug 28</strong></div><div className="grid gap-3 px-5 pb-[26px] sm:grid-cols-2 sm:px-[34px]"><button type="button" onClick={onToggle} className={`focus-ring grid place-items-center p-[15px] text-[15px] font-bold text-white ${active ? "bg-[#2e7d54]" : "bg-forest"}`}>{active ? "Scope v1 approved ✓" : "Approve scope"}</button><button type="button" className="focus-ring grid place-items-center border border-line p-[15px] text-[15px] font-bold">Request changes</button></div></div>;
}

function ChangeCard({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return <div className="mt-[18px] border border-line bg-white shadow-[0_24px_60px_rgba(23,63,53,0.10)]"><div className="flex flex-col items-start justify-between gap-3 border-b border-line px-5 py-5 sm:flex-row sm:items-center sm:px-[34px]"><h4 className="text-lg font-semibold leading-snug sm:text-[19px]">Change request #1 — Add analytics dashboard</h4><span className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[12.5px] font-bold ${active ? "bg-[#2e7d54] text-white" : "bg-amber-50 text-[#9a5d08]"}`}>{active ? "Accepted ✓" : "Decision needed"}</span></div><p className="px-5 pt-5 text-[15px] leading-[1.6] text-[#52625d] sm:px-[34px]">Traffic and booking statistics inside the CMS — requested by Dr. Hansen on the July 14 call. Not part of scope version 1.</p><div className="grid gap-3 px-5 py-5 sm:grid-cols-3 sm:px-[34px]">{[["Price impact", "+€650"], ["Timeline", "+5 days"], ["New total", "€3,050"]].map(([label, value]) => <MetaBox key={label} label={label} value={value} />)}</div><div className="grid gap-3 px-5 pb-[22px] sm:grid-cols-2 sm:px-[34px]"><button type="button" onClick={onToggle} className={`focus-ring grid place-items-center p-[15px] text-[15px] font-bold text-white ${active ? "bg-[#2e7d54]" : "bg-forest"}`}>{active ? "Change accepted ✓" : "Accept change"}</button><button type="button" className="focus-ring grid place-items-center border border-line p-[15px] text-[15px] font-bold">Decline</button></div><div className={`border-t border-line px-5 py-3.5 text-[13.5px] sm:px-[34px] ${active ? "bg-[#e6f2ea] font-semibold text-[#2e7d54]" : "bg-paper text-sage"}`}>{active ? "Accepted — scope updated to v2 · new total €3,050." : "Scope stays at version 1 until you accept — nothing changes silently."}</div></div>;
}

function PricingSection() {
  return <section id="pricing" className="mt-px grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4"><SectionIntro eyebrow="Pricing" title="Start focused. Upgrade when work grows." /><Pricing name="Free" price="€0" features={["1 active project", "System brief templates", "25 MB file storage", "Client portal links — no client accounts", "Scope versioning & approval record"]} /><Pricing featured name="Pro" price="€19" features={["Unlimited active projects", "Change requests + PDF export", "Custom templates · 1 GB storage", "Full activity log across projects", "Priority support"]} /><div className="grid content-end bg-paper px-8 py-16 text-[15px] leading-[1.65] text-[#52625d] sm:px-10 lg:px-12 lg:py-[clamp(72px,6vw,140px)]"><p>All plans include unlimited clients, secure client links, and EU data hosting.</p><p className="mt-3.5">No credit card required · Cancel anytime.</p><p className="mt-3.5">PDF exports carry the full approval record — who approved what, and when.</p></div></section>;
}

function ProblemRow({ index, title, description, children }: { index: string; title: string; description: string; children: React.ReactNode }) {
  return <article className="grid bg-white lg:col-span-3 lg:grid-cols-[100px_1fr_1.1fr]"><span className="grid place-items-center border-b border-line py-5 font-display text-[15px] font-semibold text-sage lg:border-b-0 lg:border-r">{index}</span><div className="grid content-center px-6 py-12 sm:px-10 lg:px-12 lg:py-[clamp(48px,4vw,84px)]"><h3 className="font-sans text-xl font-bold sm:text-[21px]">{title}</h3><p className="mt-2.5 max-w-[560px] text-base leading-[1.6] text-[#52625d] sm:text-[16.5px]">{description}</p></div><div className="border-t border-line px-6 py-10 sm:px-10 lg:border-l lg:border-t-0 lg:px-12 lg:py-[clamp(40px,3.5vw,68px)]">{children}</div></article>;
}

function AudienceCard({ eyebrow, title, description, items, featured }: { eyebrow: string; title: string; description: string; items: readonly string[]; featured: boolean }) {
  return <article className={`px-8 py-16 sm:px-10 lg:px-12 lg:py-[clamp(72px,6vw,140px)] ${featured ? "bg-mint" : "bg-white"}`}><p className="text-[11px] font-bold uppercase tracking-[0.1em] text-sage">{eyebrow}</p><h3 className="mt-3 text-[22px] font-semibold sm:text-[23px]">{title}</h3><p className="mt-2.5 max-w-[460px] text-[15px] leading-[1.65] text-[#52625d] sm:text-base">{description}</p><CheckList items={[...items]} className="mt-[22px]" /></article>;
}

function Pricing({ name, price, features, featured = false }: { name: string; price: string; features: string[]; featured?: boolean }) {
  return <article className={`grid content-start px-8 py-16 sm:px-10 lg:px-12 lg:py-[clamp(72px,6vw,140px)] ${featured ? "bg-forest text-white" : "bg-white"}`}><div className="flex items-center justify-between gap-3"><h3 className="text-xl font-semibold">{name}</h3>{featured ? <span className="bg-coral px-2.5 py-1 text-[11px] font-bold">MOST USEFUL</span> : null}</div><p className="mt-4 font-display text-[48px] font-semibold sm:text-[52px]">{price}<span className={`text-sm font-medium ${featured ? "text-white/60" : "text-sage"}`}> /mo</span></p><CheckList items={features} className={`mt-7 ${featured ? "text-white/80" : "text-[#52625d]"}`} /><Link to="/sign-up" className={`focus-ring mt-8 grid max-w-[380px] place-items-center p-[15px] text-sm font-bold ${featured ? "bg-coral text-white" : "border border-ink"}`}>Start with {name}</Link></article>;
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div className="border-r border-line px-5 py-[18px] last:border-r-0 sm:px-[30px]"><span className="text-xs text-sage">{label}</span><strong className="mt-1 block text-sm sm:text-[16.5px]">{value}</strong></div>;
}

function MetaBox({ label, value }: { label: string; value: string }) {
  return <div className="border border-line px-4 py-3.5"><span className="text-xs text-sage">{label}</span><strong className="mt-1 block text-lg">{value}</strong></div>;
}

function Stat({ value, children }: { value: string; children: React.ReactNode }) {
  return <article className="bg-white px-6 py-16 sm:px-10 lg:px-12 lg:py-[clamp(64px,5.5vw,120px)]"><strong className="block font-display text-[40px] font-semibold tracking-[-0.02em] text-coral lg:text-[clamp(40px,2.6vw,52px)]">{value}</strong><p className="mt-2 max-w-[440px] text-[15px] leading-[1.6] text-[#52625d] sm:text-base">{children}</p></article>;
}

function SectionIntro({ eyebrow, title, className = "" }: { eyebrow: string; title: string; className?: string }) {
  return <div className={`bg-white px-8 py-16 sm:px-10 lg:px-12 lg:py-[clamp(72px,6vw,140px)] ${className}`}><p className="text-xs font-bold uppercase tracking-[0.12em] text-coral">{eyebrow}</p><h2 className="mt-[18px] max-w-[15ch] text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] lg:text-[clamp(34px,2.3vw,46px)]">{title}</h2></div>;
}

function CheckList({ items, className = "" }: { items: readonly string[]; className?: string }) {
  return <ul className={`grid gap-3 text-[14.5px] leading-[1.5] text-[#52625d] sm:text-[15.5px] ${className}`}>{items.map((item) => <li key={item} className="flex gap-2.5"><Check size={17} className="mt-0.5 shrink-0 text-coral" />{item}</li>)}</ul>;
}
