"""
Email service abstraction layer supporting multiple providers:
- Standard SMTP
- SendGrid API
- SMTP2GO API
"""
import smtplib
import json
from abc import ABC, abstractmethod
from email.message import EmailMessage
from threading import Thread

import requests
from flask import current_app

from crewlog import db
from crewlog.auth.models import EmailConfig


class EmailProvider(ABC):
    """Abstract base class for email providers."""
    
    @abstractmethod
    def send_email(self, to: str, subject: str, content: str, html_content: str = None) -> bool:
        """Send an email. Returns True on success, False on failure."""
        pass


class SMTPProvider(EmailProvider):
    """Standard SMTP email provider."""
    
    def __init__(self, config: EmailConfig = None, app_config: dict = None):
        """
        Initialize SMTP provider.
        
        Args:
            config: EmailConfig model instance (from database)
            app_config: Flask app config dict (fallback to env vars)
        """
        self.config = config
        self.app_config = app_config or {}
    
    def send_email(self, to: str, subject: str, content: str, html_content: str = None) -> bool:
        try:
            msg = EmailMessage()
            if html_content:
                msg.set_content(content)
                msg.add_alternative(html_content, subtype='html')
            else:
                msg.set_content(content)
            
            msg['Subject'] = subject
            
            # Get settings from config or app_config
            if self.config:
                from_email = self.config.smtp_mailbox
                server = self.config.smtp_server
                port = self.config.smtp_port
                login = self.config.smtp_login
                password = self.config.smtp_password
                use_tls = self.config.smtp_use_tls
            else:
                from_email = self.app_config.get('SMTP_MAILBOX')
                server = self.app_config.get('SMTP_SERVER')
                port = self.app_config.get('SMTP_PORT')
                login = self.app_config.get('SMTP_LOGIN')
                password = self.app_config.get('SMTP_PASSWORD')
                use_tls = True
            
            msg['From'] = from_email
            msg['To'] = to
            
            if use_tls:
                s = smtplib.SMTP(server, port)
                s.starttls()
            else:
                s = smtplib.SMTP(server, port)
            
            s.login(login, password)
            s.send_message(msg)
            s.quit()
            return True
        except Exception as e:
            current_app.logger.error(f"SMTP email error: {str(e)}")
            return False


