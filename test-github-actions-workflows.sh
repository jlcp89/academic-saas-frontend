#!/bin/bash

# Script para probar workflows de GitHub Actions
echo "🚀 Probando workflows de GitHub Actions"
echo "======================================"

# Variables
FRONTEND_REPO="jlcp89/academic-saas-frontend"
BACKEND_REPO="jlcp89/academic-saas-backend"
EC2_HOST="52.20.22.173"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📋 Paso 1: Verificar que los secretos estén actualizados${NC}"
echo "IP actual: $EC2_HOST"
echo ""

echo -e "${BLUE}📋 Paso 2: Probar workflow de test-secrets${NC}"
echo "Este workflow verifica la configuración de secretos:"
echo "https://github.com/$FRONTEND_REPO/actions/workflows/test-secrets.yml"
echo ""

echo -e "${BLUE}📋 Paso 3: Disparar workflows manualmente${NC}"
echo "Para probar los workflows, puedes:"
echo ""
echo "1. Ir a GitHub y ejecutar manualmente:"
echo "   - Frontend: https://github.com/$FRONTEND_REPO/actions"
echo "   - Backend: https://github.com/$BACKEND_REPO/actions"
echo ""
echo "2. O hacer un push a la rama 'test/deployment-workflow':"
echo "   git checkout -b test/deployment-workflow"
echo "   git push origin test/deployment-workflow"
echo ""

echo -e "${BLUE}📋 Paso 4: Verificar despliegue${NC}"
echo "Una vez que los workflows se ejecuten, verifica:"
echo "- Frontend: http://$EC2_HOST:3000"
echo "- Backend: http://$EC2_HOST:8000"
echo "- Admin: http://$EC2_HOST:8000/admin"
echo ""

echo -e "${YELLOW}💡 Comandos útiles:${NC}"
echo "ssh -i ~/.ssh/academic-saas-github-actions ec2-user@$EC2_HOST"
echo "sudo docker ps"
echo "sudo docker logs academic-saas-frontend-dev"
echo "sudo docker logs academic-saas-backend-dev"
echo ""

echo -e "${GREEN}✅ Listo para probar workflows de GitHub Actions${NC}" 