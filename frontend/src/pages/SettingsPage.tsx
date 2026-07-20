import { useMutation, useQuery } from "@tanstack/react-query";
import { CreditCard, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { get, patch, post } from "../api/client";
import type { AuthSession, Organization } from "../api/types";
import { PageHeader } from "../components/AppShell";
import { Badge, Button, Field, Input, Panel, Spinner } from "../components/ui";
import { useAuth } from "../features/auth/auth-context";

interface BillingStatus {
  plan: "free" | "pro";
  subscription_status: string | null;
}

export function SettingsPage() {
  const { session, updateSession } = useAuth();
  const organization = useQuery({ queryKey: ["organization"], queryFn: () => get<Organization>("/organization") });
  const billing = useQuery({ queryKey: ["billing"], queryFn: () => get<BillingStatus>("/billing") });
  const [organizationName, setOrganizationName] = useState("");
  const [fullName, setFullName] = useState(session?.user.full_name ?? "");

  useEffect(() => {
    if (organization.data) setOrganizationName(organization.data.name);
  }, [organization.data]);

  const saveOrganization = useMutation({
    mutationFn: () => patch<Organization>("/organization", { name: organizationName }),
    onSuccess: () => toast.success("Organization updated"),
  });
  const saveProfile = useMutation({
    mutationFn: () => patch<{ message: string }>("/organization/profile", { full_name: fullName }),
    onSuccess: async () => {
      const next = await get<AuthSession>("/auth/me");
      updateSession(next);
      toast.success("Profile updated");
    },
  });
  const billingAction = useMutation({
    mutationFn: (kind: "checkout" | "portal") => post<{ url: string }>(`/billing/${kind}`),
    onSuccess: ({ url }) => window.location.assign(url),
  });

  if (organization.isLoading || billing.isLoading) return <Spinner label="Loading settings" />;
  return (
    <div className="animate-rise">
      <PageHeader eyebrow="Workspace" title="Settings" description="Manage the details clients see and your ScopeBase plan." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel className="p-6">
          <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-lg bg-mint text-forest"><UserRound size={19} /></span><div><h2 className="font-extrabold">Profile and organization</h2><p className="text-xs text-sage">Used in your internal workspace and invitations.</p></div></div>
          <form className="mt-6 grid gap-5" onSubmit={(event) => { event.preventDefault(); void saveProfile.mutateAsync(); }}>
            <Field label="Your name"><Input value={fullName} onChange={(event) => setFullName(event.target.value)} /></Field>
            <Button type="submit" variant="secondary" disabled={saveProfile.isPending} className="justify-self-start">Save profile</Button>
          </form>
          <form className="mt-7 grid gap-5 border-t border-line pt-7" onSubmit={(event) => { event.preventDefault(); void saveOrganization.mutateAsync(); }}>
            <Field label="Organization name"><Input value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} /></Field>
            <Button type="submit" variant="secondary" disabled={saveOrganization.isPending} className="justify-self-start">Save organization</Button>
          </form>
        </Panel>
        <Panel className="p-6">
          <div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-lg bg-mint text-forest"><CreditCard size={19} /></span><div><h2 className="font-extrabold">Billing</h2><p className="text-xs text-sage">Server-enforced plan limits.</p></div></div><Badge tone={billing.data?.plan === "pro" ? "success" : "neutral"}>{billing.data?.plan === "pro" ? "Pro" : "Free"}</Badge></div>
          <div className="mt-7 bg-paper p-5"><p className="text-sm font-extrabold">{billing.data?.plan === "pro" ? "Your Pro workspace" : "Upgrade to Pro"}</p><p className="mt-2 text-sm leading-6 text-sage">Unlimited active projects, custom templates, scope version history, change requests, PDF exports, and more storage.</p></div>
          <Button type="button" className="mt-6" disabled={billingAction.isPending} onClick={() => billingAction.mutate(billing.data?.plan === "pro" ? "portal" : "checkout")}>{billing.data?.plan === "pro" ? "Manage subscription" : "Upgrade to Pro"}</Button>
        </Panel>
      </div>
    </div>
  );
}
