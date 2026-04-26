# Integracion con Repositorio de Infraestructura

## 1. Contexto

Este repositorio contiene codigo de aplicacion.
La infraestructura AWS se despliega desde el repositorio hermano:

- `../airbnb_group_infrastruture`

> Nota: el nombre actual de carpeta es `infrastruture` (sin "c").

## 2. Estructura esperada en disco

```txt
arq_nube_microservicios/
├── airbnb_group_services        # este repo
└── airbnb_group_infrastruture   # repo CDK
```

El stack CDK referencia handlers dentro de `airbnb_group_services/services/*`.

## 3. Recursos que crea CDK (resumen)

Segun `../airbnb_group_infrastruture/lib/cdk-stack.ts`, se crean:

- API Gateway REST
- Cognito User Pool + App Client
- DynamoDB Tables:
  - `UsersTable`
  - `ListingsTable`
  - `BookingsTable`
  - `ReviewsTable` (+ GSI `listingId-index`)
- EventBridge Bus
- SQS `NotificationQueue`
- Lambdas conectadas a handlers de este repo

## 4. Outputs necesarios

Luego de `cdk deploy`, guardar:

- `ApiUrl`
- `UserPoolId`
- `UserPoolClientId`
- `EventBusName`
- `NotificationQueueUrl`
- `NotificationQueueName`

## 5. Paso a paso recomendado

### 5.1 Desplegar infra

```bash
cd ../airbnb_group_infrastruture
npm install
npm run build
npx cdk deploy
```

### 5.2 Configurar backend local

Archivo `airbnb_group_services/backend/.env`:

```env
PORT=3000
AWS_REGION=<region_del_stack>
COGNITO_CLIENT_ID=<UserPoolClientId>
COGNITO_USER_POOL_ID=<UserPoolId>
```

### 5.3 Configurar frontend local

Archivo `airbnb_group_services/frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

### 5.4 Probar microservicios

Usar `ApiUrl` para invocar:

- `POST {ApiUrl}v1/users`
- `POST {ApiUrl}v1/listings`
- `POST {ApiUrl}v1/bookings`
- `GET {ApiUrl}v1/bookings/{bookingId}`
- `POST {ApiUrl}v1/reviews`
- `GET {ApiUrl}v1/reviews/listing/{listingId}`

Todos requieren token Cognito en header `Authorization`.

## 6. Checklist de consistencia entre repos

1. Path de handlers en CDK apunta a `airbnb_group_services/services/*/src/handler.ts`.
2. Variables de entorno de Lambdas coinciden con cada servicio.
3. Rutas API Gateway (`/v1/...`) coinciden con la documentacion de este repo.
4. Reglas EventBridge y consumidor SQS estan alineados con eventos publicados.

