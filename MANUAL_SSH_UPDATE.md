# Actualización Manual de Claves SSH

## 🔐 Nueva Clave SSH Generada

### 1. Agregar la clave pública a EC2

Conéctate a tu instancia EC2 y ejecuta:

```bash
echo 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDu0tKsdB14/rBYoR9vwfTKvHjsnrDpoo/AReovzos/j/umBl2notS4kP3TsoWJwCVm89Sdpf6g5E3qoWD4v/3iL5GvQXSFtfctQ2d+sGiZT3PICSsmWlI7sJCkCKUszTDLShq9+A5c7uzI6Iym0Gf5Wa6liMCCenf/Fp/6eM4X8ux0jyPU8eWUlQEr/2mkH+OAamh/DyFYzP4KC7RVX7ipeU2uEIbN+HP/pyE8q+uFE/Y071dmgWgxniX1pzqL15+uiUdAD7SBvwccLkuRqiPYwtO8Ovid4NfXECdskovemRACNxe/a/E5nAjK+a+FyhhWwYuOOHRX2+Tp+s/nFRBDR5feL8OgDNIupievQkN/nsPPyM2NMI/6+0NQuI5NLOJBPjX1n8U4Z5QC4oRy2NLK0kOHCNfkpSfio2Fjg3I3nT3j4goJqScFVBv8l/3z8Dv+cHvHSY+YDazvjYI7Z2Mo33x8G4yGkbKsciSoTMmnjWuClAvkWQoP6/jrawzRdLaN0ZyykULmdwIj7AUjm4Ey7eJArzBpSP+9btG20Oug+nee7wz5fAQFraQehj2AhNhrpIOQYadAHEwupdckzFhXxmgVR2yLfz6N9V0NYf7LMt23+nqJqIthPwXMHLBTnfSGftIGAUtx7+OJHWq5/1iDh1o3IUrURMufZFhcDctejw== github-actions@academic-saas' >> ~/.ssh/authorized_keys
```

### 2. Actualizar EC2_SSH_KEY en GitHub

#### Frontend Repository:
1. Ve a: https://github.com/jlcp89/academic-saas-frontend/settings/secrets/actions
2. Haz clic en el lápiz junto a `EC2_SSH_KEY`
3. Borra el contenido actual
4. Pega TODO el siguiente contenido (incluyendo las líneas BEGIN y END):

```
-----BEGIN OPENSSH PRIVATE KEY-----
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
-----END OPENSSH PRIVATE KEY-----
```

5. Guarda los cambios

#### Backend Repository:
1. Ve a: https://github.com/jlcp89/academic-saas-backend/settings/secrets/actions
2. Repite el mismo proceso con `EC2_SSH_KEY`

### 3. Verificar la conexión

Prueba la nueva clave localmente:
```bash
ssh -i ~/.ssh/academic-saas-github-actions ec2-user@107.21.145.151
```

### 4. Re-ejecutar el workflow

1. Ve a la pestaña Actions en GitHub
2. Encuentra el workflow fallido
3. Haz clic en "Re-run all jobs"

## 📋 Checklist

- [ ] Clave pública agregada a EC2
- [ ] EC2_SSH_KEY actualizado en frontend repo
- [ ] EC2_SSH_KEY actualizado en backend repo
- [ ] Conexión SSH probada localmente
- [ ] Workflow re-ejecutado

## 🔒 Información de las claves

- **Archivo local**: `~/.ssh/academic-saas-github-actions`
- **Creada el**: 2025-01-18
- **Propósito**: GitHub Actions deployments