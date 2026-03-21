EasyBraille Frontend

> **Estado**:**Listo para Producción** - Configurado para despliegue con backend en Railway

Una aplicación web moderna basada en React para educación y traducción braille, construida con Next.js 14, TypeScript y Tailwind CSS.

## Características

- **Traducción Braille**: Convierte texto a braille y viceversa
- **Teclado Braille Interactivo**: Aprende braille de forma práctica
- **Autenticación de Usuarios**: Sistema seguro de login y registro
- **Historial de Traducciones**: Guarda y gestiona tus traducciones
- **Panel de Administración**: Gestión de usuarios y estadísticas
- **Diseño Responsivo**: Optimizado para todos los tamaños de dispositivo
- **Accesibilidad Primero**: Compatible con lectores de pantalla

## Stack Tecnológico

- **Frontend**: Next.js 14, React 18, TypeScript
- **Estilos**: Tailwind CSS con componentes personalizados
- **Componentes UI**: Primitivos de Radix UI
- **Autenticación**: NextAuth.js con tokens JWT
- **Base de Datos**: MongoDB con Mongoose ODM
- **Gráficos**: Chart.js y Recharts para analytics
- **Iconos**: Lucide React
- **Backend**: Railway Production (`https://easybraillebackend-production.up.railway.app`)

##  Configuración para Producción

###  Importante: Estado del Backend
El backend está configurado para usar Railway, pero actualmente parece estar inactivo. Verifica el estado en: `https://easybraillebackend-production.up.railway.app`

###  Variables de Entorno

1. **Copia el archivo de ejemplo**:
```bash
cp .env.example .env.local
```

2. **Configura las variables requeridas**:
```env
NEXT_PUBLIC_API_URL=https://easybraillebackend-production.up.railway.app
NEXTAUTH_URL=http://localhost:3000  # Cambia por tu dominio en producción
NEXTAUTH_SECRET=tu-secreto-nextauth-super-seguro
JWT_SECRET=tu-secreto-jwt-super-seguro
MONGODB_URI=tu-conexion-mongodb
```

### Inicio Rápido

1. **Clona el repositorio**:
```bash
git clone https://github.com/JesseAinsworth/EasyBraille_Frontend.git
cd EasyBraille_Frontend
```

2. **Instala dependencias**:
```bash
npm install
```

3. **Configura variables de entorno** (ver arriba)

4. **Ejecuta el servidor de desarrollo**:
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) para ver la aplicación.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/             # Reusable UI components
├── lib/                   # Utility functions and configurations
├── services/              # API service functions
└── types/                 # TypeScript type definitions
```

## API Routes

The application includes several API endpoints:
- `/api/auth/*` - Authentication endpoints
- `/api/translations/*` - Translation management
- `/api/admin/*` - Administrative functions
- `/api/braille-image` - Braille image generation

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
