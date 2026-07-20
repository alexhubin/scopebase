from enum import StrEnum


class OrganizationRole(StrEnum):
    owner = "owner"
    member = "member"
    client = "client"


class ProjectStatus(StrEnum):
    draft = "draft"
    waiting_for_brief = "waiting_for_brief"
    brief_submitted = "brief_submitted"
    scope_draft = "scope_draft"
    waiting_for_approval = "waiting_for_approval"
    approved = "approved"
    completed = "completed"
    archived = "archived"


class BriefStatus(StrEnum):
    draft = "draft"
    sent = "sent"
    submitted = "submitted"


class ScopeStatus(StrEnum):
    draft = "draft"
    sent = "sent"
    approved = "approved"
    superseded = "superseded"


class ApprovalDecision(StrEnum):
    approved = "approved"
    changes_requested = "changes_requested"


class ChangeRequestStatus(StrEnum):
    draft = "draft"
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"
    cancelled = "cancelled"


class PublicLinkKind(StrEnum):
    brief = "brief"
    scope = "scope"
    change_request = "change_request"


class SubscriptionPlan(StrEnum):
    free = "free"
    pro = "pro"