class SendGridProvider(EmailProvider):
    """SendGrid API email provider."""
    
    SENDGRID_API_URL = "https://api.sendgrid.com/v3/mail/send"
    
    def __init__(self, config: EmailConfig):
        self.config = config
    
    def send_email(self, to: str, subject: str, content: str, html_content: str = None) -> bool:
        try:
            headers = {
                "Authorization": f"Bearer {self.config.sendgrid_api_key}",
                "Content-Type": "application/json"
            }
            
            email_content = []
            if content:
                email_content.append({"type": "text/plain", "value": content})
            if html_content:
                email_content.append({"type": "text/html", "value": html_content})
            
            from_data = {"email": self.config.sendgrid_from_email}
            if self.config.sendgrid_from_name:
                from_data["name"] = self.config.sendgrid_from_name
            
            payload = {
                "personalizations": [{"to": [{"email": to}]}],
                "from": from_data,
                "subject": subject,
                "content": email_content
            }
            
            response = requests.post(
                self.SENDGRID_API_URL,
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code in [200, 201, 202]:
                return True
            else:
                current_app.logger.error(f"SendGrid error: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            current_app.logger.error(f"SendGrid email error: {str(e)}")
            return False


class SMTP2GOProvider(EmailProvider):
    """SMTP2GO API email provider."""
    
    SMTP2GO_API_URL = "https://api.smtp2go.com/v3/email/send"
    
    def __init__(self, config: EmailConfig):
        self.config = config
    
    def send_email(self, to: str, subject: str, content: str, html_content: str = None) -> bool:
        try:
            headers = {
                "X-Smtp2go-Api-Key": self.config.smtp2go_api_key,
                "Content-Type": "application/json",
                "accept": "application/json"
            }
            
            payload = {
                "sender": self.config.smtp2go_sender,
                "to": [to],
                "subject": subject
            }
            
            if html_content:
                payload["html_body"] = html_content
            if content:
                payload["text_body"] = content
            
            response = requests.post(
                self.SMTP2GO_API_URL,
                headers=headers,
                json=payload,
                timeout=30
            )
            
            result = response.json()
            
            if response.status_code == 200 and result.get("data", {}).get("succeeded", 0) > 0:
                return True
            else:
                error_msg = result.get("data", {}).get("error", "Unknown error")
                current_app.logger.error(f"SMTP2GO error: {error_msg}")
                return False
        except Exception as e:
            current_app.logger.error(f"SMTP2GO email error: {str(e)}")
            return False


class EmailService:
    """
    Main email service that selects the appropriate provider
    based on configuration.
    """
    
    def __init__(self, app_config: dict = None):
        self.app_config = app_config
    
    def _get_provider(self) -> EmailProvider:
        """Get the appropriate email provider based on configuration."""
        # First, try to get active config from database
        config = EmailConfig.get_active_config()
        
        if config:
            if config.provider == EmailConfig.PROVIDER_SENDGRID:
                return SendGridProvider(config)
            elif config.provider == EmailConfig.PROVIDER_SMTP2GO:
                return SMTP2GOProvider(config)
            else:
                return SMTPProvider(config=config)
        
        # Fallback to app config (environment variables)
        if self.app_config and self.app_config.get('SMTP_SERVER'):
            return SMTPProvider(app_config=self.app_config)
        
        return None
    
    def send_email(self, to: str, subject: str, content: str, html_content: str = None) -> bool:
        """
        Send an email using the configured provider.
        
        Args:
            to: Recipient email address
            subject: Email subject
            content: Plain text content
            html_content: Optional HTML content
            
        Returns:
            True if email was sent successfully, False otherwise
        """
        provider = self._get_provider()
        
        if not provider:
            current_app.logger.warning("No email provider configured")
            return False
        
        return provider.send_email(to, subject, content, html_content)
    
    def send_email_async(self, to: str, subject: str, content: str, html_content: str = None):
        """Send email asynchronously in a background thread."""
        thread = Thread(
            target=self._send_email_thread,
            args=(to, subject, content, html_content, self.app_config)
        )
        thread.daemon = True
        thread.start()
    
    @staticmethod
    def _send_email_thread(to: str, subject: str, content: str, html_content: str, app_config: dict):
        """Thread target for async email sending."""
        from crewlog import application
        with application.app_context():
            service = EmailService(app_config)
            service.send_email(to, subject, content, html_content)
    
    def test_connection(self) -> tuple:
        """
        Test the email configuration.
        
        Returns:
            Tuple of (success: bool, message: str)
        """
        provider = self._get_provider()
        
        if not provider:
            return False, "No email provider configured"
        
        # For SMTP, we can test the connection
        if isinstance(provider, SMTPProvider):
            try:
                if provider.config:
                    server = provider.config.smtp_server
                    port = provider.config.smtp_port
                    login = provider.config.smtp_login
                    password = provider.config.smtp_password
                    use_tls = provider.config.smtp_use_tls
                else:
                    server = provider.app_config.get('SMTP_SERVER')
                    port = provider.app_config.get('SMTP_PORT')
                    login = provider.app_config.get('SMTP_LOGIN')
                    password = provider.app_config.get('SMTP_PASSWORD')
                    use_tls = True
                
                if use_tls:
                    s = smtplib.SMTP(server, port, timeout=10)
                    s.starttls()
                else:
                    s = smtplib.SMTP(server, port, timeout=10)
                
                s.login(login, password)
                s.quit()
                return True, "SMTP connection successful"
            except Exception as e:
                return False, f"SMTP connection failed: {str(e)}"
        
        # For API providers, we just verify the config exists
        elif isinstance(provider, SendGridProvider):
            if provider.config.sendgrid_api_key and provider.config.sendgrid_from_email:
                return True, "SendGrid configuration looks valid"
            return False, "SendGrid API key or from email not configured"
        
        elif isinstance(provider, SMTP2GOProvider):
            if provider.config.smtp2go_api_key and provider.config.smtp2go_sender:
                return True, "SMTP2GO configuration looks valid"
            return False, "SMTP2GO API key or sender not configured"
        
        return False, "Unknown provider type"


def get_email_service() -> EmailService:
    """Get an EmailService instance with current app config."""
    return EmailService(current_app.config)


def send_email(to: str, subject: str, content: str, html_content: str = None) -> bool:
    """Convenience function to send an email."""
    service = get_email_service()
    return service.send_email(to, subject, content, html_content)


def send_email_async(to: str, subject: str, content: str, html_content: str = None):
    """Convenience function to send an email asynchronously."""
    service = get_email_service()
    service.send_email_async(to, subject, content, html_content)