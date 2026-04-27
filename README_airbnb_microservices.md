# Guia Rapida - Airbnb Microservices

Este documento resume solo la linea de microservicios (`services/*`).
Para la documentacion general del repositorio usa `README.md`.

## 1. Servicios disponibles

- `user-service`
- `listing-service`
- `booking-service`
- `review-service`
- `notification-service`

## 2. Endpoints `/v1` (API Gateway)

- `POST /v1/users`
- `POST /v1/listings`
- `POST /v1/bookings`
- `GET /v1/bookings/{bookingId}`
- `POST /v1/reviews`
- `GET /v1/reviews/listing/{listingId}`

Todos los endpoints requieren autenticacion Cognito en API Gateway.

## 3. Variables por servicio

- `user-service`: `USERS_TABLE`
- `listing-service`: `LISTINGS_TABLE`, `EVENT_BUS_NAME`
- `booking-service`: `BOOKINGS_TABLE`, `EVENT_BUS_NAME`
- `review-service`: `REVIEWS_TABLE`, `EVENT_BUS_NAME`
- `notification-service`: consume SQS, sin vars obligatorias hoy

## 4. Eventos

Productores actuales:

- `listing.created`
- `booking.created`
- `review.created`

Consumidor:

- `notification-service` (via SQS)

Nota: existe regla infra para `user.created`, pero hoy no se emite desde `user-service`.

## 5. Comandos utiles

Desde raiz de repo:

```bash
npm run build
npm run test
```

Tests por servicio:

```bash
npm run test -w @airbnb-clone/user-service
npm run test -w @airbnb-clone/notification-service
```

## 6. Contrato

Contrato principal de microservicios:

- `contracts/smithy/models/airbnb.smithy`

Tipos compartidos TypeScript:

- `shared/contracts/src/index.ts`

