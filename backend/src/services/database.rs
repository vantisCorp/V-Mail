use anyhow::Result;
use sqlx::postgres::PgPoolOptions;
use crate::config::Config;

/// Create database connection pool
pub async fn create_pool(config: &Config) -> Result<sqlx::PgPool> {
    let pool = PgPoolOptions::new()
        .max_connections(config.database.max_connections)
        .connect(&config.database.url)
        .await?;

    Ok(pool)
}

/// Run database migrations
pub async fn run_migrations(pool: &sqlx::PgPool) -> Result<()> {
    // In production, use sqlx-cli for migrations
    // For now, we'll create tables directly
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            display_name VARCHAR(255),
            is_active BOOLEAN DEFAULT true,
            is_verified BOOLEAN DEFAULT false,
            two_factor_enabled BOOLEAN DEFAULT false,
            two_factor_secret VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            last_login TIMESTAMP WITH TIME ZONE
        )
        "#,
    )
    .execute(pool)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS folders (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            icon VARCHAR(50) NOT NULL,
            is_system BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, name)
        )
        "#,
    )
    .execute(pool)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS emails (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            folder_id UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
            from_email VARCHAR(255) NOT NULL,
            from_name VARCHAR(255),
            to_email VARCHAR(255) NOT NULL,
            cc_email VARCHAR(255),
            bcc_email VARCHAR(255),
            subject TEXT NOT NULL,
            body TEXT NOT NULL,
            body_html TEXT,
            is_encrypted BOOLEAN DEFAULT false,
            has_attachments BOOLEAN DEFAULT false,
            is_read BOOLEAN DEFAULT false,
            is_starred BOOLEAN DEFAULT false,
            phantom_alias VARCHAR(255),
            self_destruct_at TIMESTAMP WITH TIME ZONE,
            received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
        "#,
    )
    .execute(pool)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS attachments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
            filename VARCHAR(255) NOT NULL,
            content_type VARCHAR(100) NOT NULL,
            file_size BIGINT NOT NULL,
            file_path VARCHAR(500) NOT NULL,
            is_encrypted BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
        "#,
    )
    .execute(pool)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS phantom_aliases (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            alias_email VARCHAR(255) UNIQUE NOT NULL,
            domain VARCHAR(255) NOT NULL,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            expires_at TIMESTAMP WITH TIME ZONE
        )
        "#,
    )
    .execute(pool)
    .await?;

    Ok(())
}