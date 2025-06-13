# MIOwSIS Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### 1. Prerequisites Check
Ensure you have the following installed:
- Node.js 18+ (`node --version`)
- Java 17+ (`java -version`)
- Docker (`docker --version`)

### 2. Quick Setup
```bash
# Clone and navigate to project
cd miowsis

# Run automated setup
./scripts/setup.sh

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your configurations
```

### 3. Start Development
```bash
# Start all services
npm run dev

# Or start individually:
# Frontend only: cd frontend && npm run dev
# Backend only: cd backend && ./gradlew bootRun
```

### 4. Access the Application
- Frontend: http://localhost:3000
- API Gateway: http://localhost:8080
- API Documentation: http://localhost:8080/swagger-ui.html

## 🧪 Running Tests

```bash
# Run all tests
./scripts/test.sh

# Or run individually:
# Frontend: cd frontend && npm test
# Backend: cd backend && ./gradlew test
```

## 📱 Key Features to Test

1. **User Registration**
   - Navigate to http://localhost:3000/register
   - Create a new account with email and password
   - Complete the onboarding flow

2. **Authentication**
   - Login with your credentials
   - Test biometric authentication (if supported)
   - Verify JWT token in browser DevTools

3. **Dashboard**
   - View portfolio overview
   - Check ESG impact scores
   - Explore investment opportunities

4. **Micro-Investments**
   - Set up round-up rules
   - Simulate purchases to test round-up
   - View investment history

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Find and kill process using port 3000
   lsof -ti:3000 | xargs kill -9
   ```

2. **Database connection failed**
   ```bash
   # Ensure Docker containers are running
   docker-compose ps
   docker-compose up -d
   ```

3. **Build failures**
   ```bash
   # Clean and rebuild
   npm run clean
   npm install
   npm run build
   ```

## 📚 Next Steps

1. Read the full [README.md](README.md) for detailed documentation
2. Check [API Documentation](http://localhost:8080/swagger-ui.html)
3. Review the [PRD.md](../PRD.md) for product requirements
4. Join our development Slack channel

## 🤝 Getting Help

- Check existing issues on GitHub
- Contact the development team
- Review logs in `logs/` directory

Happy coding! 🎉