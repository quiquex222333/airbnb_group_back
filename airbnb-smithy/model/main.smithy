$version: "2"

namespace com.airbnb.api

use aws.protocols#restJson1
use airbnbclone.common.headers#TraceHeaders
use airbnbclone.common.headers#JsonHeaders

@title("Airbnb Backend Core API")
@documentation("""
    HTTP API versionado por URL: todas las operaciones REST usan el prefijo de ruta `/v1`.
    Cambios incompatibles del contrato requieren una nueva versión en la URL (p. ej. `/v2`);
    cambios compatibles permanecen bajo `/v1`. Los eventos asíncronos deben declarar su
    versión de esquema en metadatos cuando aplique.
    """)
@restJson1
@httpBearerAuth
service AirbnbService {
    version: "2026-03-30",
    resources: [Listing, Booking],
    operations: [Register, Login, GetCurrentUser, UpdateListingStatus, UpdateBookingStatus],
    errors: [
        BadRequestError,
        UnauthorizedError,
        ForbiddenError,
        NotFoundError,
        ConflictError,
        EmailAlreadyExistsError,
        InvalidPasswordPolicyError,
        InvalidRoleError,
        InvalidCredentialsError,
        UserDisabledError,
        AuthUserNotFoundError,
        AuthUnauthorizedError,
        TokenExpiredError,
        TokenInvalidError,
        InvalidListingDataError,
        ForbiddenRoleError,
        HostNotFoundError,
        ListingNotFoundError,
        ForbiddenListingAccessError,
        InvalidStatusTransitionError,
        ListingNotReadyForPublishError,
        InternalServerError
    ]
}

// ---------------------------------------------------------
//  Auth (Registration — MVP)
// ---------------------------------------------------------

/// Rol permitido en el registro público del MVP.
enum RegistrationRole {
    GUEST = "guest"
    HOST = "host"
}

@http(method: "POST", uri: "/v1/auth/register", code: 201)
@auth([])
operation Register {
    input: RegisterInput,
    output: RegisterOutput,
    errors: [
        EmailAlreadyExistsError,
        InvalidPasswordPolicyError,
        InvalidRoleError,
        InternalServerError
    ]
}

@input
structure RegisterInput with [TraceHeaders, JsonHeaders] {
    @required
    @length(min: 1, max: 200)
    name: String,

    @required
    @Length(min: 5, max: 250)
    @pattern("^[^@\\s]+@[^@\\s]+\.[^@\\s]+$")
    email: String,

    /// Mín. 8 caracteres, mayúscula, minúscula, dígito y carácter especial.
    @required
    @pattern("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,128}$")
    password: String,

    @required
    role: RegistrationRole
}

@output
structure RegisterOutput {
    @required
    userId: String,

    @required
    email: String,

    @required
    role: String,

    @required
    status: String
}

/// Autenticación: emite tokens de sesión (JWT u opacos según implementación) y perfil mínimo.
@http(method: "POST", uri: "/v1/auth/login", code: 200)
@auth([])
operation Login {
    input: LoginInput,
    output: LoginOutput,
    errors: [
        InvalidCredentialsError,
        UserDisabledError,
        AuthUserNotFoundError,
        InternalServerError
    ]
}

@input
structure LoginInput with [TraceHeaders, JsonHeaders] {
    @required
    email: String,

    @required
    password: String
}

/// Claims mínimos del usuario expuestos al cliente tras login (sin secretos).
structure AuthenticatedUser {
    @required
    id: String,

    @required
    name: String,

    @required
    email: String,

    @required
    role: String
}

@output
structure LoginOutput {
    /// Access token (p. ej. JWT) para `Authorization: Bearer`.
    @required
    accessToken: String,

    /// Refresh token para renovar sesión sin reintroducir contraseña.
    @required
    refreshToken: String,

    /// Vida útil del access token en segundos (p. ej. 3600).
    @required
    expiresIn: Integer,

    @required
    user: AuthenticatedUser
}

