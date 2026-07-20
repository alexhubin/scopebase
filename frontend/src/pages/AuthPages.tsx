import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { APIError, post } from "../api/client";
import { Logo } from "../components/Logo";
import { Button, Field, Input } from "../components/ui";
import { useAuth } from "../features/auth/auth-context";

const signInSchema = z.object({ email: z.email(), password: z.string().min(1) });
const signUpSchema = z
  .object({
    full_name: z.string().min(2, "Enter your name"),
    organization_name: z.string().min(2, "Enter your studio name"),
    email: z.email(),
    password: z.string().min(10, "Use at least 10 characters").regex(/[A-Za-z]/, "Add a letter").regex(/\d/, "Add a number"),
  });

type SignInValues = z.infer<typeof signInSchema>;
type SignUpValues = z.infer<typeof signUpSchema>;

export function SignInPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignInValues>({ resolver: zodResolver(signInSchema) });

  return (
    <AuthFrame title="Welcome back" description="Sign in to continue shaping clear client work." footer={<><span>New to ScopeBase?</span> <Link to="/sign-up" className="font-bold text-forest underline-offset-4 hover:underline">Create an account</Link></>}>
      <form className="grid gap-5" onSubmit={(event) => void handleSubmit(async (values) => {
        setServerError("");
        try {
          await signIn(values.email, values.password);
          await navigate({ to: "/dashboard" });
        } catch (error) {
          setServerError(error instanceof APIError ? error.detail : "Unable to sign in");
        }
      })(event)}>
        <Field label="Email" error={errors.email?.message}><Input type="email" autoComplete="email" {...register("email")} /></Field>
        <Field label="Password" error={errors.password?.message}><Input type="password" autoComplete="current-password" {...register("password")} /></Field>
        <div className="-mt-2 text-right"><Link to="/forgot-password" className="text-xs font-bold text-sage hover:text-forest">Forgot password?</Link></div>
        {serverError ? <p role="alert" className="bg-red-50 p-3 text-sm font-semibold text-red-800">{serverError}</p> : null}
        <Button variant="accent" type="submit" disabled={isSubmitting} className="min-h-12 w-full text-[15px]">{isSubmitting ? "Signing in…" : "Sign in"}</Button>
      </form>
    </AuthFrame>
  );
}

export function SignUpPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignUpValues>({ resolver: zodResolver(signUpSchema) });

  return (
    <AuthFrame signup title="Start with a clearer scope" description="Create your workspace and invite a client when you are ready." footer={<><span>Already have an account?</span> <Link to="/sign-in" className="font-bold text-forest underline-offset-4 hover:underline">Sign in</Link></>}>
      <form className="grid gap-4" onSubmit={(event) => void handleSubmit(async (values) => {
        setServerError("");
        try {
          await signUp(values);
          await navigate({ to: "/dashboard" });
        } catch (error) {
          setServerError(error instanceof APIError ? error.detail : "Unable to create account");
        }
      })(event)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your name" error={errors.full_name?.message}><Input autoComplete="name" {...register("full_name")} /></Field>
          <Field label="Studio or agency" error={errors.organization_name?.message}><Input autoComplete="organization" {...register("organization_name")} /></Field>
        </div>
        <Field label="Work email" error={errors.email?.message}><Input type="email" autoComplete="email" {...register("email")} /></Field>
        <Field label="Password" error={errors.password?.message} hint="At least 10 characters with a letter and number"><Input type="password" autoComplete="new-password" {...register("password")} /></Field>
        {serverError ? <p role="alert" className="bg-red-50 p-3 text-sm font-semibold text-red-800">{serverError}</p> : null}
        <Button variant="accent" type="submit" disabled={isSubmitting} className="mt-1 min-h-12 w-full text-[15px]">{isSubmitting ? "Creating workspace…" : "Create free workspace"}</Button>
      </form>
    </AuthFrame>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <AuthFrame title={sent ? "Check your inbox" : "Reset your password"} description={sent ? "If an account exists, a secure reset link is on its way." : "Enter your account email and we will send a one-hour reset link."} footer={<Link to="/sign-in" className="inline-flex items-center gap-2 font-bold text-forest"><ArrowLeft size={14} /> Back to sign in</Link>}>
      {sent ? <div className="bg-mint p-5 text-sm leading-6 text-forest">For local development, open Mailpit at <strong>localhost:8025</strong>.</div> : (
        <form className="grid gap-5" onSubmit={(event) => { event.preventDefault(); void post("/auth/forgot-password", { email }).then(() => setSent(true)); }}>
          <Field label="Email"><Input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></Field>
          <Button variant="accent" type="submit" className="min-h-12 w-full">Send reset link</Button>
        </form>
      )}
    </AuthFrame>
  );
}

