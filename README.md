# Airbnb Group Services

Repositorio de **código de aplicación** para el proyecto académico de Airbnb (microservicios + BFF de autenticación + frontend).

Este repositorio **no contiene la infraestructura AWS**. La infraestructura se gestiona en un repositorio hermano ubicado al mismo nivel:

- `../airbnb_group_infrastruture` (nombre actual de carpeta)

## Qué contiene este repo

- Microservicios Lambda en `services/*`:
  - `user-service`
  - `listing-service`
  - `booking-service`
  - `review-service`
  - `notification-service`
- Contratos compartidos TypeScript en `shared/contracts`
- Contratos Smithy en `contracts/smithy`
- Backend BFF de autenticación (Express + Cognito) en `backend`
- Frontend React (Vite + Tailwind v4) en `frontend`

## Mapa rápido de carpetas

```txt
.
├── backend/                  # BFF Auth API (Express + Cognito)
├── contracts/smithy/         # Contrato Smithy (API de microservicios)
├── docs/                     # Documentación técnica
├── frontend/                 # UI web de autenticación
├── generated/                # Código generado (no fuente de verdad)
├── services/                 # Lambdas de dominio
├── shared/contracts/         # Tipos TS compartidos entre servicios
├── API_documentation.md      # Referencia de endpoints (BFF + microservicios)
└── Airbnb_Design_Document.md # Documento académico de diseño (alto nivel)
```

## Diagramas

### Arquitectura de microservicios

```mermaid
flowchart LR
    C[Cliente] --> APIGW[API Gateway /v1]
    APIGW --> U[user-service]
    APIGW --> L[listing-service]
    APIGW --> B[booking-service]
    APIGW --> R[review-service]
    APIGW -. Cognito Authorizer .-> CG[Cognito]

    U --> D1[(UsersTable)]
    L --> D2[(ListingsTable)]
    B --> D3[(BookingsTable)]
    R --> D4[(ReviewsTable + GSI listingId-index)]

    L --> EB[(EventBridge)]
    B --> EB
    R --> EB
    EB --> SQS[(NotificationQueue)]
    SQS --> N[notification-service]
```

### Flujo BFF + Frontend

```mermaid
flowchart LR
    FE[Frontend React] --> BFF[Express BFF /api/v1/auth]
    BFF --> CG[Cognito]
    FE <-->|Access Token + Cookie refresh| BFF
```

### Modelo de datos (ER)

```mermaid
erDiagram
    User ||--o{ Listing : "hostea (1:N)"
    User ||--o{ Booking : "reserva (1:N)"
    User ||--o{ Review : "escribe (1:N)"
    User ||--o{ Notification : "recibe (1:N)"
    Listing ||--o{ Booking : "tiene (1:N)"
    Listing ||--o{ Review : "recibe (1:N)"
    Booking ||--o| Review : "genera (1:1)"

    User {
        UUID id PK
        VARCHAR nombre
        VARCHAR email
        VARCHAR rol "GUEST, HOST, ADMIN"
        TIMESTAMP fecha_registro
    }

    Listing {
        UUID id PK
        UUID host_id "Lógico FK"
        VARCHAR titulo
        DECIMAL precio_por_noche
        INT capacidad_maxima
        POINT ubicacion
        VARCHAR estado "ACTIVE, INACTIVE"
    }

    Booking {
        UUID id PK
        UUID listing_id "Lógico FK"
        UUID guest_id "Lógico FK"
        DATE check_in
        DATE check_out
        DECIMAL precio_total
        VARCHAR estado "PENDING, CONFIRMED, CANCELLED"
    }

    Review {
        UUID id PK
        UUID booking_id "Lógico FK"
        UUID reviewer_id "Lógico FK"
        UUID listing_id "Lógico FK"
        INT calificacion "1 to 5"
        TEXT comentario
    }

    Notification {
        UUID id PK
        UUID user_id "Lógico FK"
        VARCHAR tipo "BOOKING, SYSTEM"
        VARCHAR mensaje
        BOOLEAN is_read
        TIMESTAMP created_at
    }
```

### Flujo de reserva (secuencia)

```mermaid
sequenceDiagram
    actor Huésped
    participant API_Gateway as API Gateway
    participant Booking_Svc as Booking Service
    participant Listing_Svc as Listing Service
    participant DB_Booking as (PostgreSQL) Reservas
    participant Event_Bus as Event Bus (Kafka)
    participant Notif_Svc as Notification Svc
    actor Anfitrión

    Huésped->>API_Gateway: 1. POST /v1/bookings {listingId, dates} con JWT
    API_Gateway->>API_Gateway: 2. Valida Token (AuthN)
    API_Gateway->>Booking_Svc: 3. Llama al controlador de Reserva
    Booking_Svc->>Listing_Svc: 4. Valida disponibilidad y precio (gRPC/REST)
    Listing_Svc-->>Booking_Svc: 5. 200 OK (Disponible)
    Booking_Svc->>DB_Booking: 6. TRANSACTION: Row-level lock y Crea Booking PENDING
    DB_Booking-->>Booking_Svc: 7. Booking Creado
    Booking_Svc->>Event_Bus: 8. Publica evento "BookingCreated"
    Booking_Svc-->>API_Gateway: 9. 201 Created (Booking Details)
    API_Gateway-->>Huésped: 10. Reserva Confirmada
    
    %% Flujo Asíncrono de Notificaciones
    Event_Bus-->>Notif_Svc: 11. Consume "BookingCreated"
    Notif_Svc->>Notif_Svc: 12. Prepara plantilla de correo/push
    Notif_Svc-->>Anfitrión: 13. [Push] "Tienes una nueva Reserva!"
```

