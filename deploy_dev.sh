#!/bin/bash

# ================================================================
# Academic SaaS - Frontend Development Deployment Script
# ================================================================
# Este script despliega el frontend (Next.js) en el entorno de desarrollo
# sin Docker, usando Node.js directo y PM2 para process management.
# 
# Uso: 
#   ./deploy_dev.sh              # Instalación inteligente de dependencias
#   ./deploy_dev.sh --force-deps # Forzar reinstalación de dependencias
# ================================================================

set -e  # Exit on any error

# Variables de configuración
FORCE_DEPS=false
if [[ "$1" == "--force-deps" ]]; then
    FORCE_DEPS=true
fi

# Variables de entorno para desarrollo
export NODE_ENV=production
export PORT=3000
export HOSTNAME=0.0.0.0

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ================================================================
# VERIFICACIONES PREVIAS
# ================================================================

log_info "🚀 Iniciando deployment de Frontend en DEV..."
log_info "=============================================="

# Verificar Node.js
if ! command -v node &> /dev/null; then
    log_error "Node.js no está instalado"
    exit 1
fi

# Verificar npm
if ! command -v npm &> /dev/null; then
    log_error "npm no está instalado"
    exit 1
fi

# Verificar Nginx
if ! command -v nginx &> /dev/null; then
    log_info "Nginx no está instalado. Instalando..."
    sudo yum update -y
    sudo yum install -y nginx
    sudo systemctl enable nginx
fi

# ================================================================
# CONFIGURACIÓN DEL FRONTEND
# ================================================================

log_info "🎨 Configurando Frontend (Next.js)..."

# Verificar e instalar dependencias solo si es necesario
if [ "$FORCE_DEPS" = true ] || [ ! -f "node_modules/.deps_installed" ] || [ "package.json" -nt "node_modules/.deps_installed" ] || [ "package-lock.json" -nt "node_modules/.deps_installed" ]; then
    log_info "Instalando/actualizando dependencias del frontend..."
    npm ci --only=production
    touch node_modules/.deps_installed
else
    log_info "Dependencias del frontend ya están actualizadas ✓"
fi

# Crear archivo .env.local para producción
log_info "Configurando variables de entorno..."
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://52.20.22.173
NEXTAUTH_URL=http://52.20.22.173
NEXTAUTH_SECRET=/bG5bl9y23JSqYstIc/c+uoY/3eIwlPeInJU9kiJd7I=
NODE_ENV=production
EOF

# Build de la aplicación
log_info "Construyendo aplicación para producción..."
npm run build

# ================================================================
# DEPLOYMENT CON SYSTEMD Y NGINX
# ================================================================

log_info "🔄 Configurando servicio systemd..."

# Detener servicio existente si existe
sudo systemctl stop academic-saas-frontend 2>/dev/null || log_info "No hay servicio previo ejecutándose"

# Crear servicio systemd
sudo tee /etc/systemd/system/academic-saas-frontend.service > /dev/null << EOF
[Unit]
Description=Academic SaaS Frontend
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/academic-saas-frontend
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=HOSTNAME=0.0.0.0
EnvironmentFile=/home/ec2-user/academic-saas-frontend/.env.local

[Install]
WantedBy=multi-user.target
EOF

# Recargar systemd y habilitar servicio
sudo systemctl daemon-reload
sudo systemctl enable academic-saas-frontend.service

# Configurar Nginx
log_info "🌐 Configurando Nginx..."

sudo tee /etc/nginx/conf.d/academic-saas-frontend.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name 52.20.22.173;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    # Backend API (Django)
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Django Admin
    location /admin/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Django Static Files
    location /static/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
    }
}
EOF

# Crear directorio de logs si no existe
mkdir -p /home/ec2-user/logs

# Iniciar servicios
log_info "🚀 Iniciando servicios..."
sudo systemctl start academic-saas-frontend
sudo systemctl restart nginx

# ================================================================
# VERIFICACIÓN
# ================================================================

log_info "⏳ Esperando que la aplicación esté lista..."
sleep 10

# Verificar que la aplicación responda
if curl -f http://localhost/ > /dev/null 2>&1; then
    log_success "✅ Frontend desplegado exitosamente!"
    log_info "🌐 URL: http://52.20.22.173"
else
    log_error "❌ Error: La aplicación no responde a través de Nginx"
    sudo systemctl status academic-saas-frontend --no-pager
    sudo systemctl status nginx --no-pager
    exit 1
fi

# ================================================================
# INFORMACIÓN FINAL
# ================================================================

log_success "🎉 ¡Deployment completado!"
log_info "=========================="
log_info "🌐 URLs de acceso:"
log_info "   • Frontend:      http://52.20.22.173"
log_info "   • Backend API:   http://52.20.22.173/api/"
log_info "   • Django Admin:  http://52.20.22.173/admin/"
log_info ""
log_info "📋 Comandos útiles:"
log_info "   • sudo systemctl status academic-saas-frontend  # Ver estado"
log_info "   • sudo journalctl -u academic-saas-frontend -f  # Ver logs"
log_info "   • sudo systemctl restart academic-saas-frontend # Reiniciar"
log_info "   • sudo systemctl restart nginx                 # Reiniciar Nginx"
log_info "   • ./deploy_dev.sh --force-deps                 # Reinstalar dependencias"