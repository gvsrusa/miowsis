# MIOwSIS Test Environment Setup Guide

## 🔧 Test Environment Preparation Summary

### 1. Database Setup

#### Primary Database (PostgreSQL)
- **Type**: PostgreSQL 15 Alpine
- **Port**: 5432
- **Database**: miowsis
- **Username**: postgres
- **Password**: postgres
- **Docker Service**: postgres:15-alpine

#### Additional Databases
- **MongoDB**: Port 27017, Database: miowsis_documents
- **TimescaleDB**: Port 5433, Database: miowsis_timeseries
- **Neo4j**: Ports 7474/7687, Username: neo4j
- **Redis**: Port 6379
- **Kafka**: Port 9092 (with Zookeeper on 2181)

### 2. Service Configuration

| Service | Port | Profile | Status |
|---------|------|---------|--------|
| API Gateway | 8080 | local | Required |
| User Service | 8081 | local | Required |
| Portfolio Service | 8082 | local | Required |
| AI Service | 8083 | local | Required |
| ESG Service | 8084 | local | Required |

### 3. Environment Variables

#### Required Variables
```bash
export DATABASE_URL=jdbc:postgresql://localhost:5432/miowsis
export DATABASE_USERNAME=postgres
export DATABASE_PASSWORD=postgres
export JWT_SECRET=mySecretKey123456789012345678901234567890
export SPRING_PROFILES_ACTIVE=local
export OPENAI_API_KEY=your-api-key-here
```

#### Optional Variables
```bash
export KAFKA_BOOTSTRAP_SERVERS=localhost:9092
export REDIS_HOST=localhost
export REDIS_PORT=6379
```

### 4. Test Users

#### Existing Test Users (from previous test runs)
1. **john.doe@example.com** - Created via User Service
   - User ID: 416d8f98-825b-46b8-aca8-eabdb386cf06

2. **jane.smith@example.com** - Created via API Gateway
   - User ID: 6f9dd5b9-77e1-4e1a-bff7-14aa8e7eb386

3. **test.gateway@example.com** - Created via API Gateway
   - User ID: c58b8dcc-0688-4aef-a682-271c06082ab6

#### Test User Template (for new users)
```json
{
  "email": "test@example.com",
  "password": "SecurePass123!",
  "firstName": "Test",
  "lastName": "User"
}
```

### 5. Password Requirements
- Pattern: `^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=]).*$`
- Requirements:
  - At least one digit
  - At least one lowercase letter
  - At least one uppercase letter
  - At least one special character from: @#$%^&+=

### 6. Startup Procedure

#### Option 1: Using Docker Compose
```bash
cd /workspaces/miowsis
docker-compose up -d
```

#### Option 2: Using Startup Script
```bash
cd /workspaces/miowsis/backend
./start-services.sh
```

The startup script will:
- Kill existing processes on service ports
- Start services in order with delays
- Check service status
- Create log files for each service

### 7. Frontend Configuration

Create a `.env` file in the frontend directory:
```env
VITE_API_BASE_URL=http://localhost:8080
VITE_API_TIMEOUT=30000
VITE_USE_MOCK=false
VITE_ENABLE_AI_ASSISTANT=true
VITE_ENABLE_BIOMETRIC_AUTH=true
VITE_ENABLE_ROUND_UP=true
VITE_WS_URL=ws://localhost:8080/ws
VITE_DEBUG_MODE=false
```

### 8. Test Configuration Notes

#### Application Test Profile
- Location: `/backend/user-service/src/main/resources/application-test.yml`
- Features:
  - Eureka disabled
  - Kafka disabled for testing
  - Flyway enabled
  - JPA DDL auto-validate mode

#### Application Local Profile
- JPA DDL auto-update mode (creates tables automatically)
- Eureka disabled
- Cloud config disabled

### 9. Database Schema
- **Automatic Creation**: Tables are created automatically via Hibernate/JPA
- **DDL Mode**: `update` for local profile (creates/updates tables)
- **No Seed Data**: No SQL seed files found; test data must be created via API

### 10. Quick Test Commands

#### Check Service Health
```bash
# Check if all services are running
for port in 8080 8081 8082 8083 8084; do
    if lsof -i:$port > /dev/null 2>&1; then
        echo "Port $port: ✓ Service is running"
    else
        echo "Port $port: ✗ Service is not running"
    fi
done
```

#### Check Database Connection
```bash
# Test PostgreSQL connection
docker exec -it miowsis-postgres-1 psql -U postgres -d miowsis -c "\dt"
```

#### View Service Logs
```bash
# View logs for a specific service
tail -f /workspaces/miowsis/backend/{service-name}/{service-name}.log
```

## 🚀 Ready for Testing
With this setup, the test environment is ready for:
- API testing
- Integration testing
- End-to-end testing with Playwright
- Performance testing
- Security testing

All necessary infrastructure is configured and test users are available for authentication flows.