#!/bin/bash

# Script para actualizar las claves SSH en EC2 y GitHub
# Autor: Claude
# Fecha: 2025-01-18

echo "🔐 Actualizando claves SSH para GitHub Actions..."
echo "================================================"

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuración
EC2_HOST="107.21.145.151"
EC2_USER="ec2-user"
GITHUB_USERNAME="jlcp89"
BACKEND_REPO="academic-saas-backend"
FRONTEND_REPO="academic-saas-frontend"

# Rutas de las claves
OLD_SSH_KEY="$HOME/.ssh/academic_saas_aws"
NEW_SSH_KEY="$HOME/.ssh/academic-saas-github-actions"
NEW_SSH_KEY_PUB="$HOME/.ssh/academic-saas-github-actions.pub"

# Verificar que las nuevas claves existen
if [ ! -f "$NEW_SSH_KEY" ] || [ ! -f "$NEW_SSH_KEY_PUB" ]; then
    echo -e "${RED}❌ Error: Las nuevas claves SSH no existen${NC}"
    echo "Esperado: $NEW_SSH_KEY y $NEW_SSH_KEY_PUB"
    exit 1
fi

# Verificar que GitHub CLI está instalado
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ Error: GitHub CLI (gh) no está instalado${NC}"
    echo "Instálalo con: sudo apt install gh (Ubuntu) o brew install gh (Mac)"
    exit 1
fi

# Verificar autenticación de GitHub CLI
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}⚠️  GitHub CLI no está autenticado${NC}"
    echo "Ejecuta: gh auth login"
    exit 1
fi

echo ""
echo "📋 Paso 1: Agregar la nueva clave pública a EC2"
echo "-----------------------------------------------"

# Leer la clave pública
NEW_PUBLIC_KEY=$(cat "$NEW_SSH_KEY_PUB")

# Intentar agregar la clave pública a EC2
echo "Intentando conectar a EC2 con la clave existente..."
if ssh -i "$OLD_SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" "echo '$NEW_PUBLIC_KEY' >> ~/.ssh/authorized_keys && echo '✅ Clave pública agregada exitosamente a EC2'" 2>/dev/null; then
    echo -e "${GREEN}✅ Clave pública agregada a EC2${NC}"
else
    echo -e "${YELLOW}⚠️  No se pudo conectar automáticamente a EC2${NC}"
    echo ""
    echo "Por favor, agrega manualmente la siguiente clave pública a EC2:"
    echo "1. Conéctate a EC2 usando AWS Console o tu método actual"
    echo "2. Ejecuta el siguiente comando en EC2:"
    echo ""
    echo -e "${YELLOW}echo '$NEW_PUBLIC_KEY' >> ~/.ssh/authorized_keys${NC}"
    echo ""
    read -p "Presiona ENTER cuando hayas agregado la clave a EC2..."
fi

echo ""
echo "🧪 Paso 2: Probar la nueva clave SSH"
echo "------------------------------------"

if ssh -i "$NEW_SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" "echo 'Conexión exitosa con la nueva clave'" 2>/dev/null; then
    echo -e "${GREEN}✅ Conexión SSH exitosa con la nueva clave${NC}"
else
    echo -e "${RED}❌ Error: No se pudo conectar con la nueva clave${NC}"
    echo "Verifica que la clave pública se agregó correctamente a EC2"
    exit 1
fi

echo ""
echo "🔄 Paso 3: Actualizar el secreto EC2_SSH_KEY en GitHub"
echo "------------------------------------------------------"

# Leer el contenido de la clave privada
SSH_KEY_CONTENT=$(cat "$NEW_SSH_KEY")

# Función para actualizar secreto
update_secret() {
    local repo=$1
    local repo_full="$GITHUB_USERNAME/$repo"
    
    echo -n "Actualizando EC2_SSH_KEY en $repo... "
    
    if echo "$SSH_KEY_CONTENT" | gh secret set EC2_SSH_KEY --repo "$repo_full" 2>/dev/null; then
        echo -e "${GREEN}✅${NC}"
        return 0
    else
        echo -e "${RED}❌${NC}"
        return 1
    fi
}

# Actualizar en ambos repositorios
update_secret "$BACKEND_REPO"
update_secret "$FRONTEND_REPO"

echo ""
echo "📝 Paso 4: Verificar secretos"
echo "----------------------------"

echo "Backend secrets:"
gh secret list --repo "$GITHUB_USERNAME/$BACKEND_REPO" | grep EC2_SSH_KEY || echo "EC2_SSH_KEY no encontrado"

echo ""
echo "Frontend secrets:"
gh secret list --repo "$GITHUB_USERNAME/$FRONTEND_REPO" | grep EC2_SSH_KEY || echo "EC2_SSH_KEY no encontrado"

echo ""
echo -e "${GREEN}✅ ¡Actualización completada!${NC}"
echo ""
echo "📋 Resumen:"
echo "- Nueva clave SSH: $NEW_SSH_KEY"
echo "- Clave agregada a EC2: $EC2_HOST"
echo "- Secreto actualizado en: $BACKEND_REPO y $FRONTEND_REPO"
echo ""
echo "🚀 Próximos pasos:"
echo "1. Ve a GitHub Actions y re-ejecuta el workflow fallido"
echo "2. El deployment debería funcionar ahora"
echo ""
echo "🔍 Para verificar manualmente:"
echo "ssh -i $NEW_SSH_KEY $EC2_USER@$EC2_HOST"