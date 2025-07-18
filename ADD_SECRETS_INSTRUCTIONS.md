# Quick Fix: Add Secrets to Frontend Repository

The deployment is failing because the secrets are not configured in the **frontend repository**. The backend works because it has its own secrets.

## Add these secrets to the frontend repo:

1. **Go to**: https://github.com/jlcp89/academic-saas-frontend/settings/secrets/actions

2. Click "New repository secret" and add each of these:

### Required Secrets:

```bash
# 1. EC2_SSH_KEY
# Copy the content of your SSH key:
cat ~/.ssh/academic_saas_aws
# Paste the ENTIRE content (including -----BEGIN RSA PRIVATE KEY-----)

# 2. EC2_HOST_DEV
107.21.145.151

# 3. PERSONAL_ACCESS_TOKEN
# Your GitHub personal access token (same as backend)

# 4. NEXT_PUBLIC_API_URL_DEV
http://107.21.145.151:8000

# 5. NEXTAUTH_URL_DEV
http://107.21.145.151:3000

# 6. NEXTAUTH_SECRET_DEV
# Generate a new one:
openssl rand -base64 32
```

## To get the SSH key content:
```bash
cat ~/.ssh/academic_saas_aws
```

Copy everything including:
```
-----BEGIN RSA PRIVATE KEY-----
[... key content ...]
-----END RSA PRIVATE KEY-----
```

After adding these secrets, re-run the failed workflow and it should work!