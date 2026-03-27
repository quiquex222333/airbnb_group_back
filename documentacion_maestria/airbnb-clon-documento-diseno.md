# Airbnb Clon – Documento de Diseño

## 1. Información general

**Nombre del proyecto:** Airbnb Clon  
**Módulo académico:** Arquitectura en la Nube y Microservicios  
**Tipo de sistema:** Plataforma web y móvil para publicación, búsqueda y reserva de alojamientos  
**Versión del documento:** 1.0  

---

## 2. Introducción

Este documento describe el diseño funcional y técnico de un sistema inspirado en Airbnb, desarrollado como proyecto académico para la materia de Arquitectura en la Nube y Microservicios. El objetivo es construir una plataforma escalable que permita a anfitriones publicar propiedades y a huéspedes buscar, reservar y pagar estadías de manera segura.

La propuesta adopta una arquitectura basada en microservicios desplegada en la nube, con separación clara de responsabilidades, escalabilidad horizontal, integración mediante API Gateway y comunicación asíncrona para ciertos procesos de negocio.

---

## 3. Objetivo del documento

Definir la arquitectura, componentes, flujos principales, módulos funcionales, decisiones técnicas y lineamientos de implementación del clon de Airbnb, de modo que el equipo de desarrollo pueda construir el sistema de forma ordenada, escalable y alineada a los requerimientos académicos del proyecto.

---

## 4. Objetivos del sistema

### 4.1 Objetivo general

Diseñar e implementar una plataforma tipo Airbnb basada en arquitectura de microservicios en la nube, que permita gestionar usuarios, propiedades, reservas, pagos y reseñas de forma segura, modular y escalable.

### 4.2 Objetivos específicos

- Permitir el registro e inicio de sesión de usuarios con roles diferenciados.
- Permitir a los anfitriones publicar y administrar alojamientos.
- Permitir a los huéspedes buscar propiedades por ubicación, fecha, precio y características.
- Gestionar el proceso de reserva con validación de disponibilidad.
- Integrar un módulo de pagos.
- Permitir la publicación de reseñas y calificaciones.
- Garantizar escalabilidad, observabilidad y tolerancia a fallos mediante servicios desacoplados.

---

## 5. Alcance

### 5.1 Alcance del MVP

El sistema incluirá las siguientes funcionalidades mínimas:

- Registro, autenticación e inicio de sesión.
- Gestión de perfiles de usuario.
- Publicación y edición de propiedades.
- Carga de imágenes de propiedades.
- Búsqueda y filtrado de alojamientos.
- Visualización del detalle de una propiedad.
- Solicitud y confirmación de reservas.
- Gestión básica de pagos.
- Reseñas y calificaciones.
- Panel básico para anfitrión y huésped.

### 5.2 Fuera de alcance en primera versión

- Chat en tiempo real entre huésped y anfitrión.
- Recomendaciones inteligentes con IA.
- Precios dinámicos automáticos.
- Programa de fidelización.
- Soporte multimoneda avanzado.
- Aplicación móvil nativa completa en primera fase.

---

## 6. Actores del sistema

### 6.1 Huésped
Usuario que busca propiedades, revisa disponibilidad, realiza reservas, efectúa pagos y publica reseñas.

### 6.2 Anfitrión
Usuario que publica propiedades, administra disponibilidad, define precios y recibe reservas.

### 6.3 Administrador
Usuario con privilegios para supervisar la plataforma, gestionar incidencias, moderar contenido y monitorear el estado del sistema.

---

## 7. Requerimientos funcionales

### RF-01. Registro de usuarios
El sistema debe permitir el registro de usuarios mediante correo electrónico y contraseña.

### RF-02. Autenticación
El sistema debe permitir el inicio y cierre de sesión utilizando credenciales seguras.

### RF-03. Gestión de perfil
Los usuarios podrán actualizar sus datos personales, foto de perfil y preferencias.

### RF-04. Publicación de propiedades
Los anfitriones podrán registrar propiedades con título, descripción, ubicación, precio, servicios, reglas e imágenes.

### RF-05. Administración de propiedades
Los anfitriones podrán editar, activar, desactivar o eliminar sus propiedades.

### RF-06. Búsqueda de alojamientos
Los huéspedes podrán buscar alojamientos por ciudad, rango de fechas, cantidad de huéspedes, precio y características.

### RF-07. Visualización de detalle
El sistema mostrará información completa de cada propiedad, incluyendo imágenes, servicios, ubicación aproximada, disponibilidad, precio y reseñas.

### RF-08. Gestión de disponibilidad
El sistema permitirá mantener un calendario de disponibilidad para evitar reservas superpuestas.

### RF-09. Creación de reservas
Los huéspedes podrán seleccionar fechas y confirmar una reserva si la propiedad está disponible.

