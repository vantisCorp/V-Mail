use serde::Deserialize;
use std::env;

#[derive(Debug, Deserialize, Clone)]
pub struct Config {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub jwt: JwtConfig,
    pub crypto: CryptoConfig,
    pub email: EmailConfig,
}

#[derive(Debug, Deserialize, Clone)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
}

#[derive(Debug, Deserialize, Clone)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
}

#[derive(Debug, Deserialize, Clone)]
pub struct JwtConfig {
    pub secret: String,
    pub expiration: u64,
}

#[derive(Debug, Deserialize, Clone)]
pub struct CryptoConfig {
    pub key_derivation_iterations: u32,
    pub memory_cost: u32,
}

#[derive(Debug, Deserialize, Clone)]
pub struct EmailConfig {
    pub smtp_host: String,
    pub smtp_port: u16,
    pub smtp_username: String,
    pub smtp_password: String,
    pub max_attachment_size: usize,
}

impl Config {
    pub fn from_env() -> anyhow::Result<Self> {
        dotenv::dotenv().ok();

        Ok(Config {
            server: ServerConfig {
                host: env::var("SERVER_HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
                port: env::var("SERVER_PORT")
                    .unwrap_or_else(|_| "8080".to_string())
                    .parse()?,
            },
            database: DatabaseConfig {
                url: env::var("DATABASE_URL")
                    .unwrap_or_else(|_| "postgresql://localhost/vantis_mail".to_string()),
                max_connections: env::var("DB_MAX_CONNECTIONS")
                    .unwrap_or_else(|_| "10".to_string())
                    .parse()?,
            },
            jwt: JwtConfig {
                secret: env::var("JWT_SECRET").expect("JWT_SECRET must be set"),
                expiration: env::var("JWT_EXPIRATION")
                    .unwrap_or_else(|_| "86400".to_string())
                    .parse()?,
            },
            crypto: CryptoConfig {
                key_derivation_iterations: env::var("KEY_DERIVATION_ITERATIONS")
                    .unwrap_or_else(|_| "100000".to_string())
                    .parse()?,
                memory_cost: env::var("MEMORY_COST")
                    .unwrap_or_else(|_| "65536".to_string())
                    .parse()?,
            },
            email: EmailConfig {
                smtp_host: env::var("SMTP_HOST").unwrap_or_else(|_| "localhost".to_string()),
                smtp_port: env::var("SMTP_PORT")
                    .unwrap_or_else(|_| "587".to_string())
                    .parse()?,
                smtp_username: env::var("SMTP_USERNAME").unwrap_or_else(|_| "".to_string()),
                smtp_password: env::var("SMTP_PASSWORD").unwrap_or_else(|_| "".to_string()),
                max_attachment_size: env::var("MAX_ATTACHMENT_SIZE")
                    .unwrap_or_else(|_| "26214400".to_string())
                    .parse()?,
            },
        })
    }
}