import asyncio
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal

from sqlalchemy import select

from app.common.database import SessionLocal
from app.common.enums import (
    ApprovalDecision,
    BriefStatus,
    ChangeRequestStatus,
    OrganizationRole,
    ProjectStatus,
    ScopeStatus,
    SubscriptionPlan,
)
from app.common.security import hash_password
from app.models import (
    ActivityEvent,
    Approval,
    BriefTemplate,
    ChangeRequest,
    Organization,
    OrganizationMember,
    Project,
    ProjectBrief,
    ScopeDocument,
    User,
)

demo_email = "demo@scopebase.dev"
demo_password = "DemoPass123!"


website_questions = [
    {
        "id": "business_goals",
        "label": "What should the new website achieve?",
        "description": "Describe the most important business outcome.",
        "required": True,
        "type": "long_text",
        "options": [],
        "order": 0,
    },
    {
        "id": "audience",
        "label": "Who is the primary audience?",
        "description": "Tell us who needs the website most.",
        "required": True,
        "type": "short_text",
        "options": [],
        "order": 1,
    },
    {
        "id": "features",
        "label": "Which features are required?",
        "description": "Select every feature needed for launch.",
        "required": True,
        "type": "multiple_choice",
        "options": ["Online booking", "Services", "Team profiles", "Blog", "Contact forms"],
        "order": 2,
    },
    {
        "id": "launch_date",
        "label": "Preferred launch date",
        "description": "Choose the ideal public launch date.",
        "required": False,
        "type": "date",
        "options": [],
        "order": 3,
    },
    {
        "id": "assets",
        "label": "Upload brand assets",
        "description": "Logos, photography, and brand guidelines are helpful.",
        "required": False,
        "type": "file_upload",
        "options": [],
        "order": 4,
    },
]


