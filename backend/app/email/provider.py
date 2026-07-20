import asyncio
import smtplib
from dataclasses import dataclass
from email.message import EmailMessage
from html import escape

from app.common.config import settings


@dataclass
class TransactionalEmail:
    recipient: str
    subject: str
    heading: str
    body: str
    action_label: str | None = None
    action_url: str | None = None


class SMTPEmailProvider:
    async def send(self, email: TransactionalEmail) -> None:
        await asyncio.to_thread(self._send_sync, email)

    def _send_sync(self, email: TransactionalEmail) -> None:
        message = EmailMessage()
        message["From"] = settings.smtp_from
        message["To"] = email.recipient
        message["Subject"] = email.subject
        message.set_content(f"{email.heading}\n\n{email.body}\n\n{email.action_url or ''}".strip())
        action = ""
        if email.action_label and email.action_url:
            action = (
                f'<p><a href="{escape(email.action_url)}" '
                'style="display:inline-block;background:#173f35;color:#fff;padding:12px 18px;'
                f'text-decoration:none;border-radius:8px">{escape(email.action_label)}</a></p>'
            )
        html = (
            '<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#173f35">'
            '<p style="font-weight:700">ScopeBase</p>'
            f"<h1>{escape(email.heading)}</h1>"
            f"<p>{escape(email.body)}</p>"
            f"{action}"
            '<p style="color:#66736f;font-size:13px">Sent by ScopeBase.</p>'
            "</div>"
        )
        message.add_alternative(html, subtype="html")
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as client:
            client.send_message(message)


email_provider = SMTPEmailProvider()
