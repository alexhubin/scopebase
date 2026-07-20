import { useMutation, useQuery } from "@tanstack/react-query";
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
        <Panel className="p-7">
          <div className="flex items-start justify-between gap-4"><div><h2 className="text-[19px] font-semibold">Profile and organization</h2><p className="mt-1.5 text-[13.5px] text-sage">Used in your workspace and client invitations.</p></div><span className="grid size-10 place-items-center bg-mint text-xs font-bold text-forest">{fullName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span></div>
          <form className="mt-6 grid gap-5" onSubmit={(event) => { event.preventDefault(); void saveProfile.mutateAsync(); }}>
            <Field label="Your name"><Input value={fullName} onChange={(event) => setFullName(event.target.value)} /></Field>
            <Button type="submit" variant="secondary" disabled={saveProfile.isPending} className="justify-self-start">Save profile</Button>
          </form>
          <form className="mt-7 grid gap-5 border-t border-line pt-7" onSubmit={(event) => { event.preventDefault(); void saveOrganization.mutateAsync(); }}>
            <Field label="Organization name"><Input value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} /></Field>
            <Button type="submit" variant="secondary" disabled={saveOrganization.isPending} className="justify-self-start">Save organization</Button>
          </form>
        </Panel>
        <Panel className="p-7">
          <div className="flex items-start justify-between gap-4"><div><h2 className="text-[19px] font-semibold">Billing</h2><p className="mt-1.5 text-[13.5px] text-sage">Server-enforced plan limits.</p></div><Badge tone={billing.data?.plan === "pro" ? "success" : "neutral"}>{billing.data?.plan === "pro" ? "Pro plan" : "Free plan"}</Badge></div>
          <div className="mt-[26px] border border-line"><div className="grid grid-cols-2 gap-px bg-line"><div className="bg-paper px-[18px] py-4"><span className="text-[12.5px] text-sage">Active projects</span><strong className="mt-1 block font-display text-xl">{billing.data?.plan === "pro" ? "Unlimited" : "1 / 1"}</strong></div><div className="bg-paper px-[18px] py-4"><span className="text-[12.5px] text-sage">File storage</span><strong className="mt-1 block font-display text-xl">{billing.data?.plan === "pro" ? "1 GB" : "25 MB"}</strong></div></div></div>
          <div className="mt-5 bg-forest p-5 text-white"><h3 className="font-display text-base font-semibold">{billing.data?.plan === "pro" ? "Your Pro workspace" : "Upgrade to Pro — €19/mo"}</h3><p className="mt-2 text-[13.5px] leading-[1.6] text-white/70">Unlimited active projects, custom templates, version history, change requests, PDF exports, and 1 GB storage.</p><Button variant="accent" type="button" className="mt-4" disabled={billingAction.isPending} onClick={() => billingAction.mutate(billing.data?.plan === "pro" ? "portal" : "checkout")}>{billing.data?.plan === "pro" ? "Manage subscription" : "Upgrade to Pro"}</Button></div>
        </Panel>
      </div>
    </div>
  );
}
