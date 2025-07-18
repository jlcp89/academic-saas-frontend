# Required GitHub Secrets for Frontend Deployment

This deployment workflow follows the same pattern as the backend deployment. Configure these secrets in your GitHub repository settings.

## Required Secrets

### 1. **EC2_SSH_KEY**
- The private SSH key for accessing EC2 instances
- Must include the full key with headers:
  ```
  -----BEGIN RSA PRIVATE KEY-----
  [key content]
  -----END RSA PRIVATE KEY-----
  ```

### 2. **PERSONAL_ACCESS_TOKEN**
- GitHub personal access token for cloning the repository
- Required scope: `repo` (for private repositories)
- Create at: https://github.com/settings/tokens

### 3. **EC2_HOST_DEV**
- Development EC2 instance IP address or hostname
- Example: `54.123.456.789` or `dev.yourdomain.com`

### 4. **EC2_HOST_PROD**
- Production EC2 instance IP address or hostname
- Example: `54.987.654.321` or `app.yourdomain.com`

### 5. **NEXT_PUBLIC_API_URL_DEV**
- Development backend API URL
- Example: `https://api-dev.yourdomain.com` or `http://dev-ec2-ip:8000`

### 6. **NEXT_PUBLIC_API_URL_PROD**
- Production backend API URL
- Example: `https://api.yourdomain.com`

### 7. **NEXTAUTH_URL_DEV**
- Development frontend URL for NextAuth
- Example: `https://dev.yourdomain.com` or `http://dev-ec2-ip:3000`

### 8. **NEXTAUTH_URL_PROD**
- Production frontend URL for NextAuth
- Example: `https://app.yourdomain.com`

### 9. **NEXTAUTH_SECRET_DEV**
- Development NextAuth secret key
- Generate with: `openssl rand -base64 32`

### 10. **NEXTAUTH_SECRET_PROD**
- Production NextAuth secret key (different from dev!)
- Generate with: `openssl rand -base64 32`

## How to Add Secrets

1. Go to your GitHub repository
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with the exact name listed above

## EC2 Instance Requirements

Both EC2 instances (dev and prod) must have:

```bash
# 1. Docker installed and running
sudo yum update -y
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# 2. Git installed
sudo yum install -y git

# 3. Required ports open in security group
# - Port 3000 for Next.js application
# - Port 22 for SSH access

# 4. Sufficient disk space for Docker images and backups
```

## Testing the Deployment

1. Create a test branch and push it:
   ```bash
   git checkout -b test/deployment
   git push origin test/deployment
   ```

2. Open a pull request to the `dev` branch

3. Check the Actions tab to monitor deployment

4. Common issues to check:
   - SSH key format (must include headers)
   - EC2 security group allows SSH from GitHub Actions
   - Docker is installed and running on EC2
   - Personal access token has correct permissions

## Deployment Flow

- **Pull Request to `dev` branch** → Deploys to DEV environment
- **Merged PR to `main` branch** → Deploys to PROD environment
- Both deployments include health checks and automatic cleanup