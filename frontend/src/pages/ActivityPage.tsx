import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";

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
      <div><h2 className="text-[22px] font-semibold">Activity</h2><p className="mt-1.5 text-[14.5px] leading-6 text-[#52625d]">A focused history of decisions, published versions, client actions, and files.</p></div>
      <Panel className="p-7 pl-8"><div className="relative border-l border-line pl-[30px]">{activity.data.items.map((event, index) => <div key={event.id} className={`relative pb-[26px] ${index === activity.data.items.length - 1 ? "pb-0" : ""}`}><span className={`absolute -left-[39px] top-0 size-4 rounded-full border-4 border-white ${event.event_type.includes("approved") || event.event_type.includes("accepted") ? "bg-[#087a55]" : "bg-coral"}`} /><div className="flex flex-col justify-between gap-1 sm:flex-row"><p className="text-[14.5px] text-ink"><strong>{event.actor_name}</strong> {eventLabel(event.event_type)}</p><time className="shrink-0 text-[12.5px] font-semibold text-sage" dateTime={event.created_at} title={shortDate(event.created_at)}>{relativeDate(event.created_at)}</time></div><EventDetails metadata={event.event_metadata} /></div>)}</div></Panel>
    </div>
  );
}

function EventDetails({ metadata }: { metadata: Record<string, unknown> }) {
  const details = Object.entries(metadata).filter(([, value]) => typeof value === "string" || typeof value === "number");
  if (!details.length) return null;
  return <p className="mt-1 text-xs text-sage">{details.map(([key, value]) => `${key.replaceAll("_", " ")}: ${String(value)}`).join(" · ")}</p>;
}
