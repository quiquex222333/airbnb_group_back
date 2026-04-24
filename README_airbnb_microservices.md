# Airbnb Microservices Clone

## Descripción
Proyecto académico de microservicios inspirado en Airbnb usando AWS (Free Tier), CDK, TypeScript y Smithy.

## Arquitectura actual

Client → API Gateway → Lambda (User Service) → DynamoDB  
                    ↘ Cognito (Auth)

## Tecnologías
- AWS CDK
- Lambda
- API Gateway
- DynamoDB
- Cognito
- TypeScript
- Jest

## Requisitos

- Node.js 20+
- AWS CLI configurado
- CDK instalado

## Instalación

```bash
npm install
```

## Build

```bash
npm run build
```

## Deploy

```bash
cd infrastructure/cdk
cdk bootstrap
cdk deploy
```

Guardar outputs:
- ApiUrl
- UserPoolId
- UserPoolClientId

## Autenticación (Cognito)

### Crear usuario

```bash
aws cognito-idp sign-up \
  --client-id TU_CLIENT_ID \
  --username test@test.com \
  --password Test1234 \
  --user-attributes Name=email,Value=test@test.com
```

### Confirmar usuario

```bash
aws cognito-idp admin-confirm-sign-up \
  --user-pool-id TU_USER_POOL_ID \
  --username test@test.com
```

### Login

```bash
aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id TU_CLIENT_ID \
  --auth-parameters USERNAME=test@test.com,PASSWORD=Test1234
```

Copiar el IdToken.

## Endpoint protegido

### Crear usuario

```http
POST /v1/users
```

### Headers

```http
Authorization: Bearer <IdToken>
Content-Type: application/json
```

### Body

```json
{
  "fullName": "Juan Perez"
}
```

El email se obtiene desde el token JWT (Cognito), no desde el body.

## Pruebas

```bash
npm test
```

Solo user-service:

```bash
npm run test -w @airbnb-clone/user-service
```

## Buenas prácticas aplicadas

- Contract-first (Smithy)
- Infraestructura como código (CDK)
- Autenticación JWT (Cognito)
- Validación backend
- Tests unitarios (Jest)
- Separación por microservicios
- Uso de variables de entorno

## Próximos pasos

- EventBridge (event-driven)
- Notification Service
- Listing Service (CQRS)
- Booking Service (Saga)
