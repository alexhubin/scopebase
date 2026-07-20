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
        {serverError ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-800">{serverError}</p> : null}
        <Button type="submit" disabled={isSubmitting} className="w-full">{isSubmitting ? "Signing in…" : "Sign in"}</Button>
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
    <AuthFrame title="Start with a clearer scope" description="Create your workspace and invite a client when you are ready." footer={<><span>Already have an account?</span> <Link to="/sign-in" className="font-bold text-forest underline-offset-4 hover:underline">Sign in</Link></>}>
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
        {serverError ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-800">{serverError}</p> : null}
        <Button type="submit" disabled={isSubmitting} className="mt-1 w-full">{isSubmitting ? "Creating workspace…" : "Create free workspace"}</Button>
      </form>
    </AuthFrame>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <AuthFrame title={sent ? "Check your inbox" : "Reset your password"} description={sent ? "If an account exists, a secure reset link is on its way." : "Enter your account email and we will send a one-hour reset link."} footer={<Link to="/sign-in" className="inline-flex items-center gap-2 font-bold text-forest"><ArrowLeft size={14} /> Back to sign in</Link>}>
      {sent ? <div className="rounded-lg bg-mint p-5 text-sm leading-6 text-forest">For local development, open Mailpit at <strong>localhost:8025</strong>.</div> : (
        <form className="grid gap-5" onSubmit={(event) => { event.preventDefault(); void post("/auth/forgot-password", { email }).then(() => setSent(true)); }}>
          <Field label="Email"><Input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></Field>
          <Button type="submit" className="w-full">Send reset link</Button>
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
        {error ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p> : null}
        <Button type="submit" disabled={submitting} className="w-full">{submitting ? "Updating…" : "Update password"}</Button>
      </form>
    </AuthFrame>
  );
}

function AuthFrame({ title, description, children, footer }: { title: string; description: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
      <section className="hidden bg-forest p-12 text-white lg:flex lg:flex-col">
        <Logo light />
        <div className="my-auto max-w-lg">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-coral">Built for client work</p>
          <blockquote className="mt-6 text-4xl font-extrabold leading-tight tracking-[-0.04em]">“The project gets easier when everyone can see exactly what was agreed.”</blockquote>
          <p className="mt-6 text-sm leading-6 text-white/55">Collect the brief. Publish the scope. Record the decision. Keep changes explicit.</p>
        </div>
      </section>
      <section className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md animate-rise">
          <div className="mb-10 lg:hidden"><Logo /></div>
          <h1 className="text-3xl font-extrabold tracking-[-0.035em] text-ink">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-sage">{description}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-7 flex gap-1.5 text-sm text-sage">{footer}</div>
        </div>
      </section>
    </main>
  );
}
