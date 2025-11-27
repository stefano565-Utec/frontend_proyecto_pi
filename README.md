# Frontend - Sistema de Gestión de Comedor UTEC

## 📋 Descripción

Aplicación móvil y web desarrollada con **React Native** y **Expo** para el sistema de gestión de comedor universitario. Permite a usuarios, vendedores y administradores gestionar menús, pedidos, pagos y feedback de manera intuitiva. Incluye modo oscuro, navegación adaptativa (tabs en móvil, navbar en web), y integración completa con Mercado Pago para pagos mediante Yape.

## 🏗️ Arquitectura

El proyecto utiliza **Expo Router** para la navegación basada en archivos:

```
frontend_proyecto_pi/
├── app/                    # Rutas y pantallas (Expo Router)
│   ├── (tabs)/            # Pantallas con navegación por tabs
│   │   ├── home.tsx       # Pantalla principal (USER)
│   │   ├── menus.tsx      # Menús disponibles (USER)
│   │   ├── mis-pedidos.tsx# Historial de pedidos (USER)
│   │   ├── gestionar-menus.tsx # Gestión de menús (VENDOR)
│   │   ├── pedidos-vendor.tsx  # Pedidos del vendor (VENDOR)
│   │   ├── dashboard.tsx  # Dashboard (ADMIN)
│   │   ├── gestionar-usuarios.tsx # Gestión usuarios (ADMIN)
│   │   ├── gestionar-vendors.tsx  # Gestión vendors (ADMIN)
│   │   ├── comentarios.tsx # Comentarios (ADMIN/VENDOR)
│   │   ├── perfil.tsx     # Perfil de usuario
│   │   └── pago-yape.tsx  # Pantalla de pago Yape
│   ├── _layout.tsx        # Layout raíz con providers
│   ├── (tabs)/_layout.tsx # Layout de tabs/navbar
│   ├── index.tsx          # Redirección inicial según rol
│   ├── login.tsx          # Login y registro
│   ├── +not-found.tsx     # Página 404
│   └── +html.tsx          # Configuración HTML para web
├── components/            # Componentes reutilizables
│   ├── Button/           # Botón con variantes y hover
│   ├── Card/             # Tarjeta contenedora
│   ├── MenuCard/         # Tarjeta de item del menú
│   ├── PedidoCard/       # Tarjeta de pedido
│   ├── PaymentModal/     # Modal de selección de pago
│   ├── Navbar/           # Barra de navegación web
│   ├── Loading/          # Indicador de carga
│   └── ToggleSwitch/     # Switch para modo oscuro
├── context/              # Context API
│   ├── AuthContext.tsx   # Autenticación y usuario
│   └── ThemeContext.tsx  # Tema claro/oscuro
├── services/             # Servicios API
│   ├── api.ts           # Cliente Axios configurado
│   └── index.ts         # Exports de servicios
├── types/               # TypeScript types
│   └── index.ts
├── validations/         # Validaciones con Zod
│   └── auth.ts
└── constants/          # Constantes (si aplica)
```

## 🛠️ Tecnologías

- **React Native 0.81.5** - Framework móvil multiplataforma
- **Expo ~54.0.23** - Plataforma de desarrollo
- **Expo Router ~6.0.14** - Navegación basada en archivos
- **TypeScript 5.9.2** - Tipado estático
- **Axios 1.13.2** - Cliente HTTP
- **Zod 3.25.76** - Validación de esquemas
- **@react-native-async-storage/async-storage** - Almacenamiento local
- **date-fns 4.1.0** - Manipulación de fechas
- **@expo/vector-icons** - Iconos (FontAwesome)
- **expo-web-browser** - Navegador web integrado
- **expo-linking** - Deep linking

## 📦 Instalación

### Requisitos Previos

- **Node.js 18+** o **Bun**
- **npm**, **yarn**, o **bun**
- **Expo CLI** (opcional, se usa npx)

### Pasos de Instalación

1. **Instalar dependencias:**
```bash
# Con npm
npm install

# Con yarn
yarn install

# Con bun (recomendado)
bun install
```

2. **Configurar URL del backend** en `services/api.ts`:
```typescript
const api = axios.create({
  baseURL: 'http://localhost:8080', // Cambiar en producción
  // ...
});
```

3. **Iniciar el servidor de desarrollo:**
```bash
# Con npm
npm start

# Con bun
bun start

# Modo específico
npm run web      # Solo web
npm run android  # Android
npm run ios      # iOS
```

