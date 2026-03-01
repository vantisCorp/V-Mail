use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct Folder {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub icon: String,
    pub is_system: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateFolderRequest {
    pub name: String,
    pub icon: String,
}

#[derive(Debug, Serialize)]
pub struct FolderResponse {
    pub id: Uuid,
    pub name: String,
    pub icon: String,
    pub is_system: bool,
    pub email_count: i64,
}

impl From<Folder> for FolderResponse {
    fn from(folder: Folder) -> Self {
        FolderResponse {
            id: folder.id,
            name: folder.name,
            icon: folder.icon,
            is_system: folder.is_system,
            email_count: 0, // Will be populated by query
        }
    }
}