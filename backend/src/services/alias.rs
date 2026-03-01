use anyhow::Result;
use base64::{Engine as _, engine::general_purpose};
use rand::Rng;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

/// Phantom alias service for generating and managing disposable email aliases
pub struct AliasService {
    domain: String,
    alias_length: usize,
    reserved_words: Vec<String>,
}

impl AliasService {
    /// Create a new alias service
    pub fn new(domain: String, alias_length: usize) -> Self {
        let reserved_words = vec![
            "admin".to_string(),
            "support".to_string(),
            "info".to_string(),
            "webmaster".to_string(),
            "postmaster".to_string(),
            "abuse".to_string(),
            "security".to_string(),
            "noreply".to_string(),
            "no-reply".to_string(),
            "root".to_string(),
        ];

        Self {
            domain,
            alias_length,
            reserved_words,
        }
    }

    /// Generate a new random phantom alias
    pub fn generate_alias(&self) -> Result<String> {
        let mut rng = rand::thread_rng();
        let chars: Vec<char> = "abcdefghijklmnopqrstuvwxyz0123456789".chars().collect();
        
        loop {
            let alias: String = (0..self.alias_length)
                .map(|_| chars[rng.gen_range(0..chars.len())])
                .collect();
            
            // Check if alias is reserved
            if !self.reserved_words.contains(&alias) {
                return Ok(format!("{}@{}", alias, self.domain));
            }
        }
    }

    /// Generate a memorable alias using words
    pub fn generate_memorable_alias(&self) -> Result<String> {
        let words = vec![
            "shadow", "ghost", "phantom", "specter", "wraith", "spirit", "echo",
            "whisper", "silence", "void", "mist", "fog", "haze", "dusk", "dawn",
            "ember", "spark", "flame", "blaze", "frost", "ice", "snow", "storm",
            "thunder", "lightning", "rain", "cloud", "sky", "star", "moon", "sun",
            "nova", "comet", "asteroid", "meteor", "galaxy", "nebula", "cosmos",
        ];
        
        let mut rng = rand::thread_rng();
        let word1 = words[rng.gen_range(0..words.len())];
        let word2 = words[rng.gen_range(0..words.len())];
        let number = rng.gen_range(10..999);
        
        Ok(format!("{}{}{}@{}", word1, word2, number, self.domain))
    }

    /// Generate a time-limited alias
    pub fn generate_timed_alias(&self, hours: u32) -> Result<TimedAlias> {
        let alias = self.generate_alias()?;
        let expires_at = chrono::Utc::now() + chrono::Duration::hours(hours as i64);
        
        Ok(TimedAlias {
            alias,
            expires_at,
            hours,
        })
    }

    /// Generate a reverse alias for replying
    pub fn generate_reverse_alias(&self, original_email: &str, user_id: Uuid) -> Result<String> {
        let mut rng = rand::thread_rng();
        let chars: Vec<char> = "abcdefghijklmnopqrstuvwxyz0123456789".chars().collect();
        
        let random_part: String = (0..16)
            .map(|_| chars[rng.gen_range(0..chars.len())])
            .collect();
        
        let encoded_user = general_purpose::STANDARD.encode(user_id.to_string());
        let encoded_email = general_purpose::STANDARD.encode(original_email);
        
        Ok(format!("{}-{}-{}@{}", random_part, encoded_user, encoded_email, self.domain))
    }

    /// Parse a reverse alias to get original email and user ID
    pub fn parse_reverse_alias(&self, alias: &str) -> Result<ReverseAliasInfo> {
        let parts: Vec<&str> = alias.split('@').collect();
        if parts.len() != 2 {
            return Err(anyhow::anyhow!("Invalid alias format"));
        }
        
        let local_part = parts[0];
        let local_parts: Vec<&str> = local_part.split('-').collect();
        
        if local_parts.len() != 3 {
            return Err(anyhow::anyhow!("Invalid reverse alias format"));
        }
        
        let encoded_user = local_parts[1];
        let encoded_email = local_parts[2];
        
        let user_id_bytes = general_purpose::STANDARD.decode(encoded_user)
            .map_err(|e| anyhow::anyhow!("Failed to decode user ID: {}", e))?;
        let user_id_str = String::from_utf8(user_id_bytes)
            .map_err(|e| anyhow::anyhow!("Invalid user ID UTF-8: {}", e))?;
        let user_id = Uuid::parse_str(&user_id_str)
            .map_err(|e| anyhow::anyhow!("Invalid user ID: {}", e))?;
        
        let original_email_bytes = general_purpose::STANDARD.decode(encoded_email)
            .map_err(|e| anyhow::anyhow!("Failed to decode email: {}", e))?;
        let original_email = String::from_utf8(original_email_bytes)
            .map_err(|e| anyhow::anyhow!("Invalid email UTF-8: {}", e))?;
        
        Ok(ReverseAliasInfo {
            user_id,
            original_email,
        })
    }