4. **Abrir la aplicación:**
   - **Web**: Presiona `w` en la terminal o abre `http://localhost:8081`
   - **Móvil**: Escanea el QR con Expo Go (Android/iOS)
   - **Android Emulator**: Presiona `a` en la terminal
   - **iOS Simulator**: Presiona `i` en la terminal

## 🚀 Ejecución

### Desarrollo

```bash
# Iniciar servidor Expo
npm start

# Limpiar caché y reiniciar
npm start -- --clear

# Modo específico con limpieza
npm run web -- --clear
```

### Build para Producción

```bash
# Web (genera carpeta dist/)
npx expo export:web

# Android (requiere EAS)
eas build --platform android

# iOS (requiere EAS)
eas build --platform ios
```

## 📱 Pantallas y Funcionalidades

### 👤 Usuario Regular (USER)

#### 1. **Home** (`/home`)
- Vista principal con bienvenida
- Información sobre cómo funciona el sistema
- Botón de acceso rápido a menús disponibles
- Iconos mejorados con FontAwesome

#### 2. **Menús** (`/menus`)
- Ver menús disponibles por vendor
- **Búsqueda** por nombre de item
- **Filtros**:
  - Por fecha (hoy, mañana, semana)
  - Por vendor
- Agregar items al carrito
- Ver detalles de cada item (precio, stock, disponibilidad)
- Selector de cantidad mejorado (botones +/-)
- Carrito agrupado por vendor
- Crear pedidos separados por vendor

#### 3. **Mis Pedidos** (`/mis-pedidos`)
- Ver historial de pedidos
- **Búsqueda** por código de recogida
- **Filtros** por estado
- Pagar pedidos pendientes (Yape)
- Ver estado de pedidos
- Dar feedback a pedidos completados:
  - Calificación con estrellas (1-5)
  - Comentario opcional
  - Solo un comentario por pedido
- Cancelar pedidos pendientes
- Pull to refresh

### 🏪 Vendedor (VENDOR)

#### 1. **Gestionar Menús** (`/gestionar-menus`)
- Ver todos los menús del vendor (incluyendo pasados)
- **Búsqueda** por nombre de item
- Crear nuevos items del menú:
  - Nombre, descripción, precio
  - Selección de fecha (no permite fechas pasadas)
  - Stock inicial
- Editar items existentes
- Eliminar disponibilidades específicas (por fecha)
- Eliminar menús completos
- Ver stock y disponibilidad por fecha

#### 2. **Pedidos** (`/pedidos-vendor`)
- Ver pedidos del vendor
- **Búsqueda** por código de recogida
- **Filtros** por estado:
  - Todos
  - Pendientes de pago
  - Pagados
  - Listos para recoger
  - Completados
  - Cancelados
- Marcar pedidos como listos para recoger
- Marcar pedidos como completados
- Ver detalles completos de cada pedido
- Pull to refresh

#### 3. **Comentarios** (`/comentarios`)
- Ver comentarios de sus menús únicamente
- **Filtros**:
  - Por calificación (1-5 estrellas)
  - Por fecha (hoy, semana, mes, todos)
- Ver calificación promedio
- Ver nombre del item y vendor

### 👨‍💼 Administrador (ADMIN)

#### 1. **Dashboard** (`/dashboard`)
- Estadísticas generales del sistema:
  - Total de usuarios
  - Total de vendors
  - Total de menús
  - Total de pedidos
  - Pedidos completados
  - Ingresos totales
- **Nota**: Solo cuenta pedidos no cancelados
- Accesos rápidos a otras secciones

#### 2. **Gestionar Usuarios** (`/gestionar-usuarios`)
- Ver todos los usuarios
- **Búsqueda** por nombre, email o rol
- Cambiar roles (USER, VENDOR, ADMIN)
- Asociar usuarios VENDOR con vendors
- Ver información completa de cada usuario

#### 3. **Gestionar Vendors** (`/gestionar-vendors`)
- Ver todos los vendors
- Crear nuevos vendors:
  - Nombre
  - Ubicación
  - Hora de apertura y cierre
- Editar vendors existentes
- Eliminar vendors
- Modal de confirmación para eliminación

#### 4. **Comentarios** (`/comentarios`)
- Ver **todos** los comentarios del sistema
- **Filtros**:
  - Por calificación (1-5 estrellas)
  - Por fecha (hoy, semana, mes, todos)
- Ver calificación promedio
- Ver nombre del item, vendor y fecha

### 🔄 Común a Todos

#### **Perfil** (`/perfil`)
- Ver información del usuario (solo lectura):
  - Nombre completo
  - Email
  - Rol
- Toggle de modo oscuro/claro
- Botón de cerrar sesión con hover effect

