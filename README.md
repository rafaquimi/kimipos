# KimiPOS - Sistema de Gestión para Restaurantes

Sistema POS (Punto de Venta) offline-first para restaurantes, construido con React, TypeScript y tecnologías web modernas.

## 🚀 Características Principales

- **Funcionalidad Offline**: Funciona completamente sin conexión a internet
- **Sincronización en la Nube**: Sincroniza datos cuando hay conexión disponible
- **Interfaz Moderna**: Diseño minimalista y responsive
- **Gestión Completa**: Productos, categorías, mesas, pedidos y configuración
- **Editor de Salones**: Editor visual para organizar mesas
- **Base de Datos Local**: IndexedDB para almacenamiento persistente
- **PWA Ready**: Instalable como aplicación nativa

## 📱 Módulos Incluidos

### 🎯 Punto de Venta (POS)
- Interfaz principal para tomar pedidos
- Categorías de productos con colores personalizables
- Carrito de compras en tiempo real
- Selección de mesas y clientes
- Cálculo automático de impuestos

### 📦 Gestión de Productos
- CRUD completo de productos
- Categorización y organización
- Control de stock (opcional)
- Precios y descripciones
- Estados activo/inactivo

### 🏷️ Gestión de Categorías
- Categorías con colores personalizables
- Orden personalizable
- Conteo automático de productos

### 🪑 Editor de Salones y Mesas
- Editor visual de salones
- Mesas arrastrables y redimensionables
- Estados de mesa (disponible, ocupada, reservada, mantenimiento)
- Múltiples salones

### 📋 Gestión de Pedidos
- Historial completo de pedidos
- Estados de pedido en tiempo real
- Filtros por fecha, estado y cliente
- Vista detallada de cada pedido

### ⚙️ Configuración Avanzada
- Configuración del restaurante
- Configuración de impuestos y pagos
- Configuración de impresoras
- Configuración de sincronización
- Respaldos y seguridad

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 18 + TypeScript
- **Base de Datos**: IndexedDB (Dexie.js)
- **Estilos**: Tailwind CSS
- **Iconos**: Lucide React
- **PWA**: Vite PWA Plugin
- **Build Tool**: Vite
- **Notificaciones**: React Hot Toast
- **Fechas**: date-fns

## 📋 Requisitos Previos

- Node.js 16 o superior
- npm o yarn

## 🚀 Instalación

1. **Clonar el repositorio**
   \`\`\`bash
   git clone <repository-url>
   cd kimipos
   \`\`\`

2. **Instalar dependencias**
   \`\`\`bash
   npm install
   \`\`\`

3. **Iniciar el servidor de desarrollo**
   \`\`\`bash
   npm run dev
   \`\`\`

4. **Abrir en el navegador**
   \`\`\`
   http://localhost:5173
   \`\`\`

## 🏗️ Build para Producción

1. **Generar build de producción**
   \`\`\`bash
   npm run build
   \`\`\`

2. **Previsualizar build**
   \`\`\`bash
   npm run preview
   \`\`\`

## 📱 Instalación como PWA

1. Abrir la aplicación en un navegador compatible
2. Buscar el ícono de "Instalar" en la barra de direcciones
3. Seguir las instrucciones para instalar como aplicación

## 🗃️ Estructura de la Base de Datos

La aplicación utiliza IndexedDB con las siguientes tablas:

- **categories**: Categorías de productos
- **products**: Productos del menú
- **tables**: Mesas del restaurante
- **salons**: Salones o áreas del restaurante
- **orders**: Pedidos realizados
- **orderItems**: Items de cada pedido
- **customers**: Base de datos de clientes
- **configuration**: Configuración del sistema
- **syncLogs**: Logs de sincronización

## 🔄 Sincronización

La aplicación está preparada para sincronizar con servicios en la nube:

- **Offline First**: Todas las operaciones funcionan sin conexión
- **Auto-sync**: Sincronización automática cuando hay conexión
- **Conflict Resolution**: Manejo de conflictos de sincronización
- **Sync Logs**: Registro detallado de sincronización

## 🎨 Personalización

### Colores y Temas
Los colores se pueden personalizar en `tailwind.config.js`:

\`\`\`javascript
colors: {
  primary: {
    // Personalizar colores primarios
  },
  secondary: {
    // Personalizar colores secundarios
  }
}
\`\`\`

### Configuración
La configuración se puede modificar desde la interfaz o directamente en la base de datos.

## 🔧 Configuración Avanzada

### Variables de Entorno
Crear un archivo `.env` en la raíz del proyecto:

\`\`\`env
VITE_API_BASE_URL=https://tu-api.com
VITE_SYNC_ENABLED=true
VITE_ANALYTICS_ID=your-analytics-id
\`\`\`

### Configuración de PWA
Modificar `vite.config.ts` para personalizar la configuración de PWA.

## 📊 Características de Negocio

### Flujo de Trabajo Típico
1. **Configuración inicial**: Configurar restaurante, categorías y productos
2. **Diseño de salones**: Crear salones y ubicar mesas
3. **Toma de pedidos**: Usar el POS para procesar pedidos
4. **Gestión de órdenes**: Seguimiento del estado de pedidos
5. **Análisis**: Revisar historial y estadísticas

### Estados de Mesa
- **Disponible**: Mesa libre para nuevos clientes
- **Ocupada**: Mesa con clientes y pedido activo
- **Reservada**: Mesa reservada para una hora específica
- **Mantenimiento**: Mesa fuera de servicio

### Estados de Pedido
- **Pendiente**: Pedido creado, esperando confirmación
- **Confirmado**: Pedido confirmado, listo para preparar
- **Preparando**: Pedido en proceso de preparación
- **Listo**: Pedido terminado, listo para servir
- **Entregado**: Pedido servido al cliente
- **Pagado**: Pedido pagado y finalizado
- **Cancelado**: Pedido cancelado

## 🔐 Seguridad

- Datos almacenados localmente de forma segura
- Opción de encriptación de datos sensibles
- Control de acceso con PIN
- Registro de auditoría de acciones
- Respaldos automáticos

## 🆘 Soporte y Contribución

### Reportar Problemas
Crear un issue en el repositorio con:
- Descripción detallada del problema
- Pasos para reproducir
- Capturas de pantalla si es aplicable
- Información del navegador y sistema operativo

### Contribuir
1. Fork del repositorio
2. Crear una rama para la característica: \`git checkout -b feature/nueva-caracteristica\`
3. Commit de cambios: \`git commit -am 'Agregar nueva característica'\`
4. Push a la rama: \`git push origin feature/nueva-caracteristica\`
5. Crear un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo \`LICENSE\` para más detalles.

## 🏆 Créditos

Desarrollado con ❤️ para la gestión eficiente de restaurantes.

---

## 📞 Contacto

Para soporte técnico o consultas comerciales, contactar a través de los issues del repositorio.

