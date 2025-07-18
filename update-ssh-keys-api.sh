#!/bin/bash

# Script alternativo para actualizar claves SSH usando la API de GitHub
# Requiere: GITHUB_TOKEN como variable de entorno

echo "🔐 Actualizando claves SSH para GitHub Actions (API Version)..."
echo "============================================================="

# Verificar GITHUB_TOKEN
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ Error: GITHUB_TOKEN no está configurado"
    echo ""
    echo "Para obtener un token:"
    echo "1. Ve a: https://github.com/settings/tokens"
    echo "2. Genera un nuevo token con permisos 'repo'"
    echo "3. Ejecuta: export GITHUB_TOKEN=ghp_tutoken"
    echo ""
    exit 1
fi

# Configuración
EC2_HOST="107.21.145.151"
EC2_USER="ec2-user"
GITHUB_USERNAME="jlcp89"
OLD_SSH_KEY="$HOME/.ssh/academic_saas_aws"
NEW_SSH_KEY="$HOME/.ssh/academic-saas-github-actions"
NEW_SSH_KEY_PUB="$HOME/.ssh/academic-saas-github-actions.pub"

echo ""
echo "📋 Información de configuración:"
echo "- EC2 Host: $EC2_HOST"
echo "- Nueva clave SSH: $NEW_SSH_KEY"
echo ""

# Verificar que las claves existen
if [ ! -f "$NEW_SSH_KEY" ] || [ ! -f "$NEW_SSH_KEY_PUB" ]; then
    echo "❌ Error: Las nuevas claves SSH no existen"
    exit 1
fi

# Leer las claves
NEW_PUBLIC_KEY=$(cat "$NEW_SSH_KEY_PUB")
SSH_KEY_CONTENT=$(cat "$NEW_SSH_KEY")

echo "📝 Paso 1: Instrucciones para agregar la clave a EC2"
echo "---------------------------------------------------"
echo ""
echo "⚠️  IMPORTANTE: Debes agregar manualmente la clave pública a EC2"
echo ""
echo "Opción A - Usando AWS Console:"
echo "1. Ve a EC2 Console → Instances → Connect"
echo "2. Selecciona 'EC2 Instance Connect'"
echo "3. Una vez conectado, ejecuta:"
echo ""
echo "echo '$NEW_PUBLIC_KEY' >> ~/.ssh/authorized_keys"
echo ""
echo "Opción B - Si tienes acceso SSH actual:"
echo "ssh -i $OLD_SSH_KEY $EC2_USER@$EC2_HOST"
echo "echo '$NEW_PUBLIC_KEY' >> ~/.ssh/authorized_keys"
echo ""
read -p "Presiona ENTER cuando hayas agregado la clave a EC2..."

echo ""
echo "🧪 Paso 2: Probar la nueva clave"
echo "--------------------------------"

if ssh -i "$NEW_SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" "echo 'Test exitoso'" 2>/dev/null; then
    echo "✅ Conexión exitosa con la nueva clave"
else
    echo "❌ No se pudo conectar con la nueva clave"
    echo "Verifica que agregaste correctamente la clave pública"
    exit 1
fi

echo ""
echo "🔄 Paso 3: Actualizar secretos en GitHub"
echo "---------------------------------------"

# Función para actualizar secreto usando API
update_secret_api() {
    local repo=$1
    local secret_name="EC2_SSH_KEY"
    
    echo -n "Actualizando $secret_name en $repo... "
    
    # URL de la API
    local api_url="https://api.github.com/repos/$GITHUB_USERNAME/$repo/actions/secrets/$secret_name"
    
    # Actualizar el secreto
    response=$(curl -s -X PUT \
        -H "Authorization: token $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        -H "Content-Type: application/json" \
        -d "{\"encrypted_value\": \"temp\", \"key_id\": \"temp\"}" \
        "$api_url" 2>&1)
    
    # Nota: La API de GitHub requiere cifrado del secreto
    # Por simplicidad, mostramos las instrucciones manuales
    echo "Requiere actualización manual"
}

echo ""
echo "📋 Instrucciones para actualizar secretos manualmente:"
echo ""
echo "1. Frontend repository:"
echo "   https://github.com/$GITHUB_USERNAME/academic-saas-frontend/settings/secrets/actions"
echo "   - Haz clic en el lápiz junto a EC2_SSH_KEY"
echo "   - Pega el siguiente contenido:"
echo ""
echo "---INICIO DE LA CLAVE---"
cat "$NEW_SSH_KEY"
echo "---FIN DE LA CLAVE---"
echo ""
echo "2. Backend repository:"
echo "   https://github.com/$GITHUB_USERNAME/academic-saas-backend/settings/secrets/actions"
echo "   - Repite el mismo proceso"
echo ""

# Crear archivo con la clave para fácil copiado
echo "$SSH_KEY_CONTENT" > /tmp/ec2_ssh_key_for_github.txt
echo ""
echo "💡 La clave también se guardó en: /tmp/ec2_ssh_key_for_github.txt"
echo "   Puedes copiarla con: cat /tmp/ec2_ssh_key_for_github.txt | pbcopy (Mac)"
echo "   O: cat /tmp/ec2_ssh_key_for_github.txt | xclip -selection clipboard (Linux)"
echo ""

echo "✅ Script completado!"
echo ""
echo "📋 Resumen de acciones pendientes:"
echo "1. ✓ Clave pública agregada a EC2"
echo "2. ✓ Conexión probada exitosamente"
echo "3. ⏳ Actualizar EC2_SSH_KEY en ambos repositorios de GitHub"
echo ""
echo "Una vez actualices los secretos, re-ejecuta el workflow en GitHub Actions."