## 💳 Sistema de Pagos (Mercado Pago - Yape)

### Flujo de Pago Yape

1. **Usuario crea pedido** desde el carrito
2. **Navega a pantalla de pago** (`/pago-yape`)
3. **Ingresa datos de Yape**:
   - Número de celular (asociado a cuenta Yape)
   - Código OTP de 6 dígitos (de la app Yape)
4. **Genera token** (`POST /payment/yape/token`)
5. **Ingresa email** del pagador
6. **Crea pago** (`POST /payment/yape/{orderId}`)
7. **Resultado**:
   - Si es aprobado: Pedido cambia a `PAGADO`
   - Si es rechazado: Muestra error y pedido queda `PENDIENTE_PAGO`

### Pantalla de Pago (`/pago-yape`)

- Input de número de celular
- Input de código OTP
- Botón para generar token
- Input de email del pagador
- Botón para crear pago
- Manejo de errores descriptivos
- Loading states

### Requisitos

- **Credenciales de producción** de Mercado Pago
- **Email válido** (no de prueba)
- **Número y OTP reales** de Yape

## 🎨 Modo Oscuro

El sistema incluye un **modo oscuro completo** con:

- **Toggle en perfil**: Switch visual para cambiar entre claro/oscuro
- **Persistencia**: La preferencia se guarda en AsyncStorage
- **Tema adaptativo**: Todos los componentes se adaptan automáticamente
- **Colores coherentes**: Paleta de colores optimizada para ambos modos

### Colores del Tema

**Modo Claro:**
- Fondo: `#F5F7FA`
- Superficie: `#FAFBFC`
- Texto: `#2C3E50`
- Primario: `#BEE0E7`
- Borde: `#D1D9E0`

**Modo Oscuro:**
- Fondo: `#1A1A1A`
- Superficie: `#2A2A2A`
- Texto: `#D0D0D0`
- Primario: `#4A9BA8`
- Borde: `#3A3A3A`

## 🔐 Autenticación

### Flujo de Autenticación

1. Usuario se registra o inicia sesión en `/login`
2. Backend devuelve JWT token
3. Token se almacena en **AsyncStorage**
4. Token se incluye automáticamente en todas las peticiones API
5. Si el token expira o hay error 401, se redirige al login

### Context API

El `AuthContext` maneja:
- Estado de autenticación (`isAuthenticated`)
- Información del usuario (`user`)
- Funciones de login/logout
- Persistencia del token
- Loading state

### Validaciones

Los formularios de login/registro usan **Zod** para validación:
- Email válido
- Contraseña mínima 6 caracteres
- Contraseña con mayúscula, minúscula y número (registro)
- Campos requeridos

## 📡 Servicios API

Todos los servicios están en `services/api.ts` y usan Axios:

### Configuración Base

```typescript
const api = axios.create({
  baseURL: 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Interceptores

**Request Interceptor:**
- Agrega token JWT automáticamente a todas las peticiones
- Header: `Authorization: Bearer <token>`

**Response Interceptor:**
- Maneja errores 401 (no autorizado) y redirige al login
- Maneja errores de red
- Muestra mensajes de error descriptivos

### Servicios Disponibles

- **authService**: `login()`, `register()`
- **userService**: `getMe()`, `getById()`, `getAll()`, `updateRole()`
- **vendorService**: `getAll()`, `getById()`, `create()`, `update()`, `delete()`
- **menuItemService**: `getAll()`, `getToday()`, `getByDate()`, `getByVendor()`, `create()`, `update()`, `delete()`, `deleteAvailability()`
- **orderService**: `create()`, `getById()`, `getByUserId()`, `getByVendorId()`, `pay()`, `ready()`, `complete()`, `cancel()`
- **paymentService**: `generateYapeToken()`, `createYapePayment()`
- **feedbackService**: `getAll()`, `getByMenuItem()`, `getByVendor()`, `create()`
- **dashboardService**: `getStats()`

## 🎨 Componentes Principales

### Button

Botón reutilizable con:
- **Variantes**: `primary`, `secondary`, `danger`
- **Hover effects** en web (sombra, transform, cambio de color)
- **Estados**: `disabled`
- **Estilos personalizados** via `style` prop
- **Soporte para modo oscuro**

```tsx
<Button variant="primary" onPress={handlePress}>
  Texto del botón
</Button>
```

### Card

Contenedor con estilo consistente:
- Fondo adaptativo al tema
- Sombra sutil
- Border radius
- Padding consistente

```tsx
<Card style={customStyles}>
  Contenido
