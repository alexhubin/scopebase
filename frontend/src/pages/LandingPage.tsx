import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, CircleCheckBig, FileQuestion, RefreshCw, ShieldCheck } from "lucide-react";

import { Logo } from "../components/Logo";

const steps = [
  [FileQuestion, "Collect a useful brief", "Guide clients through the exact questions you need, with files in one place."],
  [CircleCheckBig, "Agree on one scope", "Turn answers into a structured, versioned scope the client can approve."],
  [RefreshCw, "Handle changes clearly", "Price later additions and record a client decision before extra work starts."],
] as const;

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link to="/sign-in" className="focus-ring rounded-lg px-4 py-2 text-sm font-bold text-ink hover:bg-white">
            Sign in
          </Link>
          <Link to="/sign-up" className="focus-ring rounded-lg bg-forest px-4 py-2.5 text-sm font-bold text-white hover:bg-forest-strong">
            Start free
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl gap-14 px-5 pb-24 pt-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-24">
          <div className="animate-rise">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.13em] text-forest">
              <ShieldCheck size={14} />
              Scope control for client work
            </p>
            <h1 className="max-w-3xl text-5xl font-extrabold leading-[0.98] tracking-[-0.055em] text-ink sm:text-6xl lg:text-7xl">
              Turn scattered client conversations into a clear, approved project scope.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-sage">
              ScopeBase helps freelancers collect requirements, agree on what is included, and keep every later request visible.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link to="/sign-up" className="focus-ring inline-flex min-h-12 items-center gap-2 rounded-lg bg-coral px-5 text-sm font-extrabold text-white shadow-[0_10px_30px_rgba(229,111,81,0.25)] transition hover:-translate-y-0.5">
                Build your first scope <ArrowRight size={17} />
              </Link>
              <a href="#workflow" className="focus-ring rounded-lg px-5 py-3 text-sm font-extrabold text-ink hover:bg-white">
                See the workflow
              </a>
            </div>
            <p className="mt-4 text-xs font-semibold text-sage">No credit card required · One active project free</p>
          </div>

          <div className="relative animate-rise [animation-delay:120ms]">
            <div className="absolute -inset-8 -z-10 rotate-2 rounded-[3rem] bg-mint/65" />
            <div className="border border-line bg-white p-5 shadow-[0_30px_80px_rgba(23,63,53,0.13)] sm:p-7">
              <div className="flex items-center justify-between border-b border-line pb-5">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-coral">Waiting for approval</p>
                  <h2 className="mt-2 text-xl font-extrabold text-ink">Dental clinic website redesign</h2>
                </div>
                <span className="grid size-10 place-items-center rounded-full bg-mint text-forest">01</span>
              </div>
              <div className="grid gap-5 py-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-bold text-sage">Client</p>
                  <p className="mt-1 font-bold">BrightSmile Clinic</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-sage">Scope value</p>
                  <p className="mt-1 font-bold">€2,400</p>
                </div>
              </div>
              <div className="bg-paper p-5">
                <p className="text-sm font-extrabold">Included in scope</p>
                <ul className="mt-4 grid gap-3 text-sm text-sage">
                  {["Discovery and UX direction", "Responsive design for 8 page templates", "CMS build, QA, and launch support"].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 text-coral" size={16} /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-5 flex items-center justify-between">
                <p className="text-xs font-semibold text-sage">Scope version 1 · Sent today</p>
                <span className="rounded-lg bg-forest px-4 py-2 text-xs font-extrabold text-white">Client review</span>
              </div>
            </div>
          </div>
        </section>

        <section id="workflow" className="bg-forest py-24 text-white">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-coral">A calmer project start</p>
            <h2 className="mt-4 max-w-2xl text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">One shared record from brief to approved change.</h2>
            <div className="mt-14 grid gap-px bg-white/10 md:grid-cols-3">
              {steps.map(([Icon, title, description], index) => (
                <article key={title} className="bg-forest p-7 sm:p-9">
                  <div className="flex items-center justify-between">
                    <Icon className="text-coral" size={25} />
                    <span className="text-xs font-extrabold text-white/35">0{index + 1}</span>
                  </div>
                  <h3 className="mt-10 text-xl font-extrabold">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/60">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
          <div className="text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-coral">Simple pricing</p>
            <h2 className="mt-4 text-4xl font-extrabold tracking-[-0.04em] text-ink">Start focused. Upgrade when client work grows.</h2>
          </div>
          <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
            <PricingCard name="Free" price="€0" features={["1 active project", "System brief templates", "25 MB file storage", "ScopeBase branding"]} />
            <PricingCard featured name="Pro" price="€19" features={["Unlimited active projects", "Custom templates and versions", "Change requests and PDF export", "1 GB file storage"]} />
          </div>
        </section>
      </main>

      <footer className="border-t border-line px-5 py-8 text-center text-sm text-sage">
        ScopeBase · Clear scope, confident projects.
      </footer>
    </div>
  );
}

function PricingCard({ name, price, features, featured = false }: { name: string; price: string; features: string[]; featured?: boolean }) {
  return (
    <article className={`border p-7 sm:p-9 ${featured ? "border-forest bg-forest text-white" : "border-line bg-white text-ink"}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-extrabold">{name}</h3>
        {featured ? <span className="rounded-full bg-coral px-2.5 py-1 text-xs font-extrabold">Most useful</span> : null}
      </div>
      <p className="mt-6 text-4xl font-extrabold">{price}<span className="text-sm font-semibold opacity-50"> / month</span></p>
      <ul className="mt-7 grid gap-3">
        {features.map((feature) => <li key={feature} className="flex items-center gap-2.5 text-sm"><Check size={16} className="text-coral" />{feature}</li>)}
      </ul>
      <Link to="/sign-up" className={`focus-ring mt-8 inline-flex min-h-11 w-full items-center justify-center rounded-lg text-sm font-extrabold ${featured ? "bg-white text-forest" : "bg-forest text-white"}`}>
        Start with {name}
      </Link>
    </article>
  );
}