### RF-10. Pago de reservas
El sistema permitirá registrar el pago de una reserva mediante una pasarela de pagos simulada o real.

### RF-11. Historial de reservas
Los usuarios podrán consultar sus reservas pasadas, actuales y futuras.

### RF-12. Calificaciones y reseñas
Los huéspedes podrán publicar reseñas y calificaciones luego de completar una estadía.

### RF-13. Notificaciones
El sistema enviará notificaciones de eventos relevantes como creación de cuenta, confirmación de reserva y pago exitoso.

### RF-14. Administración del sistema
El administrador podrá revisar usuarios, propiedades reportadas, reservas y métricas generales.

---

## 8. Requerimientos no funcionales

### RNF-01. Escalabilidad
La solución debe permitir escalar horizontalmente los servicios con mayor carga, como búsqueda, reservas y autenticación.

### RNF-02. Disponibilidad
El sistema debe operar con alta disponibilidad mediante infraestructura en la nube.

### RNF-03. Seguridad
La autenticación debe usar tokens seguros, cifrado de contraseñas y control de acceso por roles.

### RNF-04. Rendimiento
La búsqueda de propiedades debe responder en tiempos adecuados incluso con múltiples publicaciones.

### RNF-05. Mantenibilidad
La arquitectura debe favorecer bajo acoplamiento y alta cohesión para facilitar cambios futuros.

### RNF-06. Observabilidad
El sistema debe contar con logs centralizados, métricas y trazabilidad entre servicios.

### RNF-07. Portabilidad
Los servicios deben poder desplegarse en contenedores y orquestarse en un entorno cloud.

---

## 9. Arquitectura propuesta

### 9.1 Estilo arquitectónico

Se propone una **arquitectura de microservicios** desplegada en la nube. Cada dominio principal del negocio se implementa como un servicio independiente, con base de datos propia o esquema aislado, expuesto mediante APIs y coordinado a través de un API Gateway.

### 9.2 Justificación

Este enfoque permite:

- Separar responsabilidades por dominio.
- Escalar de forma independiente los módulos críticos.
- Facilitar mantenimiento y despliegue continuo.
- Mejorar la resiliencia ante fallos parciales.
- Simular un caso real alineado a arquitectura moderna en nube.

---

## 10. Microservicios del sistema

### 10.1 Servicio de autenticación
**Responsabilidad:** registro, login, emisión y validación de tokens, gestión básica de credenciales y roles.

**Funciones principales:**
- Registro de usuario.
- Inicio de sesión.
- Generación de JWT.
- Recuperación de contraseña.

### 10.2 Servicio de usuarios
**Responsabilidad:** gestión de perfiles de usuarios y sus datos generales.

**Funciones principales:**
- Obtener perfil.
- Actualizar perfil.
- Consultar rol del usuario.

### 10.3 Servicio de propiedades
**Responsabilidad:** administración del catálogo de alojamientos.

**Funciones principales:**
- Crear propiedad.
- Editar propiedad.
- Listar propiedades.
- Cambiar estado de publicación.

### 10.4 Servicio de búsqueda
**Responsabilidad:** búsquedas y filtros optimizados de alojamientos.

**Funciones principales:**
- Buscar por ubicación.
- Filtrar por precio, fechas y servicios.
- Ordenar resultados.

### 10.5 Servicio de reservas
**Responsabilidad:** creación, validación y seguimiento de reservas.

**Funciones principales:**
- Verificar disponibilidad.
- Crear reserva.
- Cancelar reserva.
- Obtener historial de reservas.

### 10.6 Servicio de pagos
**Responsabilidad:** procesamiento o simulación de pagos.

**Funciones principales:**
- Registrar pago.
- Confirmar estado de transacción.
- Asociar pago con reserva.

### 10.7 Servicio de reseñas
**Responsabilidad:** gestión de comentarios y calificaciones.

**Funciones principales:**
- Registrar reseña.
- Listar reseñas por propiedad.
- Calcular promedio de calificación.

### 10.8 Servicio de notificaciones
**Responsabilidad:** envío de correos o notificaciones relacionadas con eventos del sistema.

**Funciones principales:**
- Confirmación de registro.
- Confirmación de reserva.
- Confirmación de pago.
- Avisos al anfitrión.

### 10.9 Servicio de administración
**Responsabilidad:** funciones de supervisión y control de la plataforma.

**Funciones principales:**
- Gestión de usuarios reportados.
- Revisión de propiedades.
- Consulta de estadísticas.

---

## 11. Componentes de infraestructura

### 11.1 API Gateway
Punto único de entrada para clientes web o móvil. Se encarga de enrutar solicitudes a cada microservicio, manejar autenticación, rate limiting y políticas comunes.

