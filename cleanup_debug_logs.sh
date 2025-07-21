#!/bin/bash

echo "🧹 Limpiando logs de depuración..."

# Remove debug logs from sidebar
sed -i '/console\.log.*🔍 Sidebar render/d' src/components/layout/sidebar.tsx
sed -i '/console\.log.*🔍 Filtered menu items/d' src/components/layout/sidebar.tsx

# Remove debug logs from auth context
sed -i '/console\.log.*🔍 Auth context/d' src/contexts/auth-context.tsx

echo "✅ Logs de depuración eliminados"
echo "📋 Problemas corregidos:"
echo "1. ✅ Duplicación de /api/ en queries.ts"
echo "2. ✅ Tipos faltantes agregados"
echo "3. ✅ Métodos request() corregidos"
echo "4. ✅ Error de sintaxis en sidebar corregido"
echo "5. 🔍 Logs de depuración agregados temporalmente" 