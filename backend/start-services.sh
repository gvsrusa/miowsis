#!/bin/bash

# Start all MIOWSIS backend services

echo "Starting MIOWSIS Backend Services..."

# Set environment variables
export SPRING_PROFILES_ACTIVE=local
export SPRING_CLOUD_CONFIG_ENABLED=false
export SPRING_CLOUD_CONFIG_IMPORT_CHECK_ENABLED=false
export EUREKA_CLIENT_ENABLED=false
export JWT_SECRET=mySecretKey123456789012345678901234567890
export OPENAI_API_KEY=${OPENAI_API_KEY:-your-api-key-here}

# Database configuration
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=miowsis
export DB_USER=postgres
export DB_PASSWORD=postgres

# Function to start a service
start_service() {
    SERVICE_NAME=$1
    SERVICE_PORT=$2
    
    echo "Starting $SERVICE_NAME on port $SERVICE_PORT..."
    cd /workspaces/miowsis/backend/$SERVICE_NAME
    
    # Kill any existing process on the port
    lsof -ti:$SERVICE_PORT | xargs kill -9 2>/dev/null || true
    
    # Start the service
    nohup gradle bootRun --args='--spring.profiles.active=local' > $SERVICE_NAME.log 2>&1 &
    
    echo "$SERVICE_NAME started with PID $!"
}

# Start services in order
start_service "api-gateway" 8080
sleep 5

start_service "user-service" 8081
sleep 5

start_service "portfolio-service" 8082
sleep 5

start_service "ai-service" 8083
sleep 5

start_service "esg-service" 8084

echo "All services started. Waiting for initialization..."
sleep 10

# Check service status
echo ""
echo "Service Status:"
echo "==============="
for port in 8080 8081 8082 8083 8084; do
    if lsof -i:$port > /dev/null 2>&1; then
        echo "Port $port: ✓ Service is running"
    else
        echo "Port $port: ✗ Service is not running"
    fi
done

echo ""
echo "PostgreSQL Status:"
docker ps | grep postgres

echo ""
echo "Logs are available in each service directory (*.log files)"