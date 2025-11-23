# Coolify Health Check Template Error Fix

## Error
```
template parsing error: template: :1:13: executing "" at <.State.Health.Status>: map has no entry for key "Health"
```

## Cause
Coolify is trying to read container health status, but the Dockerfile at commit 53d0f4a doesn't have a `HEALTHCHECK` instruction. Coolify's template is trying to access `.State.Health.Status` which doesn't exist.

## Solution
Add a simple healthcheck to the Dockerfile. This won't affect the database or any existing functionality.

## Quick Fix
Add this to the end of the Dockerfile (before CMD):

```dockerfile
# Health check for Coolify
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
```

Or use curl if available:
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1
```

## Alternative: Disable Health Check in Coolify
If you don't want to modify the Dockerfile, you can disable health check monitoring in Coolify's service settings.