### Diseño de alto nivel (componentes)

```mermaid
flowchart TD
    Client["Aplicaciones Web / Móvil"] --> CDN["CDN & WAF (CloudFront/Cloudflare)"]
    CDN --> APIGateway["API Gateway / Ingress Controller"]

    subgraph "Edge / Auth Layer"
        APIGateway
        AuthSvc["Auth/SSO Service <br/> Identity Provider"]
    end

    AuthSvc -.-> OIDC["Identity Provider - Auth0/Keycloak"]

    APIGateway -->|"Ruteo"| ListingService
    APIGateway -->|"Ruteo"| SearchService
    APIGateway -->|"Ruteo"| BookingService
    APIGateway -->|"Ruteo"| ReviewService
    
    subgraph "Core Microservices"
        ListingService["Listing Service"] --> DB_Listing[("Relational DB <br/> PostgreSQL")]
        SearchService["Search Service"] --> DB_Search[("Search Index <br/> ElasticSearch")]
        BookingService["Booking Service"] --> DB_Booking[("Relational DB <br/> PostgreSQL")]
        ReviewService["Review Service"] --> DB_Review[("NoSQL <br/> MongoDB")]
        NotifService["Notification Service"]
    end
    
    %% Event Messaging
    MessageBroker[["Message Broker / Event Bus <br/> Apache Kafka"]]
    
    ListingService -- "CDC / Publica Updates" --> MessageBroker
    BookingService -- "Publica BookingEvents" --> MessageBroker
    MessageBroker -- "Consume" --> SearchService
    MessageBroker -- "Consume" --> NotifService

    %% Service to Service (Synchronous)
    BookingService -. "Bloquea/Valida" .-> ListingService
```

### Flujo de autenticación OIDC (secuencia)

```mermaid
sequenceDiagram
    actor Usuario
    participant Cliente as App (Frontend)
    participant IdP as Auth0 (AuthZ Server)
    participant API as API Gateway (Resource Server)
    participant Backend as Microservicios (Booking/Listing)

    Usuario->>Cliente: 1. Click "Login / Sign-up"
    Cliente->>IdP: 2. Redirección OIDC (/authorize) + Code Challenge PKCE
    IdP-->>Usuario: 3. Renderiza página oficial SSO (Google/Apple/Email)
    Usuario->>IdP: 4. Ingresa credenciales correctas
    IdP-->>Cliente: 5. Retorna Authorization Code vía CallBack URI
    Cliente->>IdP: 6. POST /token intercambiando Authorization Code + PKCE Verifier
    IdP-->>Cliente: 7. Retorna ID Token y Access Token (JWT)
    
    %% Flujo contra nuestra Cloud
    Cliente->>API: 8. GET /v1/bookings HTTP Header `Authorization: Bearer <JWT>`
    API->>API: 9. Valida firma del JWT usando JWKS expuesto por Auth0
    API->>Backend: 10. Gateway propaga Request inyectando Headers proxy (X-User-Id)
    Backend-->>Cliente: 11. Respuesta de Dominio
```

## Prerrequisitos

- Node.js 20+
- npm 10+
- AWS CLI configurado (si vas a desplegar/probar en nube)
- AWS CDK (en el repo de infraestructura)

## Instalación

Desde la raíz de este repo:

```bash
npm install
```

Instalación adicional por módulo (si trabajarás en BFF/UI):

```bash
cd backend && npm install
cd ../frontend && npm install
```

## Comandos principales

En la raíz (`airbnb_group_services`):

```bash
npm run build
npm run test
```


Frontend (`frontend`):

```bash
npm run dev
npm run build
npm run preview
```

## Flujo con el repo de infraestructura

1. Desplegar infraestructura en `../airbnb_group_infrastruture` (`cdk deploy`).
2. Obtener outputs del stack (`ApiUrl`, `UserPoolId`, `UserPoolClientId`, etc.).
3. Configurar variables de entorno de `backend` y `frontend`.
4. Probar endpoints del BFF y endpoints `/v1/*` de API Gateway.

Guía completa: [`docs/INFRASTRUCTURE_INTEGRATION.md`](docs/INFRASTRUCTURE_INTEGRATION.md)

## Documentación disponible

- Arquitectura y estado actual: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- Setup local: [`docs/LOCAL_SETUP.md`](docs/LOCAL_SETUP.md)
- Integración con repo infra: [`docs/INFRASTRUCTURE_INTEGRATION.md`](docs/INFRASTRUCTURE_INTEGRATION.md)
- Referencia API (BFF + microservicios): [`API_documentation.md`](API_documentation.md)
- Guía rápida de microservicios: [`README_airbnb_microservices.md`](README_airbnb_microservices.md)

## Notas de estado importantes

- `notification-service` consume mensajes SQS, pero actualmente su lógica es de logging (simulación).
- `listing-service`, `booking-service` y `review-service` publican eventos en EventBridge.
- El código actual de `user-service` **no publica** todavía `user.created`, aunque existe regla de infraestructura para ese evento.
- Existen carpetas de artefactos generados (`generated/`, `services/generated/`) que no son fuente canónica del dominio.
