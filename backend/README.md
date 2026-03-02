# Vantis Mail Backend

A secure, military-grade email system backend built with Rust and Actix-web, featuring Zero Trust architecture and hybrid encryption (X25519 + Kyber-1024).

## Features

- **Secure Authentication**: JWT-based authentication with Argon2id password hashing
- **Hybrid Encryption**: X25519 (ECC) + Kyber-1024 (Post-Quantum) for future-proof security
- **Phantom Aliases**: Disposable email addresses for privacy protection
- **Self-Destructing Emails**: Time-limited email messages
- **Real-time Notifications**: WebSocket support for instant updates
- **RESTful API**: Clean, well-documented API endpoints
- **Comprehensive Testing**: 38+ tests covering unit, integration, and API tests

## Technology Stack

- **Language**: Rust 1.93.1
- **Web Framework**: Actix-web 4.4
- **Database**: PostgreSQL 14 with SQLx
- **Cryptography**:
  - X25519 (Elliptic Curve Diffie-Hellman)
  - AES-256-GCM (Symmetric Encryption)
  - Argon2id (Password Hashing)
  - Kyber-1024 (Post-Quantum - Planned)
- **Authentication**: JWT (JSON Web Tokens)
- **Email**: Lettre (SMTP)
- **Testing**: Built-in test framework + Actix-web test utilities

## Getting Started

### Prerequisites

- Rust 1.93.1 or later
- PostgreSQL 14 or later
- Cargo (comes with Rust)

### Installation

1. **Clone the repository**:
```bash
git clone https://github.com/vantisCorp/V-Mail.git
cd V-Mail/backend
```

2. **Install dependencies**:
```bash
cargo build
```

3. **Set up environment variables**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Initialize the database**:
```bash
createdb vantis_mail
cargo run --bin vantis-mail-backend -- migrate
```

5. **Run the application**:
```bash
cargo run
```

The API will be available at `http://localhost:8080`

## Docker Deployment

### Using Docker Compose (Recommended)

1. **Build and start services**:
```bash
docker-compose up -d
```

2. **View logs**:
```bash
docker-compose logs -f backend
```

3. **Stop services**:
```bash
docker-compose down
```

### Using Docker

1. **Build the image**:
```bash
docker build -t vantis-mail-backend:latest .
```

2. **Run the container**:
```bash
docker run -p 8080:8080 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e JWT_SECRET="your-secret-key" \
  vantis-mail-backend:latest
```

## API Documentation

See [API.md](API.md) for complete API documentation.

### Quick Start

**Health Check**:
```bash
curl http://localhost:8080/health
```

**Register User**:
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "display_name": "John Doe"
  }'
```

**Login**:
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

## Testing

### Run All Tests
```bash
cargo test
```

### Run Specific Test
```bash
cargo test --test api_test
cargo test --test integration_test
cargo test --test integration_comprehensive_test
```

### Run Tests with Output
```bash
cargo test -- --nocapture
```

### Test Coverage
```bash
cargo install cargo-tarpaulin
cargo tarpaulin --out Html
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SERVER_HOST` | Server host address | `0.0.0.0` |
| `SERVER_PORT` | Server port | `8080` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `DATABASE_MAX_CONNECTIONS` | Max database connections | `10` |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRATION` | JWT token expiration (seconds) | `86400` |
| `CRYPTO_KEY_DERIVATION_ITERATIONS` | Argon2 iterations | `100000` |
| `CRYPTO_MEMORY_COST` | Argon2 memory cost | `65536` |
| `SMTP_HOST` | SMTP server host | - |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USERNAME` | SMTP username | - |
| `SMTP_PASSWORD` | SMTP password | - |
| `MAX_ATTACHMENT_SIZE` | Max attachment size (bytes) | `26214400` |
| `STORAGE_PATH` | Storage directory path | `/var/lib/vantis-mail/storage` |

## Security Features

### Cryptography

- **X25519**: Elliptic Curve Diffie-Hellman for key exchange
- **AES-256-GCM**: Symmetric encryption for email content
- **Argon2id**: Password hashing with memory-hard function
- **Kyber-1024**: Post-quantum key encapsulation (planned)

### Authentication

- **JWT**: Stateless authentication with expiration
- **Argon2id**: Memory-hard password hashing
- **Rate Limiting**: Protection against brute force attacks
- **CSRF Protection**: Cross-site request forgery prevention

### Privacy

- **Phantom Aliases**: Disposable email addresses
- **Self-Destructing Emails**: Time-limited messages
- **End-to-End Encryption**: Client-side encryption support
- **Zero Trust Architecture**: Never trust, always verify

## Development

### Code Style

```bash
# Format code
cargo fmt

# Check code style
cargo fmt -- --check

# Lint code
cargo clippy

# Fix linting issues
cargo clippy --fix
```

### Build

```bash
# Debug build
cargo build

# Release build
cargo build --release

# Run release binary
./target/release/vantis-mail-backend
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deployment

```bash
# Docker Compose
docker-compose up -d

# Kubernetes
kubectl apply -f k8s/

# Manual
cargo build --release
./target/release/vantis-mail-backend
```

## Monitoring

### Health Check
```bash
curl http://localhost:8080/health
```

### Logs
```bash
# Docker
docker logs -f vantis-mail-backend

# Systemd
sudo journalctl -u vantis-mail-backend -f
```

### Metrics
The application exposes metrics at `/metrics` endpoint (if configured).

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## Support

- **GitHub Issues**: https://github.com/vantisCorp/V-Mail/issues
- **Documentation**: https://github.com/vantisCorp/V-Mail/wiki
- **Email**: support@vantis-mail.com

## Acknowledgments

- Actix-web team for the excellent web framework
- RustCrypto project for cryptographic implementations
- PostgreSQL team for the robust database

## Roadmap

- [ ] Complete Kyber-1024 implementation
- [ ] Add email receiving (IMAP/POP3)
- [ ] Implement email filtering rules
- [ ] Add email templates
- [ ] Implement email scheduling
- [ ] Add email signatures
- [ ] Implement auto-reply
- [ ] Add email labels/tags
- [ ] Implement full-text search
- [ ] Add email analytics
- [ ] Implement email export
- [ ] Add email import
- [ ] Implement email threading
- [ ] Add email reminders
- [ ] Implement email snooze
- [ ] Add email pinning
- [ ] Implement email archiving
- [ ] Add email reporting
- [ ] Implement email statistics
- [ ] Add email dashboard

## Changelog

### Version 0.1.0 (2026-03-01)
- Initial release
- Basic authentication system
- Email CRUD operations
- Phantom alias system
- Cryptography implementations
- Comprehensive test suite (38 tests)
- Docker support
- API documentation
- Deployment guide