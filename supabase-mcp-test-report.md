# Supabase MCP Test Report

## Test Date: 2025-06-19

### Test Summary

✅ **Successfully tested**: 2/8 features  
❌ **Authentication required**: 6/8 features

### Working Features (No Authentication Required)

#### 1. Documentation Search ✅
Tested GraphQL queries for searching Supabase documentation:
- Basic search query for "authentication" returned 3 results
- Results included title, href, and content fields
- Total count functionality working

#### 2. Error Code Lookup ✅
Tested error code queries:
- Listed AUTH service errors (5 results from 83 total)
- Retrieved specific error code details (email_not_confirmed)
- All error fields returned properly (code, message, httpStatusCode, service)

### Features Requiring Authentication ❌

The following features failed with "Unauthorized" error due to missing MCP server authentication:
1. List organizations
2. List projects  
3. Get project details
4. List tables
5. Execute SQL query
6. Edge functions

### Authentication Issues

The MCP server requires proper authentication setup:
- Access token exists in .env: `sbp_55198460e7d5f1b0d5b9f97f1edde327658772fa`
- MCP server status shows as "Not running"
- Authentication needs to be configured when starting the MCP server

### Recommendations

1. **For authenticated features**: Start MCP server with proper authentication token
2. **For testing**: Continue using GraphQL documentation search and error lookup
3. **Security**: Ensure access token is properly secured and not committed to version control

### Test Queries Used

```graphql
# Documentation search
query {
  searchDocs(query: "authentication", limit: 3) {
    nodes {
      title
      href
      content
    }
    totalCount
  }
}

# Error listing
query {
  errors(service: AUTH, first: 5) {
    nodes {
      code
      message
      httpStatusCode
      service
    }
    totalCount
  }
}

# Specific error lookup
query {
  error(code: "email_not_confirmed", service: AUTH) {
    code
    message
    httpStatusCode
    service
  }
}
```