/// Perfil mínimo del usuario autenticado (`Authorization: Bearer` obligatorio).
@readonly
@http(method: "GET", uri: "/v1/auth/me", code: 200)
operation GetCurrentUser {
    input: GetCurrentUserInput,
    output: AuthenticatedUser,
    errors: [
        AuthUnauthorizedError,
        TokenExpiredError,
        TokenInvalidError,
        InternalServerError
    ]
}

@input
structure GetCurrentUserInput with [TraceHeaders, JsonHeaders] {}

// ---------------------------------------------------------
//  Listings (Resource & Operations)
// ---------------------------------------------------------

resource Listing {
    identifiers: { listingId: String },
    read: GetListing,
    create: CreateListing,
    list: ListListings
}

/// Ciclo de vida del anuncio en catálogo.
enum ListingLifecycleStatus {
    DRAFT = "draft"
    PUBLISHED = "published"
    PAUSED = "paused"
    ARCHIVED = "archived"
}

/// Tipo de alojamiento publicado.
enum ListingPropertyType {
    APARTMENT = "apartment"
    HOUSE = "house"
    ROOM = "room"
    OTHER = "other"
}

list StringList {
    member: String
}

/// Ubicación del alojamiento (`Point` lat/lon), alineado al diccionario de entidades Listing.
structure ListingLocation {
    @required
    @range(min: -90, max: 90)
    lat: Double,

    @required
    @range(min: -180, max: 180)
    lon: Double
}

/// Detalle completo de un listing (lectura según visibilidad draft/publicado).
structure ListingDetail {
    @required
    id: String,

    @required
    hostId: String,

    @required
    title: String,

    description: String,

    @required
    type: ListingPropertyType,

    @required
    pricePerNight: Double,

    @required
    @pattern("^[A-Z]{3}$")
    currency: String,

    @required
    @range(min: 1)
    maxGuests: Integer,

    @required
    status: ListingLifecycleStatus,

    @required
    location: ListingLocation,

    @required
    amenities: StringList,

    @required
    images: StringList
}

@readonly
@http(method: "GET", uri: "/v1/listings", code: 200)
@auth([]) // Endpoint Público (Pre-login). Sobreescribe @httpBearerAuth
operation ListListings {
    input: ListListingsInput,
    output: ListListingsOutput
}

@input
structure ListListingsInput with [TraceHeaders, JsonHeaders] {
    @httpQuery("lat")
    lat: Double,

    @httpQuery("lon")
    lon: Double,

    @httpQuery("minPrice")
    @range(min: 0)
    minPrice: Double,

    @httpQuery("maxPrice")
    @range(min: 0)
    maxPrice: Double
}

@output
structure ListListingsOutput {
    @required
    listings: ListingSummaryList
}

list ListingSummaryList {
    member: ListingSummary
}

structure ListingSummary {
    @required
    listingId: String,

    @required
    title: String,

    @required
    pricePerNight: Double
}

/// Detalle: `published` visible sin token; `draft` requiere host dueño o admin (implementación).
@readonly
@http(method: "GET", uri: "/v1/listings/{listingId}", code: 200)
@auth([]) // Catálogo público; visibilidad draft restringida en servidor
operation GetListing {
    input: GetListingInput,
    output: ListingDetail,
    errors: [
        ListingNotFoundError,
        ForbiddenListingAccessError,
        InternalServerError
    ]
}

@input
structure GetListingInput with [TraceHeaders, JsonHeaders] {
    @required
    @httpLabel
    listingId: String
}

/// Crear listing: inicia en `draft`; requiere JWT de host. Validar `hostId` vs `sub` del token.
@http(method: "POST", uri: "/v1/listings", code: 201)
operation CreateListing {
    input: CreateListingInput,
    output: CreateListingOutput,
    errors: [
        InvalidListingDataError,
        ForbiddenRoleError,
        HostNotFoundError,
        InternalServerError
    ]
}

@input
structure CreateListingInput with [TraceHeaders, JsonHeaders] {
    @required
    hostId: String,

    @required
    @length(min: 1, max: 200)
    title: String,

    @length(min: 1, max: 8000)
    description: String,

    @required
    type: ListingPropertyType,

    @required
    @range(min: 0.01)
    pricePerNight: Double,

    @required
    @pattern("^[A-Z]{3}$")
    currency: String,

    @required
    @range(min: 1)
    maxGuests: Integer,

    @required
    location: ListingLocation,

    @required
    amenities: StringList,

    @required
    images: StringList
}