    /// Validate an alias format
    pub fn validate_alias(&self, alias: &str) -> Result<bool> {
        let parts: Vec<&str> = alias.split('@').collect();
        if parts.len() != 2 {
            return Ok(false);
        }
        
        let local_part = parts[0];
        let domain = parts[1];
        
        // Check domain
        if domain != self.domain {
            return Ok(false);
        }
        
        // Check local part length
        if local_part.len() < 3 || local_part.len() > 64 {
            return Ok(false);
        }
        
        // Check for reserved words
        if self.reserved_words.contains(&local_part.to_string()) {
            return Ok(false);
        }
        
        // Check characters
        if !local_part.chars().all(|c| c.is_alphanumeric() || c == '-' || c == '_') {
            return Ok(false);
        }
        
        Ok(true)
    }

    /// Check if an alias is expired
    pub fn is_alias_expired(&self, expires_at: Option<chrono::DateTime<chrono::Utc>>) -> bool {
        match expires_at {
            Some(expiry) => expiry < chrono::Utc::now(),
            None => false,
        }
    }

    /// Generate alias statistics
    pub fn generate_alias_stats(&self, total_aliases: usize, active_aliases: usize) -> AliasStats {
        AliasStats {
            total_aliases,
            active_aliases,
            expired_aliases: total_aliases - active_aliases,
            usage_rate: if total_aliases > 0 {
                (active_aliases as f64 / total_aliases as f64) * 100.0
            } else {
                0.0
            },
        }
    }
}

/// Time-limited alias information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimedAlias {
    pub alias: String,
    pub expires_at: chrono::DateTime<chrono::Utc>,
    pub hours: u32,
}

/// Reverse alias information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReverseAliasInfo {
    pub user_id: Uuid,
    pub original_email: String,
}

/// Alias statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AliasStats {
    pub total_aliases: usize,
    pub active_aliases: usize,
    pub expired_aliases: usize,
    pub usage_rate: f64,
}

/// Domain management service
pub struct DomainService {
    domains: HashMap<String, DomainConfig>,
}

impl DomainService {
    /// Create a new domain service
    pub fn new() -> Self {
        Self {
            domains: HashMap::new(),
        }
    }

    /// Add a domain
    pub fn add_domain(&mut self, domain: String, config: DomainConfig) {
        self.domains.insert(domain, config);
    }

    /// Get domain configuration
    pub fn get_domain(&self, domain: &str) -> Option<&DomainConfig> {
        self.domains.get(domain)
    }

    /// Remove a domain
    pub fn remove_domain(&mut self, domain: &str) -> bool {
        self.domains.remove(domain).is_some()
    }

    /// List all domains
    pub fn list_domains(&self) -> Vec<String> {
        self.domains.keys().cloned().collect()
    }

    /// Check if domain is active
    pub fn is_domain_active(&self, domain: &str) -> bool {
        match self.domains.get(domain) {
            Some(config) => config.is_active,
            None => false,
        }
    }
}

impl Default for DomainService {
    fn default() -> Self {
        Self::new()
    }
}

/// Domain configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DomainConfig {
    pub domain: String,
    pub is_active: bool,
    pub dkim_enabled: bool,
    pub spf_enabled: bool,
    pub dmarc_enabled: bool,
    pub dnssec_enabled: bool,
    pub max_aliases_per_user: u32,
    pub alias_expiry_hours: Option<u32>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_alias() {
        let service = AliasService::new("vantis-mail.com".to_string(), 12);
        let alias = service.generate_alias().unwrap();
        assert!(alias.ends_with("@vantis-mail.com"));
        assert!(alias.len() > 12);
    }

    #[test]
    fn test_generate_memorable_alias() {
        let service = AliasService::new("vantis-mail.com".to_string(), 12);
        let alias = service.generate_memorable_alias().unwrap();
        assert!(alias.ends_with("@vantis-mail.com"));
    }

    #[test]
    fn test_generate_timed_alias() {
        let service = AliasService::new("vantis-mail.com".to_string(), 12);
        let timed_alias = service.generate_timed_alias(24).unwrap();
        assert!(timed_alias.hours == 24);
        assert!(timed_alias.expires_at > chrono::Utc::now());
    }

    #[test]
    fn test_validate_alias() {
        let service = AliasService::new("vantis-mail.com".to_string(), 12);
        
        // Valid alias
        assert!(service.validate_alias("test123@vantis-mail.com").unwrap());
        
        // Invalid domain
        assert!(!service.validate_alias("test123@other.com").unwrap());
        
        // Reserved word
        assert!(!service.validate_alias("admin@vantis-mail.com").unwrap());
    }

    #[test]
    fn test_domain_service() {
        let mut service = DomainService::new();
        
        let config = DomainConfig {
            domain: "vantis-mail.com".to_string(),
            is_active: true,
            dkim_enabled: true,
            spf_enabled: true,
            dmarc_enabled: true,
            dnssec_enabled: true,
            max_aliases_per_user: 10,
            alias_expiry_hours: Some(24),
        };
        
        service.add_domain("vantis-mail.com".to_string(), config);
        assert!(service.is_domain_active("vantis-mail.com"));
        assert_eq!(service.list_domains().len(), 1);
    }
}
