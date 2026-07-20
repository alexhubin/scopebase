import { cleanup, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PublicBriefPage } from "../pages/PublicBriefPage";
import { PublicChangeRequestPage } from "../pages/PublicChangeRequestPage";
import { PublicScopePage } from "../pages/PublicScopePage";
import { json, renderRoute } from "./render-route";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("client portal journeys", () => {
  it("submits a required client brief", async () => {
    const user = userEvent.setup();
    const submitted: unknown[] = [];
    renderRoute("/client/brief/brief-token", "/client/brief/$token", PublicBriefPage, (path, init) => {
      if (path === "/public/briefs/brief-token" && !init?.method) {
        return json({
          project_name: "Dental clinic website redesign",
          client_name: "BrightSmile Clinic",
          target_delivery_date: "2026-09-30",
          brief_name: "Website discovery",
          brief_description: "Tell us what the new website needs to achieve.",
          questions: [{ id: "goal", label: "Primary goal", description: "", required: true, type: "short_text", options: [], order: 0 }],
          answers: {},
          submitted: false,
        });
      }
      if (path === "/public/briefs/brief-token/submit" && init?.method === "POST") {
        submitted.push(requestBody(init));
        return json({ message: "Brief submitted" });
      }
      return json({ detail: "Not found" }, 404);
    });

    await screen.findByText("Dental clinic website redesign");
    await user.type(screen.getByLabelText(/Primary goal/), "Increase appointment bookings");
    await user.click(screen.getByRole("button", { name: "Submit brief" }));

    expect(await screen.findByRole("heading", { name: "Brief submitted" })).toBeInTheDocument();
    expect(submitted).toEqual([{ answers: { goal: "Increase appointment bookings" } }]);
  });

  it("approves an exact scope version", async () => {
    const user = userEvent.setup();
    let decision: unknown;
    renderRoute("/client/scope/scope-token", "/client/scope/$token", PublicScopePage, (path, init) => {
      if (path === "/public/scopes/scope-token" && !init?.method) {
        return json({
          project_name: "Dental clinic website redesign",
          client_name: "BrightSmile Clinic",
          currency: "EUR",
          scope: {
            id: "scope-1", project_id: "project-1", version_number: 2, title: "Website redesign scope", summary: "A conversion-focused website for the clinic.",
            deliverables: [{ title: "Responsive website", description: "Seven production-ready pages" }], included_items: ["Content migration"], excluded_items: ["Paid advertising"], assumptions: ["Client supplies approved copy"], revision_limit: 2, price: "2400.00", delivery_date: "2026-09-30", status: "sent", created_by: "user-1", created_at: "2026-07-20T10:00:00Z",
          },
          approval: null,
        });
      }
      if (path === "/public/scopes/scope-token/decision" && init?.method === "POST") {
        decision = requestBody(init);
        return json({ message: "Decision recorded" });
      }
      return json({ detail: "Not found" }, 404);
    });

    await screen.findByText("Website redesign scope");
    expect(screen.getByText("Version 2")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Approve scope" }));
    await user.type(screen.getByLabelText("Your name"), "Marta Nowak");
    await user.type(screen.getByLabelText("Your email"), "marta@brightsmile.test");
    await user.click(screen.getByRole("button", { name: "Submit decision" }));

    expect(await screen.findByRole("heading", { name: "Scope approved" })).toBeInTheDocument();
    expect(decision).toMatchObject({ decision: "approved", client_name: "Marta Nowak", client_email: "marta@brightsmile.test" });
  });

  it("declines a change request with client context", async () => {
    const user = userEvent.setup();
    let decision: unknown;
    renderRoute("/client/change-request/change-token", "/client/change-request/$token", PublicChangeRequestPage, (path, init) => {
      if (path === "/public/change-requests/change-token" && !init?.method) {
        return json({
          project_name: "Dental clinic website redesign",
          client_name: "BrightSmile Clinic",
          currency: "EUR",
          change_request: { id: "change-1", project_id: "project-1", title: "Patient portal integration", description: "Connect the site to the external booking portal.", reason: "The approved scope included a link, not an API integration.", additional_price: "650.00", additional_days: 4, status: "pending", created_by: "user-1", client_comment: null, decided_at: null, created_at: "2026-07-20T10:00:00Z" },
        });
      }
      if (path === "/public/change-requests/change-token/decision" && init?.method === "POST") {
        decision = requestBody(init);
        return json({ message: "Decision recorded" });
      }
      return json({ detail: "Not found" }, 404);
    });

    await screen.findByText("Patient portal integration");
    await user.click(screen.getByRole("button", { name: "Decline change" }));
    await user.type(screen.getByLabelText("Your name"), "Marta Nowak");
    await user.type(screen.getByLabelText("Comment (optional)"), "Please keep the original booking link.");
    await user.click(screen.getByRole("button", { name: "Submit decision" }));

    expect(await screen.findByRole("heading", { name: "Change declined" })).toBeInTheDocument();
    expect(decision).toMatchObject({ accepted: false, client_name: "Marta Nowak", comment: "Please keep the original booking link." });
    await waitFor(() => expect(screen.getByText(/sent to the project team/i)).toBeVisible());
  });
});

function requestBody(init?: RequestInit) {
  if (typeof init?.body !== "string") throw new Error("Expected a JSON request body");
  return JSON.parse(init.body) as unknown;
}
