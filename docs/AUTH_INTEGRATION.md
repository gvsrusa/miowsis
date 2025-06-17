# Authentication Integration Documentation

## Overview
This document outlines the authentication integration between the frontend React application and the backend Spring Boot microservices.

## Frontend Configuration

### 1. Axios Interceptor Configuration
**Location**: `/workspaces/miowsis/frontend/src/config/axios.ts`

Features:
- Automatic JWT token attachment to all requests
- Token refresh on 401 errors
- Request queue management during token refresh
- Automatic logout on refresh failure

### 2. Auth Service
**Location**: `/workspaces/miowsis/frontend/src/services/authService.ts`

Endpoints:
- `POST /api/users/auth/login` - User login
- `POST /api/users/auth/register` - User registration
- `POST /api/users/auth/logout` - User logout
- `POST /api/users/auth/refresh` - Token refresh
- `GET /api/users/auth/verify` - Token verification

**Note**: Mock mode is now disabled (`USE_MOCK = false`)

### 3. Auth State Management
**Location**: `/workspaces/miowsis/frontend/src/store/slices/authSlice.ts`

Token Storage:
- `accessToken` - Stored in localStorage and Redux state
- `refreshToken` - Stored in localStorage and Redux state

### 4. Environment Configuration
**Location**: `/workspaces/miowsis/frontend/.env`

```env
VITE_API_URL=http://localhost:8080
VITE_ENV=development
```

### 5. Vite Proxy Configuration
**Location**: `/workspaces/miowsis/frontend/vite.config.ts`

```javascript
proxy: {
  '/api': {
    target: 'http://localhost:8080',
    changeOrigin: true,
    secure: false
  }
}
```

## Backend Configuration

### 1. Security Configuration
**Location**: `/workspaces/miowsis/backend/user-service/src/main/java/com/miowsis/user/config/SecurityConfig.java`

Features:
- JWT authentication filter
- CORS configuration for localhost:3000
- Stateless session management
- Public endpoints: `/auth/**`, `/swagger-ui/**`, `/actuator/health`

### 2. JWT Authentication Filter
**Location**: `/workspaces/miowsis/backend/user-service/src/main/java/com/miowsis/user/security/JwtAuthenticationFilter.java`

- Extracts JWT from `Authorization` header with `Bearer ` prefix
- Validates token and sets authentication context

### 3. Auth Controller
**Location**: `/workspaces/miowsis/backend/user-service/src/main/java/com/miowsis/user/controller/AuthController.java`

Base Path: `/auth`

Endpoints:
- `POST /register` - User registration
- `POST /login` - User login
- `POST /refresh` - Token refresh
- `POST /logout` - User logout
- `GET /verify` - Token verification
- `POST /verify-email/{token}` - Email verification
- `POST /forgot-password` - Password reset request
- `POST /reset-password` - Password reset

### 4. API Gateway Configuration
**Location**: `/workspaces/miowsis/backend/api-gateway`

- Port: 8080
- CORS Config: `/workspaces/miowsis/backend/api-gateway/src/main/java/com/miowsis/gateway/config/CorsConfig.java`

Routes:
- `/api/users/**` → `USER-SERVICE`
- `/api/ai/**` → `AI-SERVICE`
- `/api/portfolio/**` → `PORTFOLIO-SERVICE`
- `/api/trading/**` → `TRADING-SERVICE`
- `/api/esg/**` → `ESG-SERVICE`
- `/api/banking/**` → `BANKING-SERVICE`
- `/api/notifications/**` → `NOTIFICATION-SERVICE`
- `/api/analytics/**` → `ANALYTICS-SERVICE`

## Authentication Flow

1. **Login/Register**:
   - Frontend calls authService with credentials
   - Request uses configured axios instance with interceptors
   - Request proxied through Vite dev server to API Gateway (port 8080)
   - API Gateway routes to USER-SERVICE with CORS headers
   - JWT tokens returned and stored in localStorage and Redux state

2. **Authenticated Requests**:
   - Axios interceptor automatically adds `Authorization: Bearer {token}` header
   - Request routed through API Gateway to appropriate microservice
   - JWT validated by JwtAuthenticationFilter

3. **Token Refresh**:
   - 401 response triggers automatic token refresh
   - Failed requests queued during refresh
   - New token obtained using refresh token
   - Queued requests retried with new token
   - Failed refresh triggers logout and redirect to login

4. **Logout**:
   - Logout endpoint called with current token
   - Tokens removed from localStorage and Redux state
   - User redirected to login page

## Configuration Updates Made

1. Created axios interceptor configuration with automatic token handling
2. Updated authService to use configured axios instance
3. Added `@config` and `@store` aliases to Vite and TypeScript configurations
4. Created API Gateway CORS configuration for cross-origin requests
5. Disabled mock mode in authService to use real backend
6. Created environment configuration file for API URL

## Testing the Integration

1. Start the backend services:
   ```bash
   # Start Eureka server
   cd backend/eureka-server && ./mvnw spring-boot:run
   
   # Start User Service
   cd backend/user-service && ./mvnw spring-boot:run
   
   # Start API Gateway
   cd backend/api-gateway && ./mvnw spring-boot:run
   ```

2. Start the frontend:
   ```bash
   cd frontend && npm run dev
   ```

3. Test authentication flow:
   - Register a new user
   - Login with credentials
   - Make authenticated requests
   - Test token refresh by waiting for token expiry
   - Test logout functionality

## Troubleshooting

1. **CORS Issues**: Ensure API Gateway CORS configuration includes your frontend URL
2. **Token Not Attached**: Check axios interceptor is properly imported and configured
3. **401 Errors**: Verify JWT secret matches between services
4. **Proxy Issues**: Ensure Vite proxy configuration matches API Gateway port