</Card>
```

### MenuCard

Tarjeta para mostrar items del menú:
- Nombre y descripción
- Precio formateado
- Stock y disponibilidad
- Botón de agregar al carrito
- Adaptado al tema

### PedidoCard

Tarjeta para mostrar pedidos:
- Información del pedido
- Estado con colores
- Items incluidos
- Acciones según el estado
- Código de recogida

### PaymentModal

Modal de selección de método de pago:
- Selección de método (Yape)
- Información del vendor
- Total a pagar
- Botones de acción

### Navbar

Barra de navegación horizontal para web:
- Título "Comedor UTEC"
- Enlaces de navegación
- Indicador de página activa
- Hover effects
- Solo visible en web (oculta tabs)

### ToggleSwitch

Switch para modo oscuro:
- Animación suave
- Colores adaptativos
- Estados visuales claros

### Loading

Indicador de carga:
- Spinner animado
- Adaptado al tema
- Reutilizable

## 🔄 Gestión de Estado

- **Context API**: 
  - `AuthContext`: Autenticación global
  - `ThemeContext`: Tema claro/oscuro
- **useState**: Estado local de componentes
- **AsyncStorage**: 
  - Persistencia de token JWT
  - Persistencia de preferencia de tema

## 📱 Navegación

### Estructura de Tabs (Móvil)

Los tabs se muestran según el rol del usuario:

**USER:**
- Home
- Menús
- Mis Pedidos
- Perfil

**VENDOR:**
- Pedidos
- Gestionar Menús
- Comentarios
- Perfil

**ADMIN:**
- Dashboard
- Gestionar Usuarios
- Gestionar Vendors
- Comentarios
- Perfil

### Navbar (Web)

En web, los tabs se reemplazan por una **navbar horizontal**:
- Título a la izquierda
- Enlaces de navegación a la derecha
- Indicador de página activa
- Hover effects

### Redirección Inicial

`app/index.tsx` redirige según el rol:
- **ADMIN** → `/dashboard`
- **VENDOR** → `/pedidos-vendor`
- **USER** → `/home`
- **No autenticado** → `/login`

## 🎯 Funcionalidades Clave

### Carrito de Compras

- Agrupa items por vendor
- Calcula total automáticamente
- Permite modificar cantidades
- Crea pedidos separados por vendor
- Validación de stock antes de agregar

### Búsqueda y Filtros

**Menús:**
- Búsqueda por nombre de item
- Filtro por vendor
- Filtro por fecha

**Pedidos:**
- Búsqueda por código de recogida
- Filtro por estado

**Comentarios:**
- Filtro por calificación (estrellas)
- Filtro por fecha

**Usuarios (ADMIN):**
- Búsqueda por nombre, email o rol

### Pull to Refresh

- Recarga datos en listas
- Feedback visual durante carga
- Disponible en todas las pantallas de listas

### Validaciones

- Formularios validados con Zod
- Mensajes de error claros
- Validación en tiempo real
- Prevención de fechas pasadas en menús

### Feedback

- Calificación con estrellas interactivas (FontAwesome)
- Comentario opcional
- Solo un comentario por pedido
- Comentarios anónimos
- Validación antes de enviar

## 🎨 Estilos y Animaciones

### Hover Effects (Web)

- **Botones**: Sombra, transform, cambio de color
- **Filter chips**: Sombra, transform, cambio de color
- **Navbar items**: Sombra de texto, cambio de color
- **Transiciones suaves**: `cubic-bezier(0.25, 0.46, 0.45, 0.94)`

### Responsive Design

- **Móvil**: Tabs en la parte inferior
- **Web**: Navbar horizontal, layout optimizado
- **Breakpoints**: Adaptación automática según plataforma

### Iconos

- **FontAwesome** para todos los iconos
- Reemplazo de emojis por iconos consistentes
- Tamaños adaptativos

## 🐛 Manejo de Errores

- **Errores de red**: Se muestran con `Alert`
- **Errores 401**: Redirigen automáticamente al login
- **Errores 404**: Muestran mensajes descriptivos
- **Errores de validación**: Se muestran en los formularios
- **Logs en consola**: Para debugging (solo en desarrollo)

## 📦 Estructura de Tipos

Todos los tipos TypeScript están en `types/index.ts`:

```typescript
- User
- MenuItem
- Order
- OrderDetail
- OrderStatus
- Vendor
- Feedback
- AuthResponse
- LoginRequest
- RegisterRequest
```

## 🔧 Configuración

### app.json

Configuración de Expo:
- Nombre de la app: "Comedor UTEC"
- Versión: 1.0.0
- Iconos y splash screen
- Deep linking: `frontendproyectopi://`
- Permisos

