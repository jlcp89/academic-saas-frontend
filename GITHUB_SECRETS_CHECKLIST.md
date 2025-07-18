# GitHub Repository Secrets Checklist

This checklist helps you verify all required secrets are properly configured in your GitHub repository settings.

## How to Add Secrets
1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret" to add each secret

## Required Secrets Checklist

### Core Authentication & Security
- [ ] **EC2_SSH_KEY** - Private SSH key for EC2 access
  - Format: Full SSH private key starting with `-----BEGIN RSA PRIVATE KEY-----`
  - Used by: Both workflows

- [ ] **NEXTAUTH_SECRET** - NextAuth.js secret for production
  - Generate with: `openssl rand -base64 32`
  - Used by: deploy.yml

- [ ] **NEXTAUTH_SECRET_DEV** - NextAuth.js secret for dev
  - Generate with: `openssl rand -base64 32`
  - Used by: deploy.yaml

- [ ] **NEXTAUTH_SECRET_PROD** - NextAuth.js secret for production
  - Generate with: `openssl rand -base64 32`
  - Used by: deploy.yaml

### AWS Infrastructure (deploy.yml)
- [ ] **AWS_ROLE_ARN** - IAM role for GitHub Actions OIDC
  - Format: `arn:aws:iam::123456789012:role/GitHubActionsRole`
  - Required permissions: ECR access

- [ ] **ECR_REGISTRY** - AWS ECR registry URL
  - Format: `123456789012.dkr.ecr.us-east-1.amazonaws.com`

### EC2 Host Configuration
- [ ] **EC2_HOST_DEV** - Development EC2 instance
  - Format: IP address or hostname
  - Example: `54.123.456.789` or `dev.example.com`

- [ ] **EC2_HOST_PROD** - Production EC2 instance
  - Format: IP address or hostname
  - Example: `54.987.654.321` or `prod.example.com`

### Application URLs (deploy.yml)
- [ ] **NEXT_PUBLIC_API_URL** - Base API URL for build
  - Example: `https://api.example.com`

- [ ] **NEXTAUTH_URL** - NextAuth base URL for build
  - Example: `https://example.com`

- [ ] **NEXT_PUBLIC_API_URL_DEV** - Dev API URL
  - Example: `https://dev-api.example.com`

- [ ] **NEXTAUTH_URL_DEV** - Dev NextAuth URL
  - Example: `https://dev.example.com`

- [ ] **NEXT_PUBLIC_API_URL_PROD** - Production API URL
  - Example: `https://api.example.com`

- [ ] **NEXTAUTH_URL_PROD** - Production NextAuth URL
  - Example: `https://example.com`

### GitHub Access (deploy.yaml)
- [ ] **PERSONAL_ACCESS_TOKEN** - GitHub PAT for cloning
  - Required scopes: `repo` (for private repositories)
  - Create at: https://github.com/settings/tokens

## Troubleshooting Common Issues

### 1. "Bad configuration" or SSH connection errors
- Verify EC2_SSH_KEY format (must include header/footer)
- Check EC2_HOST_* values are correct
- Ensure EC2 security group allows SSH from GitHub Actions

### 2. AWS/ECR authentication failures
- Verify AWS_ROLE_ARN has correct permissions
- Check ECR_REGISTRY format
- Ensure OIDC provider is configured in AWS

### 3. Docker build failures
- Verify all NEXT_PUBLIC_API_URL_* and NEXTAUTH_URL_* are valid URLs
- Check NEXTAUTH_SECRET* are properly generated

### 4. Repository cloning failures
- Verify PERSONAL_ACCESS_TOKEN has `repo` scope
- Check token hasn't expired

## Environment-Specific Notes

- **deploy.yml**: Uses AWS ECR and OIDC authentication
- **deploy.yaml**: Clones repository directly on EC2 and builds locally

Make sure to use the appropriate secrets based on which workflow file you're using.