### 11.2 Balanceador de carga
Distribuye tráfico entre instancias disponibles de los servicios.

### 11.3 Service discovery
Permite localizar servicios dinámicamente dentro de la plataforma.

### 11.4 Mensajería/Event Bus
Facilita comunicación asíncrona entre servicios para eventos como:
- Reserva creada.
- Pago confirmado.
- Notificación enviada.
- Reseña publicada.

### 11.5 Almacenamiento de objetos
Se utilizará para imágenes de propiedades y perfiles.

### 11.6 Observabilidad
- Logs centralizados.
- Métricas por servicio.
- Trazabilidad distribuida.
- Monitoreo de salud.

---

## 12. Arquitectura lógica

### 12.1 Vista de alto nivel

**Clientes:**
- Web frontend
- App móvil o versión responsive

**Entrada:**
- API Gateway

**Capa de negocio:**
- Auth Service
- User Service
- Property Service
- Search Service
- Booking Service
- Payment Service
- Review Service
- Notification Service
- Admin Service

**Capa de datos:**
- Bases de datos independientes por servicio
- Almacenamiento de archivos
- Cache

---

## 13. Flujo principal de negocio

### 13.1 Flujo de publicación de propiedad
1. El anfitrión inicia sesión.
2. Ingresa al módulo de propiedades.
3. Registra título, descripción, ubicación, precio, servicios e imágenes.
4. El sistema valida la información.
5. La propiedad se almacena y queda publicada.

### 13.2 Flujo de búsqueda y reserva
1. El huésped ingresa ubicación y fechas.
2. El servicio de búsqueda devuelve propiedades disponibles.
3. El huésped selecciona una propiedad.
4. El sistema consulta disponibilidad real.
5. Se genera una reserva en estado pendiente.
6. El huésped realiza el pago.
7. El servicio de pagos confirma transacción.
8. La reserva cambia a confirmada.
9. El sistema notifica al huésped y al anfitrión.

### 13.3 Flujo de reseña
1. La estadía finaliza.
2. El huésped accede a su historial.
3. Publica reseña y calificación.
4. El sistema vincula la reseña con la propiedad.

---

## 14. Modelo de datos conceptual

### 14.1 Entidades principales

#### Usuario
- id
- nombre
- correo
- contraseña_hash
- rol
- foto_perfil
- fecha_registro
- estado

#### Propiedad
- id
- host_id
- título
- descripción
- país
- ciudad
- dirección
- latitud
- longitud
- precio_noche
- cantidad_huéspedes
- cantidad_habitaciones
- cantidad_baños
- servicios
- estado
- fecha_creación

#### ImagenPropiedad
- id
- propiedad_id
- url
- orden

#### Reserva
- id
- propiedad_id
- huésped_id
- fecha_inicio
- fecha_fin
- total
- estado
- fecha_creación

#### Pago
- id
- reserva_id
- monto
- moneda
- método
- estado
- referencia
- fecha_pago

#### Reseña
- id
- propiedad_id
- reserva_id
- usuario_id
- calificación
- comentario
- fecha

---

## 15. Diseño de APIs

