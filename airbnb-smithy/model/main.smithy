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
    errors: [
        BadRequestError,
        UnauthorizedError,
        ForbiddenError,
        NotFoundError,
        ConflictError,
        InternalServerError
    ]
}

// ---------------------------------------------------------
//  Listings (Resource & Operations)
// ---------------------------------------------------------

resource Listing {
    identifiers: { listingId: String },
    read: GetListing,
    create: CreateListing,
    list: ListListings
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

@readonly
@http(method: "GET", uri: "/v1/listings/{listingId}", code: 200)
@auth([]) // Público
operation GetListing {
    input: GetListingInput,
    output: GetListingOutput
}

@input
structure GetListingInput with [TraceHeaders, JsonHeaders] {
    //Path
    @required
    @httpLabel
    listingId: String
}

@output
structure GetListingOutput {
    @required
    listingId: String,

    @required
    hostId: String,

    @required
    title: String,

    @required
    pricePerNight: Double,

    @required
    maxGuests: Integer,

    @required
    location: Location
}

structure Location {
    @required
    lat: Double,

    @required
    lon: Double
}

@http(method: "POST", uri: "/v1/listings", code: 201)
// Requiere Auth (anfitriones validos - @httpBearerAuth aplica por defecto)
operation CreateListing {
    input: CreateListingInput,
    output: GetListingOutput
}

@input
structure CreateListingInput with [TraceHeaders, JsonHeaders] {
    // Body
    @required
    @length(min: 10, max: 100)
    title: String,

    @required
    @range(min: 1)
    pricePerNight: Double,

    @required
    @range(min: 1, max: 20)
    maxGuests: Integer,

    @required
    location: Location
}

// ---------------------------------------------------------
//  Bookings (Resource & Operations)
// ---------------------------------------------------------

resource Booking {
    identifiers: { bookingId: String },
    read: GetBooking,
    create: CreateBooking,
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
