use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct PhantomAlias {
    pub id: Uuid,
    pub user_id: Uuid,
    pub alias_email: String,
    pub domain: String,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub expires_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct CreateAliasRequest {
    pub alias_email: String,
    pub domain: String,
    pub expires_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize)]
pub struct AliasResponse {
    pub id: Uuid,
    pub alias_email: String,
    pub domain: String,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub expires_at: Option<DateTime<Utc>>,
}

impl From<PhantomAlias> for AliasResponse {
    fn from(alias: PhantomAlias) -> Self {
        AliasResponse {
            id: alias.id,
            alias_email: alias.alias_email,
            domain: alias.domain,
            is_active: alias.is_active,
            created_at: alias.created_at,
            expires_at: alias.expires_at,
        }
    }
}