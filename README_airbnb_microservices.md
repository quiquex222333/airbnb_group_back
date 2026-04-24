# Airbnb Microservices Clone

Proyecto académico de microservicios inspirado en Airbnb, construido con enfoque **contract-first** y buenas prácticas para una demo avanzada en AWS.

## Tecnologías principales

- TypeScript
- Smithy
- AWS CDK
- AWS Lambda
- API Gateway
- DynamoDB
- CloudWatch Logs
- Node.js 20+

## Objetivo del proyecto

Construir una arquitectura de microservicios tipo Airbnb, aplicando patrones modernos como:

- Contratos API con Smithy.
- Infraestructura como código con AWS CDK.
- Servicios serverless con Lambda.
- Persistencia independiente por servicio.
- Comunicación futura por eventos.
- Buenas prácticas de despliegue y documentación.

## Arquitectura inicial implementada

Primer hito implementado: **User Service**.

```txt
Client
  ↓
API Gateway
  ↓
User Service Lambda
  ↓
DynamoDB UsersTable
```

## Estructura del proyecto

```txt
airbnb-microservices/
├── contracts/
│   └── smithy/
│       ├── models/
│       │   └── user.smithy
│       └── smithy-build.json
├── generated/
│   └── typescript/
│       └── user-client/
├── services/
│   ├── user-service/
│   │   ├── src/
│   │   │   └── handler.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── listing-service/
│   ├── booking-service/
│   ├── review-service/
│   └── notification-service/
├── infrastructure/
│   └── cdk/
│       ├── bin/
│       ├── lib/
│       │   └── cdk-stack.ts
│       ├── package.json
│       └── tsconfig.json
├── shared/
├── docs/
└── README.md
```

## Requisitos previos

Antes de ejecutar el proyecto, se debe tener instalado:

- Node.js 20 o superior.
- npm.
- AWS CLI.
- AWS CDK.
- Smithy CLI.
- Cuenta AWS configurada.

Validar instalaciones:

```bash
node -v
npm -v
aws --version
cdk --version
smithy --version
```

Configurar credenciales de AWS:

```bash
aws configure
```

## Instalación general

Desde la raíz del proyecto:

```bash
npm install
```

## Configuración del monorepo

El proyecto usa npm workspaces.

El `package.json` raíz debe incluir:

```json
{
  "name": "airbnb-microservices",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "services/*",
    "shared/*",
    "infrastructure/cdk"
  ],
  "scripts": {
    "build": "npm run build --workspaces --if-present",
    "test": "npm run test --workspaces --if-present"
  }
}
```

## Contrato Smithy

El contrato del servicio de usuarios se encuentra en:

```txt
contracts/smithy/models/user.smithy
```

El contrato define:

- `UserService`
- Operación `CreateUser`
- Entrada `CreateUserInput`
- Salida `CreateUserOutput`
- Errores `ValidationError` y `ConflictError`

## Generar código desde Smithy

Desde la raíz del proyecto:

```bash
cd contracts/smithy
smithy build
cd ../..
```

Copiar cliente generado:

```bash
rm -rf generated/typescript/user-client
mkdir -p generated/typescript/user-client

cp -R contracts/smithy/build/smithy/source/typescript-client-codegen/* generated/typescript/user-client/
```

Compilar cliente generado:

```bash
cd generated/typescript/user-client
npm install
npm run build
cd ../../..
```

## User Service

Ubicación:

```txt
services/user-service
```

Responsabilidad actual:

- Crear usuarios.
- Validar nombre completo.
- Validar email.
- Guardar usuario en DynamoDB.
- Responder errores estándar.

## Compilar User Service

Desde la raíz:

```bash
npm run build -w @airbnb-clone/user-service
```

## Infraestructura CDK

Ubicación:

```txt
infrastructure/cdk
```

Recursos creados actualmente:

- DynamoDB `UsersTable`.
- Lambda `UserLambda`.
- API Gateway `AirbnbApi`.
- Endpoint `POST /v1/users`.

La Lambda se empaqueta usando `NodejsFunction` y `esbuild`, para incluir correctamente dependencias como `uuid`.

## Desplegar infraestructura

Desde la raíz:

```bash
cd infrastructure/cdk
npm run build
cdk deploy
```

Si es la primera vez usando CDK en la cuenta/región:

```bash
cdk bootstrap
```

Luego:

```bash
cdk deploy
```

Al terminar, CDK mostrará una URL parecida a:

```txt
https://xxxx.execute-api.us-east-2.amazonaws.com/prod/
```

## Probar endpoint

Crear usuario:

```bash
curl -X POST https://TU_URL/v1/users \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Juan Perez","email":"juan@test.com"}'
```

Respuesta esperada:

```json
{
  "user": {
    "userId": "uuid",
    "fullName": "Juan Perez",
    "email": "juan@test.com",
    "createdAt": "2026-04-24T..."
  }
}
```

## Endpoint actual

### Crear usuario

```http
POST /v1/users
```

Body:

```json
{
  "fullName": "Juan Perez",
  "email": "juan@test.com"
}
```

Respuestas:

| Código | Descripción |
|---|---|
| 201 | Usuario creado correctamente |
| 400 | Error de validación |
| 409 | Email duplicado |
| 500 | Error interno |

## Ver logs de Lambda

Listar grupos de logs:

```bash
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda"
```

Ver logs en vivo:

```bash
aws logs tail "/aws/lambda/NOMBRE_DE_LA_LAMBDA" --follow
```

Ejemplo:

```bash
aws logs tail "/aws/lambda/CdkStack-UserLambdaAD4FB23B-xxxx" --follow
```

## Buenas prácticas aplicadas

- Monorepo modular.
- Contratos definidos con Smithy.
- Infraestructura como código con CDK.
- Separación entre contratos, servicios e infraestructura.
- Lambda empaquetada con `NodejsFunction`.
- Dependencias empaquetadas con `esbuild`.
- Uso de variables de entorno.
- DynamoDB en modo `PAY_PER_REQUEST`.
- Validaciones básicas de entrada.
- Respuestas HTTP consistentes.
- Logs en CloudWatch.
- `RemovalPolicy.DESTROY` usado solo por ser ambiente académico/demo.

## Consideraciones de costos

Este proyecto está pensado para una cuenta AWS con créditos o Free Tier.

Servicios de bajo riesgo inicial:

- Lambda.
- API Gateway.
- DynamoDB bajo demanda.
- CloudWatch con logs controlados.

Servicios avanzados que se agregarán con cuidado:

- OpenSearch.
- ElastiCache.
- RDS PostgreSQL.
- Step Functions.

Estos servicios pueden generar costos aunque no tengan mucho tráfico, porque algunos cobran por tiempo encendido.

## Próximos pasos

- Agregar pruebas unitarias al User Service.
- Mejorar unicidad por email en DynamoDB.
- Agregar Cognito para autenticación.
- Crear Listing Service.
- Aplicar CQRS en Listing Service.
- Crear Booking Service.
- Agregar SAGA con Step Functions.
- Agregar EventBridge/SQS para eventos.
- Agregar Review Service.
- Agregar Notification Service.

## Flujo de trabajo recomendado

Para cada nuevo cambio importante se debe incluir:

```txt
1. Código de implementación.
2. Pruebas correspondientes.
3. Actualización del README.
4. Comandos de ejecución o despliegue.
5. Validación manual con curl/Postman cuando aplique.
```
