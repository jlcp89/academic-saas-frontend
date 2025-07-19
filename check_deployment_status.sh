#!/bin/bash

echo "=== EC2 Deployment Status Check ==="
echo "Date: $(date)"
echo ""

echo "=== 1. Checking systemd services ==="
echo "--- academic-frontend service ---"
systemctl status academic-frontend 2>/dev/null || echo "Service 'academic-frontend' not found"
echo ""
echo "--- academic-backend service ---"
systemctl status academic-backend 2>/dev/null || echo "Service 'academic-backend' not found"
echo ""

echo "=== 2. Checking Node.js installation ==="
if command -v node &> /dev/null; then
    echo "Node.js is installed: $(node --version)"
    echo "NPM version: $(npm --version 2>/dev/null || echo 'NPM not found')"
else
    echo "Node.js is NOT installed"
fi
echo ""

echo "=== 3. Checking Nginx status ==="
if systemctl is-active --quiet nginx; then
    echo "Nginx is running"
    echo "Nginx version: $(nginx -v 2>&1)"
    echo ""
    echo "Nginx configuration test:"
    sudo nginx -t 2>&1
    echo ""
    echo "Nginx sites-enabled:"
    ls -la /etc/nginx/sites-enabled/ 2>/dev/null || echo "sites-enabled directory not found"
else
    echo "Nginx is NOT running"
fi
echo ""

echo "=== 4. Contents of /home/ec2-user ==="
if [ -d "/home/ec2-user" ]; then
    ls -la /home/ec2-user/
else
    echo "Directory /home/ec2-user does not exist"
fi
echo ""

echo "=== 5. Checking listening ports ==="
echo "--- Port 3000 (Frontend) ---"
sudo lsof -i :3000 2>/dev/null || sudo ss -tlnp | grep :3000 || echo "Nothing listening on port 3000"
echo ""
echo "--- Port 8000 (Backend) ---"
sudo lsof -i :8000 2>/dev/null || sudo ss -tlnp | grep :8000 || echo "Nothing listening on port 8000"
echo ""

echo "=== 6. Additional checks ==="
echo "--- Running Node.js processes ---"
ps aux | grep -E "node|npm" | grep -v grep || echo "No Node.js processes found"
echo ""

echo "--- PM2 status (if installed) ---"
if command -v pm2 &> /dev/null; then
    pm2 list
else
    echo "PM2 is not installed"
fi
echo ""

echo "--- Docker containers (if Docker is used) ---"
if command -v docker &> /dev/null; then
    docker ps -a
else
    echo "Docker is not installed"
fi
echo ""

echo "=== End of deployment status check ==="