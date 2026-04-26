# Airbnb Group Services

Repositorio de servicios del proyecto de microservicios tipo Airbnb.

## Contenido
- Contratos Smithy
- Servicios Lambda (User, Notification)
- Código generado
- Paquetes compartidos
- Tests

## Instalación
npm install

## Build
npm run build

## Tests
npm test

## Servicios

### User Service
- Crea usuarios autenticados
- Emite evento user.created

### Notification Service
- Consume eventos desde SQS
- Simula notificaciones

## Smithy
cd contracts/smithy
smithy build

## Variables de entorno
USERS_TABLE=
EVENT_BUS_NAME=

## Nota
Este repo no contiene infraestructura. Ver airbnb_group_infrastructure.
