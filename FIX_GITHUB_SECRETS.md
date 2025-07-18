# How to Fix GitHub Actions Deployment Secrets

## Step-by-Step Instructions

### 1. Generate Required Secrets

#### NextAuth Secrets
```bash
# Generate secrets for each environment
openssl rand -base64 32  # For NEXTAUTH_SECRET
openssl rand -base64 32  # For NEXTAUTH_SECRET_DEV
openssl rand -base64 32  # For NEXTAUTH_SECRET_PROD
```

#### AWS ECR Registry
```bash
# Get your ECR registry URL
aws ecr describe-repositories --repository-names academic-saas-frontend \
  --query 'repositories[0].repositoryUri' --output text | cut -d'/' -f1
```

#### SSH Key for EC2
```bash
# If you don't have the private key, you'll need to:
# 1. Create a new key pair in AWS EC2 console
# 2. Add the public key to ~/.ssh/authorized_keys on EC2 instances
# 3. Use the private key content for EC2_SSH_KEY secret
```

### 2. Add Secrets to GitHub Repository

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. For each secret, click **New repository secret**

### 3. Configure AWS OIDC (for deploy.yml)

If using the deploy.yml workflow with AWS OIDC:

```bash
# Create OIDC provider in AWS
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1

# Create IAM role with trust policy
cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_GITHUB_USERNAME/academic-saas-frontend:*"
        }
      }
    }
  ]
}
EOF

aws iam create-role \
  --role-name GitHubActionsECR \
  --assume-role-policy-document file://trust-policy.json

# Attach ECR permissions
aws iam attach-role-policy \
  --role-name GitHubActionsECR \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser
```

### 4. Create GitHub Personal Access Token (for deploy.yaml)

1. Go to https://github.com/settings/tokens
2. Click **Generate new token (classic)**
3. Give it a descriptive name
4. Select scope: **repo** (full control of private repositories)
5. Click **Generate token**
6. Copy the token immediately (you won't see it again)

### 5. Verify EC2 Configuration

Ensure your EC2 instances have:

```bash
# 1. Docker installed
sudo yum install -y docker
sudo systemctl start docker
sudo usermod -a -G docker ec2-user

# 2. AWS CLI configured (for ECR login)
aws configure

# 3. Security group allows SSH from GitHub Actions
# Add inbound rule: SSH (22) from 0.0.0.0/0 or GitHub Actions IP ranges
```

### 6. Common Fixes for Deployment Errors

#### Error: "Host key verification failed"
Add this to your workflow before SSH:
```yaml
- name: Setup known hosts
  run: |
    mkdir -p ~/.ssh
    ssh-keyscan -H ${{ secrets.EC2_HOST_DEV }} >> ~/.ssh/known_hosts
```

#### Error: "Permission denied (publickey)"
- Verify EC2_SSH_KEY contains the full private key including headers
- Check the key matches what's in EC2's authorized_keys

#### Error: "Cannot connect to Docker daemon"
On EC2, run:
```bash
sudo systemctl restart docker
sudo chmod 666 /var/run/docker.sock
```

#### Error: "ECR login failed"
Ensure the EC2 instance has proper IAM role attached with ECR permissions.

### 7. Test Your Configuration

After setting up all secrets, trigger a workflow run:

```bash
# Create a test branch
git checkout -b test/github-actions
git push origin test/github-actions

# Open a PR to trigger the workflow
# Check Actions tab for any errors
```

### 8. Security Best Practices

1. **Rotate secrets regularly** - Update NextAuth secrets every 90 days
2. **Use environment-specific secrets** - Don't reuse secrets across environments
3. **Limit token scopes** - Only grant necessary permissions
4. **Monitor access** - Check GitHub Actions logs regularly
5. **Use OIDC when possible** - Prefer AWS OIDC over static credentials

## Need Help?

If you encounter issues:
1. Check the Actions tab for detailed error messages
2. Verify all secrets are set correctly (no extra spaces/newlines)
3. Test SSH connectivity manually first
4. Ensure EC2 instances are running and accessible