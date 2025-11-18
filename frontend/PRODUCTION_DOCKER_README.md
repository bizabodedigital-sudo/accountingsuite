# Production Docker Build Guide

## Production Readiness ✅

The Dockerfile has been optimized for **production live environments**:

### Key Production Features:

1. **Multi-stage build** - Smaller final image (~200MB vs ~1GB)
2. **Standalone output** - Next.js bundles only what's needed
3. **Non-root user** - Runs as `nextjs` user for security
4. **Production-only dependencies** - Final image excludes devDependencies
5. **No debug logging** - Removed verbose output for production
6. **Environment variables** - Properly configured for Coolify build args

### Current Setup:

- **Node.js**: 20.x (LTS)
- **npm**: Latest from Node 20 image
- **Base Image**: `node:20-bullseye` (builder) → `node:20-bullseye-slim` (runner)

## Using pnpm (Alternative - Faster)

If you want to use **pnpm** instead of npm (often faster and more reliable):

1. **Rename Dockerfile**: `mv Dockerfile Dockerfile.npm`
2. **Use pnpm version**: `mv Dockerfile.pnpm Dockerfile`
3. **Add pnpm-lock.yaml**: Run `pnpm install` locally to generate lock file

### Benefits of pnpm:
- ⚡ **Faster installs** (uses hard links)
- 💾 **Less disk space** (shared dependency store)
- 🔒 **Stricter dependency resolution**
- ✅ **Better for monorepos**

## Environment Variables Required in Coolify:

Set these as **Build Arguments** in Coolify:

```
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NEXT_PUBLIC_APP_URL=https://your-app-domain.com
```

## Build Process:

1. **Builder stage**: Installs all deps + builds Next.js
2. **Runner stage**: Only copies built artifacts (standalone output)
3. **Final image**: ~200MB (vs ~1GB with all node_modules)

## Verification:

After build, verify:
- ✅ `.next/standalone` directory exists
- ✅ `server.js` is present
- ✅ No devDependencies in final image
- ✅ Running as non-root user

