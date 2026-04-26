# Airbnb Microservices API Documentation

## Descripción general

API académica basada en una arquitectura de microservicios inspirada en Airbnb.

La solución actual incluye:

- API Gateway
- Cognito para autenticación JWT
- User Service
- Listing Service
- Notification Service
- DynamoDB
- EventBridge
- SQS

## Base URL

```txt
{{apiUrl}}
```

Ejemplo:

```txt
https://xxxxx.execute-api.us-east-2.amazonaws.com/prod
```

## Autenticación

Los endpoints protegidos requieren un `IdToken` de Cognito.

Header requerido:

```http
Authorization: Bearer {{idToken}}
Content-Type: application/json
```

## Obtener token con AWS CLI

### Crear usuario Cognito

```bash
aws cognito-idp sign-up \
  --client-id TU_USER_POOL_CLIENT_ID \
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
  --client-id TU_USER_POOL_CLIENT_ID \
  --auth-parameters USERNAME=test@test.com,PASSWORD=Test1234
```

Usar el valor de:

```json
"IdToken": "..."
```

# Endpoints

## 1. Crear usuario

```http
POST /v1/users
```

Crea un usuario interno en DynamoDB usando el email obtenido desde Cognito JWT.

### Headers

```http
Authorization: Bearer {{idToken}}
Content-Type: application/json
```

### Body

```json
{
  "fullName": "Juan Perez"
}
```

### Respuesta 201

```json
{
  "user": {
    "email": "test@test.com",
    "userId": "uuid",
    "fullName": "Juan Perez",
    "createdAt": "2026-04-25T00:00:00.000Z"
  }
}
```

### Errores posibles

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "fullName is required and must have at least 2 characters"
  }
}
```

```json
{
  "message": "Unauthorized"
}
```

```json
{
  "error": {
    "code": "CONFLICT_ERROR",
    "message": "A user with this email already exists"
  }
}
```

## 2. Crear listing

```http
POST /v1/listings
```

Crea una propiedad/listing asociada al usuario autenticado.

El `ownerId` se obtiene desde el claim `sub` del JWT Cognito.

### Headers

```http
Authorization: Bearer {{idToken}}
Content-Type: application/json
```

### Body

```json
{
  "title": "Depto en La Paz",
  "price": 50
}
```

### Respuesta 201

```json
{
  "listing": {
    "listingId": "uuid",
    "ownerId": "cognito-sub",
    "title": "Depto en La Paz",
    "price": 50,
    "status": "draft",
    "createdAt": "2026-04-25T00:00:00.000Z"
  }
}
```

### Errores posibles

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input"
  }
}
```

```json
{
  "message": "Unauthorized"
}
```

# Eventos

## user.created

Emitido por User Service después de crear un usuario.

```json
{
  "source": "user.service",
  "detailType": "user.created",
  "detail": {
    "userId": "uuid",
    "email": "test@test.com",
    "fullName": "Juan Perez",
    "createdAt": "2026-04-25T00:00:00.000Z"
  }
}
```

Flujo:

```txt
User Service -> EventBridge -> SQS -> Notification Service
```

## listing.created

Emitido por Listing Service después de crear una propiedad.

```json
{
  "source": "listing.service",
  "detailType": "listing.created",
  "detail": {
    "listingId": "uuid",
    "ownerId": "cognito-sub",
    "title": "Depto en La Paz",
    "price": 50,
    "status": "draft",
    "createdAt": "2026-04-25T00:00:00.000Z"
  }
}
```

# Pruebas rápidas con curl

## Crear usuario

```bash
curl -X POST "$TU_URL/v1/users" \
  -H "Authorization: Bearer $TU_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Juan Perez"}'
```

## Crear listing

```bash
curl -X POST "$TU_URL/v1/listings" \
  -H "Authorization: Bearer $TU_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Depto en La Paz","price":50}'
```

# Variables recomendadas para Postman

| Variable | Descripción |
|---|---|
| `apiUrl` | URL base de API Gateway sin slash final |
| `idToken` | Token JWT Cognito IdToken |
| `userPoolId` | ID del User Pool |
| `userPoolClientId` | ID del App Client |
