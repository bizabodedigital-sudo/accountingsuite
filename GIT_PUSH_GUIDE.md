# Git Push Guide - Quick Reference

## 🚀 Push to Git and Deploy

### Step 1: Check Current Status

```bash
# See what files changed
git status

# See what will be committed
git diff
```

### Step 2: Add All Changes

```bash
# Add all modified and new files
git add .

# Or add specific files
git add docker-compose.yml frontend/Dockerfile backend/Dockerfile
```

### Step 3: Commit Changes

```bash
# Commit with a descriptive message
git commit -m "Add production docker-compose setup with clean Dockerfiles"

# Or use a more detailed message
git commit -m "Production setup:
- Clean production Dockerfiles for frontend and backend
- Production-ready docker-compose.yml
- Health checks for all services
- MongoDB and Redis with persistent volumes"
```

### Step 4: Push to Repository

```bash
# Push to main branch
git push origin main

# Or push to a different branch
git push origin develop
```

### Step 5: Deploy in Coolify

After pushing:

1. **Go to Coolify** → Your Docker Compose resource
2. **Click "Redeploy"** or **"Rebuild"**
3. Coolify will:
   - Pull latest code from git
   - Rebuild services if Dockerfiles changed
   - Restart services with new configuration

## 📋 Files to Commit

Make sure these files are in your repository:

### Required Files:
- ✅ `docker-compose.yml` - Main compose file
- ✅ `frontend/Dockerfile` - Frontend production Dockerfile
- ✅ `backend/Dockerfile` - Backend production Dockerfile
- ✅ `frontend/package.json` - Frontend dependencies
- ✅ `backend/package.json` - Backend dependencies
- ✅ `frontend/next.config.js` - Next.js configuration
- ✅ `.gitignore` - Git ignore file

### Optional Files:
- `docker-compose.prod.yml` - Alternative production compose
- `PRODUCTION_SETUP.md` - Setup documentation
- `COOLIFY_DOCKER_COMPOSE_SETUP.md` - Coolify deployment guide

## 🔄 Typical Workflow

```bash
# 1. Make changes to files
# ... edit docker-compose.yml, Dockerfiles, etc. ...

# 2. Check what changed
git status

# 3. Add changes
git add .

# 4. Commit
git commit -m "Description of changes"

# 5. Push
git push origin main

# 6. Deploy in Coolify (manual or auto via webhook)
```

## 🎯 Quick Commands

### One-liner to commit and push:
```bash
git add . && git commit -m "Update production setup" && git push origin main
```

### Check if everything is committed:
```bash
git status
# Should show: "nothing to commit, working tree clean"
```

### See commit history:
```bash
git log --oneline -10
```

## ⚠️ Before Pushing

### Check These:

1. **No sensitive data:**
   - No passwords in files
   - No API keys committed
   - Use environment variables instead

2. **`.gitignore` is working:**
   - `node_modules/` should be ignored
   - `.env` files should be ignored
   - Build artifacts (`.next/`, `dist/`) should be ignored

3. **Dockerfiles are correct:**
   - Paths are relative to build context
   - No hardcoded secrets
   - Health checks are configured

## 🐛 If Push Fails

### Authentication Error:
```bash
# Check your git credentials
git config --list | grep user

# Set credentials if needed
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

### Remote Not Found:
```bash
# Check remote URL
git remote -v

# Add remote if missing
git remote add origin https://github.com/yourusername/yourrepo.git
```

### Branch Issues:
```bash
# Check current branch
git branch

# Switch to main branch
git checkout main

# Or create and switch to new branch
git checkout -b main
```

## ✅ After Pushing

1. **Verify in GitHub/GitLab:**
   - Check that files appear in repository
   - Verify `docker-compose.yml` is there
   - Verify `Dockerfile` files are in `frontend/` and `backend/`

2. **In Coolify:**
   - Go to your resource
   - Check "Source" shows latest commit
   - Click "Redeploy" to pull latest code

3. **Monitor Deployment:**
   - Watch build logs
   - Check service health
   - Verify all services start successfully

## 🎉 Success!

Once pushed and deployed:
- ✅ Code is in git repository
- ✅ Coolify has latest version
- ✅ Services are running with new configuration
- ✅ Database persists across deployments

