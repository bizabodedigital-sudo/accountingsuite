# Coolify Environment Variables - Copy & Paste Ready

## 🔐 Generated JWT_SECRET

Here's a secure JWT_SECRET generated for you:

```
SgrLvV/iBtpTYIDS4jOabnzND7TykHcl/Do54gQnKPQ=
```

**⚠️ IMPORTANT:** Copy this value and paste it into Coolify's Shared Variables.

---

## 📋 Required Environment Variables for Coolify

Copy these into Coolify → Your Project → **Shared Variables**:

### 🔴 CRITICAL (Must Have - Backend Won't Start Without These)

```env
# JWT Secret (REQUIRED - use the generated value above)
JWT_SECRET=SgrLvV/iBtpTYIDS4jOabnzND7TykHcl/Do54gQnKPQ=

# Database URLs (REQUIRED)
MONGODB_URI=mongodb://mongo:27017/bizabode
REDIS_URL=redis://redis:6379

# Server Port (REQUIRED)
PORT=3001
BACKEND_PORT=3001

# Frontend URL (REQUIRED in production)
FRONTEND_URL=https://your-frontend-domain.com
```

### 🟡 IMPORTANT (Frontend Needs These)

```env
# Frontend URLs (REQUIRED for Next.js build)
NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api
NEXT_PUBLIC_APP_URL=https://your-frontend-domain.com
```

### 🟢 S3/MinIO Configuration (Required for File Storage)

```env
# S3/MinIO Configuration
S3_ENDPOINT=http://minio:9000
S3_BUCKET=bizabode-accounting
S3_ACCESS_KEY=your-minio-access-key
S3_SECRET_KEY=your-minio-secret-key
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=true

# MinIO Root Credentials
MINIO_ROOT_USER=your-minio-root-user
MINIO_ROOT_PASSWORD=your-minio-root-password
MINIO_BUCKET=bizabode-accounting
```

### 🔵 MongoDB Configuration (Optional but Recommended)

```env
# MongoDB Configuration
MONGO_DATABASE=bizabode
MONGO_ROOT_USERNAME=your-mongo-root-user
MONGO_ROOT_PASSWORD=your-mongo-root-password
```

### 🟣 Mongo Express (Optional - Database Admin UI)

```env
MONGO_EXPRESS_USER=admin
MONGO_EXPRESS_PASSWORD=your-secure-password
```

### ⚪ Optional Configuration

```env
# Environment
NODE_ENV=production

# JWT Expiration
JWT_EXPIRES_IN=24h

# Logging
LOG_LEVEL=info

# Email Configuration (Optional - only if using email features)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## 🚀 Quick Setup Steps

1. **Go to Coolify** → Your Project → **Shared Variables**

2. **Add each variable** from the sections above:
   - Start with the 🔴 CRITICAL section (backend won't start without these)
   - Then add 🟡 IMPORTANT (frontend needs these)
   - Add others as needed

3. **Replace placeholder values**:
   - `your-frontend-domain.com` → Your actual frontend domain
   - `your-backend-domain.com` → Your actual backend domain
   - `your-minio-access-key` → Your MinIO access key
   - `your-minio-secret-key` → Your MinIO secret key
   - `your-minio-root-user` → Your MinIO root username
   - `your-minio-root-password` → Your MinIO root password

4. **Redeploy** your Docker Compose resource after adding variables

---

## ✅ Verification Checklist

After setting variables, verify:

- [ ] `JWT_SECRET` is set (use the generated value above)
- [ ] `MONGODB_URI` points to your MongoDB instance
- [ ] `REDIS_URL` points to your Redis instance
- [ ] `FRONTEND_URL` is set to your frontend domain
- [ ] `NEXT_PUBLIC_API_URL` is set to your backend API URL
- [ ] `NEXT_PUBLIC_APP_URL` is set to your frontend domain
- [ ] S3/MinIO credentials are set (if using file storage)
- [ ] All variables are saved in Coolify
- [ ] Docker Compose resource has been redeployed

---

## 🔍 Troubleshooting

### Backend Still Crashing

1. **Check JWT_SECRET**:
   - Must be at least 32 characters
   - Use the generated value: `SgrLvV/iBtpTYIDS4jOabnzND7TykHcl/Do54gQnKPQ=`

2. **Check Variable Names**:
   - Must be exact: `JWT_SECRET` (not `JWT_SECRET_KEY` or `JWT_TOKEN`)
   - Case-sensitive

3. **Check Variable Scope**:
   - Variables should be at **Project** or **Resource** level
   - Not just at service level

### Frontend Not Building

1. **Check Build Arguments**:
   - `NEXT_PUBLIC_API_URL` must be set
   - `NEXT_PUBLIC_APP_URL` must be set
   - These are used during build time (not just runtime)

2. **Check Frontend Service**:
   - Verify frontend service is enabled in Docker Compose
   - Check build logs for errors

---

## 📝 Notes

- **JWT_SECRET**: Keep this secret! Don't commit it to git.
- **Domain URLs**: Make sure they match your actual Coolify domains
- **MinIO**: If you haven't set up MinIO yet, you can use default values for now, but file uploads won't work
- **MongoDB/Redis**: These should match your database service names in Coolify

