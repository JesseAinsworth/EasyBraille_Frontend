# 🚀 EasyBraille Frontend - Guía de Despliegue en Producción

## Preparación para Producción ✅

Este proyecto ha sido configurado para despliegue en producción con las siguientes optimizaciones:

### 🔧 Configuraciones de Producción

- ✅ Variables de entorno seguras (sin archivos .env commitidos)
- ✅ Optimizaciones de Next.js para producción
- ✅ Headers de seguridad configurados
- ✅ Compresión habilitada
- ✅ Optimización de imágenes
- ✅ Source maps deshabilitados en producción

### 🌐 Configuración del Backend

**URL del Backend**: `https://easybraillebackend-production.up.railway.app`

⚠️ **IMPORTANTE**: Actualmente el backend parece estar inactivo o mal configurado. Verifica que:
1. El backend esté ejecutándose en Railway
2. Las rutas estén configuradas correctamente
3. CORS esté habilitado para tu dominio frontend

### 📦 Despliegue

#### Opción 1: Vercel (Recomendado)

1. **Fork/Clone el repositorio**
2. **Conecta con Vercel**:
   - Ve a [vercel.com](https://vercel.com)
   - Conecta tu repositorio de GitHub
3. **Configura variables de entorno**:
   ```
   NEXT_PUBLIC_API_URL=https://easybraillebackend-production.up.railway.app
   NEXTAUTH_URL=https://tu-dominio.vercel.app
   NEXTAUTH_SECRET=tu-secreto-nextauth-super-seguro
   JWT_SECRET=tu-secreto-jwt-super-seguro
   MONGODB_URI=tu-conexion-mongodb-atlas
   ```
4. **Deploy**: Vercel hará el build automáticamente

#### Opción 2: Netlify

1. **Conecta tu repositorio**
2. **Build command**: `npm run build`
3. **Publish directory**: `.next`
4. **Configura las mismas variables de entorno**

#### Opción 3: Railway

1. **Conecta tu repositorio en Railway**
2. **Configura variables de entorno**
3. **Railway detectará automáticamente que es un proyecto Next.js**

#### Opción 4: Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### 🔐 Variables de Entorno Requeridas

Copia `.env.example` a `.env.local` para desarrollo local:

```bash
cp .env.example .env.local
```

**Variables críticas para producción**:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | URL del backend | `https://tu-backend.com` |
| `NEXTAUTH_URL` | URL de tu frontend | `https://tu-app.vercel.app` |
| `NEXTAUTH_SECRET` | Secreto para NextAuth | Genera uno seguro |
| `JWT_SECRET` | Secreto para JWT | Genera uno seguro |
| `MONGODB_URI` | Conexión a MongoDB | Atlas o servidor propio |

### 🔄 Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Iniciar en producción
npm run start

# Linting
npm run lint
```

### 🛠️ Solución de Problemas

#### Error 404 en rutas del backend
- Verifica que el backend esté funcionando
- Comprueba la variable `NEXT_PUBLIC_API_URL`
- Revisa los logs del backend

#### Errores de CORS
- Configura CORS en el backend para permitir tu dominio
- Asegúrate de que las headers estén correctamente configuradas

#### Variables de entorno no funcionan
- Las variables que empiezan con `NEXT_PUBLIC_` son visibles en el cliente
- Reinicia el servidor después de cambiar variables
- En producción, configura las variables en tu plataforma de hosting

### 📋 Checklist Pre-Deploy

- [ ] Backend funcionando y accesible
- [ ] Variables de entorno configuradas
- [ ] CORS configurado en el backend
- [ ] Base de datos configurada (MongoDB Atlas para producción)
- [ ] Secretos generados de forma segura
- [ ] URLs actualizadas para producción

### 🔒 Seguridad

- ❌ No commites archivos `.env*`
- ✅ Usa secretos fuertes y únicos
- ✅ Configura CORS correctamente
- ✅ Headers de seguridad habilitados
- ✅ HTTPS habilitado en producción

### 📞 Soporte

Si encuentras problemas:
1. Revisa los logs de tu plataforma de hosting
2. Verifica que el backend esté funcionando
3. Comprueba las variables de entorno
4. Revisa la documentación de la plataforma de hosting

---

**Status Actual**: ⚠️ El backend en Railway parece estar inactivo. Verifica la configuración del backend antes del despliegue.