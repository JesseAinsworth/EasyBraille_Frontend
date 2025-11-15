# EasyBraille Frontend - Deployment Guide

## ⚠️ PROBLEMA IDENTIFICADO: AWS Amplify Hosting vs Next.js API Routes

### 🔍 Error Actual:
```
POST https://www.easy-braille.com/api/auth/register 404 (Not Found)
```

### 📋 Causa del Problema:
- **AWS Amplify Hosting** es para contenido estático
- **Next.js API Routes** requieren un runtime de servidor
- Las rutas `/api/*` no están disponibles en hosting estático

## 🚀 SOLUCIONES RECOMENDADAS:

### Opción 1: Vercel (RECOMENDADO) ⭐
```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Deploy desde el directorio del proyecto
cd EBFrontend
vercel

# 3. Configurar variables de entorno en Vercel Dashboard:
# - NEXT_PUBLIC_API_URL=https://easybraille-backend.onrender.com
# - NEXTAUTH_SECRET=(generar secreto)
# - JWT_SECRET=(generar secreto)
```

**Ventajas:**
- ✅ Soporte nativo para Next.js API Routes
- ✅ Deploy automático desde GitHub
- ✅ Edge Functions integradas
- ✅ Configuración mínima requerida

### Opción 2: Netlify
```bash
# 1. Build para Netlify
npm run build

# 2. Deploy carpeta .next
# Configurar variables de entorno en Netlify Dashboard
```

### Opción 3: AWS Amplify con SSR (Complejo)
- Requiere configuración de Lambda Functions
- Configuración de API Gateway
- Mayor complejidad de setup

## 📁 Archivos de Configuración Incluidos:

### ✅ `vercel.json` - Para deployment en Vercel
```json
{
  "version": 2,
  "name": "easybraille-frontend",
  "env": {
    "NEXT_PUBLIC_API_URL": "https://easybraille-backend.onrender.com"
  }
}
```

### ✅ `amplify.yml` - Para deployment en Amplify (limitado)
⚠️ **Nota:** Solo funcionará para páginas estáticas, NO para rutas API

## 🎯 ACCIÓN RECOMENDADA:

**Migrar a Vercel** para tener soporte completo de Next.js con API Routes funcionando correctamente.

## 🔧 Variables de Entorno Requeridas:

```env
NEXT_PUBLIC_API_URL=https://easybraille-backend.onrender.com
NEXTAUTH_URL=https://tu-dominio.vercel.app
NEXTAUTH_SECRET=tu-secreto-nextauth-seguro
JWT_SECRET=tu-secreto-jwt-seguro
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/easybraille
```

---

**Estado:** Frontend listo para deployment, recomendamos Vercel para funcionalidad completa.