#!/bin/bash

# Script de configuración inicial para nueva instancia EC2
# Este script debe ejecutarse en la nueva instancia EC2 después de crearla
# Autor: Claude
# Fecha: 2025-01-18

echo "🚀 Configuración inicial de EC2 para Academic SaaS"
echo "=================================================="

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Función para verificar éxito
check_success() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1 completado${NC}"
    else
        echo -e "${RED}❌ Error en: $1${NC}"
        exit 1
    fi
}

# Actualizar sistema
echo ""
echo -e "${BLUE}📦 Actualizando sistema...${NC}"
sudo yum update -y
check_success "Actualización del sistema"

# Instalar Docker
echo ""
echo -e "${BLUE}🐳 Instalando Docker...${NC}"
sudo yum install -y docker
check_success "Instalación de Docker"

# Iniciar y habilitar Docker
sudo systemctl start docker
check_success "Inicio de Docker"
sudo systemctl enable docker
check_success "Habilitación de Docker"

# Agregar usuario al grupo docker
sudo usermod -a -G docker ec2-user
check_success "Usuario agregado al grupo docker"

# Instalar Git
echo ""
echo -e "${BLUE}📚 Instalando Git...${NC}"
sudo yum install -y git
check_success "Instalación de Git"

# Instalar Docker Compose
echo ""
echo -e "${BLUE}🎼 Instalando Docker Compose...${NC}"
COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
sudo curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
check_success "Instalación de Docker Compose"

# Crear enlace simbólico para docker-compose
sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
check_success "Enlace simbólico de Docker Compose"

# Instalar herramientas útiles
echo ""
echo -e "${BLUE}🛠️  Instalando herramientas adicionales...${NC}"
sudo yum install -y htop curl wget jq
check_success "Instalación de herramientas"

# Crear directorios para los proyectos
echo ""
echo -e "${BLUE}📁 Creando estructura de directorios...${NC}"
mkdir -p ~/academic-saas-backend ~/academic-saas-frontend
check_success "Creación de directorios"

# Configurar firewall (si está habilitado)
echo ""
echo -e "${BLUE}🔥 Configurando firewall...${NC}"
if systemctl is-active --quiet firewalld; then
    sudo firewall-cmd --permanent --add-port=22/tcp
    sudo firewall-cmd --permanent --add-port=80/tcp
    sudo firewall-cmd --permanent --add-port=3000/tcp
    sudo firewall-cmd --permanent --add-port=8000/tcp
    sudo firewall-cmd --reload
    check_success "Configuración de firewall"
else
    echo -e "${YELLOW}ℹ️  Firewall no está activo${NC}"
fi

# Verificar instalaciones
echo ""
echo -e "${BLUE}🔍 Verificando instalaciones...${NC}"
echo ""
echo "Docker version:"
docker --version
echo ""
echo "Docker Compose version:"
docker-compose --version
echo ""
echo "Git version:"
git --version

# Información importante
echo ""
echo -e "${GREEN}✅ ¡Configuración inicial completada!${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "1. Debes cerrar sesión y volver a conectarte para que los cambios de grupo surtan efecto"
echo "2. Comando: exit (luego reconecta por SSH)"
echo ""
echo "📋 Después de reconectar, verifica con:"
echo "   docker run hello-world"
echo ""
echo "🚀 Los directorios están listos para el deployment:"
echo "   - Backend: ~/academic-saas-backend"
echo "   - Frontend: ~/academic-saas-frontend"
echo ""
echo "📍 Puertos configurados:"
echo "   - SSH: 22"
echo "   - HTTP: 80"
echo "   - Frontend: 3000"
echo "   - Backend: 8000"

# Crear archivo de información
cat > ~/ec2-setup-info.txt << EOF
EC2 Setup Information
====================
Date: $(date)
Docker: $(docker --version 2>/dev/null || echo "Not available until re-login")
Docker Compose: $(docker-compose --version 2>/dev/null || echo "Installed")
Git: $(git --version)

Directories:
- Backend: ~/academic-saas-backend
- Frontend: ~/academic-saas-frontend

Ports:
- SSH: 22
- HTTP: 80
- Frontend: 3000
- Backend: 8000

Next steps:
1. Exit and reconnect SSH session
2. Test Docker: docker run hello-world
3. Re-run GitHub Actions deployment
EOF

echo ""
echo -e "${BLUE}📄 Información guardada en: ~/ec2-setup-info.txt${NC}"