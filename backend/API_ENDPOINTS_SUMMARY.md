# Backend API Endpoints Summary

## Overview
This document provides a comprehensive mapping of all backend REST API endpoints available for frontend integration in the Miowsis investment platform.

## Service Architecture
- **Base Path**: `/api`
- **Architecture**: Microservices with Spring Boot
- **Authentication**: Bearer token (JWT) in Authorization header
- **API Gateway**: All services accessed through central gateway

## Available Services

### 1. User Service (`/auth`)
Authentication and user management endpoints.

#### Endpoints:
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user
- `GET /auth/verify` - Verify token and get user info
- `POST /auth/verify-email/{token}` - Verify email address
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password

### 2. Portfolio Service (`/portfolios`)
Portfolio management and transaction handling.

#### Endpoints:
- `GET /portfolios/{userId}` - Get user portfolio
- `GET /portfolios/{userId}/holdings` - Get portfolio holdings (paginated)
- `GET /portfolios/{userId}/performance` - Get portfolio performance
- `POST /portfolios/{userId}/buy` - Buy securities
- `POST /portfolios/{userId}/sell` - Sell securities
- `POST /portfolios/{userId}/rebalance` - Rebalance portfolio
- `GET /portfolios/{userId}/transactions` - Get transaction history (paginated)
- `GET /portfolios/{userId}/allocation` - Get portfolio allocation
- `POST /portfolios/{userId}/round-up` - Process round-up investment

### 3. AI Service (`/ai`)
AI-powered features including chat, recommendations, and insights.

#### Endpoints:
- `POST /ai/chat` - Chat with AI assistant
- `POST /ai/chat/stream` - Stream chat response (Server-Sent Events)
- `GET /ai/portfolio/recommendations` - Get AI portfolio recommendations
- `POST /ai/portfolio/optimize` - Get portfolio optimization suggestions
- `GET /ai/insights/market` - Get AI-generated market insights
- `GET /ai/insights/esg-trends` - Get ESG market trends
- `POST /ai/analyze/company` - Get AI analysis of specific company
- `POST /ai/goals/advice` - Get personalized investment advice
- `POST /ai/education/explain` - Explain financial concepts

## Missing Services (Need Implementation)
1. **Market Data Service**: Real-time market data endpoints
2. **Transaction Service**: Complex transaction management (currently in portfolio-service)
3. **ESG Service**: ESG data access endpoints (service exists but no REST controller)

## Technical Notes
- **Reactive Programming**: AI service uses Mono/Flux for async operations
- **Streaming**: Chat endpoint supports Server-Sent Events for real-time responses
- **Pagination**: Portfolio endpoints support Spring Pageable parameters
- **User ID Header**: AI service uses `X-User-Id` header for user identification

## Frontend Integration Guide
1. All endpoints require authentication except public auth endpoints
2. Include Bearer token in Authorization header
3. User ID should be passed as path parameter for portfolio endpoints
4. AI endpoints use X-User-Id header instead of path parameter
5. Handle reactive streams for AI chat streaming endpoint
6. Implement proper error handling for all endpoints
7. Support pagination for list endpoints

## Data Transfer Objects (DTOs)
Key request/response objects:
- `AuthResponse`: Contains user info and tokens
- `RegisterRequest`: User registration data with validation
- `ChatRequest`: AI chat message with optional context
- `PortfolioDto`: Complete portfolio information
- `TransactionDto`: Transaction details
- `HoldingDto`: Individual holding information

For detailed API documentation, refer to the Swagger/OpenAPI specification available at `/swagger-ui.html` when services are running.