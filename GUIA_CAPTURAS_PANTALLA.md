# Guía de Capturas de Pantalla para Documentación de Pruebas

## 📸 Lista de Capturas Requeridas

### 1. Página Principal / Dashboard (2 capturas)
- [ ] **CAP-001:** Vista general del dashboard con usuario autenticado
- [ ] **CAP-002:** Vista sin autenticación (estado inicial)

### 2. Traductor - Pestaña Texto (8 capturas)

#### Traducción Español → Braille
- [ ] **CAP-003:** Interfaz inicial con campos vacíos
- [ ] **CAP-004:** Ingresando texto en español ("Hola mundo")
- [ ] **CAP-005:** Resultado de traducción mostrando símbolos Braille
- [ ] **CAP-006:** Botón "Copiar resultado" activado

#### Traducción Braille → Español  
- [ ] **CAP-007:** Después de hacer clic en "Cambiar dirección"
- [ ] **CAP-008:** Ingresando texto en Braille
- [ ] **CAP-009:** Resultado en español

#### Funcionalidades Adicionales
- [ ] **CAP-010:** Botón "Leer en voz alta" (con indicador de reproducción si es posible)

### 3. Traductor - Pestaña Imagen (6 capturas)

- [ ] **CAP-011:** Vista inicial con opciones "Usar cámara" y "Subir imagen"
- [ ] **CAP-012:** Ventana de selección de archivo abierta
- [ ] **CAP-013:** Imagen cargada (muestra la imagen de Braille "TU VOZ")
- [ ] **CAP-014:** Estado "Procesando imagen..." (toast/notificación)
- [ ] **CAP-015:** Resultado detectado: "Tu Voz"
- [ ] **CAP-016:** Mensaje de error si la imagen no es válida

### 4. Traductor - Pestaña Teclado Braille (6 capturas)

#### Teclado Virtual
- [ ] **CAP-017:** Teclado virtual completo visible (letras A-Z)
- [ ] **CAP-018:** Presionando una letra (resaltada)
- [ ] **CAP-019:** Texto apareciendo en campo de entrada

#### Teclado Arduino
- [ ] **CAP-020:** Botón "Conectar Arduino" (estado desconectado)
- [ ] **CAP-021:** Ventana de selección de puerto serial del navegador
- [ ] **CAP-022:** Estado "Conectado" con indicador verde
- [ ] **CAP-023:** Monitor mostrando "Presiona una tecla..." (Arduino desconectado)
- [ ] **CAP-024:** Arduino detectando tecla: "Código binario: 100000, Carácter: a"

### 5. Historial de Traducciones (4 capturas)

- [ ] **CAP-025:** Vista del historial vacío (usuario nuevo)
- [ ] **CAP-026:** Lista de traducciones guardadas
- [ ] **CAP-027:** Filtros de búsqueda (si existen)
- [ ] **CAP-028:** Detalle de una traducción específica

### 6. Configuración / Settings (3 capturas)

- [ ] **CAP-029:** Página de configuración del usuario
- [ ] **CAP-030:** Edición de perfil
- [ ] **CAP-031:** Guardado exitoso (mensaje de confirmación)

### 7. Autenticación (6 capturas)

#### Login
- [ ] **CAP-032:** Formulario de login vacío
- [ ] **CAP-033:** Credenciales ingresadas (ocultar password)
- [ ] **CAP-034:** Mensaje de error con credenciales incorrectas
- [ ] **CAP-035:** Login exitoso (redirección o mensaje)

#### Registro
- [ ] **CAP-036:** Formulario de registro completo
- [ ] **CAP-037:** Registro exitoso (mensaje de confirmación)

### 8. Funcionalidades de Exportación (3 capturas)

- [ ] **CAP-038:** Botón "Descargar PDF" visible
- [ ] **CAP-039:** PDF generado abierto mostrando la traducción
- [ ] **CAP-040:** Confirmación de descarga exitosa

### 9. Responsive / Móvil (4 capturas)

- [ ] **CAP-041:** Vista móvil del traductor (vertical)
- [ ] **CAP-042:** Menú hamburguesa abierto
- [ ] **CAP-043:** Teclado Braille en dispositivo móvil
- [ ] **CAP-044:** Cámara activada en móvil

### 10. Estados de Error (4 capturas)

- [ ] **CAP-045:** Error 404 - Página no encontrada
- [ ] **CAP-046:** Error de conexión (offline)
- [ ] **CAP-047:** Timeout de API (504)
- [ ] **CAP-048:** Validación de formulario (campos obligatorios)

### 11. Pruebas Unitarias (5 capturas)

- [ ] **CAP-049:** Terminal ejecutando `npm test` con resultados exitosos
- [ ] **CAP-050:** Salida completa de 32 tests pasando
- [ ] **CAP-051:** Ejecutando `npm run test:coverage`
- [ ] **CAP-052:** Tabla de cobertura mostrando 8.75% global y 100% en brailleTranslator
- [ ] **CAP-053:** Archivos de test en VS Code (estructura de carpetas)

### 12. Integración Arduino (Hardware) (6 capturas)

