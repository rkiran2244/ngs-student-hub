import os
import smtplib
import ssl
import time
import logging
from flask import current_app

logger = logging.getLogger(__name__)


def _get_mail_output_dir(app=None):
    # Prefer explicit config, then env var, then project instance directory
    out = None
    try:
        if app is None:
            app = current_app._get_current_object()
        out = app.config.get('MAIL_OUTPUT_DIR')
    except Exception:
        out = None

    if not out:
        out = os.environ.get('MAIL_OUTPUT_DIR')
    if not out:
        # default to instance/sent_emails at project root
        root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        out = os.path.join(root, 'instance', 'sent_emails')
    try:
        os.makedirs(out, exist_ok=True)
    except Exception:
        logger.exception('Failed to create mail output dir %s', out)
    return out


def _write_email_to_file(to: str, subject: str, body: str, app=None) -> str:
    out = _get_mail_output_dir(app)
    ts = int(time.time() * 1000)
    safe_to = to.replace('@', '_at_').replace('.', '_')
    filename = f"{ts}_{safe_to}.eml"
    path = os.path.join(out, filename)
    content = f"To: {to}\nSubject: {subject}\n\n{body}\n"
    try:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        return path
    except Exception:
        logger.exception('Failed to write email to file: %s', path)
        raise


def send_email(to: str, subject: str, body: str, app=None) -> bool:
    """Send an email. In production, configure SMTP settings via env vars or
    app.config. In development/tests, emails are written to disk in
    MAIL_OUTPUT_DIR for inspection.

    Configuration options (env or app.config):
      - SMTP_SERVER
      - SMTP_PORT
      - SMTP_USER
      - SMTP_PASSWORD
      - SMTP_USE_TLS (true/false)
      - MAIL_OUTPUT_DIR (fallback / test)
    """
    # Attempt SMTP if server configured
    server = os.environ.get('SMTP_SERVER')
    port = os.environ.get('SMTP_PORT')
    user = os.environ.get('SMTP_USER')
    password = os.environ.get('SMTP_PASSWORD')
    use_tls = os.environ.get('SMTP_USE_TLS', '0').lower() in ('1', 'true', 'yes')

    # Allow app.config overrides
    try:
        if not server and app is None:
            app = current_app._get_current_object()
        if app is not None:
            server = server or app.config.get('SMTP_SERVER')
            port = port or app.config.get('SMTP_PORT')
            user = user or app.config.get('SMTP_USER')
            password = password or app.config.get('SMTP_PASSWORD')
            if app.config.get('SMTP_USE_TLS') is not None:
                use_tls = bool(app.config.get('SMTP_USE_TLS'))
    except Exception:
        pass

    if server:
        try:
            port_int = int(port) if port else (587 if use_tls else 25)
            if use_tls:
                context = ssl.create_default_context()
                with smtplib.SMTP(server, port_int, timeout=10) as smtp:
                    smtp.starttls(context=context)
                    if user and password:
                        smtp.login(user, password)
                    msg = f"To: {to}\nSubject: {subject}\n\n{body}\n"
                    smtp.sendmail(user or f"noreply@{server}", [to], msg)
            else:
                with smtplib.SMTP(server, port_int, timeout=10) as smtp:
                    if user and password:
                        smtp.login(user, password)
                    msg = f"To: {to}\nSubject: {subject}\n\n{body}\n"
                    smtp.sendmail(user or f"noreply@{server}", [to], msg)
            return True
        except Exception:
            logger.exception('Failed to send email via SMTP')
            # Fall through to file output fallback

    # Fallback: write email to disk
    _write_email_to_file(to, subject, body, app)
    return True
