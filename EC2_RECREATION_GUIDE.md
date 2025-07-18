# Guía Completa: Recrear Instancia EC2 con Nueva Clave SSH

## 📋 Resumen
Esta guía documenta el proceso completo para recrear la instancia EC2 con la nueva clave SSH que ya está configurada en los repositorios de GitHub.

## 🔧 Prerequisitos
- AWS CLI configurado con credenciales
- Clave SSH nueva ya creada: `~/.ssh/academic-saas-github-actions`
- Secretos de GitHub actualizados con la nueva clave
- IP Elástica existente: 107.21.145.151

## 📝 Paso a Paso

### 1️⃣ Eliminar Recursos Actuales (Mantener IP Elástica)

#### En la Consola AWS:
1. **EC2 → Instances**
   - Selecciona la instancia actual
   - Actions → Instance State → Terminate
   - Confirmar terminación
   - ⚠️ NO eliminar la IP Elástica

2. **EC2 → Key Pairs**
   - Eliminar el key pair antiguo (si existe)

### 2️⃣ Importar Nueva Clave SSH a AWS

```bash
# Ejecutar el script de importación
./aws-import-keypair.sh
```

O manualmente en AWS Console:
1. EC2 → Key Pairs → Import key pair
2. Name: `academic-saas-github-actions`
3. Pegar contenido de: `~/.ssh/academic-saas-github-actions.pub`

### 3️⃣ Crear Nueva Instancia EC2

#### Configuración de la Instancia:

**1. Choose AMI:**
- Amazon Linux 2 AMI (HVM) - Kernel 5.10
- 64-bit (x86)

**2. Choose Instance Type:**
- `t2.micro` (Free tier eligible)

**3. Configure Instance:**
- Network: Default VPC
- Subnet: Seleccionar una subnet pública
- Auto-assign Public IP: Enable

**4. Add Storage:**
- Size: 10 GB
- Volume Type: GP3
- Delete on Termination: Yes

**5. Add Tags:**
- Name: `academic-saas-dev`
- Environment: `dev`

**6. Configure Security Group:**
Crear nuevo security group con estas reglas:

| Type | Protocol | Port Range | Source |
|------|----------|------------|---------|
| SSH | TCP | 22 | 0.0.0.0/0 |
| HTTP | TCP | 80 | 0.0.0.0/0 |
| Custom TCP | TCP | 3000 | 0.0.0.0/0 |
| Custom TCP | TCP | 8000 | 0.0.0.0/0 |

**7. Review and Launch:**
- Select key pair: `academic-saas-github-actions`
- Launch instance

### 4️⃣ Asociar IP Elástica

1. Esperar que la instancia esté "running"
2. EC2 → Elastic IPs
3. Seleccionar la IP 107.21.145.151
4. Actions → Associate Elastic IP address
5. Instance: Seleccionar la nueva instancia
6. Associate

### 5️⃣ Configurar la Nueva Instancia

```bash
# Conectar a la nueva instancia
ssh -i ~/.ssh/academic-saas-github-actions ec2-user@107.21.145.151

# Copiar el script de configuración
scp -i ~/.ssh/academic-saas-github-actions setup-new-ec2.sh ec2-user@107.21.145.151:~/

# Ejecutar el script de configuración
ssh -i ~/.ssh/academic-saas-github-actions ec2-user@107.21.145.151 "bash ~/setup-new-ec2.sh"

# Reconectar para aplicar cambios de grupo
exit
ssh -i ~/.ssh/academic-saas-github-actions ec2-user@107.21.145.151

# Verificar Docker
docker run hello-world
```

### 6️⃣ Probar el Deployment

1. **En GitHub:**
   - Ir a Actions en el repositorio frontend
   - Re-run el workflow fallido
   - Verificar que se conecta por SSH correctamente

2. **Verificar localmente:**
   ```bash
   ./verify-deployment.sh
   ```

### 7️⃣ Verificación Final

URLs para verificar:
- Frontend: http://107.21.145.151:3000
- Backend API: http://107.21.145.151:8000
- API Docs: http://107.21.145.151:8000/api/docs/
- Django Admin: http://107.21.145.151:8000/admin/

## 🐛 Troubleshooting

### Problema: SSH Connection Timeout
```bash
# Verificar security group permite SSH desde tu IP
# Verificar que la instancia está en subnet pública
# Verificar que la IP elástica está asociada
```

### Problema: Docker Permission Denied
```bash
# Asegurarse de haber salido y reconectado después del setup
# Verificar grupo: groups
# Debe mostrar: ec2-user docker
```

### Problema: GitHub Actions sigue fallando
```bash
# Verificar el secreto EC2_SSH_KEY tiene el contenido correcto
# No debe tener espacios extra al inicio/final
# Debe incluir las líneas BEGIN y END
```

## 📊 Scripts Incluidos

1. **aws-import-keypair.sh** - Importa el key pair a AWS
2. **setup-new-ec2.sh** - Configura la instancia con Docker y herramientas
3. **verify-deployment.sh** - Verifica que todo funciona correctamente

## 🔒 Seguridad

- La clave SSH está en: `~/.ssh/academic-saas-github-actions`
- Los secretos están en GitHub Settings → Secrets
- El security group permite acceso público (considerar restringir en producción)

## ✅ Checklist Final

- [ ] Instancia antigua terminada
- [ ] Key pair importado a AWS
- [ ] Nueva instancia creada con el key pair correcto
- [ ] IP elástica asociada (107.21.145.151)
- [ ] Instancia configurada con Docker
- [ ] GitHub Actions deployment exitoso
- [ ] Servicios accesibles por HTTP

## 📝 Notas

- La instancia usa Amazon Linux 2
- Docker y Docker Compose están instalados
- Los puertos 3000 (frontend) y 8000 (backend) están abiertos
- La IP elástica se mantiene para no cambiar configuraciones