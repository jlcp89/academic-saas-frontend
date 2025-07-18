# Verificación de Secretos - Lista de Chequeo

## 1. ¿Agregaste los secretos en el lugar correcto?

Asegúrate de estar en:
- **Repositorio**: `academic-saas-frontend` (NO el backend)
- **URL correcta**: https://github.com/jlcp89/academic-saas-frontend/settings/secrets/actions
- **Sección**: "Repository secrets" (NO environment secrets)

## 2. Verifica que estos secretos estén listados:

- [ ] EC2_SSH_KEY
- [ ] EC2_HOST_DEV
- [ ] PERSONAL_ACCESS_TOKEN
- [ ] NEXT_PUBLIC_API_URL_DEV
- [ ] NEXTAUTH_URL_DEV
- [ ] NEXTAUTH_SECRET_DEV

## 3. Problemas comunes con EC2_SSH_KEY:

### ❌ Error común 1: Espacios o saltos de línea extra
- NO agregues espacios antes o después de la llave
- Copia exactamente desde `-----BEGIN` hasta `-----END`

### ❌ Error común 2: Formato incorrecto
La llave debe verse EXACTAMENTE así:
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAACFwAAAAdzc2gtcn
[... más líneas ...]
mmdMQgk4cL8AAAAVYWNhZGVtaWMtc2Fhcy1hd3MtbmV3AQIDBAUG
-----END OPENSSH PRIVATE KEY-----
```

### ❌ Error común 3: Usar la llave pública en lugar de la privada
- NO uses el archivo `.pub`
- USA el archivo sin extensión: `academic_saas_aws`

## 4. Para verificar que los secretos existen:

Ve a: https://github.com/jlcp89/academic-saas-frontend/actions/workflows/test-secrets.yml

Haz clic en "Run workflow" → "Run workflow"

Esto te mostrará:
- ✅ Qué secretos están configurados
- ❌ Cuáles faltan
- Si la conexión SSH funciona

## 5. Si sigues teniendo problemas:

### Opción A: Verifica manualmente
1. Ve a Settings → Secrets and variables → Actions
2. Deberías ver 6 secretos listados
3. Si falta EC2_SSH_KEY, agrégalo de nuevo

### Opción B: Elimina y vuelve a crear EC2_SSH_KEY
1. Si ya existe, haz clic en el lápiz para editarlo
2. O elimínalo y créalo de nuevo
3. Pega TODO el contenido de la llave (incluyendo headers)

### Opción C: Verifica que no estés usando "Environment secrets"
- Los secretos deben estar en "Repository secrets"
- NO en "Environment secrets"
- NO en "Organization secrets"