$version: "2"

namespace airbnb

use smithy.api#required
use smithy.api#length
use smithy.api#range
use smithy.api#http
use smithy.api#httpError
use smithy.api#httpLabel
use smithy.api#readonly

service AirbnbService {
    version: "2026-04-26",
    operations: [
        CreateUser,
        CreateListing,
        CreateBooking,
        GetBookingById,
        CreateReview,
        GetReviewsByListing
    ]
}

// ================= USER =================

@http(method: "POST", uri: "/v1/users", code: 201)
operation CreateUser {
    input: CreateUserInput
    output: CreateUserOutput
    errors: [ValidationError, UnauthorizedError, ConflictError]
}

structure CreateUserInput {
    @required
    @length(min: 2, max: 80)
    fullName: String
}

structure CreateUserOutput {
    @required
    user: User
}

structure User {
    @required
    email: String

    @required
    userId: String

    @required
    fullName: String

    @required
    createdAt: String
}

// ================= LISTING =================

@http(method: "POST", uri: "/v1/listings", code: 201)
operation CreateListing {
    input: CreateListingInput
    output: CreateListingOutput
    errors: [ValidationError, UnauthorizedError]
}

structure CreateListingInput {
    @required
    @length(min: 3, max: 120)
    title: String

    @required
    @range(min: 1)
    price: Integer
}

structure CreateListingOutput {
    @required
    listing: Listing
}

structure Listing {
    @required
    listingId: String

    @required
    ownerId: String

    @required
    title: String

    @required
    price: Integer

    @required
    status: String

    @required
    createdAt: String
}

// ================= BOOKING =================

@http(method: "POST", uri: "/v1/bookings", code: 201)
operation CreateBooking {
    input: CreateBookingInput
    output: CreateBookingOutput
    errors: [ValidationError, UnauthorizedError]
}

@readonly
@http(method: "GET", uri: "/v1/bookings/{bookingId}", code: 200)
operation GetBookingById {
    input: GetBookingByIdInput
    output: GetBookingByIdOutput
    errors: [ValidationError, UnauthorizedError, NotFoundError]
}

structure CreateBookingInput {
    @required
    listingId: String

    @required
    checkIn: String

    @required
    checkOut: String

    @required
    @range(min: 1)
    guests: Integer

    @required
    @range(min: 1)
    totalAmount: Integer
}

structure CreateBookingOutput {
    @required
    booking: Booking
}

structure GetBookingByIdInput {
    @required
    @httpLabel
    bookingId: String
}

structure GetBookingByIdOutput {
    @required
    booking: Booking
}

structure Booking {
    @required
    bookingId: String

    @required
    listingId: String

    @required
    guestId: String

    @required
    checkIn: String

    @required
    checkOut: String

    @required
    guests: Integer

    @required
    totalAmount: Integer

    @required
    status: String

    @required
    createdAt: String
}

// ================= REVIEW =================

@http(method: "POST", uri: "/v1/reviews", code: 201)
operation CreateReview {
    input: CreateReviewInput
    output: CreateReviewOutput
    errors: [ValidationError, UnauthorizedError]
}

@readonly
@http(method: "GET", uri: "/v1/reviews/listing/{listingId}", code: 200)
operation GetReviewsByListing {
    input: GetReviewsByListingInput
    output: GetReviewsByListingOutput
    errors: [ValidationError, UnauthorizedError]
}

structure CreateReviewInput {
    @required
    listingId: String

    @required
    @range(min: 1, max: 5)
    rating: Integer

    @required
    @length(min: 1, max: 500)
    comment: String
}

structure CreateReviewOutput {
    @required
    review: Review
}

structure GetReviewsByListingInput {
    @required
    @httpLabel
    listingId: String
}

structure GetReviewsByListingOutput {
    @required
    reviews: ReviewList
}

list ReviewList {
    member: Review
}

structure Review {
    @required
    reviewId: String

    @required
    listingId: String

    @required
    userId: String

    @required
    rating: Integer

    @required
    comment: String

    @required
    createdAt: String
}

// ================= ERRORS =================

@error("client")
@httpError(400)
structure ValidationError {
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
