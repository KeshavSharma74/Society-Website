import express from "express";
import {
    createBooking,
    getCustomerBookings,
    getProviderBookings,
    updateBookingStatus
} from "../controllers/booking.controller.js";
import { protect, isCustomer, isProvider } from "../middlewares/user.middleware.js";

const bookingRouter = express.Router();

// @route   POST /api/bookings/
// @desc    Create a new booking
// @access  Private (Customer)
bookingRouter.post(
    "/create-booking/:providerId",
    protect,
    createBooking
);

// @route   GET /api/bookings/my-bookings
// @desc    Get all bookings for the logged-in customer
// @access  Private (Customer)
bookingRouter.get(
    "/my-bookings",
    protect,
    getCustomerBookings
);

// @route   GET /api/bookings/my-requests
// @desc    Get all booking requests for the logged-in provider
// @access  Private (Provider)
bookingRouter.get(
    "/my-requests",
    protect,
    isProvider, // Only providers can see their requests
    getProviderBookings
);

// @route   PUT /api/bookings/update-status/:id
// @desc    Update a booking's status
// @access  Private ( Provider)
bookingRouter.put(
    "/update-status/:id",
    protect,
    isProvider, 
    updateBookingStatus
);



export default bookingRouter;