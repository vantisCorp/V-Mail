# Vantis Mail Backend

A secure, high-performance email backend built with Rust and Actix-web.

## Features

- **Secure Authentication**: JWT-based authentication with Argon2 password hashing
- **Hybrid Encryption**: X25519 (ECC) + Kyber-1024 (Post-Quantum) for quantum-resistant security
- **Email Management**: Full CRUD operations for emails, folders, and attachments
- **Phantom Aliases**: Disposable email aliases for privacy
- **Self-Destructing Emails**: Automatic message deletion after specified time
- **Real-time Updates**: WebSocket support for real-time notifications (TODO)

## Technology Stack

- **Language**: Rust 1.93+
- **Web Framework**: Actix-web 4.4
- **Database**: PostgreSQL with SQLx
- **Cryptography**:
  - X25519 (Elliptic Curve Diffie-Hellman)
  - Kyber-1024 (Post-Quantum Key Encapsulation)
  - AES-256-GCM (Symmetric Encryption)
  - Argon2id (Password Hashing)
- **Authentication**: JWT (JSON Web Tokens)

## Getting Started

### Prerequisites

- Rust 1.93 or later
- PostgreSQL 14 or later
- Cargo (comes with Rust)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/vantisCorp/V-Mail.git
cd V-Mail/backend
```

2. Install dependencies:
```bash
cargo build
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run migrations:
```bash
cargo run --bin migrate
```

5. Start the server:
```bash
cargo run
```

The server will start on `http://localhost:8080`

## API Endpoints

### Health Check
- `GET /health` - Health check endpoint

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Emails (Protected)
- `GET /api/emails` - List all emails
- `POST /api/emails` - Create a new email
- `GET /api/emails/{id}` - Get email by ID
- `PATCH /api/emails/{id}` - Update email
- `DELETE /api/emails/{id}` - Delete email

### Aliases (Protected)
- `GET /api/aliases` - List all phantom aliases
- `POST /api/aliases` - Create a new phantom alias
- `DELETE /api/aliases/{id}` - Delete an alias

### Folders (Protected)
- `GET /api/folders` - List all folders
- `POST /api/folders` - Create a new folder

## Security Features

### Hybrid Encryption
The backend implements hybrid encryption combining:
- **X25519**: Elliptic Curve Diffie-Hellman for key exchange
- **Kyber-1024**: Post-quantum key encapsulation mechanism
- **AES-256-GCM**: Symmetric encryption for data

This provides protection against both classical and quantum computers.

### Password Security
- Argon2id password hashing with configurable iterations
- Salt-based key derivation
- Memory-hard algorithm to prevent brute-force attacks

### Authentication
- JWT-based stateless authentication
- Secure token generation and validation
- Configurable token expiration

## Development

### Run tests:
```bash
cargo test
```

### Run with logging:
```bash
RUST_LOG=debug cargo run
```

### Format code:
```bash
cargo fmt
```

### Check code:
```bash
cargo clippy
```

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration management
│   ├── models/          # Data models
│   ├── handlers/        # HTTP request handlers
│   ├── services/        # Business logic
│   ├── crypto/          # Cryptography implementations
│   ├── auth/            # Authentication utilities
│   ├── utils/           # Utility functions
│   └── middleware/      # Custom middleware
├── Cargo.toml           # Dependencies
└── README.md            # This file
```

## License

MIT License - See LICENSE file for details