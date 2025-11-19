# 🔧 Fix Coolify Dockerfile Path Error

## ❌ Error

```
tee: /artifacts/.../frontend/Dockerfile: No such file or directory
Deployment failed.
```

**Problem:** Coolify is trying to generate/create a Dockerfile instead of using your existing one, or the path is incorrect.

---

## ✅ Solution: Configure Dockerfile Path Correctly

### In Coolify → Frontend Application → Settings

**You need to set:**

1. **Root Directory:** `/frontend` (or `frontend`)
2. **Dockerfile Path:** `./Dockerfile` (relative to root directory)

**OR if Root Directory is empty:**

1. **Root Directory:** `/` (empty or root)
2. **Dockerfile Path:** `./frontend/Dockerfile` (relative to repo root)

---

## 🎯 Recommended Configuration

### Option 1: Set Root Directory (Recommended)

**Settings:**
- **Root Directory:** `frontend`
- **Dockerfile Path:** `Dockerfile` or `./Dockerfile`
- **Build Context:** Auto (should be `frontend/`)

**This tells Coolify:**
- Build from `/frontend` directory
- Use `frontend/Dockerfile`
- All paths in Dockerfile are relative to `/frontend`

### Option 2: Use Full Path

**Settings:**
- **Root Directory:** `/` (empty)
- **Dockerfile Path:** `frontend/Dockerfile`
- **Build Context:** `frontend/`

**This tells Coolify:**
- Build from repo root
- Use `frontend/Dockerfile` (full path from root)
- Build context is `frontend/`

---

## 🔍 Check Your Current Settings

**In Coolify → Frontend Application:**

1. Go to **Settings** or **Configuration**
2. Check:
   - **Root Directory:** What is it set to?
   - **Dockerfile Path:** What is it set to?
   - **Build Context:** What is it set to?

**Common Issues:**

- ❌ Root Directory empty + Dockerfile Path = `Dockerfile` → Looks for `/Dockerfile` (doesn't exist)
- ❌ Root Directory = `frontend` + Dockerfile Path = `frontend/Dockerfile` → Looks for `frontend/frontend/Dockerfile` (wrong)
- ✅ Root Directory = `frontend` + Dockerfile Path = `Dockerfile` → Uses `frontend/Dockerfile` (correct)

---

## 📋 Step-by-Step Fix

### Step 1: Check Application Type

**Make sure:**
- Application Type: **Dockerfile** (not "Docker Compose" or "Docker Image")
- Source: Your GitHub repo
- Branch: `main` (or your branch)

### Step 2: Set Root Directory

1. Go to **Settings**
2. Find **"Root Directory"** field
3. Set to: `frontend`
4. Save

### Step 3: Set Dockerfile Path

1. Find **"Dockerfile Path"** or **"Dockerfile"** field
2. Set to: `Dockerfile` (or `./Dockerfile`)
3. **NOT:** `frontend/Dockerfile` (if Root Directory is already `frontend`)
4. Save

### Step 4: Verify Build Context

**Build Context should be:**
- Auto-set to `frontend/` when Root Directory is `frontend`
- Or manually set to `frontend/`

### Step 5: Rebuild

1. Click **Rebuild** or **Redeploy**
2. Watch build logs
3. Should now find Dockerfile correctly ✅

---

## 🧪 Expected Build Output (Success)

```
Step 1/15 : FROM node:22-bullseye AS builder
 ---> abc123def456
Step 2/15 : WORKDIR /app
 ---> Running in xyz789
Step 3/15 : COPY package*.json ./
 ---> abc123def456
...
```

**Should NOT see:**
- ❌ "Dockerfile not found"
- ❌ "No such file or directory"
- ❌ "tee: .../Dockerfile: No such file or directory"

---

## ⚠️ If Coolify is Generating Dockerfile

**If you see base64-encoded Dockerfile content in logs:**

Coolify might be trying to generate a Dockerfile instead of using yours.

**Fix:**
1. Make sure **Dockerfile Path** points to your actual Dockerfile
2. Don't use "Generate Dockerfile" option
3. Use "Custom Dockerfile" or "Use Existing Dockerfile"
4. Set path correctly: `Dockerfile` (relative to Root Directory)

---

## 🔧 Alternative: Check Dockerfile Exists

**Verify your Dockerfile is in the repo:**

```bash
# Should exist:
frontend/Dockerfile
```

**If it doesn't exist:**
- Create it using your existing `frontend/Dockerfile`
- Commit and push to GitHub
- Then configure Coolify

---

## 📝 Quick Checklist

- [ ] Application Type: **Dockerfile** (not Docker Compose)
- [ ] Root Directory: `frontend` (or `/frontend`)
- [ ] Dockerfile Path: `Dockerfile` (relative to Root Directory)
- [ ] Build Context: `frontend/` (auto or manual)
- [ ] Dockerfile exists in repo: `frontend/Dockerfile`
- [ ] Source: GitHub repo (correct branch)
- [ ] Rebuild after changing settings

---

## 🆘 Still Not Working?

**If still getting errors:**

1. **Check Coolify version** - Some versions have different UI
2. **Try absolute path** - `frontend/Dockerfile` (if Root Directory is `/`)
3. **Check file permissions** - Dockerfile should be readable
4. **Check GitHub sync** - Make sure latest code is in GitHub
5. **Try manual Dockerfile content** - Copy/paste Dockerfile content directly in Coolify (if option exists)

---

## ✅ Success Indicators

After fixing:

- ✅ Build starts without "No such file" errors
- ✅ Dockerfile is found and used
- ✅ Build progresses through Dockerfile steps
- ✅ Container builds successfully
- ✅ Application deploys

---

## 💡 Pro Tip

**Best Practice:**
- Set **Root Directory** to the service directory (`frontend` or `backend`)
- Set **Dockerfile Path** to `Dockerfile` (simple, relative)
- Let Coolify auto-set Build Context

This keeps configuration simple and clear!

