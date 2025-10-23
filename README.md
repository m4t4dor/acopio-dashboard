# Main Dashboard

Aplicación web simplificada para un Centro de Acopios

## Funcionalidades

Este sistema incluye las siguientes funcionalidades principales:

- **Autenticación**: Login de usuarios
- **Dashboard**: Página de inicio con información general
- **Gestión de Usuarios**: CRUD completo de usuarios del sistema
- **Gestión de Sucursales**: CRUD completo de sucursales
- **Gestión de Clientes**: CRUD completo de clientes con búsqueda de DNI/RUC
- **Cambio de Contraseña**: Funcionalidad para cambiar contraseña de usuario

## Estructura del Proyecto

Este proyecto está dividido en dos partes principales:

- **Frontend**: Aplicación React + Vite + TypeScript
- **Backend**: API Laravel

## Requisitos

- PHP >= 8.1
- Composer 2.x
- Node.js >= 16.x
- npm o yarn
- MySQL >= 8.0 (o SQLite para desarrollo)

## Solución al Error de Proxy HTTP

Si encuentras el error `[vite] http proxy error: /api/products?category=all`, esto se debe a que:

1. El backend Laravel no está en ejecución
2. La configuración de proxy en Vite está intentando redirigir las solicitudes API al backend

### Soluciones implementadas:

1. Se ha configurado un sistema de fallback que utiliza datos estáticos cuando el backend no está disponible
2. Se ha mejorado la configuración de proxy en `vite.config.ts` para manejar mejor los errores
3. Se han agregado logs detallados para ayudar a diagnosticar problemas de conexión

## Instalación y Configuración

### Frontend (React + Vite)

1. Navegue a la carpeta del frontend:
   ```bash
   cd frontend
   ```

2. Instale las dependencias:
   ```bash
   npm install
   ```

3. Inicie el servidor de desarrollo:
   ```bash
   npm run dev
   ```

4. La aplicación estará disponible en http://localhost:3000

### Backend (Laravel)

> **Nota**: Actualmente, el frontend está configurado para funcionar sin el backend mediante datos mockeados.

1. Navegue a la carpeta del backend:
   ```bash
   cd backend
   ```

2. Instale las dependencias:
   ```bash
   composer install
   ```

3. Copie el archivo de entorno:
   ```bash
   cp .env.example .env
   ```

4. Configure su base de datos en el archivo `.env`

5. Genere la clave de la aplicación:
   ```bash
   php artisan key:generate
   ```

6. Ejecute las migraciones:
   ```bash
   php artisan migrate --seed
   ```

7. Inicie el servidor:
   ```bash
   php artisan serve
   ```

### Iniciar todo el proyecto

Para mayor comodidad, puede usar el script `start.bat` incluido:

```bash
./start.bat
```

Este script iniciará tanto el frontend como el backend (cuando esté completamente implementado).

7. Inicie el servidor:
   ```bash
   php artisan serve
   ```

### Frontend (React + Vite)

1. Navegue a la carpeta del frontend:
   ```bash
   cd frontend
   ```

2. Instale las dependencias:
   ```bash
   npm install
   ```
   o
   ```bash
   yarn
   ```

3. Inicie el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   o
   ```bash
   yarn dev
   ```

## Estructura de Carpetas

### Frontend

```
frontend/
  ├── public/            # Archivos estáticos
  │   └── images/        # Imágenes
  ├── src/
  │   ├── components/    # Componentes React
  │   │   ├── ui/        # Componentes de interfaz de usuario
  │   │   └── molecules/ # Componentes compuestos
  │   ├── lib/           # Utilidades y configuraciones
  │   ├── pages/         # Páginas de la aplicación
  │   └── types/         # Tipos TypeScript
  ├── index.html         # Punto de entrada HTML
  └── vite.config.ts     # Configuración de Vite
```

### Backend

```
backend/
  ├── app/
  │   ├── Http/
  │   │   ├── Controllers/ # Controladores
  │   │   └── Middleware/  # Middleware
  │   └── Models/          # Modelos
  ├── database/
  │   ├── migrations/      # Migraciones
  │   └── seeders/         # Seeders
  └── routes/
      └── api.php         # Rutas de la API
```

## Contribución

1. Cree una rama para su funcionalidad: `git checkout -b feature/nueva-funcionalidad`
2. Commit sus cambios: `git commit -m 'Añade nueva funcionalidad'`
3. Push a la rama: `git push origin feature/nueva-funcionalidad`
4. Envíe un pull request
