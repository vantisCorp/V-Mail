# Vantis Mail Backend - Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Docker Deployment](#docker-deployment)
4. [Kubernetes Deployment](#kubernetes-deployment)
5. [Manual Deployment](#manual-deployment)
6. [Monitoring](#monitoring)
7. [Backup Procedures](#backup-procedures)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Rust**: 1.93.1 or later
- **PostgreSQL**: 14 or later
- **Docker**: 20.10 or later (for containerized deployment)
- **Docker Compose**: 2.0 or later
- **Kubernetes**: 1.24 or later (for K8s deployment)

### System Requirements
- **CPU**: 2 cores minimum, 4 cores recommended
- **RAM**: 4GB minimum, 8GB recommended
- **Disk**: 20GB minimum, 50GB recommended
- **Network**: Stable internet connection

---

## Environment Setup

### 1. Clone the Repository
```bash
git clone https://github.com/vantisCorp/V-Mail.git
cd V-Mail/backend
```

### 2. Install Dependencies
```bash
cargo build --release
```

### 3. Configure Environment Variables
Create a `.env` file in the backend directory:

```bash
# Server Configuration
SERVER_HOST=0.0.0.0
SERVER_PORT=8080

# Database Configuration
DATABASE_URL=postgresql://vantis_mail:secure_password@localhost:5432/vantis_mail
DATABASE_MAX_CONNECTIONS=10

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=86400

# Cryptography Configuration
CRYPTO_KEY_DERIVATION_ITERATIONS=100000
CRYPTO_MEMORY_COST=65536

# Email Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=your-smtp-username
SMTP_PASSWORD=your-smtp-password
MAX_ATTACHMENT_SIZE=26214400

# Storage Configuration
STORAGE_PATH=/var/lib/vantis-mail/storage
```

### 4. Initialize Database
```bash
# Create database
createdb vantis_mail

# Run migrations
cargo run --bin vantis-mail-backend -- migrate
```

---

## Docker Deployment

### Build Docker Image
```bash
docker build -t vantis-mail-backend:latest .
```

### Run with Docker Compose
Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    container_name: vantis-mail-db
    environment:
      POSTGRES_DB: vantis_mail
      POSTGRES_USER: vantis_mail
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U vantis_mail"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    image: vantis-mail-backend:latest
    container_name: vantis-mail-backend
    environment:
      SERVER_HOST: 0.0.0.0
      SERVER_PORT: 8080
      DATABASE_URL: postgresql://vantis_mail:secure_password@postgres:5432/vantis_mail
      DATABASE_MAX_CONNECTIONS: 10
      JWT_SECRET: your-super-secret-jwt-key-change-this-in-production
      JWT_EXPIRATION: 86400
      CRYPTO_KEY_DERIVATION_ITERATIONS: 100000
      CRYPTO_MEMORY_COST: 65536
      SMTP_HOST: smtp.example.com
      SMTP_PORT: 587
      SMTP_USERNAME: your-smtp-username
      SMTP_PASSWORD: your-smtp-password
      MAX_ATTACHMENT_SIZE: 26214400
      STORAGE_PATH: /app/storage
    ports:
      - "8080:8080"
    volumes:
      - storage_data:/app/storage
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

volumes:
  postgres_data:
  storage_data:
```

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
docker-compose logs -f backend
```

---

## Kubernetes Deployment

### Create Namespace
```bash
kubectl create namespace vantis-mail
```

### Create Secrets
```bash
kubectl create secret generic vantis-mail-secrets \
  --from-literal=database-url="postgresql://vantis_mail:secure_password@postgres:5432/vantis_mail" \
  --from-literal=jwt-secret="your-super-secret-jwt-key-change-this-in-production" \
  --from-literal=smtp-password="your-smtp-password" \
  -n vantis-mail
```

### Deploy PostgreSQL
Create `postgres-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: vantis-mail
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:14-alpine
        env:
        - name: POSTGRES_DB
          value: vantis_mail
        - name: POSTGRES_USER
          value: vantis_mail
        - name: POSTGRES_PASSWORD
          value: secure_password
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: vantis-mail
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: vantis-mail
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

### Deploy Backend
Create `backend-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vantis-mail-backend
  namespace: vantis-mail
spec:
  replicas: 3
  selector:
    matchLabels:
      app: vantis-mail-backend
  template:
    metadata:
      labels:
        app: vantis-mail-backend
    spec:
      containers:
      - name: backend
        image: vantis-mail-backend:latest
        ports:
        - containerPort: 8080
        env:
        - name: SERVER_HOST
          value: "0.0.0.0"
        - name: SERVER_PORT
          value: "8080"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: vantis-mail-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: vantis-mail-secrets
              key: jwt-secret
        - name: SMTP_PASSWORD
          valueFrom:
            secretKeyRef:
              name: vantis-mail-secrets
              key: smtp-password
        - name: STORAGE_PATH
          value: "/app/storage"
        volumeMounts:
        - name: storage
          mountPath: /app/storage
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
      volumes:
      - name: storage
        persistentVolumeClaim:
          claimName: storage-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: vantis-mail-backend
  namespace: vantis-mail
spec:
  selector:
    app: vantis-mail-backend
  ports:
  - port: 8080
    targetPort: 8080
  type: LoadBalancer
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: storage-pvc
  namespace: vantis-mail
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 20Gi
```

### Apply Deployments
```bash
kubectl apply -f postgres-deployment.yaml
kubectl apply -f backend-deployment.yaml
```

### Check Status
```bash
kubectl get pods -n vantis-mail
kubectl get services -n vantis-mail
```

---

## Manual Deployment

### Build Release
```bash
cargo build --release
```

### Run Binary
```bash
./target/release/vantis-mail-backend
```

### Run with Systemd
Create `/etc/systemd/system/vantis-mail-backend.service`:

```ini
[Unit]
Description=Vantis Mail Backend
After=network.target postgresql.service

[Service]
Type=simple
User=vantis-mail
Group=vantis-mail
WorkingDirectory=/opt/vantis-mail
Environment="RUST_LOG=info"
ExecStart=/opt/vantis-mail/target/release/vantis-mail-backend
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start service:
```bash
sudo systemctl enable vantis-mail-backend
sudo systemctl start vantis-mail-backend
sudo systemctl status vantis-mail-backend
```

---

## Monitoring

### Health Check
```bash
curl http://localhost:8080/health
```

### View Logs
```bash
# Docker
docker logs -f vantis-mail-backend

# Kubernetes
kubectl logs -f deployment/vantis-mail-backend -n vantis-mail

# Systemd
sudo journalctl -u vantis-mail-backend -f
```

### Metrics
The application exposes metrics at `/metrics` endpoint (if configured).

### Monitoring Tools
- **Prometheus**: For metrics collection
- **Grafana**: For visualization
- **Sentry**: For error tracking
- **New Relic**: For APM

---

## Backup Procedures

### Database Backup
```bash
# Backup
pg_dump -U vantis_mail vantis_mail > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
psql -U vantis_mail vantis_mail < backup_20260301_120000.sql
```

### Storage Backup
```bash
# Backup storage directory
tar -czf storage_backup_$(date +%Y%m%d_%H%M%S).tar.gz /var/lib/vantis-mail/storage

# Restore
tar -xzf storage_backup_20260301_120000.tar.gz -C /
```

### Automated Backups
Create a cron job for automated backups:

```bash
# Edit crontab
crontab -e

# Add backup job (daily at 2 AM)
0 2 * * * /opt/scripts/backup.sh
```

Create `/opt/scripts/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Database backup
pg_dump -U vantis_mail vantis_mail > $BACKUP_DIR/db_backup_$DATE.sql

# Storage backup
tar -czf $BACKUP_DIR/storage_backup_$DATE.tar.gz /var/lib/vantis-mail/storage

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

---

## Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -U vantis_mail -d vantis_mail -c "SELECT 1"

# Check logs
tail -f /var/log/postgresql/postgresql-14-main.log
```

#### Port Already in Use
```bash
# Find process using port 8080
lsof -i :8080

# Kill process
kill -9 <PID>
```

#### Out of Memory
```bash
# Check memory usage
free -h

# Check process memory
ps aux --sort=-%mem | head

# Increase swap space
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

#### High CPU Usage
```bash
# Check CPU usage
top

# Check Rust backtrace
RUST_BACKTRACE=1 ./target/release/vantis-mail-backend
```

### Debug Mode
Enable debug logging:
```bash
export RUST_LOG=debug
./target/release/vantis-mail-backend
```

### Performance Profiling
```bash
# CPU profiling
cargo flamegraph --bin vantis-mail-backend

# Memory profiling
valgrind --leak-check=full ./target/release/vantis-mail-backend
```

---

## Security Checklist

- [ ] Change default passwords
- [ ] Use strong JWT secrets
- [ ] Enable HTTPS/TLS
- [ ] Configure firewall rules
- [ ] Enable rate limiting
- [ ] Set up intrusion detection
- [ ] Regular security updates
- [ ] Security audit completed
- [ ] Penetration testing completed

---

## Support

For issues and questions:
- GitHub Issues: https://github.com/vantisCorp/V-Mail/issues
- Documentation: https://github.com/vantisCorp/V-Mail/wiki
- Email: support@vantis-mail.com

---

## License

MIT License - See LICENSE file for details