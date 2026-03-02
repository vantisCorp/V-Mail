use anyhow::Result;
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String, // User ID
    pub email: String,
    pub exp: i64,
    pub iat: i64,
}

pub struct JwtService {
    secret: String,
    expiration_hours: i64,
}

impl JwtService {
    pub fn new(secret: String, expiration_hours: i64) -> Self {
        Self {
            secret,
            expiration_hours,
        }
    }

    /// Generate a JWT token for a user
    pub fn generate_token(&self, user_id: Uuid, email: &str) -> Result<String> {
        let now = Utc::now();
        let exp = now + Duration::hours(self.expiration_hours);

        let claims = Claims {
            sub: user_id.to_string(),
            email: email.to_string(),
            exp: exp.timestamp(),
            iat: now.timestamp(),
        };

        encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.secret.as_ref()),
        )
        .map_err(|e| anyhow::anyhow!("Token generation failed: {}", e))
    }

    /// Validate a JWT token and return the claims
    pub fn validate_token(&self, token: &str) -> Result<Claims> {
        decode::<Claims>(
            token,
            &DecodingKey::from_secret(self.secret.as_ref()),
            &Validation::new(Algorithm::HS256),
        )
        .map(|data| data.claims)
        .map_err(|e| anyhow::anyhow!("Token validation failed: {}", e))
    }

    /// Extract user ID from token
    pub fn extract_user_id(&self, token: &str) -> Result<Uuid> {
        let claims = self.validate_token(token)?;
        Uuid::parse_str(&claims.sub)
            .map_err(|e| anyhow::anyhow!("Invalid user ID in token: {}", e))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_jwt_generation_and_validation() {
        let service = JwtService::new("test_secret".to_string(), 24);
        let user_id = Uuid::new_v4();
        let email = "test@example.com";

        let token = service.generate_token(user_id, email).unwrap();
        let claims = service.validate_token(&token).unwrap();

        assert_eq!(claims.sub, user_id.to_string());
        assert_eq!(claims.email, email);
    }
}