### 15.1 Servicio de autenticación
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/forgot-password`

### 15.2 Servicio de usuarios
- `GET /users/me`
- `PUT /users/me`
- `GET /users/{id}`

### 15.3 Servicio de propiedades
- `POST /properties`
- `GET /properties/{id}`
- `PUT /properties/{id}`
- `DELETE /properties/{id}`
- `GET /properties/host/{hostId}`

### 15.4 Servicio de búsqueda
- `GET /search?location=&startDate=&endDate=&guests=&minPrice=&maxPrice=`

### 15.5 Servicio de reservas
- `POST /bookings`
- `GET /bookings/{id}`
- `GET /bookings/me`
- `PATCH /bookings/{id}/cancel`

### 15.6 Servicio de pagos
- `POST /payments`
- `GET /payments/{id}`
- `POST /payments/webhook`

### 15.7 Servicio de reseñas
- `POST /reviews`
- `GET /reviews/property/{propertyId}`

---

## 16. Comunicación entre servicios

### 16.1 Comunicación síncrona
Se utilizará HTTP/REST para consultas directas entre servicios cuando se requiera respuesta inmediata.

**Ejemplos:**
- Reserva consulta disponibilidad de una propiedad.
- API Gateway consulta autenticación.

### 16.2 Comunicación asíncrona
Se utilizará mensajería para eventos del sistema.

**Ejemplos:**
- `booking.created`
- `payment.completed`
- `notification.send`
- `review.created`

Esto reduce acoplamiento y mejora resiliencia.

---

## 17. Seguridad

La plataforma aplicará las siguientes medidas:

- Autenticación basada en JWT.
- Contraseñas cifradas con algoritmo seguro.
- Autorización por roles: huésped, anfitrión, administrador.
- Validación de entradas en todos los endpoints.
- Uso de HTTPS.
- Protección contra ataques comunes: inyección, XSS, CSRF según contexto del cliente.
- Rate limiting en API Gateway.
- Gestión segura de secretos y variables de entorno.

---

## 18. Despliegue en la nube

### 18.1 Estrategia de despliegue
Cada microservicio será empaquetado en contenedores Docker y desplegado en una plataforma cloud.

### 18.2 Componentes de despliegue
- Frontend web desplegado en hosting estático o contenedor.
- Microservicios desplegados en contenedores.
- Orquestación mediante Kubernetes o servicio administrado equivalente.
- Base de datos administrada en la nube.
- Bucket de almacenamiento para imágenes.
- CDN para archivos estáticos.

### 18.3 Ambientes
- Desarrollo
- Pruebas
- Producción

---

## 19. CI/CD

Se plantea una tubería de integración y despliegue continuo con las siguientes etapas:

1. Descarga del código fuente.
2. Instalación de dependencias.
3. Ejecución de pruebas unitarias.
4. Análisis de calidad de código.
5. Construcción de imagen Docker.
6. Publicación de imagen.
7. Despliegue automático a entorno de desarrollo o pruebas.

---

## 20. Estrategia de base de datos

Se recomienda **base de datos por microservicio**, evitando acoplamiento directo entre dominios.

### Posible distribución
- Auth Service → usuarios y credenciales.
- Property Service → propiedades e imágenes.
- Booking Service → reservas.
- Payment Service → pagos.
- Review Service → reseñas.

En búsquedas avanzadas, puede incluirse un índice optimizado para consultas rápidas.

---

## 21. Escenarios de escalabilidad

### Escenario 1: aumento de búsquedas
El servicio de búsqueda puede replicarse horizontalmente y apoyarse en cache.

### Escenario 2: aumento de reservas en temporada alta
El servicio de reservas puede escalar independientemente del resto.

### Escenario 3: gran volumen de imágenes
El almacenamiento de objetos desacopla archivos del backend y permite mejor rendimiento.

---

## 22. Riesgos técnicos

- Inconsistencia entre servicios si no se manejan correctamente eventos o fallos parciales.
- Complejidad operativa mayor que una arquitectura monolítica.
- Dificultad de depuración si no existe observabilidad adecuada.
- Riesgo de sobrecargar el MVP con demasiados servicios.

### Mitigación
- Definir límites claros por dominio.
- Implementar logs, métricas y trazas desde el inicio.
- Empezar con microservicios esenciales.
- Usar contratos API bien definidos.

---

## 23. Propuesta tecnológica referencial

### Frontend
- React, Next.js o Flutter Web

### Backend
- Node.js con NestJS / Express, o Java con Spring Boot, o .NET

### Base de datos
- PostgreSQL o MySQL

### Cache
- Redis

### Mensajería
- RabbitMQ o Kafka

### Contenedores
- Docker

### Orquestación
- Kubernetes

### Nube
- AWS, Azure o Google Cloud

### Observabilidad
- Prometheus, Grafana, ELK o equivalente

---

## 24. Roadmap sugerido de implementación

### Fase 1. Análisis y diseño
- Definición de requerimientos.
- Diseño de arquitectura.
- Diseño de base de datos.
- Prototipo UI.

### Fase 2. MVP funcional
- Autenticación.
- Gestión de usuarios.
- Gestión de propiedades.
- Búsqueda.
- Reservas.

### Fase 3. Funcionalidades complementarias
- Pagos.
- Reseñas.
- Notificaciones.
- Panel administrativo.

### Fase 4. DevOps y nube
- Contenerización.
- Despliegue cloud.
- Pipeline CI/CD.
- Monitoreo.

---

## 25. Conclusión

El clon de Airbnb propuesto constituye un caso de estudio adecuado para aplicar principios de arquitectura en la nube y microservicios. La división por dominios, el uso de APIs independientes, el despliegue en contenedores y la incorporación de observabilidad permiten construir una solución moderna, escalable y alineada con escenarios reales de software.

Este documento servirá como base para los siguientes entregables del proyecto, incluyendo diagramas, backlog técnico, diseño de base de datos, definición de endpoints, despliegue cloud y presentación final.

---

## 26. Anexos sugeridos

Como complemento a este documento, se recomienda elaborar:

- Diagrama de arquitectura general.
- Diagrama de microservicios.
- Diagrama de despliegue en la nube.
- Diagrama de base de datos.
- Casos de uso.
- Historias de usuario.
- Backlog técnico.
- Matriz de requerimientos funcionales y no funcionales.
