# Setup Local

## 1. Prerrequisitos

- Node.js 20+
- npm 10+
- (Opcional) AWS CLI configurado para pruebas reales contra Cognito/API Gateway

## 2. Instalacion de dependencias

Desde la raiz:

```bash
npm install
```

Instalacion por modulo (recomendado para trabajo en BFF/UI):

```bash
cd backend && npm install
cd ../frontend && npm install
```

## 3. Variables de entorno

### 3.1 Backend

Crear `backend/.env` desde `backend/template.env`:

```env
PORT=3000
AWS_REGION=us-east-2
COGNITO_CLIENT_ID=...
COGNITO_USER_POOL_ID=...
JWT_SECRET_MOCK=super_secret
```

### 3.2 Frontend

Crear `frontend/.env` desde `frontend/template.env`:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

## 4. Ejecucion local

### 4.1 Backend (BFF)

```bash
cd backend
npm run dev
```

Servidor por defecto: `http://localhost:3000`

### 4.2 Frontend

```bash
cd frontend
npm run dev
```

UI por defecto: `http://localhost:5173`

## 5. Build y tests

Desde la raiz:

```bash
npm run build
npm run test
```

Tambien puedes ejecutar por paquete:

```bash
npm run test -w @airbnb-clone/user-service
npm run test -w @airbnb-clone/notification-service
```

## 6. Probar endpoints de microservicios

Los endpoints `/v1/*` viven en API Gateway (infra repo).

Para probar localmente de punta a punta:

1. desplegar infraestructura en `../airbnb_group_infrastruture`
2. obtener `ApiUrl`, `UserPoolId`, `UserPoolClientId`
3. obtener `IdToken` de Cognito
4. invocar endpoints `/v1/*` con `Authorization: Bearer <IdToken>`

Referencia completa: `API_documentation.md`

## 7. Troubleshooting rapido

- `401 Missing token` en BFF: falta `Authorization: Bearer ...`
- `TOKEN_INVALID` en BFF: Access Token vencido/invalido
- `CONFIGURATION_ERROR` en user-service: falta `USERS_TABLE`
- `Invalid input` en listing/booking/review: payload fuera de contrato