### tsconfig.json

Configuración de TypeScript:
- Strict mode habilitado
- Paths aliases (`@/` para componentes)
- Compatibilidad con Expo
- JSX: react-native

### services/api.ts

Configuración del cliente Axios:
- Base URL del backend
- Timeout
- Headers por defecto
- Interceptores

## 🚨 Consideraciones Importantes

### Seguridad

1. **Token JWT**: Se almacena en AsyncStorage (considera almacenamiento seguro en producción)
2. **Validación**: Valida todas las entradas del usuario
3. **HTTPS**: Usa HTTPS en producción
4. **Credenciales**: Nunca commitees credenciales reales

### Performance

1. **Imágenes**: Optimiza imágenes antes de subirlas
2. **Lazy Loading**: Componentes pesados se cargan bajo demanda
3. **Memoización**: Usa `React.memo` donde sea necesario
4. **Listas grandes**: Considera virtualización para listas muy grandes

### Compatibilidad

- **Web**: Chrome, Firefox, Safari (últimas versiones)
- **Android**: 6.0+ (API 23+)
- **iOS**: 12.0+

### Mercado Pago

1. **Credenciales**: Requiere credenciales de producción
2. **Testing**: Prueba el flujo completo antes de producción
3. **Errores**: Maneja todos los posibles errores de pago
4. **UX**: Proporciona feedback claro durante el proceso de pago

## 📝 Scripts Disponibles

```json
{
  "start": "expo start",
  "android": "expo start --android",
  "ios": "expo start --ios",
  "web": "expo start --web"
}
```

## 🧪 Testing

```bash
# Ejecutar tests (si están configurados)
npm test
```

## 📚 Recursos Adicionales

- [Documentación de Expo](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Zod Docs](https://zod.dev/)

## 🔄 Actualización de Dependencias

```bash
# Verificar dependencias desactualizadas
npm outdated

# Actualizar dependencias
npm update

# Actualizar Expo a la última versión compatible
npx expo install --fix
```

## 📞 Troubleshooting

### Problemas Comunes

1. **Error de conexión con backend**:
   - Verifica que el backend esté corriendo en `http://localhost:8080`
   - Verifica la URL en `services/api.ts`
   - Verifica CORS en el backend
   - Verifica que no haya firewall bloqueando

2. **Token expirado**:
   - Cierra sesión y vuelve a iniciar
   - Verifica la configuración JWT en el backend
   - Limpia AsyncStorage si es necesario

3. **Errores de build**:
   - Limpia caché: `npm start -- --clear`
   - Elimina `node_modules` y reinstala: `rm -rf node_modules && npm install`
   - Verifica versiones de Node.js y npm

4. **Modo oscuro no funciona**:
   - Verifica que `ThemeProvider` esté en `_layout.tsx`
   - Verifica que los componentes usen `useTheme()`
   - Limpia AsyncStorage si es necesario

5. **Hover effects no funcionan en web**:
   - Verifica que `Platform.OS === 'web'` esté correctamente implementado
   - Verifica que los estilos CSS estén cargados
   - Verifica la consola del navegador para errores

6. **Pago Yape falla**:
   - Verifica credenciales de Mercado Pago
   - Verifica que el email no sea de prueba
   - Verifica que el token Yape sea válido
   - Revisa los logs del backend

## 🎓 Guía de Uso

### Para Usuarios

1. **Registro/Login**: Crea una cuenta o inicia sesión
2. **Ver Menús**: Navega a "Menús" y explora los items disponibles
3. **Agregar al Carrito**: Selecciona cantidad y agrega items
4. **Crear Pedido**: Confirma el pedido desde el carrito
5. **Pagar**: Usa Yape para pagar el pedido
6. **Recoger**: Usa el código de recogida cuando el pedido esté listo
7. **Feedback**: Deja un comentario después de recoger

### Para Vendedores

1. **Gestionar Menús**: Crea y edita items del menú
2. **Configurar Disponibilidad**: Agrega fechas y stock
3. **Ver Pedidos**: Revisa pedidos en "Pedidos"
4. **Marcar Listo**: Marca pedidos como listos para recoger
5. **Completar**: Marca pedidos como completados
6. **Ver Comentarios**: Revisa feedback de tus menús

### Para Administradores

1. **Dashboard**: Revisa estadísticas generales
2. **Gestionar Usuarios**: Cambia roles y asocia vendors
3. **Gestionar Vendors**: Crea y edita vendors
4. **Ver Comentarios**: Revisa todos los comentarios del sistema

## 📄 Licencia

[Especificar licencia del proyecto]
