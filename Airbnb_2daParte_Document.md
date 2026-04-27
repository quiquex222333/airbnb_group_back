# Airbnb - Documento de Justificación de Cambios (2da Parte)

## Introducción

Este documento detalla y justifica las desviaciones y adaptaciones realizadas en
la implementación del proyecto Airbnb frente a las especificaciones originales
planteadas en el documento de diseño técnico inicial (Fase 1).

Las decisiones técnicas tomadas durante el desarrollo buscan priorizar la
agilidad, la escalabilidad nativa en la nube, la integración de servicios de AWS
y la reducción de la complejidad operativa, asegurando al mismo tiempo la
robustez del sistema.

---

## Cambios Arquitectónicos y Justificaciones Técnicas

### 1. Migración de Almacenamiento Relacional a NoSQL Serverless

- **Diseño Original:** Se estipuló el uso de PostgreSQL para los microservicios
  de Booking y Listing, y ElasticSearch para búsquedas.
- **Implementación Actual:** Se optó por utilizar **Amazon DynamoDB** para todas
  las entidades centrales (`UsersTable`, `ListingsTable`, `BookingsTable`).
- **Justificación:** DynamoDB encaja perfectamente en una arquitectura 100%
  Serverless. Al usar el modo _Pay-Per-Request_, se eliminan los altos costos
  fijos de instancias RDS o clústeres de ElasticSearch. DynamoDB provee escalado
  automático e infinito y latencias de un solo dígito de milisegundo, cumpliendo
  excepcionalmente con los requerimientos de tolerancia a fallos y velocidad
  definidos originalmente.

### 2. Gestión de Identidad: Transición de Auth0 a Amazon Cognito

- **Diseño Original:** Delegación de la identidad vía OIDC/SSO usando Auth0.
- **Implementación Actual:** Implementación de **Amazon Cognito (User Pools)**
  integrado directamente en la infraestructura con flujos de usuario
  administrados internamente (`auth.smithy`).
- **Justificación:** La elección de Amazon Cognito permite una sinergia
  inigualable con el stack de AWS CDK y API Gateway a través del
  `CognitoUserPoolsAuthorizer`. Esto simplifica enormemente la gestión del ciclo
  de vida del usuario y la autorización de recursos, manteniendo los estándares
  de seguridad mediante JWT y eliminando la necesidad de gestionar redes
  externas de terceros, lo que incrementa la cohesión del ecosistema.

### 3. Ajuste en la Jerarquía de Endpoints de Reseñas

- **Diseño Original:** Enrutamiento anidado estricto:
  `POST /v1/bookings/{bookingId}/reviews`.
- **Implementación Actual:** Enrutamiento aplanado e independiente:
  `POST /v1/reviews` y `GET /v1/reviews/listing/{listingId}`.
- **Justificación:** Aplanar el endpoint de creación de reseñas desacopla el
  microservicio de Reviews del servicio de Bookings, permitiendo que las
  interfaces de usuario obtengan directamente las reseñas de un _Listing_ sin
  necesidad de inferir la reserva previa. Este patrón facilita un renderizado
  mucho más ágil y directo en la vista pública de alojamientos.

### 4. Adaptación de Manejo de Errores en Smithy

- **Diseño Original:** Uso genérico de `BadRequestError`.
- **Implementación Actual:** Uso de `ValidationError` en los modelos Smithy.
- **Justificación:** La adopción de `ValidationError` otorga mayor claridad
  semántica para los clientes de la API, indicando de forma explícita que la
  falla ocurre en la capa de validación estructural (inputs inválidos según los
  traits de Smithy) antes de alcanzar la lógica de negocio, lo cual mejora la
  experiencia de debugging.

### 5. Incorporación de Endpoints Customizados de Autenticación

- **Diseño Original:** Redirección absoluta del flujo OAuth al IdP externo.
- **Implementación Actual:** Modelado de la API `auth.smithy` exponiendo
  endpoints de `Register`, `Login`, `ConfirmSignUp`, etc.
- **Justificación:** Al tener contratos explícitos de autenticación dentro del
  ecosistema Smithy, los clientes (Frontend/Mobile) pueden aprovechar los SDKs
  generados automáticamente para invocar los flujos de login sin depender de
  bibliotecas pesadas externas (como SDKs genéricos de OIDC). Esto centraliza la
  definición de todo el sistema dentro de una sola fuente de la verdad (Smithy).

### 6. Omisión Temporal de ElasticSearch y Endpoints de Lectura Pura

- **Diseño Original:** Sincronización asíncrona hacia ElasticSearch para el
  `GET /v1/listings`.
- **Implementación Actual:** Aún no desplegados en el AWS CDK.
- **Justificación:** Para garantizar la entrega ágil de la Fase 1, se ha
  priorizado el flujo transaccional crítico (escritura de propiedades y
  reservas). Las consultas asíncronas y vistas pre-calculadas complejas se
  pueden integrar iterativamente sobre la arquitectura orientada a eventos ya
  implementada (Amazon EventBridge), asegurando una evolución orgánica de la
  infraestructura sin sobreingeniería inicial.