async def seed() -> None:
    async with SessionLocal() as session:
        template = await session.scalar(
            select(BriefTemplate).where(
                BriefTemplate.organization_id.is_(None),
                BriefTemplate.name == "Website discovery",
            )
        )
        if template is None:
            session.add(
                BriefTemplate(
                    organization_id=None,
                    name="Website discovery",
                    description="A practical discovery brief for new website projects.",
                    category="Web design",
                    questions=website_questions,
                )
            )
        existing = await session.scalar(select(User).where(User.email == demo_email))
        if existing:
            await session.commit()
            return
        now = datetime.now(UTC)
        owner = User(
            email=demo_email,
            password_hash=hash_password(demo_password),
            full_name="Maya Chen",
        )
        session.add(owner)
        await session.flush()
        organization = Organization(
            name="Northstar Studio",
            slug="northstar-studio",
            owner_id=owner.id,
            plan=SubscriptionPlan.pro,
            subscription_status="active",
            created_at=now - timedelta(days=120),
        )
        session.add(organization)
        await session.flush()
        session.add(
            OrganizationMember(
                organization_id=organization.id,
                user_id=owner.id,
                role=OrganizationRole.owner,
            )
        )
        dental = Project(
            organization_id=organization.id,
            name="Dental clinic website redesign",
            slug="dental-clinic-website-redesign",
            description="A warmer, conversion-focused website for a growing dental clinic.",
            client_name="Elena Rossi",
            client_email="elena@brightsmile.example",
            currency="EUR",
            base_price=Decimal("2400.00"),
            target_delivery_date=date.today() + timedelta(days=28),
            status=ProjectStatus.waiting_for_approval,
        )
        wellness = Project(
            organization_id=organization.id,
            name="Harbor Wellness identity",
            slug="harbor-wellness-identity",
            description="Brand identity and launch kit for a neighborhood wellness practice.",
            client_name="Noah Williams",
            client_email="noah@harborwellness.example",
            currency="EUR",
            base_price=Decimal("3200.00"),
            target_delivery_date=date.today() + timedelta(days=14),
            status=ProjectStatus.approved,
        )
        coffee = Project(
            organization_id=organization.id,
            name="Pine & Oak packaging",
            slug="pine-and-oak-packaging",
            description="Retail packaging system for a small-batch coffee roaster.",
            client_name="Ava Thompson",
            client_email="ava@pineandoak.example",
            currency="EUR",
            base_price=Decimal("1800.00"),
            target_delivery_date=date.today() + timedelta(days=35),
            status=ProjectStatus.brief_submitted,
        )
        session.add_all([dental, wellness, coffee])
        await session.flush()
        dental_brief = ProjectBrief(
            project_id=dental.id,
            template_snapshot={
                "name": "Website discovery",
                "description": "A practical discovery brief for new website projects.",
                "category": "Web design",
                "questions": website_questions,
            },
            answers={
                "business_goals": (
                    "Increase online bookings and make treatment options easier to understand."
                ),
                "audience": "Families and professionals living within 10 km of the clinic.",
                "features": ["Online booking", "Services", "Team profiles", "Contact forms"],
                "launch_date": (date.today() + timedelta(days=28)).isoformat(),
                "assets": [],
            },
            status=BriefStatus.submitted,
            submitted_at=now - timedelta(days=5),
        )
        coffee_brief = ProjectBrief(
            project_id=coffee.id,
            template_snapshot={
                "name": "Packaging discovery",
                "description": "Product and production details for the packaging system.",
                "category": "Branding",
                "questions": website_questions[:2],
            },
            answers={
                "business_goals": (
                    "Stand out on independent retail shelves without losing the craft feel."
                ),
                "audience": "Specialty coffee buyers aged 25–45.",
            },
            status=BriefStatus.submitted,
            submitted_at=now - timedelta(days=2),
        )
        session.add_all([dental_brief, coffee_brief])
        dental_scope = ScopeDocument(
            project_id=dental.id,
            version_number=1,
            title="BrightSmile website redesign scope",
            summary=(
                "Design and build a responsive marketing website that makes treatments clear "
                "and drives qualified bookings."
            ),
            deliverables=[
                {
                    "title": "UX and visual design",
                    "description": "Responsive designs for eight page templates.",
                },
                {
                    "title": "Website implementation",
                    "description": "Production-ready responsive website and CMS setup.",
                },
                {
                    "title": "Launch support",
                    "description": "Content migration, QA, and deployment support.",
                },
            ],
            included_items=[
                "Discovery workshop",
                "Responsive design",
                "CMS configuration",
                "Analytics setup",
            ],
            excluded_items=["Copywriting", "Ongoing SEO", "Paid advertising"],
            assumptions=[
                "Client provides approved copy and photography",
                "One stakeholder consolidates feedback",
            ],
            revision_limit=2,
            price=Decimal("2400.00"),
            delivery_date=dental.target_delivery_date,
            status=ScopeStatus.sent,
            created_by=owner.id,
            created_at=now - timedelta(days=1),
        )
        wellness_scope = ScopeDocument(
            project_id=wellness.id,
            version_number=2,
            title="Harbor Wellness brand identity",
            summary=(
                "A calm, credible identity system designed for digital and neighborhood "
                "touchpoints."
            ),
            deliverables=[
                {
                    "title": "Identity system",
                    "description": "Logo suite, color, typography, and usage rules.",
                },
                {
                    "title": "Launch toolkit",
                    "description": "Social templates, signage, and stationery files.",
                },
            ],
            included_items=[
                "Two creative directions",
                "Brand guidelines",
                "Production-ready exports",
            ],
            excluded_items=["Website development", "Printing costs"],
            assumptions=["Final business name remains unchanged"],
            revision_limit=2,
            price=Decimal("3200.00"),
            delivery_date=wellness.target_delivery_date,
            status=ScopeStatus.approved,
            created_by=owner.id,
            created_at=now - timedelta(days=12),
        )
        session.add_all([dental_scope, wellness_scope])
        await session.flush()
        session.add(
            Approval(
                scope_document_id=wellness_scope.id,
                client_name=wellness.client_name,
                client_email=wellness.client_email,
                decision=ApprovalDecision.approved,
                optional_comment="Everything is clear. Excited to move forward.",
                approved_at=now - timedelta(days=10),
                ip_address="203.0.113.12",
                user_agent="ScopeBase demo client",
            )
        )
        session.add(
            ChangeRequest(
                project_id=wellness.id,
                title="Additional exterior signage concepts",
                description="Create three concepts for the building entrance and window vinyl.",
                reason="The new lease includes more exterior signage space than expected.",
                additional_price=Decimal("480.00"),
                additional_days=4,
                status=ChangeRequestStatus.pending,
                created_by=owner.id,
                created_at=now - timedelta(days=1),
            )
        )
        activity_specs = [
            (dental, "project_created", "Maya Chen", 9),
            (dental, "brief_submitted", "Elena Rossi", 5),
            (dental, "scope_version_created", "Maya Chen", 2),
            (dental, "scope_sent", "Maya Chen", 1),
            (wellness, "scope_approved", "Noah Williams", 10),
            (wellness, "change_request_created", "Maya Chen", 1),
            (coffee, "brief_submitted", "Ava Thompson", 2),
        ]
        session.add_all(
            [
                ActivityEvent(
                    organization_id=organization.id,
                    project_id=project.id,
                    actor_id=owner.id if actor == "Maya Chen" else None,
                    actor_name=actor,
                    event_type=event_type,
                    event_metadata={"project_name": project.name},
                    created_at=now - timedelta(days=days),
                )
                for project, event_type, actor, days in activity_specs
            ]
        )
        await session.commit()


if __name__ == "__main__":
    asyncio.run(seed())