/// Listing completo: mismos atributos que el body de creación más `status` y `createdAt` generados en servidor.
@output
structure CreateListingOutput with [ListingDetail] {
    /// Fecha de creación en ISO 8601 (UTC), p. ej. `2026-03-29T19:00:00Z`.
    @required
    createdAt: String
}

/// Transición de estado del listing (dueño o admin).
@http(method: "PATCH", uri: "/v1/listings/{listingId}/status", code: 200)
operation UpdateListingStatus {
    input: UpdateListingStatusInput,
    output: UpdateListingStatusOutput,
    errors: [
        InvalidStatusTransitionError,
        ListingNotReadyForPublishError,
        ForbiddenListingAccessError,
        ListingNotFoundError,
        InternalServerError
    ]
}

@input
structure UpdateListingStatusInput with [TraceHeaders, JsonHeaders] {
    @required
    @httpLabel
    listingId: String,

    @required
    status: ListingLifecycleStatus
}

@output
structure UpdateListingStatusOutput {
    @required
    id: String,

    @required
    status: ListingLifecycleStatus,

    /// Última actualización en ISO 8601 (UTC).
    @required
    updatedAt: String
}

// ---------------------------------------------------------
//  Bookings (Resource & Operations)
// ---------------------------------------------------------

resource Booking {
    identifiers: { bookingId: String },
    read: GetBooking,
    create: CreateBooking,
    update: UpdateBookingStatus,
    resources: [Review]
}

@http(method: "POST", uri: "/v1/bookings", code: 201)
operation CreateBooking {
    input: CreateBookingInput,
    output: GetBookingOutput
}

@input
structure CreateBookingInput with [TraceHeaders, JsonHeaders] {
    // Body
    @required
    listingId: String,

    @required
    @pattern("^[0-9]{4}-[0-9]{2}-[0-9]{2}$") // Estricto YYYY-MM-DD
    checkIn: String,

    @required
    @pattern("^[0-9]{4}-[0-9]{2}-[0-9]{2}$")
    checkOut: String
}

@output
structure GetBookingOutput {
    @required
    bookingId: String,

    @required
    listingId: String,

    @required
    guestId: String,

    @required
    status: BookingStatus,

    @required
    totalPrice: Double
}

enum BookingStatus {
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELED = "CANCELED"
}

@readonly
@http(method: "GET", uri: "/v1/bookings/{bookingId}", code: 200)
operation GetBooking {
    input: GetBookingInput,
    output: GetBookingOutput
}

@input
structure GetBookingInput with [TraceHeaders, JsonHeaders] {
    // Path
    @required
    @httpLabel
    bookingId: String
}

/// Actualiza el estado de la reserva (p. ej. transición a `CANCELED`). Reglas de transición en servidor.
@http(method: "PATCH", uri: "/v1/bookings/{bookingId}/status", code: 200)
operation UpdateBookingStatus {
    input: UpdateBookingStatusInput,
    output: GetBookingOutput,
    errors: [
        NotFoundError,
        ForbiddenError,
        InvalidStatusTransitionError,
        InternalServerError
    ]
}

@input
structure UpdateBookingStatusInput with [TraceHeaders, JsonHeaders] {
    @required
    @httpLabel
    bookingId: String,

    @required
    status: BookingStatus
}

// ---------------------------------------------------------
//  Reviews (Nested Resource under Booking)
// ---------------------------------------------------------

resource Review {
    identifiers: { bookingId: String, reviewId: String },
    create: CreateReview
}

@http(method: "POST", uri: "/v1/bookings/{bookingId}/reviews", code: 201)
operation CreateReview {
    input: CreateReviewInput,
    output: CreateReviewOutput
}

@input
structure CreateReviewInput with [TraceHeaders, JsonHeaders] {
    // Path + Body
    @required
    @httpLabel
    bookingId: String,

    @required
    @range(min: 1, max: 5)
    rating: Integer,

    @required
    @length(min: 10, max: 2000)
    comment: String
}

