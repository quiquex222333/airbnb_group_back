# Airbnb Group Services - API Documentation

Documentacion actualizada al estado real del codigo en este repositorio.

## 1. Alcance

Esta documentacion cubre dos APIs distintas:

1. **BFF Auth API** (`backend`, Express + Cognito)
2. **Microservices API** (`services/*`, expuesta via API Gateway en `/v1`)

## 2. Base URLs

### 2.1 BFF Auth API (local)

```txt
http://localhost:3000/api/v1
```

### 2.2 Microservices API (deploy AWS)

```txt
{ApiUrl}v1
```

Donde `ApiUrl` es output del stack CDK del repo de infraestructura.

## 3. Autenticacion

### 3.1 BFF

- `login` retorna `accessToken` en body.
- `refreshToken` se guarda como cookie HTTPOnly.
- endpoints protegidos usan header:

```http
Authorization: Bearer <accessToken>
```

### 3.2 Microservicios

Todos los endpoints `/v1/*` usan Cognito Authorizer en API Gateway.
Header requerido:

```http
Authorization: Bearer <IdToken o AccessToken valido segun authorizer>
Content-Type: application/json
```

## 4. BFF Auth API

### 4.1 POST `/auth/register`

Registra usuario en Cognito.

Request body:

```json
{
  "name": "Juan Perez",
  "email": "juan@test.com",
  "password": "Test1234!",
  "role": "guest"
}
```

Response `201`:

```json
{
  "userId": "uuid",
  "email": "juan@test.com",
  "role": "guest",
  "status": "UNCONFIRMED"
}
```

Errores comunes:

- `409 EMAIL_ALREADY_EXISTS`
- `422 INVALID_PASSWORD_POLICY`

### 4.2 POST `/auth/confirm`

Confirma usuario con codigo enviado por Cognito.

Request body:

```json
{
  "email": "juan@test.com",
  "code": "123456"
}
```

Response `200`:

```json
{
  "message": "Account confirmed successfully"
}
```

### 4.3 POST `/auth/login`

Autentica usuario y crea sesion.

Request body:

```json
{
  "email": "juan@test.com",
  "password": "Test1234!"
}
```

Response `200`:

```json
{
  "accessToken": "...",
  "expiresIn": 3600,
  "user": {
    "id": "uuid",
    "email": "juan@test.com",
    "name": "Juan Perez",
    "role": "guest"
  }
}
```

Notas:

- `refreshToken` va en cookie HTTPOnly (no en body).

### 4.4 POST `/auth/refresh`

Renueva Access Token usando cookie `refreshToken`.

Response `200`:

```json
{
  "accessToken": "...",
  "expiresIn": 3600,
  "user": {
    "id": "uuid",
    "email": "juan@test.com",
    "name": "Juan Perez",
    "role": "guest"
  }
}
```

Error tipico: `401 TOKEN_MISSING`.

### 4.5 POST `/auth/logout`

Revoca sesion en Cognito (si hay access token) y elimina cookie.

Response `200`:

```json
{
  "message": "Logged out successfully"
}
```

### 4.6 GET `/auth/me`

Obtiene perfil de usuario autenticado.

Response `200`:

```json
{
  "id": "uuid",
  "email": "juan@test.com",
  "name": "Juan Perez",
  "role": "guest"
}
```

### 4.7 GET `/health`

Health check del backend.

Response `200`:

```json
{
  "status": "OK",
  "version": "1.0"
}
```

## 5. Microservices API (`/v1`)

## 5.1 POST `/users`

Crea usuario interno. El email se toma del claim `email` del token.

Request body:

```json
{
  "fullName": "Juan Perez"
}
```

Response `201`:

```json
{
  "user": {
    "email": "juan@test.com",
    "userId": "uuid",
    "fullName": "Juan Perez",
    "createdAt": "2026-04-25T00:00:00.000Z"
  }
}
```

Errores comunes:

- `401 UNAUTHORIZED` (token sin email)
- `400 VALIDATION_ERROR` (`fullName` invalido)
- `409 CONFLICT_ERROR` (email ya registrado)
- `500 CONFIGURATION_ERROR` (`USERS_TABLE` faltante)

## 5.2 POST `/listings`

Crea listing. El `ownerId` se toma de `claims.sub`.

Request body:

```json
{
  "title": "Depto en La Paz",
  "price": 50
}
```

Response `201`:

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

## 5.3 POST `/bookings`

Crea reserva. El `guestId` se toma de `claims.sub`.

Request body:

```json
{
  "listingId": "listing-uuid",
  "checkIn": "2026-05-01",
  "checkOut": "2026-05-05",
  "guests": 2,
  "totalAmount": 200
}
```

Response `201`:

```json
{
  "booking": {
    "bookingId": "uuid",
    "listingId": "listing-uuid",
    "guestId": "cognito-sub",
    "checkIn": "2026-05-01",
    "checkOut": "2026-05-05",
    "guests": 2,
    "totalAmount": 200,
    "status": "pending",
    "createdAt": "2026-04-25T00:00:00.000Z"
  }
}
```

## 5.4 GET `/bookings/{bookingId}`

Obtiene reserva por id.

Response `200`:

```json
{
  "booking": {
    "bookingId": "uuid",
    "listingId": "listing-uuid",
    "guestId": "cognito-sub",
    "checkIn": "2026-05-01",
    "checkOut": "2026-05-05",
    "guests": 2,
    "totalAmount": 200,
    "status": "pending",
    "createdAt": "2026-04-25T00:00:00.000Z"
  }
}
```

Errores comunes:

- `400 VALIDATION_ERROR` (`bookingId` faltante)
- `404 NOT_FOUND`

## 5.5 POST `/reviews`

Crea review para un listing.

Request body:

```json
{
  "listingId": "listing-uuid",
  "rating": 5,
  "comment": "Excelente estadia"
}
```

Response `201`:

```json
{
  "review": {
    "reviewId": "uuid",
    "listingId": "listing-uuid",
    "userId": "cognito-sub",
    "rating": 5,
    "comment": "Excelente estadia",
    "createdAt": "2026-04-25T00:00:00.000Z"
  }
}
```

## 5.6 GET `/reviews/listing/{listingId}`

Lista reviews por listing usando GSI `listingId-index`.

Response `200`:

```json
{
  "reviews": [
    {
      "reviewId": "uuid",
      "listingId": "listing-uuid",
      "userId": "cognito-sub",
      "rating": 5,
      "comment": "Excelente estadia",
      "createdAt": "2026-04-25T00:00:00.000Z"
    }
  ]
}
```

## 6. Eventos

### 6.1 `listing.created`

Emitido por `listing-service`.

### 6.2 `booking.created`

Emitido por `booking-service`.

### 6.3 `review.created`

Emitido por `review-service`.

### 6.4 `user.created`

- Existe regla de infraestructura para este evento.
- El `user-service` actual todavia no lo publica.

## 7. Curl rapido

### 7.1 Crear listing

```bash
curl -X POST "${API_URL}/v1/listings" \
  -H "Authorization: Bearer ${ID_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"title":"Depto centrico","price":55}'
```

### 7.2 Crear booking

```bash
curl -X POST "${API_URL}/v1/bookings" \
  -H "Authorization: Bearer ${ID_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"listingId":"abc","checkIn":"2026-05-01","checkOut":"2026-05-03","guests":2,"totalAmount":110}'
```

### 7.3 Crear review

```bash
curl -X POST "${API_URL}/v1/reviews" \
  -H "Authorization: Bearer ${ID_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"listingId":"abc","rating":5,"comment":"Muy recomendado"}'
```