export function ResetPasswordPage({ token }: { token: string }) {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  return (
    <AuthFrame
      title="Choose a new password"
      description="Your new password must use at least 10 characters with a letter and number."
      footer={<Link to="/sign-in" className="font-bold text-forest">Back to sign in</Link>}
    >
      <form className="grid gap-5" onSubmit={(event) => {
        event.preventDefault();
        setError("");
        setSubmitting(true);
        void post<{ message: string }>("/auth/reset-password", { token, password })
          .then(() => navigate({ to: "/sign-in" }))
          .catch((caught: unknown) => setError(caught instanceof APIError ? caught.detail : "Unable to reset password"))
          .finally(() => setSubmitting(false));
      }}>
        <Field label="New password"><Input type="password" minLength={10} required autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} /></Field>
        {error ? <p role="alert" className="bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p> : null}
        <Button variant="accent" type="submit" disabled={submitting} className="min-h-12 w-full">{submitting ? "Updating…" : "Update password"}</Button>
      </form>
    </AuthFrame>
  );
}

function AuthFrame({ title, description, children, footer, signup = false }: { title: string; description: string; children: React.ReactNode; footer: React.ReactNode; signup?: boolean }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden bg-forest p-12 text-white lg:flex lg:flex-col">
        <Logo light />
        <div className="my-auto max-w-[480px]">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-coral">{signup ? "Free to start" : "Built for client work"}</p>
          <p className="mt-[22px] font-display text-[34px] font-semibold leading-[1.25] tracking-[-0.02em]">{signup ? "Run your next project on one shared record — brief to approved change." : "“The project gets easier when everyone can see exactly what was agreed.”"}</p>
          {signup ? <div className="mt-[26px] grid gap-3 text-[15px] text-white/75">{["One active project free, no card", "Clients never need an account", "Every decision recorded on a version"].map((item) => <span key={item} className="flex gap-2.5"><span className="font-bold text-coral">✓</span>{item}</span>)}</div> : <p className="mt-5 text-[15px] leading-[1.7] text-white/60">Collect the brief. Publish the scope. Record the decision. Keep changes explicit.</p>}
        </div>
        <span className={`${signup ? "text-white/45" : "border-t border-white/15 pt-6 text-white/55"} text-[12.5px] leading-[1.6]`}>{signup ? "Free plan: one active project, no credit card" : "Clients never need an account — briefs and approvals work through secure links."}</span>
      </section>
      <section className="flex items-center justify-center bg-paper px-5 py-12 sm:px-10 lg:p-12">
        <div className={`w-full animate-rise ${signup ? "max-w-[440px]" : "max-w-[400px]"}`}>
          <div className="mb-10 lg:hidden"><Logo /></div>
          <h1 className="font-display text-[32px] font-semibold tracking-[-0.02em] text-ink">{title}</h1>
          <p className="mt-2.5 text-[15px] leading-[1.6] text-[#52625d]">{description}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-6 flex gap-1.5 text-sm text-[#52625d]">{footer}</div>
        </div>
      </section>
    </main>
  );
}
