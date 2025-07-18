#!/bin/bash

# Script para importar la nueva clave SSH a AWS
# Autor: Claude
# Fecha: 2025-01-18

echo "🔑 Importando Key Pair a AWS..."
echo "=============================="

# Configuración
KEY_NAME="academic-saas-github-actions"
PUBLIC_KEY_FILE="$HOME/.ssh/academic-saas-github-actions.pub"
REGION="us-east-1"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Verificar que AWS CLI está instalado
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ Error: AWS CLI no está instalado${NC}"
    echo "Instálalo con: sudo apt install awscli"
    exit 1
fi

# Verificar que la clave pública existe
if [ ! -f "$PUBLIC_KEY_FILE" ]; then
    echo -e "${RED}❌ Error: No se encuentra la clave pública${NC}"
    echo "Esperado en: $PUBLIC_KEY_FILE"
    exit 1
fi

# Verificar credenciales AWS
echo "Verificando credenciales AWS..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ Error: No hay credenciales AWS configuradas${NC}"
    echo "Configura con: aws configure"
    exit 1
fi

# Leer la clave pública
PUBLIC_KEY=$(cat "$PUBLIC_KEY_FILE")

echo ""
echo "📋 Información:"
echo "- Key Name: $KEY_NAME"
echo "- Region: $REGION"
echo "- Public Key File: $PUBLIC_KEY_FILE"
echo ""

# Verificar si el key pair ya existe
echo "Verificando si el key pair ya existe..."
if aws ec2 describe-key-pairs --key-names "$KEY_NAME" --region "$REGION" &> /dev/null; then
    echo -e "${YELLOW}⚠️  El key pair '$KEY_NAME' ya existe${NC}"
    read -p "¿Deseas eliminarlo y crear uno nuevo? (s/N): " confirm
    if [[ $confirm =~ ^[Ss]$ ]]; then
        echo "Eliminando key pair existente..."
        aws ec2 delete-key-pair --key-name "$KEY_NAME" --region "$REGION"
        echo -e "${GREEN}✅ Key pair eliminado${NC}"
    else
        echo "Operación cancelada"
        exit 0
    fi
fi

# Importar el key pair
echo ""
echo "Importando key pair a AWS..."
if aws ec2 import-key-pair \
    --key-name "$KEY_NAME" \
    --public-key-material "file://$PUBLIC_KEY_FILE" \
    --region "$REGION" \
    --output json > /tmp/keypair-import.json; then
    
    echo -e "${GREEN}✅ Key pair importado exitosamente${NC}"
    echo ""
    echo "Detalles:"
    cat /tmp/keypair-import.json | jq -r '
        "- Key Name: \(.KeyName)
- Key Fingerprint: \(.KeyFingerprint)
- Key Pair ID: \(.KeyPairId)"'
    
    rm /tmp/keypair-import.json
else
    echo -e "${RED}❌ Error al importar el key pair${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ ¡Key pair listo para usar!${NC}"
echo ""
echo "📋 Próximos pasos:"
echo "1. Usar este key pair al crear la nueva instancia EC2"
echo "2. Seleccionar '$KEY_NAME' en la sección 'Key pair' al lanzar la instancia"
echo ""
echo "🔍 Para verificar:"
echo "aws ec2 describe-key-pairs --key-names $KEY_NAME --region $REGION"