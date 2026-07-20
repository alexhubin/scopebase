export type ProjectStatus =
  | "draft"
  | "waiting_for_brief"
  | "brief_submitted"
  | "scope_draft"
  | "waiting_for_approval"
  | "approved"
  | "completed"
  | "archived";

export type ScopeStatus = "draft" | "sent" | "approved" | "superseded";
export type ChangeStatus = "draft" | "pending" | "accepted" | "rejected" | "cancelled";

export interface User {
  id: string;
  email: string;
  full_name: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  role: "owner" | "member" | "client";
  plan: "free" | "pro";
  subscription_status?: string | null;
}

export interface AuthSession {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  user: User;
  organization: Organization;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface Project {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description: string;
  client_name: string;
  client_email: string;
  currency: string;
  base_price: string;
  target_delivery_date: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export type QuestionType =
  | "short_text"
  | "long_text"
  | "single_choice"
  | "multiple_choice"
  | "yes_no"
  | "number"
  | "date"
  | "file_upload";

export interface BriefQuestion {
  id: string;
  label: string;
  description: string;
  required: boolean;
  type: QuestionType;
  options: string[];
  order: number;
}

export interface BriefTemplate {
  id: string;
  organization_id: string | null;
  name: string;
  description: string;
  category: string;
  questions: BriefQuestion[];
}

export interface ProjectBrief {
  id: string;
  project_id: string;
  template_snapshot: {
    name: string;
    description: string;
    category: string;
    questions: BriefQuestion[];
  };
  answers: Record<string, unknown>;
  status: "draft" | "sent" | "submitted";
  submitted_at: string | null;
  updated_at: string;
}

export interface Deliverable {
  title: string;
  description: string;
}

export interface ScopeDocument {
  id: string;
  project_id: string;
  version_number: number;
  title: string;
  summary: string;
  deliverables: Deliverable[];
  included_items: string[];
  excluded_items: string[];
  assumptions: string[];
  revision_limit: number;
  price: string;
  delivery_date: string | null;
  status: ScopeStatus;
  created_by: string;
  created_at: string;
}

export interface ChangeRequest {
  id: string;
  project_id: string;
  title: string;
  description: string;
  reason: string;
  additional_price: string;
  additional_days: number;
  status: ChangeStatus;
  client_comment: string | null;
  decided_at: string | null;
  created_at: string;
}

export interface ActivityEvent {
  id: string;
  project_id: string | null;
  actor_name: string;
  event_type: string;
  event_metadata: Record<string, unknown>;
  created_at: string;
}

export interface FileAttachment {
  id: string;
  project_id: string;
  uploaded_by: string | null;
  original_filename: string;
  content_type: string;
  size: number;
  created_at: string;
}

export interface PublicBrief {
  project_name: string;
  client_name: string;
  target_delivery_date: string | null;
  brief_name: string;
  brief_description: string;
  questions: BriefQuestion[];
  answers: Record<string, unknown>;
  submitted: boolean;
}

export interface PublicScope {
  project_name: string;
  client_name: string;
  currency: string;
  scope: ScopeDocument;
  approval: {
    client_name: string;
    decision: "approved" | "changes_requested";
    optional_comment: string | null;
    approved_at: string;
  } | null;
}

export interface PublicChangeRequest {
  project_name: string;
  client_name: string;
  currency: string;
  change_request: ChangeRequest;
}

