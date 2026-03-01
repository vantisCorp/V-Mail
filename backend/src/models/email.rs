use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct Email {
    pub id: Uuid,
    pub user_id: Uuid,
    pub folder_id: Uuid,
    pub from_email: String,
    pub from_name: Option<String>,
    pub to_email: String,
    pub cc_email: Option<String>,
    pub bcc_email: Option<String>,
    pub subject: String,
    pub body: String,
    pub body_html: Option<String>,
    pub is_encrypted: bool,
    pub has_attachments: bool,
    pub is_read: bool,
    pub is_starred: bool,
    pub phantom_alias: Option<String>,
    pub self_destruct_at: Option<DateTime<Utc>>,
    pub received_at: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateEmailRequest {
    pub to_email: String,
    pub cc_email: Option<String>,
    pub bcc_email: Option<String>,
    pub subject: String,
    pub body: String,
    pub body_html: Option<String>,
    pub encrypt: bool,
    pub phantom_alias: Option<String>,
    pub self_destruct_minutes: Option<u32>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateEmailRequest {
    pub is_read: Option<bool>,
    pub is_starred: Option<bool>,
    pub folder_id: Option<Uuid>,
}

#[derive(Debug, Serialize)]
pub struct EmailResponse {
    pub id: Uuid,
    pub from_email: String,
    pub from_name: Option<String>,
    pub to_email: String,
    pub cc_email: Option<String>,
    pub bcc_email: Option<String>,
    pub subject: String,
    pub body: String,
    pub body_html: Option<String>,
    pub is_encrypted: bool,
    pub has_attachments: bool,
    pub is_read: bool,
    pub is_starred: bool,
    pub phantom_alias: Option<String>,
    pub self_destruct_at: Option<DateTime<Utc>>,
    pub received_at: DateTime<Utc>,
}

impl From<Email> for EmailResponse {
    fn from(email: Email) -> Self {
        EmailResponse {
            id: email.id,
            from_email: email.from_email,
            from_name: email.from_name,
            to_email: email.to_email,
            cc_email: email.cc_email,
            bcc_email: email.bcc_email,
            subject: email.subject,
            body: email.body,
            body_html: email.body_html,
            is_encrypted: email.is_encrypted,
            has_attachments: email.has_attachments,
            is_read: email.is_read,
            is_starred: email.is_starred,
            phantom_alias: email.phantom_alias,
            self_destruct_at: email.self_destruct_at,
            received_at: email.received_at,
        }
    }
}