@output
structure CreateReviewOutput {
    @required
    reviewId: String,

    @required
    bookingId: String,

    @required
    reviewerId: String,

    @required
    rating: Integer,

    @required
    comment: String
}


// ---------------------------------------------------------
//  Global Errors (Centralized)
// ---------------------------------------------------------
@error("client")
@httpError(400)
structure BadRequestError {
    @required
    message: String
}

@error("client")
@httpError(401)
structure UnauthorizedError {
    @required
    message: String
}

@error("client")
@httpError(403)
structure ForbiddenError {
    @required
    message: String
}

@error("client")
@httpError(404)
structure NotFoundError {
    @required
    message: String
}

@error("client")
@httpError(409)
structure ConflictError {
    @required
    message: String
}

@error("server")
@httpError(500)
structure InternalServerError {
    @required
    message: String
}

// ---------------------------------------------------------
//  Auth Errors (Centralized)
// ---------------------------------------------------------
structure AuthErrorBody {
    @required
    code: String,

    @required
    message: String
}

@error("client")
@httpError(409)
structure EmailAlreadyExistsError {
    @required
    error: AuthErrorBody
}

@error("client")
@httpError(422)
structure InvalidPasswordPolicyError {
    @required
    error: AuthErrorBody
}

@error("client")
@httpError(422)
structure InvalidRoleError {
    @required
    error: AuthErrorBody
}

/// Email no registrado (`USER_NOT_FOUND`).
@error("client")
@httpError(404)
structure AuthUserNotFoundError {
    @required
    error: AuthErrorBody
}

/// Cuenta existe pero no puede iniciar sesión (`USER_DISABLED`).
@error("client")
@httpError(403)
structure UserDisabledError {
    @required
    error: AuthErrorBody
}

/// Usuario existe pero la contraseña no coincide (`INVALID_CREDENTIALS`).
@error("client")
@httpError(401)
structure InvalidCredentialsError {
    @required
    error: AuthErrorBody
}

/// Falta token o no está autorizado (`UNAUTHORIZED`).
@error("client")
@httpError(401)
structure AuthUnauthorizedError {
    @required
    error: AuthErrorBody
}

/// Token de acceso expirado (`TOKEN_EXPIRED`).
@error("client")
@httpError(401)
structure TokenExpiredError {
    @required
    error: AuthErrorBody
}

/// Token mal formado, firma inválida o emitido por otro emisor (`TOKEN_INVALID`).
@error("client")
@httpError(401)
structure TokenInvalidError {
    @required
    error: AuthErrorBody
}

// --- Listings (domain errors, `error.code` estable) ---

/// Payload inválido o reglas de validación de listing (`INVALID_LISTING_DATA`).
@error("client")
@httpError(422)
structure InvalidListingDataError {
    @required
    error: AuthErrorBody
}

/// El actor no tiene rol de host (`FORBIDDEN_ROLE`).
@error("client")
@httpError(403)
structure ForbiddenRoleError {
    @required
    error: AuthErrorBody
}

/// El `hostId` no corresponde a un usuario existente (`HOST_NOT_FOUND`).
@error("client")
@httpError(404)
structure HostNotFoundError {
    @required
    error: AuthErrorBody
}

/// Listing inexistente (`LISTING_NOT_FOUND`).
@error("client")
@httpError(404)
structure ListingNotFoundError {
    @required
    error: AuthErrorBody
}

/// Sin permiso para ver o modificar el recurso (`FORBIDDEN_ACCESS`).
@error("client")
@httpError(403)
structure ForbiddenListingAccessError {
    @required
    error: AuthErrorBody
}

/// Transición de estado no permitida (`INVALID_STATUS_TRANSITION`).
@error("client")
@httpError(409)
structure InvalidStatusTransitionError {
    @required
    error: AuthErrorBody
}

/// Faltan datos mínimos para publicar (`LISTING_NOT_READY_FOR_PUBLISH`).
@error("client")
@httpError(422)
structure ListingNotReadyForPublishError {
    @required
    error: AuthErrorBody
}