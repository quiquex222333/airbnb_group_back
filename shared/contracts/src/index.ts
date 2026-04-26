export type CreateUserInput = {
  fullName: string;
  email: string;
};

export type CreateUserOutput = {
  user: {
    email: string;
    userId: string;
    fullName: string;
    createdAt: string;
  };
};

export type CreateListingInput = {
  title: string;
  price: number;
};

export type Listing = {
  listingId: string;
  ownerId: string;
  title: string;
  price: number;
  status: "draft" | "published" | "paused" | "archived";
  createdAt: string;
};

export type CreateListingOutput = {
  listing: Listing;
};

export type CreateBookingInput = {
  listingId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
};

export type Booking = {
  bookingId: string;
  listingId: string;
  guestId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
};

export type CreateBookingOutput = {
  booking: Booking;
};

export type GetBookingByIdOutput = {
  booking: Booking;
};

export type CreateReviewInput = {
  listingId: string;
  rating: number;
  comment: string;
};

export type Review = {
  reviewId: string;
  listingId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type CreateReviewOutput = {
  review: Review;
};

export type GetReviewsByListingOutput = {
  reviews: Review[];
};
