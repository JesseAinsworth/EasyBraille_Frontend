# EasyBraille Local Backend

## 🎯 Objetivo
Crear un backend local completo que incluya todas las funcionalidades que necesita el frontend:
- ✅ Sistema de autenticación (register/login)
- ✅ Base de datos de usuarios
- ✅ Historial de traducciones
- ✅ Panel de administración
- ✅ Integración con Railway para detección de braille

## 🏗️ Arquitectura

```
Frontend (Next.js) → Local Backend (Express/Node.js) → Railway Backend (Braille Detection)
                  ↓
               MongoDB Local
```

## 📋 Plan de Implementación

### Fase 1: Backend Base
- [ ] Crear servidor Express
- [ ] Configurar MongoDB local
- [ ] Crear modelos de datos (User, Translation)

### Fase 2: Autenticación
- [ ] Ruta POST /api/auth/register
- [ ] Ruta POST /api/auth/login
- [ ] JWT token management

### Fase 3: Traducciones
- [ ] Ruta POST /api/translations (guardar historial)
- [ ] Ruta GET /api/translations (obtener historial)
- [ ] Integración con Railway para detección

### Fase 4: Administración
- [ ] Rutas /api/admin/*
- [ ] Gestión de usuarios
- [ ] Estadísticas

### Fase 5: Integración
- [ ] Configurar frontend para usar backend local
- [ ] Proxy requests de braille a Railway
- [ ] Testing completo

## 🔧 Stack Técnico
- **Backend**: Node.js + Express
- **Base de datos**: MongoDB local
- **Autenticación**: JWT
- **Validación**: Joi/Zod
- **Detección Braille**: Proxy a Railway