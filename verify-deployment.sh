#!/bin/bash

# Script para verificar el deployment de Academic SaaS
# Autor: Claude
# Fecha: 2025-01-18

echo "🔍 Verificando Deployment de Academic SaaS"
echo "=========================================="

# Configuración
EC2_IP="107.21.145.151"
FRONTEND_PORT="3000"
BACKEND_PORT="8000"
SSH_KEY="$HOME/.ssh/academic-saas-github-actions"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Función para verificar servicio
check_service() {
    local service=$1
    local url=$2
    local expected=$3
    
    echo -n "Verificando $service... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$url" 2>/dev/null)
    
    if [ "$response" = "$expected" ]; then
        echo -e "${GREEN}✅ OK (HTTP $response)${NC}"
        return 0
    else
        echo -e "${RED}❌ Error (HTTP $response)${NC}"
        return 1
    fi
}

# Función para verificar contenedor Docker
check_container() {
    local container=$1
    local host=$2
    
    echo -n "Verificando contenedor $container... "
    
    result=$(ssh -i "$SSH_KEY" -o ConnectTimeout=5 -o StrictHostKeyChecking=no "ec2-user@$host" \
        "docker ps --format '{{.Names}}' | grep -q '$container' && echo 'running' || echo 'not found'" 2>/dev/null)
    
    if [ "$result" = "running" ]; then
        echo -e "${GREEN}✅ En ejecución${NC}"
        return 0
    else
        echo -e "${RED}❌ No encontrado o detenido${NC}"
        return 1
    fi
}

echo ""
echo -e "${BLUE}📡 Verificando conectividad...${NC}"
echo "IP: $EC2_IP"
echo ""

# Verificar SSH
echo -n "Conexión SSH... "
if ssh -i "$SSH_KEY" -o ConnectTimeout=5 -o StrictHostKeyChecking=no "ec2-user@$EC2_IP" "echo 'SSH OK'" &>/dev/null; then
    echo -e "${GREEN}✅ OK${NC}"
    ssh_ok=true
else
    echo -e "${RED}❌ Error${NC}"
    ssh_ok=false
fi

echo ""
echo -e "${BLUE}🌐 Verificando servicios HTTP...${NC}"
echo ""

# Verificar Frontend
check_service "Frontend" "http://$EC2_IP:$FRONTEND_PORT" "200"
frontend_ok=$?

# Verificar Backend
check_service "Backend API" "http://$EC2_IP:$BACKEND_PORT" "200"
backend_ok=$?

# Verificar API Docs
check_service "API Docs" "http://$EC2_IP:$BACKEND_PORT/api/docs/" "200"
docs_ok=$?

# Verificar Admin
check_service "Django Admin" "http://$EC2_IP:$BACKEND_PORT/admin/" "200"
admin_ok=$?

# Si SSH está disponible, verificar contenedores
if [ "$ssh_ok" = true ]; then
    echo ""
    echo -e "${BLUE}🐳 Verificando contenedores Docker...${NC}"
    echo ""
    
    check_container "academic-saas-frontend" "$EC2_IP"
    container_frontend_ok=$?
    
    check_container "academic-saas-backend" "$EC2_IP"
    container_backend_ok=$?
    
    # Mostrar información adicional
    echo ""
    echo -e "${BLUE}📊 Información del sistema:${NC}"
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "ec2-user@$EC2_IP" << 'EOF'
echo ""
echo "Uso de disco:"
df -h | grep -E "^/dev/"
echo ""
echo "Memoria:"
free -h | grep -E "^Mem:"
echo ""
echo "Contenedores Docker:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "Imágenes Docker:"
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
EOF
fi

# Resumen
echo ""
echo -e "${BLUE}📋 Resumen de verificación:${NC}"
echo "=========================="

# Función para mostrar estado
show_status() {
    local name=$1
    local status=$2
    
    if [ "$status" -eq 0 ]; then
        echo -e "$name: ${GREEN}✅ Funcionando${NC}"
    else
        echo -e "$name: ${RED}❌ Error${NC}"
    fi
}

[ "$ssh_ok" = true ] && echo -e "SSH: ${GREEN}✅ Funcionando${NC}" || echo -e "SSH: ${RED}❌ Error${NC}"
show_status "Frontend (HTTP)" $frontend_ok
show_status "Backend API" $backend_ok
show_status "API Docs" $docs_ok
show_status "Django Admin" $admin_ok

if [ "$ssh_ok" = true ]; then
    show_status "Container Frontend" $container_frontend_ok
    show_status "Container Backend" $container_backend_ok
fi

echo ""
echo -e "${BLUE}🔗 URLs de acceso:${NC}"
echo "- Frontend: http://$EC2_IP:$FRONTEND_PORT"
echo "- Backend API: http://$EC2_IP:$BACKEND_PORT"
echo "- API Docs: http://$EC2_IP:$BACKEND_PORT/api/docs/"
echo "- Django Admin: http://$EC2_IP:$BACKEND_PORT/admin/"
echo ""

# Determinar estado general
if [ "$frontend_ok" -eq 0 ] && [ "$backend_ok" -eq 0 ]; then
    echo -e "${GREEN}✅ ¡El deployment está funcionando correctamente!${NC}"
    exit 0
else
    echo -e "${RED}❌ Hay problemas con el deployment${NC}"
    echo ""
    echo "Sugerencias:"
    echo "1. Verifica los logs de GitHub Actions"
    echo "2. Conecta por SSH y revisa: docker ps -a"
    echo "3. Revisa los logs: docker logs academic-saas-frontend"
    echo "4. Revisa los logs: docker logs academic-saas-backend"
    exit 1
fi