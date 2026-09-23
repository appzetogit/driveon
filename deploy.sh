#!/bin/bash
# ==============================================================================
# DriveOn Automated Deployment Script (Frontend + Backend + Nginx)
# Usage: ./deploy.sh
# ==============================================================================

set -e # Exit immediately if a command exits with a non-zero status

# Color codes for pretty terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Absolute directory of this script
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_ROOT="/var/www/driveon"

echo -e "\n${BLUE}======================================================${NC}"
echo -e "${BLUE}       🚀 Starting DriveOn Full Deployment            ${NC}"
echo -e "${BLUE}======================================================${NC}\n"

# ------------------------------------------------------------------------------
# 1. Pull Latest Code from GitHub
# ------------------------------------------------------------------------------
echo -e "${YELLOW}📥 [1/4] Pulling latest code from GitHub...${NC}"
cd "$PROJECT_DIR"
git pull origin main
echo -e "${GREEN}✓ Git pull successful.${NC}\n"

# ------------------------------------------------------------------------------
# 2. Deploy & Restart Backend (PM2)
# ------------------------------------------------------------------------------
echo -e "${YELLOW}⚙️  [2/4] Updating & restarting backend...${NC}"
cd "$PROJECT_DIR/backend"

# Ensure uploads directory exists and has permissions
mkdir -p "$PROJECT_DIR/backend/public/uploads"

# Install backend dependencies if needed
npm install --silent

# Restart PM2 process
if pm2 describe driveon-api > /dev/null 2>&1; then
    pm2 restart driveon-api --update-env
else
    pm2 start server.js --name driveon-api
fi
echo -e "${GREEN}✓ Backend restarted successfully.${NC}\n"

# ------------------------------------------------------------------------------
# 3. Build & Deploy Frontend to Nginx Web Root
# ------------------------------------------------------------------------------
echo -e "${YELLOW}🎨 [3/4] Building & deploying frontend...${NC}"
cd "$PROJECT_DIR/frontend"

# Install frontend dependencies if needed
npm install --silent

# Build production bundle
npm run build

# Deploy to Nginx web root directory
echo -e "${BLUE}📦 Copying build files to ${WEB_ROOT}...${NC}"
mkdir -p "$WEB_ROOT"
cp -r dist/* "$WEB_ROOT/"

# Fix permissions so Nginx can read without 403 Forbidden
chmod -R 755 "$WEB_ROOT"

echo -e "${GREEN}✓ Frontend built and deployed to ${WEB_ROOT}.${NC}\n"

# ------------------------------------------------------------------------------
# 4. Test & Reload Nginx
# ------------------------------------------------------------------------------
echo -e "${YELLOW}🌐 [4/4] Testing and reloading Nginx...${NC}"
if nginx -t > /dev/null 2>&1; then
    systemctl reload nginx
    echo -e "${GREEN}✓ Nginx reloaded successfully.${NC}\n"
else
    echo -e "${RED}⚠️ Nginx configuration test failed! Please check: nginx -t${NC}\n"
fi

# ------------------------------------------------------------------------------
# Deployment Summary
# ------------------------------------------------------------------------------
echo -e "${BLUE}======================================================${NC}"
echo -e "${GREEN}       🎉 Deployment Completed Successfully!         ${NC}"
echo -e "${BLUE}======================================================${NC}"
echo -e "Website: ${GREEN}https://driveoncar.co.in${NC}"
echo -e "API:     ${GREEN}https://driveoncar.co.in/api${NC}"
echo -e "Uploads: ${GREEN}https://driveoncar.co.in/uploads${NC}\n"
