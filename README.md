# ⛪ ProDucción ERP - Sistema de Gestión y Coordinación Eclesiástica

![Version](https://img.shields.io/badge/version-1.0.0-blueviolet)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-green)
![PostgreSQL](https://img.shields.io/badge/postgresql-14%2B-blue)
![Gemini](https://img.shields.io/badge/Gemini%20IA-Pro-orange)

Un sistema ERP moderno, dinámico y asistido por **Inteligencia Artificial (Gemini)** diseñado específicamente para coordinar y optimizar las operaciones de los servidores técnicos en los 14 equipos y áreas de producción de la iglesia.

---

## 🌟 Características Principales

### 1. 🤖 Asistente de IA (Gemini Pro) Flotante
*   **Consultas Contextuales**: Un chatbot interactivo integrado directamente con la base de datos de PostgreSQL.
*   **Seguridad**: Las consultas de la IA se procesan de forma segura a través de un proxy en el servidor backend, ocultando y protegiendo tu API Key privada de Google AI Studio.
*   **Interacción Premium**: Interfaz fluida con efecto de máquina de escribir y micro-animaciones en las burbujas de chat.

### 2. 🛡️ Control de Acceso por Roles (RBAC)
*   **Administrador General**: Control invisible y absoluto. Puede auditar y deshacer cualquier cambio.
*   **Superlíder (Dirección)**: Encargado de planificar eventos especiales y delegar en líderes de área.
*   **Líder / Co-líder de Área**: Gestionan la asistencia y asignaciones de siervos en su equipo específico.
*   **Siervo (Equipo Técnico)**: Consulta sus turnos programados, confirma su asistencia y se postula a eventos.

### 3. 🗓️ Gestión de Servicios y Eventos Especiales
*   **Cronograma Semanal**: Rotación de turnos automatizada para los servicios de Domingos (4 turnos) y Miércoles.
*   **Eventos Especiales**: Módulo para programar eventos únicos (Vigilias, Conciertos, Congresos) definiendo requerimientos específicos por área.

### 4. 👥 Estructura Organizacional Interactiva
*   **Visualización de 14 Áreas**: Organizadas en los 4 pilares: *Live Production, Media & AV, Creative & Design y Logistics & Protocol*.
*   **Paneles Dinámicos**: Tarjetas colapsables para áreas complejas (como **Switchers y Cámaras**) detallando roles específicos de Switcher y Cámara.

---

## 🛠️ Arquitectura y Tecnologías

El proyecto utiliza una arquitectura de monolito simplificada para facilitar su despliegue y desarrollo:

```
├── [Raíz] (Archivos del Frontend estático)
│   ├── index.html     - Estructura visual estructurada y SEO optimizado
│   ├── style.css      - Diseño premium con Glassmorphism y Dark Mode
│   ├── app.js         - Lógica del cliente, fetch APIs y sesión (JWT)
│   └── assets/        - Recursos y mockups de imágenes del sistema
│
└── server/ (Servidor API de Node.js)
    ├── server.js      - Express API, conexión PostgreSQL y Gemini proxy
    ├── schema.sql     - Esquema relacional de base de datos y mock data
    ├── package.json   - Dependencias del backend (pg, bcrypt, jwt, generative-ai)
    └── .env.example   - Plantilla de variables de entorno
```

---

## 🚀 Instalación y Configuración Local

### Prerrequisitos
*   **Node.js** (v16 o superior) instalado.
*   **PostgreSQL** instalado y corriendo.
*   Una API Key de **Google AI Studio** (obtenla gratis en [aistudio.google.com](https://aistudio.google.com/)).

### Pasos
1.  **Clona el repositorio**:
    ```bash
    git clone https://github.com/leonnnc/prod.git
    cd prod
    ```

2.  **Configura el Servidor Backend**:
    *   Entra a la carpeta del servidor:
        ```bash
        cd server
        ```
    *   Crea tu archivo `.env` basado en `.env.example`:
        ```env
        DATABASE_URL=postgresql://tu_usuario:tu_contraseña@localhost:5432/produccion_erp
        JWT_SECRET=tu_frase_secreta_para_tokens
        GEMINI_API_KEY=tu_api_key_de_gemini
        ```
    *   Instala las dependencias de Node.js:
        ```bash
        npm install
        ```

3.  **Inicializa la Base de Datos**:
    *   Crea una base de datos en tu PostgreSQL local llamada `produccion_erp`.
    *   Ejecuta el archivo `schema.sql` para crear las tablas e insertar los datos iniciales de prueba:
        ```bash
        psql -U tu_usuario -d produccion_erp -f schema.sql
        ```

4.  **Inicia la aplicación**:
    *   Ejecuta el servidor:
        ```bash
        npm start
        ```
    *   Abre tu navegador e ingresa a `http://localhost:3000`. ¡El servidor servirá de forma automática tanto la API como la interfaz web!

---

## ☁️ Guía de Despliegue en Producción

### 1. Base de Datos en la Nube (Neon.tech)
1.  Crea una cuenta gratuita en [Neon.tech](https://neon.tech/) y crea un proyecto PostgreSQL.
2.  Copia la URL de conexión de tu base de datos en la nube.
3.  Usa el editor SQL en el dashboard de Neon para ejecutar las consultas de `server/schema.sql` y dejar tu base de datos inicializada.

### 2. Alojamiento del Servidor y Web (Render.com)
1.  Inicia sesión en [Render.com](https://render.com/) y crea un nuevo **Web Service**.
2.  Conéctalo a este repositorio de GitHub.
3.  Configura las siguientes propiedades de despliegue:
    *   **Root Directory**: (Dejar vacío).
    *   **Build Command**: `cd server && npm install`
    *   **Start Command**: `cd server && node server.js`
4.  En la sección de **Variables de Entorno (Environment)** agrega las 3 claves configuradas localmente:
    *   `DATABASE_URL` = *(Tu conexión string de Neon.tech)*
    *   `GEMINI_API_KEY` = *(Tu clave de Google AI Studio)*
    *   `JWT_SECRET` = *(Una frase larga para proteger las sesiones)*
5.  Haz clic en **Deploy Web Service** y ¡listo! Render te entregará una URL pública para que todo tu equipo pueda acceder.
