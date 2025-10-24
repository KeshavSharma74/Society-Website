import express from "express";
import {
    createBooking,
    getCustomerBookings,
    getProviderBookings,
    updateBookingStatus
} from "../controllers/booking.controller.js";
import { protect, isCustomer, isProvider } from "../middlewares/user.middleware.js";

const bookingRouter = express.Router();

bookingRouter.post(
    "/:providerId", // This path is better than "/create-booking/:providerId"
    protect,
    isCustomer, // <-- GOOD: Only customers can create bookings
    createBooking
);

bookingRouter.get(
    "/my-bookings",
    protect,
    isCustomer, // <-- GOOD: Only customers see their bookings
    getCustomerBookings
);

bookingRouter.get(
    "/my-requests",
    protect,
    isProvider, // GOOD: Only providers can see their requests
    getProviderBookings
);

bookingRouter.put(
    "/update-status/:id",
    protect,
    // REMOVED 'isProvider'. The controller handles both roles.
    updateBookingStatus
);

export default bookingRouter;