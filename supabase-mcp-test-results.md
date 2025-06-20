# Supabase MCP Test Results

## Test Summary

### ✅ Working Features (No Auth Required)
- **Documentation Search**: GraphQL API for searching Supabase documentation
- **Error Lookup**: Query error codes by service (AUTH, REALTIME, STORAGE)

### ❌ Features Requiring Authentication
Most Supabase MCP features require authentication via `SUPABASE_ACCESS_TOKEN`. The token needs to be provided when starting the MCP server, not just exported as an environment variable afterward.

## Documentation Search Examples

### 1. Basic Search
```graphql
query {
  searchDocs(query: "authentication", limit: 3) {
    nodes {
      title
      href
      content
    }
  }
}
```

### 2. Search with Subsections
```graphql
query {
  searchDocs(query: "edge functions", limit: 2) {
    nodes {
      title
      href
      ... on Guide {
        subsections {
          nodes {
            title
            content
          }
        }
      }
    }
  }
}
```

### 3. Error Code Lookup
```graphql
query {
  errors(service: AUTH, first: 3) {
    nodes {
      code
      message
      httpStatusCode
    }
  }
}
```

## Authentication Setup

To use authenticated features, the MCP server needs to be started with the access token:

```bash
# When starting the MCP server
mcp-server-supabase --access-token sbp_55198460e7d5f1b0d5b9f97f1edde327658772fa

# Or via environment variable before starting
export SUPABASE_ACCESS_TOKEN="sbp_55198460e7d5f1b0d5b9f97f1edde327658772fa"
```

## Available MCP Tools

- `list_organizations` - List all organizations
- `get_organization` - Get organization details
- `list_projects` - List all projects
- `get_project` - Get project details
- `create_project` - Create new project
- `list_tables` - List database tables
- `execute_sql` - Execute SQL queries
- `apply_migration` - Apply database migrations
- `list_edge_functions` - List edge functions
- `deploy_edge_function` - Deploy edge functions
- `get_logs` - Get service logs
- `create_branch` - Create development branch
- `search_docs` - Search documentation (no auth required)

## Security Note

The access token `sbp_55198460e7d5f1b0d5b9f97f1edde327658772fa` is a sensitive credential. Please:
- Never commit it to version control
- Rotate it regularly
- Use environment variables or secure credential management