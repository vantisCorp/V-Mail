use anyhow::Result;
use sqlx::PgPool;
use uuid::Uuid;
use crate::models::{User, CreateUserRequest, LoginRequest, AuthResponse, UserResponse};
use crate::crypto::key_derivation::{hash_password, verify_password};
use crate::auth::jwt::JwtService;

pub struct AuthService {
    pool: PgPool,
}

impl AuthService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Register a new user
    pub async fn register(&self, req: CreateUserRequest) -> Result<AuthResponse> {
        // Hash password
        let password_hash = hash_password(&req.password)?;

        // Create user
        let user_id = Uuid::new_v4();
        let user = sqlx::query_as::<_, User>(
            r#"
            INSERT INTO users (id, email, password_hash, display_name)
            VALUES ($1, $2, $3, $4)
            RETURNING *
            "#,
        )
        .bind(user_id)
        .bind(&req.email)
        .bind(&password_hash)
        .bind(&req.display_name)
        .fetch_one(&self.pool)
        .await?;

        // Create default folders
        self.create_default_folders(user_id).await?;

        Ok(AuthResponse {
            token: String::new(), // Will be set by handler
            user: user.into(),
        })
    }

    /// Login user
    pub async fn login(&self, req: LoginRequest, jwt_service: &JwtService) -> Result<AuthResponse> {
        // Find user by email
        let user = sqlx::query_as::<_, User>(
            "SELECT * FROM users WHERE email = $1 AND is_active = true"
        )
        .bind(&req.email)
        .fetch_optional(&self.pool)
        .await?
        .ok_or_else(|| anyhow::anyhow!("Invalid credentials"))?;

        // Verify password
        if !verify_password(&req.password, &user.password_hash)? {
            return Err(anyhow::anyhow!("Invalid credentials"));
        }

        // Update last login
        sqlx::query("UPDATE users SET last_login = NOW() WHERE id = $1")
            .bind(user.id)
            .execute(&self.pool)
            .await?;

        // Generate JWT token
        let token = jwt_service.generate_token(user.id, &user.email)?;

        Ok(AuthResponse {
            token,
            user: user.into(),
        })
    }

    /// Create default folders for a new user
    async fn create_default_folders(&self, user_id: Uuid) -> Result<()> {
        let folders = [
            ("Inbox", "📥"),
            ("Sent", "📤"),
            ("Drafts", "📝"),
            ("Trash", "🗑️"),
        ];

        for (name, icon) in folders {
            sqlx::query(
                "INSERT INTO folders (user_id, name, icon, is_system) VALUES ($1, $2, $3, true)"
            )
            .bind(user_id)
            .bind(name)
            .bind(icon)
            .execute(&self.pool)
            .await?;
        }

        Ok(())
    }
}