- [ ] **CAP-054:** Arduino Leonardo conectado por USB
- [ ] **CAP-055:** Arduino IDE con código cargado
- [ ] **CAP-056:** Monitor serial mostrando "LEER" y códigos binarios
- [ ] **CAP-057:** Teclado Braille físico (6 botones + 2 para voz)
- [ ] **CAP-058:** Presionando tecla en Arduino → aparece en navegador
- [ ] **CAP-059:** Botones de voz (A0, A1) activados

### 13. Deployment / Producción (4 capturas)

- [ ] **CAP-060:** AWS Amplify mostrando build exitoso
- [ ] **CAP-061:** URL de producción: https://www.easy-braille.com
- [ ] **CAP-062:** Variables de entorno configuradas en Amplify
- [ ] **CAP-063:** Logs del build mostrando "24 pages generated"

---

## 🎯 Instrucciones para Tomar las Capturas

### Preparación:
1. **Navegador limpio:** Usa modo incógnito o limpia caché
2. **Resolución estándar:** 1920x1080 o 1366x768
3. **Zoom al 100%:** No hagas zoom in/out
4. **Ocultar información sensible:** 
   - Passwords
   - Tokens/API keys
   - Datos personales reales

### Herramientas Recomendadas:

**Para capturas estáticas:**
- Windows: `Win + Shift + S` (Snipping Tool)
- Chrome: `Ctrl + Shift + P` → "Capture screenshot"
- Extensión: Awesome Screenshot

**Para videos/GIFs:**
- ScreenToGif (Windows)
- LICEcap (multiplataforma)
- OBS Studio (para demostraciones largas)

### Nomenclatura de Archivos:
```
CAP-XXX-descripcion.png

Ejemplos:
CAP-003-traductor-interfaz-inicial.png
CAP-024-arduino-detectando-tecla-a.png
CAP-050-test-coverage-output.png
```

### Organización de Carpetas:
```
EasyBraille_Frontend/
├── docs/
│   └── capturas/
│       ├── 01-pagina-principal/
│       ├── 02-traductor-texto/
│       ├── 03-traductor-imagen/
│       ├── 04-teclado-braille/
│       ├── 05-historial/
│       ├── 06-autenticacion/
│       ├── 07-pruebas-unitarias/
│       ├── 08-hardware-arduino/
│       └── 09-deployment/
```

---

## 📋 Checklist de Validación

Antes de finalizar, verifica que tienes:

- [ ] **Al menos 60 capturas** de las 63 listadas
- [ ] **Capturas en alta resolución** (mínimo 1280px de ancho)
- [ ] **Nombres descriptivos** siguiendo la convención CAP-XXX
- [ ] **Sin información sensible** expuesta
- [ ] **Capturas organizadas** en carpetas por funcionalidad
- [ ] **README.md** en cada carpeta explicando las capturas

---

## 🎬 Capturas Especiales (Opcionales pero Recomendadas)

### Video/GIF Demostraciones:
- [ ] **VID-001:** Flujo completo de traducción texto → braille → voz (30 seg)
- [ ] **VID-002:** Proceso de captura de imagen → detección → resultado (45 seg)
- [ ] **VID-003:** Uso del teclado Arduino en tiempo real (60 seg)
- [ ] **VID-004:** Ejecución de pruebas unitarias completas (30 seg)

### Diagramas (Si no existen):
- [ ] **DIAG-001:** Arquitectura del sistema (Frontend, Backend, IA)
- [ ] **DIAG-002:** Flujo de datos del traductor
- [ ] **DIAG-003:** Esquema de base de datos MongoDB

---

## 💡 Tips para Capturas Efectivas

1. **Contexto claro:** Incluye barras de navegación y URLs cuando sea relevante
2. **Destaca elementos importantes:** Usa flechas o círculos rojos (edición posterior)
3. **Antes y después:** Para cambios de estado, toma 2 capturas consecutivas
4. **Capturas limpias:** Cierra pestañas innecesarias del navegador
5. **Iluminación consistente:** Si capturas hardware, usa buena iluminación

---

## 📤 Entrega Final

Una vez completadas todas las capturas, crea un documento:

**`DOCUMENTACION_VISUAL_PRUEBAS.md`**

Estructura sugerida:
```markdown
# Documentación Visual de Pruebas - EasyBraille

## 1. Funcionalidades Validadas

### 1.1 Traductor Español ↔ Braille
![Interfaz inicial](./capturas/02-traductor-texto/CAP-003-traductor-interfaz-inicial.png)
*Descripción: Vista inicial del traductor con campos vacíos...*

[... resto de capturas con descripciones]
```

---

## ⏱️ Tiempo Estimado

- **Capturas básicas (1-40):** 2 horas
- **Capturas técnicas (41-53):** 1 hora  
- **Capturas Arduino (54-59):** 1.5 horas (requiere hardware)
- **Capturas deployment (60-63):** 30 minutos
- **Organización y documentación:** 1 hora

**Total estimado:** 6 horas

---

**Próximo paso:** Empezar con las capturas de la categoría 1 (Página Principal) e ir avanzando secuencialmente.
