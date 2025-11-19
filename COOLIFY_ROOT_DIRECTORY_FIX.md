# ✅ Coolify Root Directory Configuration

## 🎯 The Issue

**Error:** `"/package.json": not found`

**Cause:** Coolify is building from repo root, but Dockerfiles expect to be in `backend/` or `frontend/` directories.

---

## ✅ Your Repo Structure (Correct!)

```
/
├── backend/
│   ├── Dockerfile ✅
│   ├── package.json ✅
│   └── src/
├── frontend/
│   ├── Dockerfile ✅
│   ├── package.json ✅
│   └── src/
└── package.json (root - workspace)
```

**Your Dockerfiles are already in the right place!** They just need Coolify to build from the correct directory.

---

## 🔧 The Fix: Set Root Directory in Coolify

### For Backend Application

**In Coolify → Backend Application → Settings:**

1. Find **"Root Directory"** or **"Build Context"** field
2. Set to: `/backend`
3. Save

**This tells Coolify:**
- Build context starts at `/backend`
- Dockerfile location: `./backend/Dockerfile` (relative to repo root)
- Or: `./Dockerfile` (if Root Directory is `/backend`)

### For Frontend Application

**In Coolify → Frontend Application → Settings:**

1. Find **"Root Directory"** or **"Build Context"** field
2. Set to: `/frontend`
3. Save

---

## 📋 Coolify Settings Checklist

### Backend App Settings

- **Type:** Dockerfile
- **Source:** Your GitHub repo
- **Branch:** `main`
- **Root Directory:** `/backend` ✅
- **Dockerfile Path:** `./Dockerfile` (or `./backend/Dockerfile` if Root Directory is empty)
- **Build Context:** Should auto-set to `/backend` when Root Directory is set

### Frontend App Settings

- **Type:** Dockerfile
- **Source:** Your GitHub repo
- **Branch:** `main`
- **Root Directory:** `/frontend` ✅
- **Dockerfile Path:** `./Dockerfile` (or `./frontend/Dockerfile` if Root Directory is empty)
- **Build Context:** Should auto-set to `/frontend` when Root Directory is set

---

## 🔍 How to Verify

### After Setting Root Directory

**Backend build should:**
- Find `package.json` at `/backend/package.json` ✅
- Find `Dockerfile` at `/backend/Dockerfile` ✅
- Copy files from `/backend/` directory ✅

**Frontend build should:**
- Find `package.json` at `/frontend/package.json` ✅
- Find `Dockerfile` at `/frontend/Dockerfile` ✅
- Copy files from `/frontend/` directory ✅

---

## 🚀 Your Dockerfiles Are Perfect!

**No changes needed!** Your Dockerfiles are already correct:

### Backend Dockerfile (`backend/Dockerfile`)
```dockerfile
COPY package*.json ./  # ✅ Correct - expects package.json in current dir
COPY . .                # ✅ Correct - copies all files from build context
```

### Frontend Dockerfile (`frontend/Dockerfile`)
```dockerfile
COPY package*.json ./  # ✅ Correct - expects package.json in current dir
COPY . .                # ✅ Correct - copies all files from build context
```

**They just need Coolify to set the build context correctly!**

---

## 📝 Step-by-Step in Coolify

### Step 1: Backend Application

1. Go to **Backend Application** in Coolify
2. Click **Settings** or **Configuration**
3. Find **"Root Directory"** field
4. Enter: `backend` (or `/backend`)
5. **Dockerfile Path:** Should be `./Dockerfile` (relative to root directory)
6. Save

### Step 2: Frontend Application

1. Go to **Frontend Application** in Coolify
2. Click **Settings** or **Configuration**
3. Find **"Root Directory"** field
4. Enter: `frontend` (or `/frontend`)
5. **Dockerfile Path:** Should be `./Dockerfile` (relative to root directory)
6. Save

### Step 3: Rebuild

1. **Backend:** Click **Rebuild** or **Redeploy**
2. **Frontend:** Click **Rebuild** or **Redeploy**
3. Watch build logs - should now find `package.json` ✅

---

## 🧪 Expected Build Output

### Backend Build (Success)

```
Step 1/10 : COPY package*.json ./
 ---> Using cache
 ---> abc123def456
Step 2/10 : RUN npm install
 ---> Running in xyz789
...
```

### Frontend Build (Success)

```
Step 1/15 : COPY package*.json ./
 ---> Using cache
 ---> abc123def456
Step 2/15 : RUN npm install --legacy-peer-deps
 ---> Running in xyz789
...
```

---

## ⚠️ Common Mistakes

### Mistake 1: Root Directory Empty

**Problem:** Root Directory is empty or `/`
- Coolify builds from repo root
- Looks for `package.json` at root → Not found ❌

**Fix:** Set Root Directory to `/backend` or `/frontend`

### Mistake 2: Wrong Dockerfile Path

**Problem:** Dockerfile path is wrong
- If Root Directory = `/backend`, Dockerfile should be `./Dockerfile`
- If Root Directory = `/`, Dockerfile should be `./backend/Dockerfile`

**Fix:** Adjust Dockerfile path based on Root Directory

### Mistake 3: Build Context Mismatch

**Problem:** Build context doesn't match Root Directory
- Build context should match Root Directory

**Fix:** Let Coolify auto-set build context, or manually set it to match Root Directory

---

## ✅ Success Indicators

After setting Root Directory correctly:

- ✅ Build finds `package.json`
- ✅ `npm install` runs successfully
- ✅ Application files copy correctly
- ✅ Build completes without errors
- ✅ Container starts successfully

---

## 🎯 Summary

**Your setup is correct!** Just need to tell Coolify where to build from:

- **Backend:** Root Directory = `/backend`
- **Frontend:** Root Directory = `/frontend`

That's it! No Dockerfile changes needed. 🎉

