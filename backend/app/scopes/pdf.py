from io import BytesIO

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.approvals.models import Approval
from app.projects.models import Project
from app.scopes.models import ScopeDocument


def build_scope_pdf(project: Project, scope: ScopeDocument, approval: Approval | None) -> bytes:
    output = BytesIO()
    document = SimpleDocTemplate(
        output,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        title=f"{project.name} scope v{scope.version_number}",
    )
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="Brand", parent=styles["Title"], textColor=HexColor("#173F35")))
    styles.add(
        ParagraphStyle(name="Meta", parent=styles["BodyText"], textColor=HexColor("#66736F"))
    )
    story = [
        Paragraph("ScopeBase", styles["Brand"]),
        Paragraph(f"{project.name} · Scope version {scope.version_number}", styles["Meta"]),
        Spacer(1, 8 * mm),
        Paragraph(scope.title, styles["Heading1"]),
        Paragraph(scope.summary, styles["BodyText"]),
        Spacer(1, 5 * mm),
    ]
    sections = [
        (
            "Deliverables",
            [
                f"<b>{item['title']}</b><br/>{item.get('description', '')}"
                for item in scope.deliverables
            ],
        ),
        ("Included work", scope.included_items),
        ("Excluded work", scope.excluded_items),
        ("Assumptions", scope.assumptions),
    ]
    for title, items in sections:
        story.append(Paragraph(title, styles["Heading2"]))
        if items:
            for item in items:
                story.append(Paragraph(f"• {item}", styles["BodyText"]))
        else:
            story.append(Paragraph("None specified", styles["Meta"]))
        story.append(Spacer(1, 3 * mm))
    summary = Table(
        [
            ["Price", f"{project.currency} {scope.price:,.2f}"],
            [
                "Delivery date",
                scope.delivery_date.isoformat() if scope.delivery_date else "To be agreed",
            ],
            ["Revision limit", str(scope.revision_limit)],
        ],
        colWidths=[55 * mm, 95 * mm],
    )
    summary.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), HexColor("#EEF3F1")),
                ("TEXTCOLOR", (0, 0), (-1, -1), HexColor("#173F35")),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#CED8D4")),
                ("PADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.extend([summary, Spacer(1, 8 * mm)])
    if approval:
        story.extend(
            [
                Paragraph("Approval record", styles["Heading2"]),
                Paragraph(
                    f"{approval.client_name} ({approval.client_email}) · "
                    f"{approval.decision.value.replace('_', ' ').title()} · "
                    f"{approval.approved_at.isoformat()}",
                    styles["BodyText"],
                ),
            ]
        )
    document.build(story)
    return output.getvalue()
