use anyhow::Result;
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};

/// Hash a password using Argon2id
pub fn hash_password(password: &str) -> Result<String> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    
    let password_hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| anyhow::anyhow!("Password hashing failed: {}", e))?;
    
    Ok(password_hash.to_string())
}

/// Verify a password against a hash
pub fn verify_password(password: &str, hash: &str) -> Result<bool> {
    let parsed_hash = PasswordHash::new(hash)
        .map_err(|e| anyhow::anyhow!("Invalid password hash: {}", e))?;
    
    let argon2 = Argon2::default();
    
    match argon2.verify_password(password.as_bytes(), &parsed_hash) {
        Ok(()) => Ok(true),
        Err(argon2::password_hash::Error::Password) => Ok(false),
        Err(e) => Err(anyhow::anyhow!("Password verification failed: {}", e)),
    }
}

/// Derive a key from a password using Argon2id
pub fn derive_key(password: &str, salt: &[u8; 32], iterations: u32) -> Result<[u8; 32]> {
    use argon2::Algorithm;
    
    let params = argon2::Params::new(65536, 3, iterations, Some(32))
        .map_err(|e| anyhow::anyhow!("Invalid Argon2 parameters: {}", e))?;
    
    let argon2 = Argon2::new(Algorithm::Argon2id, argon2::Version::V0x13, params);
    
    let mut key = [0u8; 32];
    argon2
        .hash_password_into(password.as_bytes(), salt, &mut key)
        .map_err(|e| anyhow::anyhow!("Key derivation failed: {}", e))?;
    
    Ok(key)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_password_hashing() {
        let password = "secure_password_123";
        let hash = hash_password(password).unwrap();
        
        assert!(verify_password(password, &hash).unwrap());
        assert!(!verify_password("wrong_password", &hash).unwrap());
    }

    #[test]
    fn test_key_derivation() {
        let password = "master_password";
        let salt = [0u8; 32];
        let iterations = 100000;
        
        let key1 = derive_key(password, &salt, iterations).unwrap();
        let key2 = derive_key(password, &salt, iterations).unwrap();
        
        assert_eq!(key1, key2);
    }
}