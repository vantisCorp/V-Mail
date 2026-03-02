use anyhow::Result;
use rand::rngs::OsRng;
use x25519_dalek::{PublicKey, StaticSecret};

/// X25519 key pair for key exchange
#[derive(Debug, Clone)]
pub struct KeyPair {
    pub secret: StaticSecret,
    pub public: PublicKey,
}

impl KeyPair {
    /// Generate a new X25519 key pair
    pub fn generate() -> Self {
        let secret = StaticSecret::new(OsRng);
        let public = PublicKey::from(&secret);
        KeyPair { secret, public }
    }

    /// Get the public key as bytes
    pub fn public_key_bytes(&self) -> [u8; 32] {
        self.public.to_bytes()
    }

    /// Derive shared secret from our secret and their public key
    pub fn derive_shared_secret(&self, their_public: &PublicKey) -> [u8; 32] {
        self.secret.diffie_hellman(their_public).to_bytes()
    }

    /// Derive shared secret from public key bytes
    pub fn derive_shared_secret_from_bytes(&self, their_public_bytes: &[u8]) -> Result<[u8; 32]> {
        if their_public_bytes.len() != 32 {
            return Err(anyhow::anyhow!("Invalid public key length"));
        }
        
        let mut bytes = [0u8; 32];
        bytes.copy_from_slice(their_public_bytes);
        let their_public = PublicKey::from(bytes);
        
        Ok(self.derive_shared_secret(&their_public))
    }
}

/// Create a public key from bytes
pub fn public_key_from_bytes(bytes: &[u8]) -> Result<PublicKey> {
    if bytes.len() != 32 {
        return Err(anyhow::anyhow!("Invalid public key length"));
    }
    
    let mut key_bytes = [0u8; 32];
    key_bytes.copy_from_slice(bytes);
    Ok(PublicKey::from(key_bytes))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_key_exchange() {
        let alice = KeyPair::generate();
        let bob = KeyPair::generate();

        let alice_shared = alice.derive_shared_secret(&bob.public);
        let bob_shared = bob.derive_shared_secret(&alice.public);

        assert_eq!(alice_shared, bob_shared);
    }
}