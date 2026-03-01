use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct Attachment {
    pub id: Uuid,
    pub email_id: Uuid,
    pub filename: String,
    pub content_type: String,
    pub file_size: i64,
    pub file_path: String,
    pub is_encrypted: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct AttachmentResponse {
    pub id: Uuid,
    pub filename: String,
    pub content_type: String,
    pub file_size: i64,
    pub is_encrypted: bool,
}

impl From<Attachment> for AttachmentResponse {
    fn from(attachment: Attachment) -> Self {
        AttachmentResponse {
            id: attachment.id,
            filename: attachment.filename,
            content_type: attachment.content_type,
            file_size: attachment.file_size,
            is_encrypted: attachment.is_encrypted,
        }
    }
}