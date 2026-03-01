use anyhow::Result;
use lettre::{
    message::{header, Mailbox},
    transport::smtp::authentication::Credentials,
    Message, SmtpTransport, Transport,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Email service for sending emails via SMTP
pub struct EmailService {
    smtp_transport: SmtpTransport,
    from_address: String,
    from_name: String,
}

impl EmailService {
    /// Create a new email service
    pub fn new(
        smtp_host: String,
        smtp_port: u16,
        smtp_username: String,
        smtp_password: String,
        from_address: String,
        from_name: String,
    ) -> Self {
        let credentials = Credentials::new(smtp_username, smtp_password);
        
        let smtp_transport = SmtpTransport::relay(&smtp_host)
            .expect("Failed to create SMTP transport")
            .port(smtp_port)
            .credentials(credentials)
            .build();

        Self {
            smtp_transport,
            from_address,
            from_name,
        }
    }

    /// Send an email
    pub async fn send_email(&self, email_data: SendEmailData) -> Result<()> {
        let from_mailbox = format!("{} <{}>", self.from_name, self.from_address)
            .parse::<Mailbox>()?;

        let mut message_builder = Message::builder()
            .from(from_mailbox)
            .to(email_data.to.parse::<Mailbox>()?)
            .subject(&email_data.subject);

        // Add CC if present
        if let Some(cc) = &email_data.cc {
            if !cc.is_empty() {
                message_builder = message_builder.cc(cc.parse::<Mailbox>()?);
            }
        }

        // Add BCC if present
        if let Some(bcc) = &email_data.bcc {
            if !bcc.is_empty() {
                message_builder = message_builder.bcc(bcc.parse::<Mailbox>()?);
            }
        }

        // Add reply-to if present
        if let Some(reply_to) = &email_data.reply_to {
            if !reply_to.is_empty() {
                message_builder = message_builder.reply_to(reply_to.parse::<Mailbox>()?);
            }
        }

        // Build message
        let message = message_builder.body(email_data.body)?;

        // Send email
        self.smtp_transport.send(&message)
            .map_err(|e| anyhow::anyhow!("Failed to send email: {}", e))?;

        Ok(())
    }

    /// Send a welcome email
    pub async fn send_welcome_email(&self, to: &str, user_name: &str) -> Result<()> {
        let body = format!(
            "Welcome to Vantis Mail, {}!\n\n\
            Your secure email account has been created successfully.\n\n\
            Features:\n\
            - End-to-end encryption\n\
            - Phantom aliases for privacy\n\
            - Self-destructing messages\n\
            - Military-grade security\n\n\
            If you have any questions, please contact support.\n\n\
            Best regards,\n\
            The Vantis Mail Team",
            user_name
        );

        let email_data = SendEmailData {
            to: to.to_string(),
            cc: None,
            bcc: None,
            reply_to: None,
            subject: "Welcome to Vantis Mail".to_string(),
            body,
        };

        self.send_email(email_data).await
    }

    /// Send a password reset email
    pub async fn send_password_reset_email(&self, to: &str, reset_token: &str) -> Result<()> {
        let reset_link = format!("https://vantis-mail.com/reset-password?token={}", reset_token);
        
        let body = format!(
            "You requested a password reset for your Vantis Mail account.\n\n\
            Click the link below to reset your password:\n\
            {}\n\n\
            This link will expire in 1 hour.\n\n\
            If you did not request this password reset, please ignore this email.\n\n\
            Best regards,\n\
            The Vantis Mail Team",
            reset_link
        );

        let email_data = SendEmailData {
            to: to.to_string(),
            cc: None,
            bcc: None,
            reply_to: None,
            subject: "Password Reset Request".to_string(),
            body,
        };

        self.send_email(email_data).await
    }

    /// Send a verification email
    pub async fn send_verification_email(&self, to: &str, verification_token: &str) -> Result<()> {
        let verification_link = format!(
            "https://vantis-mail.com/verify-email?token={}",
            verification_token
        );
        
        let body = format!(
            "Please verify your email address for your Vantis Mail account.\n\n\
            Click the link below to verify:\n\
            {}\n\n\
            This link will expire in 24 hours.\n\n\
            If you did not create this account, please ignore this email.\n\n\
            Best regards,\n\
            The Vantis Mail Team",
            verification_link
        );

        let email_data = SendEmailData {
            to: to.to_string(),
            cc: None,
            bcc: None,
            reply_to: None,
            subject: "Verify Your Email Address".to_string(),
            body,
        };

        self.send_email(email_data).await
    }

    /// Send a panic mode notification
    pub async fn send_panic_notification(&self, to: &str, panic_time: chrono::DateTime<chrono::Utc>) -> Result<()> {
        let body = format!(
            "PANIC MODE ACTIVATED\n\n\
            Your Vantis Mail account has been locked due to panic mode activation.\n\n\
            Activation time: {}\n\n\
            All data has been secured and encrypted.\n\n\
            To restore access, please contact support with your recovery key.\n\n\
            This is an automated security notification.\n\n\
            Best regards,\n\
            The Vantis Mail Security Team",
            panic_time.format("%Y-%m-%d %H:%M:%S UTC")
        );

        let email_data = SendEmailData {
            to: to.to_string(),
            cc: None,
            bcc: None,
            reply_to: None,
            subject: "PANIC MODE ACTIVATED - Account Locked".to_string(),
            body,
        };

        self.send_email(email_data).await
    }
}

/// Data for sending an email
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SendEmailData {
    pub to: String,
    pub cc: Option<String>,
    pub bcc: Option<String>,
    pub reply_to: Option<String>,
    pub subject: String,
    pub body: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_send_email_data_serialization() {
        let data = SendEmailData {
            to: "test@example.com".to_string(),
            cc: Some("cc@example.com".to_string()),
            bcc: None,
            reply_to: None,
            subject: "Test Subject".to_string(),
            body: "Test Body".to_string(),
        };

        let json = serde_json::to_string(&data).unwrap();
        let deserialized: SendEmailData = serde_json::from_str(&json).unwrap();

        assert_eq!(data.to, deserialized.to);
        assert_eq!(data.subject, deserialized.subject);
    }
}
