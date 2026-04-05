# Airbnb Clone - Full Stack Architecture & Implementation

Bienvenido al repositorio del proyecto **Airbnb Clone**, desarrollado como parte
de la maestría de Desarrollo Full Stack (Cloud Computing y Microservicios).

Este repositorio centraliza tanto la concepción arquitectónica inicial (Diseño
de Sistemas, AWS Smithy) como la **implementación oficial técnica** de los
módulos Frontend y Backend, enfocándose especialmente en los flujos seguros de
Autenticación Integrada en la Nube.

## 📋 Arquitectura del Repositorio

El proyecto se encuentra estructurado en distintas capas autónomas:

### 1. 🖥️ Frontend (React + Vite)

- **Directorio:** [`./frontend/`](./frontend/)
- Aplicación de Página Única (SPA) construida con **React, TypeScript y Vite**.
- **Motor Gráfico:** Implementación pura de **Tailwind CSS V4** basando la
  estética visual en componentes envolventes de tipo _Glassmorphism_ y
  tematización global bajo variables CSS (Airbnb Red `#FF5A5F`).
- **Estado y Red:** Uso de `Zustand` para el manejo de sesiones locales
  interconectado con un gestor `Axios` reactivo (interceptores automatizados
  para manejo de Cookies).

### 2. ⚙️ Backend BFF (Node.js + Clean Architecture)

- **Directorio:** [`./backend/`](./backend/)
- Servidor central **Backend For Frontend (BFF)** escrito en TypeScript y
  Express.
- Estructurado bajo lineamientos estrictos de **Clean Architecture** separando
  las capas de Infraestructura, Dominio y Casos de Uso.
- Intermediario central contra AWS: Consume la infraestructura de servidor para
  proteger llaves y delegar lógicas sofisticadas (Inyección de Dependencias).
- **Seguridad Perimetral:** Validador global estricto mediante middleware
  `AuthGuard` asimétrico utilizando librerías nativas (`aws-jwt-verify`) contra
  Amazon JWKs.

### 3. 🛡️ AWS Cloud Identity (Cognito SDK v3)

- El entorno delega enteramente la identidad a un grupo de usuarios de la nube
  pública **AWS Cognito**.
- El proyecto orquesta íntegramente las transacciones: `Registro`,
  `Verificación de Email por PIN de 6 dígitos`, `Alta de Perfil`, `Login`
  seguro, Inyección dinámica de Roles (`Guest/Host`), expedición de OIDC y
  cierre de sesión maestro.
- Implementa contramedidas Anti-XSS (Cross-Site Scripting) administrando y
  refrescando credenciales temporalizadas a través de un proxy de **Cookies
  Secure HTTP-Only**.

### 4. 📄 Arquitectura Inicial y Diseño Técnico Base

- **Documentación de Diseño:**
  [`Airbnb_Design_Document.md`](./Airbnb_Design_Document.md)
- **API Model (AWS Smithy):** Carpeta alojada en
  [`./airbnb-smithy/`](./airbnb-smithy/), definiendo paramétricamente los
  contratos oficiales de consumo RESTful (Listings, Bookings, Errores y
  Seguridad OIDC/SSO).

---

## 🚀 Guía de Instalación y Desarrollo Local

Todo el proyecto funciona en base a `npm`. Necesitarás inicializar tanto el
cliente como el servidor de soporte de forma paralela.

### Primer Paso: Instalación de Dependencias 📦

Deberás instalar los paquetes localizados en ambas carpetas:

```bash
# Instalado en backend
cd backend && npm install

# Instalado en frontend
cd ../frontend && npm install
```

### Segundo Paso: Configuración del Entorno (`.env`) 🔐

Tanto `backend/` como `frontend/` requieren de un archivo `.env` configurado que
el proyecto detectará de forma automática. Si no existen, créalos basándote en
los parámetros previstos o comunícate con un mantenedor del equipo.

> El backend requerirá credenciales del pool como: `COGNITO_CLIENT_ID` y
> `COGNITO_USER_POOL_ID`. El frontend únicamente requerirá rastrear al servidor
> a través de la variable `VITE_API_URL=http://localhost:3000/api/v1`.

### Tercer Paso: Inicialización y Comandos de Ejecución ▶️

Recomendamos correr estas instancias en dos pestañas de terminales locales
separadas:

**Ejecutar Servidor Backend (BFF):**

```bash
cd backend
npm run dev
```

**Ejecutar Servidor Cliente (React):**

```bash
cd frontend
npm run dev
```

Una vez que Vite levante su portal, podrás navegar directamente asegurando un
flujo desde las pantallas de Autorización hacia el sistema protegido del Airbnb.
