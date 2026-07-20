import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { Activity, CheckCircle2 } from "lucide-react";

import { get } from "../api/client";
import type { ActivityEvent, Page } from "../api/types";
import { EmptyState, Panel, Spinner } from "../components/ui";
import { eventLabel, relativeDate, shortDate } from "../lib/format";

export function ActivityPage() {
  const { projectId } = useParams({ from: "/_app/projects/$projectId/activity" });
  const activity = useQuery({ queryKey: ["activity", projectId], queryFn: () => get<Page<ActivityEvent>>(`/activity?project_id=${projectId}&page_size=100`) });
  if (activity.isLoading) return <Spinner label="Loading activity" />;
  if (activity.error) return <EmptyState title="Activity unavailable" description={activity.error.message} />;
  if (!activity.data?.items.length) return <EmptyState title="No activity yet" description="Important project events will appear here as the workflow moves forward." />;
  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-extrabold tracking-[-0.03em]">Activity</h2><p className="mt-2 text-sm leading-6 text-sage">A focused history of decisions, published versions, client actions, and files.</p></div>
      <Panel className="p-5 sm:p-6"><div className="relative ml-3 border-l border-line">{activity.data.items.map((event, index) => <div key={event.id} className={`relative pb-7 pl-8 ${index === activity.data.items.length - 1 ? "pb-0" : ""}`}><span className="absolute -left-[0.65rem] top-0 grid size-5 place-items-center rounded-full bg-paper text-coral ring-4 ring-white">{event.event_type.includes("approved") || event.event_type.includes("accepted") ? <CheckCircle2 size={14} /> : <Activity size={13} />}</span><div className="flex flex-col justify-between gap-1 sm:flex-row"><p className="text-sm text-ink"><strong>{event.actor_name}</strong> {eventLabel(event.event_type)}</p><time className="shrink-0 text-xs font-semibold text-sage" dateTime={event.created_at} title={shortDate(event.created_at)}>{relativeDate(event.created_at)}</time></div><EventDetails metadata={event.event_metadata} /></div>)}</div></Panel>
    </div>
  );
}

function EventDetails({ metadata }: { metadata: Record<string, unknown> }) {
  const details = Object.entries(metadata).filter(([, value]) => typeof value === "string" || typeof value === "number");
  if (!details.length) return null;
  return <p className="mt-1 text-xs text-sage">{details.map(([key, value]) => `${key.replaceAll("_", " ")}: ${String(value)}`).join(" · ")}</p>;
}
